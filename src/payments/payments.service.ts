import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { completePaymentValidator } from './payments.zodValidator';
import {
  BookedSeat,
  Booking,
  Bus,
  Payment,
  Route,
  Schedule,
} from '@prisma/client';
import { customExpressInterface } from 'src/users/users.guard';
import { SendMailToProvideConfirmedTicketsAfterPayment } from 'src/nodemailerMailFunctions';
import PDFDocument from 'pdfkit';
import path from 'path';
import fs from 'fs';
import { cloudinaryConfig, uploadedImageInterface } from 'src/cloudinaryConfig';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  // this complete payment route will complete the payment of the user's booked seats through booked id
  async completePaymentService(
    request: customExpressInterface,
    requestData: any,
  ): Promise<{
    status: string;
    message: string;
    data: {
      paymentId: string;
    };
  }> {
    // validate the request data using the zod schema
    const validatedData = completePaymentValidator.safeParse({
      bookingId: requestData.params.bookingId,
      method: requestData.requestBody.method,
      amount: requestData.requestBody.amount,
      referenceCode: requestData.requestBody.referenceCode,
    });

    if (!validatedData.success) {
      throw new BadRequestException({
        status: 'error',
        message: 'Failed in type validation.',
        errors: validatedData.error.errors,
      });
    }

    // do some checks of the provided booking id in the url path parameter
    const checkBookingExists: Booking | null =
      await this.prisma.booking.findUnique({
        where: {
          id: validatedData.data.bookingId,
        },
      });

    if (!checkBookingExists) {
      throw new NotFoundException({
        status: 'error',
        message: 'No bookings found with the provided booking id.',
      });
    }

    // check if the provided booking id is booked by the user making the request
    if (checkBookingExists.userId !== request.foundExistingUser.id) {
      throw new ForbiddenException({
        status: 'error',
        message: 'Invalid option for payment.',
      });
    }

    // check the status of the found booking document if they have already been paid
    if (checkBookingExists.status === 'PAID') {
      throw new ConflictException({
        status: 'error',
        message: 'The bookings has already been paid.',
      });
    }

    // check if the paid amount is not equal to the booking id
    if (checkBookingExists.totalPrice !== validatedData.data.amount) {
      throw new ConflictException({
        status: 'error',
        message: `Invalid amount selected for payment, correct amount is ${checkBookingExists.totalPrice} taka.`,
      });
    }

    // retrieve the booked seats to pass it to the send mail function
    const retrievedBookedSeats: BookedSeat | null =
      await this.prisma.bookedSeat.findFirst({
        where: {
          bookingId: checkBookingExists.id,
        },
      });

    // retrieve the schedule document using the schedule id booking
    const retrievedScheduleDocument: Schedule | null =
      await this.prisma.schedule.findUnique({
        where: {
          id: checkBookingExists.scheduleId,
        },
      });

    // retrieve the bus document using the schedule's bus id
    const retrievedBusDocument: Bus | null = await this.prisma.bus.findUnique({
      where: {
        id: retrievedScheduleDocument?.busId,
      },
    });

    // retrieve the route data from the found schedule
    const retrievedRouteDocument: Route | null =
      await this.prisma.route.findUnique({
        where: {
          id: retrievedScheduleDocument?.routeId,
        },
      });

    if (
      !retrievedBookedSeats ||
      !retrievedScheduleDocument ||
      !retrievedBusDocument ||
      !retrievedRouteDocument
    ) {
      throw new InternalServerErrorException({
        status: 'error',
        message: 'Something went wrong.',
      });
    }

    // create the payment document
    const createPayment: Payment = await this.prisma.payment.create({
      data: {
        bookingId: checkBookingExists.id,
        method: validatedData.data.method,
        referenceCode: validatedData.data.referenceCode,
        status: 'SUCCESS',
      },
    });

    try {
      // generate the pdf with a unique name and save it in the temp file
      const doc = new PDFDocument();

      const tempDir = path.join(__dirname, 'temp');

      // create the temp directory if it doesn't exist
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      const tempPath = path.join(
        tempDir,
        `/ticket_${createPayment.id}_${Date.now()}.pdf`,
      );
      const writeStream = fs.createWriteStream(tempPath);
      doc.pipe(writeStream);

      doc.fontSize(20).text('Ticket Invoice', { underline: true }).moveDown();

      doc
        .fontSize(14)
        .text(
          `Customer: ${request.foundExistingUser.firstName + ' ' + request.foundExistingUser.lastName}`,
        );
      doc.text(`Email: ${request.foundExistingUser.email}`);
      doc.text(`Phone: ${request.foundExistingUser.phoneNumber}`);
      doc.moveDown();

      doc.text(`Bus: ${retrievedBusDocument.busRegistrationNumber}`);
      doc.text(`Type: ${retrievedBusDocument.busType}`);
      doc.text(`Class: ${retrievedBusDocument.class}`);
      doc.text(`Ticket Price: ${retrievedBusDocument.farePerTicket}`);
      doc.moveDown();

      doc.text(
        `Route: ${retrievedRouteDocument.origin} → ${retrievedRouteDocument.destination}`,
      );
      doc.text(
        `Estimated Time: ${retrievedRouteDocument.estimatedTimeInMin} min`,
      );
      doc.moveDown();

      doc.text(`Journey Date: ${checkBookingExists.journeyDate}`);
      doc.text(`Seats: ${retrievedBookedSeats.seatNumbers}`);
      doc.text(`Total Price: ${checkBookingExists.totalPrice}`);
      doc.moveDown();

      doc.text(`Payment Method: ${createPayment.method}`);
      doc.text(`Reference id: ${createPayment.referenceCode}`);
      doc.text(`Booking id: ${checkBookingExists.id}`);

      doc.end();

      await new Promise((resolve, reject) => {
        writeStream.on('finish', () => resolve(tempPath));
        writeStream.on('error', reject);
      });

      // upload the pdf to the cloudinary server
      const uploadPdfResult: uploadedImageInterface =
        await cloudinaryConfig.uploader.upload(tempPath, {
          resource_type: 'auto',
        });

      // delete the server stored pdf
      await fs.promises.unlink(tempPath);

      // create the ticket document after it's ticket pdf is uploaded to cloudinary
      await this.prisma.ticket.create({
        data: {
          bookingId: checkBookingExists.id,
          ticketPdfUrl: uploadPdfResult.secure_url,
        },
      });

      // call the email sending function that will send the generate pdf's cliudinary url
      await SendMailToProvideConfirmedTicketsAfterPayment(
        request.foundExistingUser,
        uploadPdfResult.secure_url,
      );

      // update the bookings to confirm the seats
      await this.prisma.booking.update({
        where: {
          id: checkBookingExists.id,
        },
        data: {
          status: 'PAID',
        },
      });
      return {
        status: 'success',
        message:
          'Your payment has been successfully processed, tickets have been sent to your email.',
        data: {
          paymentId: createPayment.id,
        },
      };
    } catch (error) {
      throw new InternalServerErrorException({
        status: 'error',
        message: 'Something went wrong.',
      });
    }
  }
}
