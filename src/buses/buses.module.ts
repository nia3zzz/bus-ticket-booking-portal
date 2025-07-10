import { Module } from '@nestjs/common';
import { BusesController } from './buses.controller';
import { BusesService } from './buses.service';

@Module({
  controllers: [BusesController],
  providers: [BusesService]
})
export class BusesModule {}
