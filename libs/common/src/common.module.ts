import { Module } from '@nestjs/common';
import { AwsS3Module } from './modules/aws-s3/aws-s3.module';
import { CaslModule } from './modules/casl/casl.module';

@Module({
  imports: [AwsS3Module, CaslModule],
  exports: [AwsS3Module, CaslModule],
})
export class CommonModule {}
