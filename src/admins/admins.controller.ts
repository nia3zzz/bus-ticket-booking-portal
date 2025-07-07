import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  AdminsService,
  GetBuseOutputDataPropertyInterface,
  GetBusesOutputDataPropertyInterface,
  GetDriversOutputDataPropertyInterface,
  GetRoutesOutputDataPropertyInterface,
  GetScheduleOutputPropertyInterface,
  GetSchedulesOutputPropertyInterface,
  GetTripOutputDataPropertyInterface,
  GetTripsOutputDataPropertyInterface,
} from './admins.service';
import { AdminsGuard } from './admins.guard';
import {
  addRouteValidator,
  createBusValidator,
  createScheduleValidator,
  startTripValidator,
  updateBusValidator,
  updateScheduleValidator,
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

  // defining a controller function for retriving a list of buses
  @Get('/buses')
  @UseGuards(AdminsGuard)
  async getBuses(@Query() requestQueries: any): Promise<{
    status: string;
    message: String;
    data: GetBusesOutputDataPropertyInterface[];
  }> {
    return this.adminsService.getBusesService(requestQueries);
  }

  //defining a controller function that will retrieve informations related to a bus using the unique identifier
  @Get('/buses/:busId')
  @UseGuards(AdminsGuard)
  async getBus(@Param() params: any): Promise<{
    status: string;
    message: string;
    data: GetBuseOutputDataPropertyInterface;
  }> {
    return this.adminsService.getBusService(params);
  }

  //defining a controller function that will update informations of a bus found by bus id parameter
  @Put('/buses/:busId')
  @UseGuards(AdminsGuard)
  @FormDataRequest({ storage: FileSystemStoredFile })
  async updateBus(
    @Param() params: any,
    @Body() requestBody: typeof updateBusValidator,
  ): Promise<{
    status: string;
    message: string;
  }> {
    return this.adminsService.updateBusService({ params, requestBody });
  }

  //defining a controller function that will delete a bus retrieved from provided bus id path parameter
  @Delete('/buses/:busId')
  @UseGuards(AdminsGuard)
  async deleteBus(@Param() params: any): Promise<{
    status: string;
    message: string;
  }> {
    return this.adminsService.deleteBusService(params);
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

  // defining a controller function for retrieving a list of schedules through queries
  @Get('/schedules')
  @UseGuards(AdminsGuard)
  async getSchedules(@Query() requestQueries: any): Promise<{
    status: string;
    message: string;
    data: GetSchedulesOutputPropertyInterface[];
  }> {
    return this.adminsService.getSchedulesService(requestQueries);
  }

  // defining a controller function for retrieveing information related of a schedule through it's id
  @Get('/schedules/:scheduleId')
  @UseGuards(AdminsGuard)
  async getScheduleService(@Param() params: any): Promise<{
    status: string;
    message: string;
    data: GetScheduleOutputPropertyInterface;
  }> {
    return this.adminsService.getScheduleService(params);
  }

  // defining a controller function for updating data fields of a schedule through it's id
  @Put('/schedules/:scheduleId')
  @UseGuards(AdminsGuard)
  async updateSchedule(
    @Param() params: any,
    @Body() requestBody: typeof updateScheduleValidator,
  ): Promise<{
    status: string;
    message: string;
  }> {
    return this.adminsService.updateScheduleService({ params, requestBody });
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

  //defining a controller function that will retrieve data related to a trip
  @Get('/trips/:tripId')
  @UseGuards(AdminsGuard)
  async getTrip(@Param() params: any): Promise<{
    status: string;
    message: string;
    data: GetTripOutputDataPropertyInterface;
  }> {
    return this.adminsService.getTripService(params);
  }

  // defining a controller function that will update the status of a trip that is in default pendind status
  @Put('/trips/:tripId')
  @UseGuards(AdminsGuard)
  async updateTripStatus(
    @Param() params: any,
    @Body() requestBody: 'UNTRACKED' | 'COMPLETED',
  ): Promise<{
    status: string;
    message: string;
  }> {
    return this.adminsService.updateTripStatusService({ params, requestBody });
  }

  // defining a controller function that will delete an existing trip
  @Delete('/trips/:tripId')
  @UseGuards(AdminsGuard)
  async deleteTrip(@Param() params: any): Promise<{
    status: string;
    message: string;
  }> {
    return this.adminsService.deleteTripService(params);
  }
}
