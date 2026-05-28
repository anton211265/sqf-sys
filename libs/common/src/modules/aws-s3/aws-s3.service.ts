import { DependencyInjectionTokenEnum } from '@app/common/constants/dependency-injection-token.enum';
import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class AwsS3Service {
  constructor(
    @Inject(DependencyInjectionTokenEnum.AWS_S3_CLIENT)
    private readonly s3Client: S3Client,
  ) {}

  getUploadPresignedUrl = async (
    bucketName: string,
    bucketKey: string,
    expiresIn: number = 3600,
  ): Promise<string> => {
    // const contentType = getContentTypeFromExtension(fileExtension);
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: bucketKey,
      // ContentType: contentType,
    });
    return getSignedUrl(this.s3Client, command, { expiresIn });
  };

  getDownloadPresignedUrl = async (
    bucketName: string,
    bucketKey: string,
    expiresIn: number = 3600,
  ): Promise<string> => {
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: bucketKey,
    });
    return getSignedUrl(this.s3Client, command, { expiresIn });
  };
}
