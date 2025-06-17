import {
  Controller,
  HttpCode,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AdminsService } from './admins.service';
import { AdminsGuard } from './admins.guard';

@Controller('admins')
export class AdminsController {
  constructor(private adminsService: AdminsService) {}

  // defing controller function for giving drivers roles to user after verification completed
  @Post('/drivers/:driverId')
  @HttpCode(201)
  @UseGuards(AdminsGuard)
  async createDriver(
    @Param() params: any,
  ): Promise<{ status: string; message: string }> {
    return this.adminsService.createDriverService(params);
  }
}
