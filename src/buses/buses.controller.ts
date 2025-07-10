import { Controller, Get, Query } from '@nestjs/common';
import {
  BusesService,
  GetBusesOutputDataPropertyClientInterface,
} from './buses.service';

@Controller('buses')
export class BusesController {
  constructor(private busesService: BusesService) {}

  // defining a controller function for retriving a list of buses
  @Get('/buses')
  async getBuses(@Query() requestQueries: any): Promise<{
    status: string;
    message: String;
    data: GetBusesOutputDataPropertyClientInterface[];
  }> {
    return this.busesService.getBusesService(requestQueries);
  }
}
