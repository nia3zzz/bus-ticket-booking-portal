import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  AdminsService,
  GetDriversOutputDataPropertyInterface,
  GetRoutesOutputDataPropertyInterface,
} from './admins.service';
import { AdminsGuard } from './admins.guard';
import { addRouteValidtor } from './admins.zodValidator';

@Controller('admins')
export class AdminsController {
  constructor(private adminsService: AdminsService) {}

  // defining controller function for the route of giving driver's role to user after verification completed
  @Post('/drivers/:driverId')
  @HttpCode(201)
  @UseGuards(AdminsGuard)
  async addDriver(
    @Param() params: any,
  ): Promise<{ status: string; message: string }> {
    return this.adminsService.addDriverService(params);
  }

  // defining controller function for the route of removing the driver role of an already existing driver and switching it with the default role of passanger
  @Delete('/drivers/:driverId')
  @UseGuards(AdminsGuard)
  async removeDriver(
    @Param() params: any,
  ): Promise<{ status: string; message: string }> {
    return this.adminsService.removeDriverService(params);
  }

  // defining the controller function for the getting all the created drivers saved in the database
  @Get('/drivers')
  @UseGuards(AdminsGuard)
  async getDrivers(): Promise<{
    status: string;
    message: string;
    data: GetDriversOutputDataPropertyInterface[];
  }> {
    return this.adminsService.getDriversService();
  }

  // defining controller function for the creation of a route for busses to work with
  @Post('/routes')
  @UseGuards(AdminsGuard)
  async addRoute(@Body() requestBody: typeof addRouteValidtor): Promise<{
    status: string;
    message: string;
  }> {
    return this.adminsService.addRouteService(requestBody);
  }

  // defining a controller function for the sending a list of all the routes that the buses covers to the client
  @Get('/routes')
  @UseGuards(AdminsGuard)
  async getRoutes(): Promise<{
    status: string;
    message: string;
    data: GetRoutesOutputDataPropertyInterface[];
  }> {
    return this.adminsService.getRoutesService();
  }
}
