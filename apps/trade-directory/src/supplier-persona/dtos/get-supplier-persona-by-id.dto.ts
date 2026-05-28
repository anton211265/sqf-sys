import { BooleanTransformer } from '@app/common/utils/boolean-transformer';
import { Type } from 'class-transformer';
import { IsBoolean, IsNumber, IsOptional } from 'class-validator';

export class GetSupplierPersonaByIdQueryDto {
  @IsBoolean()
  @BooleanTransformer()
  @IsOptional()
  includeOrganization?: boolean;

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
  includeFactorPersona?: boolean;
}

export class GetSupplierPersonaByIdParamDto {
  @IsNumber()
  @Type(() => Number)
  id: number;
}
