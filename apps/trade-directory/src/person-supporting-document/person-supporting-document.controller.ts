import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import {
  GetPersonSupportingDocumentsParamsDto,
  GetPersonSupportingDocumentsQueryDto,
} from './dtos/get-person-supporting-documents.dto';
import { PersonSupportingDocumentService } from './person-supporting-document.service';

@Controller('person-supporting-document')
@ApiBearerAuth('id-token')
export class PersonSupportingDocumentController {
  constructor(
    private readonly personSupportingDocumentService: PersonSupportingDocumentService,
  ) {}

  @ApiQuery({
    name: 'pageSize',
    required: false,
    type: Number,
  })
  @ApiQuery({
    name: 'pageNumber',
    required: false,
    type: Number,
  })
  @ApiParam({
    name: 'personId',
    required: true,
    type: Number,
  })
  @Get('/:personId')
  @UseGuards(AuthGuard)
  async getPersonSupportingDocuments(
    @Param() param: GetPersonSupportingDocumentsParamsDto,
    @Query()
    query: GetPersonSupportingDocumentsQueryDto,
  ) {
    return await this.personSupportingDocumentService.getPersonSupportingDocuments(
      param.personId,
      query,
    );
  }
}
