import { ApiProperty } from '@nestjs/swagger';

export class OnchainResponseDto {
  @ApiProperty()
  requestId: string;

  @ApiProperty()
  refId: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  topicId: string;

  @ApiProperty()
  transactionId: string;

  @ApiProperty()
  url: string;

  @ApiProperty()
  eventName: string;

  @ApiProperty({ nullable: true })
  error?: string;

  @ApiProperty()
  createdAt: Date;
}
