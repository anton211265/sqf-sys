import { OrganizationCapitalSize } from '@app/common/apps/risk-operation/enums/organization-capital-size.enum';
import { BusinessSectorEnum } from '@app/common/apps/trade-directory/enums/business-sector.enum';
import { CurrencyCodeEnum } from '@app/common/constants/currencies';
import { IsEnum, IsIn, IsOptional, IsString } from 'class-validator';

const capitalSizes = OrganizationCapitalSize.map((item) => item.name);
export class CreateRiskProfileDto {
  @IsEnum(BusinessSectorEnum)
  businessSector: BusinessSectorEnum;

  @IsOptional()
  @IsString()
  businessSectorOther?: string;

  @IsIn(capitalSizes)
  capitalSize: string;

  @IsEnum(CurrencyCodeEnum)
  capitalCurrency: CurrencyCodeEnum;
}
