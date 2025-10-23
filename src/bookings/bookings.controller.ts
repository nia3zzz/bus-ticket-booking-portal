import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Request,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import {
  BookingsService,
  GetBookingOutputPropertyInterface,
  GetBookingsOutputPropertyInterface,
} from './bookings.service';
import { AuthGuard, customExpressInterface } from 'src/users/users.guard';
import { createBookingValidator } from './bookings.zodValidator';

@Controller('bookings')
export class BookingsController {
  constructor(private bookingsService: BookingsService) {}

  // this controller function for bookings route will book a user's selected tickets on their selected bus
  @Post('/bookings')
  @UseGuards(AuthGuard)
  @HttpCode(201)
  async createBooking(
    @Request() request: customExpressInterface,
    @Body() requestBody: typeof createBookingValidator,
  ): Promise<{
    status: string;
    message: string;
  }> {
    return this.bookingsService.createBookingService(request, requestBody);
  }

  //this controller function for bookings will retrieve all the booked seats made by the user
  @Get('/bookings')
  @UseGuards(AuthGuard)
  async getBookings(
    @Request() request: customExpressInterface,
    @Query() query: any,
  ): Promise<{
    status: string;
    message: string;
    data: GetBookingsOutputPropertyInterface[];
  }> {
    return this.bookingsService.getBookingsService({ request, query });
  }

  // this controller function for bookings will retrieve a unique booking of the user using the booking id provided by the user
  @Get('/bookings/:bookingId')
  @UseGuards(AuthGuard)
  async getBooking(@Param() params: any): Promise<{
    status: string;
    message: string;
    data: GetBookingOutputPropertyInterface;
  }> {
    return this.bookingsService.getBookingService(params);
  }
}
