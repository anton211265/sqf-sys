import { IsString } from 'class-validator';

export class ApplicationPublicParamDto {
  @IsString()
  applicationPublicUuid: string;
}
