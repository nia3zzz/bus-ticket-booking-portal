import { Controller, Delete, HttpCode, Param, Post, UseGuards } from '@nestjs/common';
import { AdminsService } from './admins.service';
import { AdminsGuard } from './admins.guard';

@Controller('admins')
export class AdminsController {
  constructor(private adminsService: AdminsService) {}

  // defining controller function for the route of giving driver's role to user after verification completed
  @Post('/drivers/:driverId')
  @HttpCode(201)
  @UseGuards(AdminsGuard)
  async createDriver(
    @Param() params: any,
  ): Promise<{ status: string; message: string }> {
    return this.adminsService.createDriverService(params);
  }

  // defining controller function for the route of removing the driver role of an already existing driver and switching it with the default role of passanger
  @Delete('/drivers/:driverId')
  @HttpCode(200)
  @UseGuards(AdminsGuard)
  async removeDriver(
    @Param() params: any,
  ): Promise<{ status: string; message: string }> {
    return this.adminsService.removeDriverService(params);
  }
}
