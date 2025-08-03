import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  getBookedTicketValidator,
  refundTicketValidator,
} from './tickets.zodValidator';
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

  // this post method on this route with the ticketid on it's url as a path parameter will refund the ticket
  async refundTicketService(requestData: any): Promise<{
    status: string;
    message: string;
  }> {
    // validate the provided parameter in url and body
    const validatedData = refundTicketValidator.safeParse({
      ticketId: requestData.params.ticketId,
      reason: requestData.requestBody.reason,
    });

    if (!validatedData.success) {
      throw new BadRequestException({
        status: 'error',
        message: 'Failed in type validation.',
        errors: validatedData.error.errors,
      });
    }

    // check if the ticket document exists with the provided ticket id
    const checkTicketExists: Ticket | null =
      await this.prisma.ticket.findUnique({
        where: {
          id: validatedData.data.ticketId,
        },
      });

    if (!checkTicketExists) {
      throw new NotFoundException({
        status: 'error',
        message: 'No ticket found with provided ticket id.',
      });
    }

    // fetch the refund document with the tickets to check if the ticket has already been refunded
    const checkRefundExists = await this.prisma.refund.findFirst({
      where: {
        ticketId: validatedData.data.ticketId,
      },
    });

    if (checkRefundExists) {
      // if the refund document exists, it means the ticket has already been refunded but depending on the value on the field of isMoneyRefunded we will send the appropriate message
      throw new BadRequestException({
        status: 'error',
        message: `This ticket has already been refunded ${checkRefundExists.isMoneyRefunded ? 'with the booking money.' : 'and collect the booking money from the counter.'}`,
      });
    }

    // retrieve the payment document
    const foundPayment = await this.prisma.payment.findFirst({
      where: {
        bookingId: checkTicketExists.bookingId,
      },
    });

    if (!foundPayment) {
      throw new InternalServerErrorException({
        status: 'error',
        message: 'Something went wrong.',
      });
    }

    try {
      // update the changes in booking document
      await this.prisma.booking.update({
        where: {
          id: checkTicketExists.bookingId,
        },
        data: {
          status: 'CANCELLED',
        },
      });

      // update the payment document status to refunded
      await this.prisma.payment.update({
        where: {
          id: foundPayment.id,
        },
        data: {
          status: 'REFUNDED',
        },
      });

      // create the refund document with the provided ticket id and reason
      await this.prisma.refund.create({
        data: {
          ticketId: validatedData.data.ticketId,
          reason: validatedData.data.reason,
        },
      });
      return {
        status: 'success',
        message:
          'Your ticket has been refunded, collect your paid amount from counter.',
      };
    } catch (error) {
      throw new InternalServerErrorException({
        status: 'error',
        message: 'Something went wrong.',
      });
    }
  }
}
