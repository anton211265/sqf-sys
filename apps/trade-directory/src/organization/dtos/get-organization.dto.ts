import { BooleanTransformer } from '@app/common/utils/boolean-transformer';
import { Type } from 'class-transformer';
import { IsBoolean, IsNumber, IsOptional } from 'class-validator';

export class GetOrganizationParamDto {
  @IsNumber()
  @Type(() => Number)
  id: number;
}

export class GetOrganizationQueryDto {
  @IsBoolean()
  @BooleanTransformer()
  @IsOptional()
  includeOrganizationPerson?: boolean;

  @IsBoolean()
  @BooleanTransformer()
  @IsOptional()
  includePerson?: boolean;

  @IsBoolean()
  @BooleanTransformer()
  @IsOptional()
  includeOrganizationPersonRole?: boolean;

  @IsBoolean()
  @BooleanTransformer()
  @IsOptional()
  includeBankAccount?: boolean;

  @IsBoolean()
  @BooleanTransformer()
  @IsOptional()
  includeClientPersona?: boolean;

  @IsBoolean()
  @BooleanTransformer()
  @IsOptional()
  includeContractAwarderPersona?: boolean;

  @IsBoolean()
  @BooleanTransformer()
  @IsOptional()
  includeSupplierPersona?: boolean;

  @IsBoolean()
  @BooleanTransformer()
  @IsOptional()
  includeFactorPersona?: boolean;
}
