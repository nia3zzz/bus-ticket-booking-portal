import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { AuthGuard, customExpressInterface } from 'src/users/users.guard';

@Controller('tickets')
export class TicketsController {
  constructor(private ticketsService: TicketsService) {}

  // this get booked ticket will retrieve the created ticket and send it back to the client once again by providing the booking id
  @Get('/:bookingId')
  @UseGuards(AuthGuard)
  async getBookedTicket(
    @Req() request: customExpressInterface,
    @Param() params: any,
  ): Promise<{
    status: string;
    message: string;
  }> {
    return await this.ticketsService.getBookedTicketService(request, params);
  }

  // this post method on this route with the ticketid on it's url as a path parameter will refund the ticket
  @Post('/refunds/:ticketId')
  @UseGuards(AuthGuard)
  async refundTicket(
    @Param() params: any,
    @Body() requestBody: any,
  ): Promise<{
    status: string;
    message: string;
  }> {
    return await this.ticketsService.refundTicketService({
      params,
      requestBody,
    });
  }
}
