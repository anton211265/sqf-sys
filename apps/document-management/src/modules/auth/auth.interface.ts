import { CreateApiKeyResponseDto } from './dto/response/create-api-key-response.dto';
import { DeleteApiKeyResponseDto } from './dto/response/delete-api-key-response.dto';
import { GetApiKeyResponseDto } from './dto/response/get-api-key-response.dto';
import { UpdateApiKeyResponseDto } from './dto/response/update-api-key-response.dto';
import { ApiInfoResponse } from './interface/api-key';

export const AUTH_SERVICE = 'AUTH SERVICE';

export interface IAuthService {
  /**
   * validate api key
   * @param apiKey
   */
  getApiKeyInfo(apiKey: string): Promise<ApiInfoResponse>;

  /**
   * create api key
   * @param orgId
   * @param name
   */
  creatApiKey(orgId: number, name: string): Promise<CreateApiKeyResponseDto>;

  /**
   * get all api keys
   * @param orgId
   */
  getApiKeys(orgId: number): Promise<GetApiKeyResponseDto[]>;

  /**
   * delete an api key
   * @param orgId
   * @param id
   */
  deleteApiKey(orgId: number, id: number): Promise<DeleteApiKeyResponseDto>;

  /**
   * update an api key
   * @param orgId
   * @param id
   * @param name
   */
  updateApiKey(
    orgId: number,
    id: number,
    name: string,
  ): Promise<UpdateApiKeyResponseDto>;
}
