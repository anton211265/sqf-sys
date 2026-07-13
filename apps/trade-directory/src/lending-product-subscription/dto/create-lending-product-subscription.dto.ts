import { LendingProductEnum } from '@app/common/apps/trade-directory/enums/lending-product.enum';
import { LendingProductSubscriptionStatusEnum } from '@app/common/apps/trade-directory/enums/lending-product-subscription-status.enum';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateLendingProductSubscriptionDto {
  @ApiProperty()
  @IsInt()
  @IsNotEmpty()
  clientPersonaId: number;

  @ApiProperty({ enum: LendingProductEnum })
  @IsEnum(LendingProductEnum)
  @IsNotEmpty()
  product: LendingProductEnum;

  @ApiProperty({ required: false })
  @IsInt()
  @IsOptional()
  facilityContractId?: number;
}

export class UpdateLendingProductSubscriptionDto {
  @ApiProperty({ enum: LendingProductSubscriptionStatusEnum, required: false })
  @IsEnum(LendingProductSubscriptionStatusEnum)
  @IsOptional()
  status?: LendingProductSubscriptionStatusEnum;

  @ApiProperty({ required: false })
  @IsInt()
  @IsOptional()
  facilityContractId?: number;
}
