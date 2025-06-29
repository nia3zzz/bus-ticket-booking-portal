import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  AdminsService,
  GetDriversOutputDataPropertyInterface,
  GetRoutesOutputDataPropertyInterface,
  GetTripsOutputDataPropertyInterface,
} from './admins.service';
import { AdminsGuard } from './admins.guard';
import {
  addRouteValidator,
  createBusValidator,
  createScheduleValidator,
  startTripValidator,
} from './admins.zodValidator';
import { FormDataRequest, FileSystemStoredFile } from 'nestjs-form-data';

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
  @HttpCode(201)
  @UseGuards(AdminsGuard)
  async addRoute(@Body() requestBody: typeof addRouteValidator): Promise<{
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

  // defining a controller function for deleting a route and send a success message to the client
  @Delete('/routes/:routeId')
  @UseGuards(AdminsGuard)
  async deleteRoute(@Param() params: any): Promise<{
    status: string;
    message: string;
  }> {
    return this.adminsService.deleteRouteService(params);
  }

  //defining a controller function for the creation of a bus using the data provided in the request body
  @Post('/buses')
  @HttpCode(201)
  @UseGuards(AdminsGuard)
  @FormDataRequest({ storage: FileSystemStoredFile })
  async createBus(@Body() requestBody: typeof createBusValidator): Promise<{
    status: string;
    message: string;
  }> {
    return this.adminsService.createBusService(requestBody);
  }

  //defining a controller function for the creation of a schedule and map it with route and bus
  @Post('/schedules')
  @HttpCode(201)
  @UseGuards(AdminsGuard)
  async createSchedule(
    @Body() requestBody: typeof createScheduleValidator,
  ): Promise<{ status: String; message: string }> {
    return this.adminsService.createScheduleService(requestBody);
  }

  // defining a controller function for starting a trip with schedule id and sending a success message to the client
  @Post('/trips')
  @HttpCode(201)
  @UseGuards(AdminsGuard)
  async startTrip(@Body() requestBody: typeof startTripValidator): Promise<{
    status: string;
    message: string;
  }> {
    return this.adminsService.startTripService(requestBody);
  }

  //defining a controller function that will retrieve a list of trips based on filter and pagination queries
  @Get('/trips')
  @UseGuards(AdminsGuard)
  async getTrips(@Query() requestQueries: any): Promise<{
    status: string;
    message: string;
    data: GetTripsOutputDataPropertyInterface[];
  }> {
    return this.adminsService.getTripsService(requestQueries);
  }
}
