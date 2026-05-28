import { DatabaseModule } from '@app/common/database/database.module';
import { Module } from '@nestjs/common';
import { Person, Token } from '../models';
import { PersonRepository } from '../repositories';
import { PersonController } from './person.controller';
import { PersonService } from './person.service';

@Module({
  imports: [DatabaseModule, DatabaseModule.forFeature([Person, Token])],
  controllers: [PersonController],
  providers: [PersonService, PersonRepository],
})
export class PersonModule {}
