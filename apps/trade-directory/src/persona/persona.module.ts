import { Module } from '@nestjs/common';
import { PersonaAssignmentService } from './persona-assignment.service';

@Module({
  providers: [PersonaAssignmentService],
  exports: [PersonaAssignmentService],
})
export class PersonaModule {}
