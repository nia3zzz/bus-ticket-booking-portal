import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { AuthGuard, customExpressInterface } from 'src/users/users.guard';
import { createBookingValidator } from './bookings.zodValidator';

@Controller('bookings')
export class BookingsController {
  constructor(private bookingsService: BookingsService) {}

  @Post('/bookings')
  @UseGuards(AuthGuard)
  async createBooking(
    @Request() request: customExpressInterface,
    @Body() requestBody: typeof createBookingValidator,
  ): Promise<{
    status: string;
    message: string;
  }> {
    return this.bookingsService.createBookingService(request, requestBody);
  }
}
