import { BadRequestException, Injectable } from '@nestjs/common';
import { IAuthService } from './auth.interface';
import { ApiKeyRepository } from '../../repositories/api-key.repository';
import { ConfigService } from '@nestjs/config';
import { ApiInfoResponse } from './interface/api-key';
import { createHash, randomBytes } from 'crypto';
import { CreateApiKeyResponseDto } from './dto/response/create-api-key-response.dto';
import { ApiKey } from '../../models/api-key.entity';
import { decrypt, encrypt } from '@app/common/utils/crypting';
import { GetApiKeyResponseDto } from './dto/response/get-api-key-response.dto';
import { DeleteApiKeyResponseDto } from './dto/response/delete-api-key-response.dto';
import { UpdateApiKeyResponseDto } from './dto/response/update-api-key-response.dto';

@Injectable()
export class AuthService implements IAuthService {
  private readonly secretKey: string;

  constructor(
    private readonly apiKeyRepository: ApiKeyRepository,
    private readonly configService: ConfigService,
  ) {
    this.secretKey = this.configService.getOrThrow(
      'DOCUMENT_MANAGEMENT_SECRET_KEY',
    );
  }

  async getApiKeyInfo(apiKey: string): Promise<ApiInfoResponse> {
    const hashedKey = this.hashKey(apiKey);

    const existingApiKey = await this.apiKeyRepository.findOne({
      where: { hashedKey },
    });

    return existingApiKey
      ? {
          isActive: existingApiKey.isActive,
          orgId: existingApiKey.orgId,
        }
      : { isActive: false, orgId: null };
  }

  async creatApiKey(
    orgId: number,
    name: string,
  ): Promise<CreateApiKeyResponseDto> {
    const exitingApiKey = await this.apiKeyRepository.findOne({
      where: { name, orgId: orgId.toString() },
    });

    if (exitingApiKey) {
      throw new BadRequestException(
        `An API key named “${name}” already exists`,
      );
    }

    const plainKey = randomBytes(32).toString('hex');
    const hashedKey = this.hashKey(plainKey);
    const encryptedKey = encrypt(plainKey, this.secretKey);

    const newApiKey = new ApiKey({
      name,
      orgId: orgId.toString(),
      hashedKey,
      encryptedKey,
    });

    await this.apiKeyRepository.save(newApiKey);

    return { message: 'success' };
  }

  async getApiKeys(orgId: number): Promise<GetApiKeyResponseDto[]> {
    const apiKeys = await this.apiKeyRepository.find({
      where: { orgId: orgId.toString() },
      order: { createdAt: 'DESC' },
    });

    const response: GetApiKeyResponseDto[] = [];

    for (const apiKey of apiKeys) {
      const { encryptedKey, createdAt, name, id } = apiKey;
      const decryptedKey = decrypt(encryptedKey, this.secretKey);

      const key: GetApiKeyResponseDto = {
        id,
        key: decryptedKey,
        name,
        createdAt,
      };

      response.push(key);
    }

    return response;
  }

  async deleteApiKey(
    orgId: number,
    id: number,
  ): Promise<DeleteApiKeyResponseDto> {
    await this.apiKeyRepository.delete({
      id,
      orgId: orgId.toString(),
    });

    return { message: 'success' };
  }

  async updateApiKey(
    orgId: number,
    id: number,
    name: string,
  ): Promise<UpdateApiKeyResponseDto> {
    const apiKey = await this.apiKeyRepository.findOne({
      where: { id, orgId: orgId.toString() },
    });

    if (!apiKey) {
      throw new BadRequestException(`Api key with id: ${id} does not exist`);
    }

    apiKey.name = name;

    await this.apiKeyRepository.save(apiKey);

    return { message: 'success' };
  }

  private hashKey(key: string): string {
    return createHash('sha256').update(key).digest('hex');
  }
}
