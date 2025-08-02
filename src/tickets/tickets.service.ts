import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { getBookedTicketValidator } from './tickets.zodValidator';
import { Booking, Ticket } from '@prisma/client';
import { HttpException } from '@nestjs/common';
import { customExpressInterface } from 'src/users/users.guard';
import { SendMailToProvideTicketUrlIfCreated } from 'src/nodemailerMailFunctions';

@Injectable()
export class TicketsService {
  constructor(private prisma: PrismaService) {}

  // this get booked ticket will retrieve the created ticket and send it back to the client once again by providing the booking id
  async getBookedTicketService(
    request: customExpressInterface,
    params: any,
  ): Promise<{
    status: string;
    message: string;
  }> {
    // validate the provided parameter in url
    const validatedData = getBookedTicketValidator.safeParse(params);

    if (!validatedData.success) {
      throw new BadRequestException({
        status: 'error',
        message: 'Failed in type validation.',
        errors: validatedData.error.errors,
      });
    }

    // check if the booking document exists with the provided booking id
    const checkBookingExists: Booking | null =
      await this.prisma.booking.findUnique({
        where: {
          id: validatedData.data.bookingId,
        },
      });

    if (!checkBookingExists) {
      throw new NotFoundException({
        status: 'error',
        message: 'No booking found with provided booking id.',
      });
    }

    // check if the payment was refunded or cancled
    if (checkBookingExists.status !== 'PAID') {
      throw new HttpException(
        {
          status: 'error',
          message: 'Payment has not been completed for this booked seats.',
        },
        402,
      );
    }

    try {
      // retrieve the ticket document using the provided document id
      const foundTicket: Ticket | null = await this.prisma.ticket.findFirst({
        where: {
          bookingId: checkBookingExists.id,
        },
      });

      if (!foundTicket) {
        throw new InternalServerErrorException({
          status: 'error',
          message: 'Something went wrong.',
        });
      }

      //call the send email function that will send the email to the user that will include the link to their ticket in pdf format
      await SendMailToProvideTicketUrlIfCreated(
        request.foundExistingUser,
        foundTicket.ticketPdfUrl,
      );

      return {
        status: 'success',
        message: 'Tickets have been sent to your email.',
      };
    } catch (error) {
      throw new InternalServerErrorException({
        status: 'error',
        message: 'Something went wrong.',
      });
    }
  }
}
