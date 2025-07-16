import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { createBookingValidator } from './bookings.zodValidator';
import {
  BookedSeat,
  Booking,
  Bus,
  Prisma,
  Route,
  Schedule,
} from '@prisma/client';
import { customExpressInterface } from 'src/users/users.guard';
import { SendMailToProvidePaymentInvoiceAfterBookingSeats } from 'src/nodemailerMailFunctions';

// type interface declaration of the get bookings data property in the response body
export interface GetBookingsOutputPropertyInterface {
  bookingId: string;
  origin: string | null;
  destination: string | null;
  estimatedDepertureTimeDate: Date | null;
  totalSeats: number;
}

@Injectable()
export class BookingsService {
  constructor(private prisma: PrismaService) {}

  // this controller function for bookings route will book a user's selected tickets on their selected bus
  async createBookingService(
    request: customExpressInterface,
    requestBody: typeof createBookingValidator,
  ): Promise<{
    status: string;
    message: string;
  }> {
    // validate the request body recieved form the controller
    const validatedData = createBookingValidator.safeParse(requestBody);

    if (!validatedData.success) {
      throw new BadRequestException({
        status: 'error',
        message: 'Failed in type validation.',
        errors: validatedData.error.errors,
      });
    }

    // check if a schedule exists with the provided schedule id
    const checkScheduleExists: Schedule | null =
      await this.prisma.schedule.findUnique({
        where: {
          id: validatedData.data.scheduleId,
        },
      });

    if (!checkScheduleExists) {
      throw new NotFoundException({
        status: 'error',
        message: 'No schedule found with provided schedule id.',
      });
    }

    // retrieve the bus from the schedule id
    const foundBus: Bus | null = await this.prisma.bus.findUnique({
      where: {
        id: checkScheduleExists.busId,
      },
    });

    if (!foundBus) {
      throw new InternalServerErrorException({
        status: 'error',
        message: 'Something went wrong.',
      });
    }

    // check if provided seat number doesnt exist or is more than the capacity in the bus

    const seatObj = foundBus.seats as Record<string, string>;
    const maxSeat = Math.max(...Object.keys(seatObj).map(Number));

    validatedData.data.seats.map((seat) => {
      if (seat > maxSeat) {
        throw new BadRequestException({
          status: 'error',
          message: `Invalid seat provided. Maximum seat is ${maxSeat}.`,
        });
      }
    });

    // retrieve the booking using the schedule and journey date
    const foundBooking: Booking[] | null = await this.prisma.booking.findMany({
      where: {
        scheduleId: checkScheduleExists.id,
        journeyDate: validatedData.data.journeyDate,
      },
    });

    // check if any booked seats include the seats client wants to book
    const retrieveBookedSeats: BookedSeat[][] = await Promise.all(
      foundBooking.map(async (booking) => {
        return await this.prisma.bookedSeat.findMany({
          where: {
            bookingId: booking.id,
          },
        });
      }),
    );

    //   map all the booked seats to go through each of them to check if the user's selected seat numbers are already booked
    if (retrieveBookedSeats.flat().length > 0) {
      retrieveBookedSeats.flat().map((retrieveBookedSeat) => {
        //set the type for the seats as its set as a jsonvalue that could of any type
        const bookedSeatObj = retrieveBookedSeat.seatNumbers as [
          string,
          string,
        ][];

        //going through all the seats and checking if they dont match with any other key
        const checkDuplicateExists = validatedData.data.seats.some((seat) =>
          bookedSeatObj.some(([key]) => key === seat.toString()),
        );

        if (checkDuplicateExists) {
          throw new ConflictException({
            status: 'error',
            message: 'One of the selected seats has already been booked.',
          });
        }
      });
    }

    // if the seats are not booked create a booking document and create a booked seats document
    const createdBooking: Booking = await this.prisma.booking.create({
      data: {
        userId: request.foundExistingUser.id,
        scheduleId: checkScheduleExists.id,
        totalPrice: foundBus?.farePerTicket * validatedData.data.seats.length,
        status: 'PENDING',
        journeyDate: validatedData.data.journeyDate,
      },
    });

    // hold the seats of each booked seat document
    const raw = foundBus.seats;

    // the seats are set as a json not any specefied type for which will parse them
    const busSeatsObj =
      typeof raw === 'string'
        ? JSON.parse(raw)
        : (raw as Record<string, string>);

    const createdBokedSeats = await this.prisma.bookedSeat.create({
      data: {
        bookingId: createdBooking.id,
        seatNumbers: Object.entries(busSeatsObj).filter(([key]) =>
          validatedData.data.seats.map(String).includes(key),
        ) as Prisma.InputJsonValue,
      },
    });

    // retrieve the route using the route id in schedule document
    const foundRoute: Route | null = await this.prisma.route.findUnique({
      where: {
        id: checkScheduleExists.routeId,
      },
    });

    if (!foundRoute) {
      throw new InternalServerErrorException({
        status: 'error',
        message: 'Something went wrong.',
      });
    }

    //   book the seats and send the invoice to the user in the email for payment
    SendMailToProvidePaymentInvoiceAfterBookingSeats(
      request.foundExistingUser,
      foundBus,
      foundRoute,
      createdBooking,
      createdBokedSeats,
    );

    try {
      return {
        status: 'success',
        message:
          'Your selected seats has been booked, please check your email for booking details.',
      };
    } catch (error) {
      throw new InternalServerErrorException({
        status: 'error',
        message: 'Something went wrong.',
      });
    }
  }

  //this controller function for bookings will retrieve all the booked seats made by the user
  async getBookingsService(request: customExpressInterface): Promise<{
    status: string;
    message: string;
    data: GetBookingsOutputPropertyInterface[];
  }> {
    try {
      // retrieve the user's bookings using their id
      const foundBookings: Booking[] | null =
        await this.prisma.booking.findMany({
          where: {
            userId: request.foundExistingUser.id,
          },
        });

      return {
        status: 'success',
        message: 'Bookings has been fetched successfully.',
        data: await Promise.all(
          foundBookings.map(async (booking) => {
            // retrieve the booke seats using the booking id
            const foundBookedSeats: BookedSeat | null =
              await this.prisma.bookedSeat.findFirst({
                where: {
                  bookingId: booking.id,
                },
              });

            //set the type for the seats as its set as a jsonvalue that could of any type
            const bookedSeatObj = foundBookedSeats?.seatNumbers as [
              string,
              string,
            ][];

            // retrieve all the schedule from the booking
            const foundSchedule: Schedule | null =
              await this.prisma.schedule.findUnique({
                where: { id: booking.scheduleId },
              });

            // retrieve the route from the found schedule document
            const foundRoute: Route | null = await this.prisma.route.findUnique(
              {
                where: {
                  id: foundSchedule?.routeId,
                },
              },
            );

            return {
              bookingId: booking.id,
              origin: foundRoute?.origin ?? null,
              destination: foundRoute?.destination ?? null,
              estimatedDepertureTimeDate:
                foundSchedule?.estimatedDepartureTimeDate ?? null,
              totalSeats: bookedSeatObj.length ?? 0,
            };
          }),
        ),
      };
    } catch (error) {
      throw new InternalServerErrorException({
        status: 'error',
        message: 'Something went wrong.',
      });
    }
  }
}
