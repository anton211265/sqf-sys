import { BooleanTransformer } from '@app/common/utils/boolean-transformer';
import { Type } from 'class-transformer';
import { IsBoolean, IsNumber, IsOptional } from 'class-validator';

export class GetApplicationByIdQueryDto {
  @IsBoolean()
  @BooleanTransformer()
  @IsOptional()
  includeClientOrganization?: boolean;

  @IsBoolean()
  @BooleanTransformer()
  @IsOptional()
  includeClientAwarderContract?: boolean;

  @IsBoolean()
  @BooleanTransformer()
  @IsOptional()
  includeFactorOrganization?: boolean;

  @IsBoolean()
  @BooleanTransformer()
  @IsOptional()
  includeCreatorPerson?: boolean;

  @IsBoolean()
  @BooleanTransformer()
  @IsOptional()
  includeAssigneePerson?: boolean;

  @IsBoolean()
  @BooleanTransformer()
  @IsOptional()
  includeFacilities?: boolean;

  @IsBoolean()
  @BooleanTransformer()
  @IsOptional()
  includeApplicationSupportingDocuments?: boolean;
}

export class GetApplicationByIdParamDto {
  @IsNumber()
  @Type(() => Number)
  id: number;
}
