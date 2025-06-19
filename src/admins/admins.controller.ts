import {
  Body,
  Controller,
  Delete,
  HttpCode,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AdminsService } from './admins.service';
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

  // defining controller function for the creation of a route for busses to work with
  @Post('/routes')
  @UseGuards(AdminsGuard)
  async addRoute(@Body() requestBody: typeof addRouteValidtor): Promise<{
    status: string;
    message: string;
  }> {
    return this.adminsService.addRouteService(requestBody);
  }
}
