import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { getBusesValidatorClient } from './buses.zodValidator';
import { BookedSeat, Booking, Bus, Route, Schedule } from '@prisma/client';

// defining a data type interface for the response body's data property
export interface GetBusesOutputDataPropertyClientInterface {
  busId: string | null;
  busType: 'AC_BUS' | 'NONE_AC_BUS' | 'SLEEPER_BUS' | null;
  busClass: 'ECONOMY' | 'BUSINESS' | 'FIRSTCLASS' | null;
  farePerTicket: number | null;
  estimatedDepurtureTimeDate: Date | null;
  ticketsLeft: number;
}

@Injectable()
export class BusesService {
  constructor(private prisma: PrismaService) {}

  async getBusesService(requestQueries: any): Promise<{
    status: string;
    message: string;
    data: GetBusesOutputDataPropertyClientInterface[];
  }> {
    // validate the request queries sent from the client side
    const validatedData = getBusesValidatorClient.safeParse(requestQueries);

    if (!validatedData.success) {
      throw new BadRequestException({
        status: 'error',
        message: 'Failed in type validation.',
        errors: validatedData.error.errors,
      });
    }

    // find the route docuemnt from the provided origin and destination
    const checkRouteExists: Route | null = await this.prisma.route.findFirst({
      where: {
        origin: validatedData.data.origin,
        destination: validatedData.data.destination,
      },
    });

    if (!checkRouteExists) {
      throw new NotFoundException({
        status: 'error',
        message: 'Invalid route provided or route does not exist yet.',
      });
    }

    // retrieve the schedule from the found route
    const foundSchedules: Schedule[] | null =
      await this.prisma.schedule.findMany({
        where: {
          routeId: checkRouteExists.id,
        },
      });

    try {
      // build up the query filter that will be used in the prisma filtering
      let where: any = {};

      if (validatedData.data.busType) {
        where.busType = validatedData.data.busType;
      }

      if (validatedData.data.class) {
        where.class = validatedData.data.class;
      }

      //retrieve the buses using the found schedules and bus filteration queries
      const foundBuses: (Bus | null)[] = await Promise.all(
        foundSchedules.map(async (foundSchedule) => {
          return await this.prisma.bus.findFirst({
            where: {
              id: foundSchedule.busId,
              ...where,
            },
          });
        }),
      );

      return {
        status: 'success',
        message: `${foundBuses.length} buses have been found based on your options.`,
        data: await Promise.all(
          foundBuses.map(async (foundBus) => {
            //retrieve the bus's from fetched bus not the original schedule array as it may hold unnecerry scheudles after bus filteration
            const retrievedSchedule: Schedule | null =
              await this.prisma.schedule.findFirst({
                where: {
                  busId: foundBus?.id,
                },
              });

            // retrieve the remaining seats from each of the bus
            const retrievedBookingFound: Booking | null =
              await this.prisma.booking.findFirst({
                where: {
                  scheduleId: retrievedSchedule?.id,
                },
              });

            // retrieve all the booked seats of using that booking id
            const retrievedBookedSeats: BookedSeat[] | null =
              await this.prisma.bookedSeat.findMany({
                where: { bookingId: retrievedBookingFound?.id },
              });

            // varaible for counting the booked seats
            let bookedSeatsCount: number = 0;

            // if a seat is booked there would be values in this array
            retrievedBookedSeats.map((bookedSeat) => {
              bookedSeatsCount = bookedSeat?.seatNumbers.length;
            });

            // count all the available seats of that bus
            const preCount: number = Object.keys(foundBus?.seats ?? '').length;

            return {
              busId: foundBus?.id ?? null,
              busType: foundBus?.busType ?? null,
              busClass: foundBus?.class ?? null,
              farePerTicket: foundBus?.farePerTicket ?? null,
              estimatedDepurtureTimeDate:
                retrievedSchedule?.estimatedDepartureTimeDate ?? null,
              ticketsLeft: preCount - bookedSeatsCount,
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
