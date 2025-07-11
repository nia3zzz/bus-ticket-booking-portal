import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  getBusesValidatorClient,
  getBusValidatorClient,
} from './buses.zodValidator';
import {
  BookedSeat,
  Booking,
  Bus,
  Route,
  Schedule,
  User,
} from '@prisma/client';
import { JsonValue } from '@prisma/client/runtime/library';

// defining a data type interface for the response body's data property of the get buses that accepts query parameter and returns array of the defined type
export interface GetBusesOutputDataPropertyClientInterface {
  busId: string | null;
  busType: 'AC_BUS' | 'NONE_AC_BUS' | 'SLEEPER_BUS' | null;
  busClass: 'ECONOMY' | 'BUSINESS' | 'FIRSTCLASS' | null;
  farePerTicket: number | null;
  estimatedDepurtureTimeDate: Date | null;
  ticketsLeft: number;
}

// defining a data type interface for the response body's data property of the get bus that accepts query parameters and returns data of this type
export interface GetBusOutputDataPropertyClientInterface {
  busId: string | null;
  busRegistrationNumber: string | null;
  busType: 'AC_BUS' | 'NONE_AC_BUS' | 'SLEEPER_BUS' | null;
  seats: JsonValue | null;
  busClass: 'BUSINESS' | 'ECONOMY' | 'FIRSTCLASS' | null;
  farePerTicket: number | null;
  driver: {
    driverId: string | null;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    profilePicture: string | null;
  };
  schedule: {
    scheduleId: string;
    estimatedepartureTimeDate: Date;
    estimatedArrivalTimeDate: Date;
  };
  route: {
    routeId: string | null;
    origin: string | null;
    destination: string | null;
    distanceinKm: number | null;
    estimatedTimeInMIn: number | null;
  };
  bookedSeats: string[] | null;
  busPicture: string | null;
  createdAt: Date | null;
}

@Injectable()
export class BusesService {
  constructor(private prisma: PrismaService) {}

  // defining a controller function for retriving a list of buses based on provided client side queries
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

  // defining a controller function for retriving all the informations that is related to the schedule and journey date from the client
  async getBusServiceBus(requestQueries: any): Promise<{
    status: string;
    message: string;
    data: GetBusOutputDataPropertyClientInterface;
  }> {
    // validate the request requeries recieved from the client
    const validatedData = getBusValidatorClient.safeParse(requestQueries);

    if (!validatedData.success) {
      throw new BadRequestException({
        status: 'error',
        message: 'Failed in type validation.',
        errors: validatedData.error.errors,
      });
    }

    // check if a schedule exists with the provided schedule id query
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

    try {
      // retrieve the bus from the found schedule
      const foundBus: Bus | null = await this.prisma.bus.findUnique({
        where: {
          id: checkScheduleExists.busId,
        },
      });

      // retrieve the driver from the found bus
      const foundDriver: User | null = await this.prisma.user.findUnique({
        where: {
          id: foundBus?.driverId,
        },
      });

      //retrieve the route from the found schedule
      const foundRoute: Route | null = await this.prisma.route.findUnique({
        where: {
          id: checkScheduleExists.routeId,
        },
      });

      // retrieve all the booking informations that is related with the schedule id and journey date
      const retrievedBookingFound: Booking | null =
        await this.prisma.booking.findFirst({
          where: {
            scheduleId: checkScheduleExists.id,
          },
        });

      // retrieve all the booked seats of using that booking id
      const retrievedBookedSeats: BookedSeat[] | null =
        await this.prisma.bookedSeat.findMany({
          where: {
            bookingId: retrievedBookingFound?.id,
          },
        });

      const bookedSeats: string[] | [] = retrievedBookedSeats.flatMap(
        (retrievedBookedSeat) => {
          return retrievedBookedSeat.seatNumbers;
        },
      );

      return {
        status: 'success',
        message: 'Bus data has been fetched.',
        data: {
          busId: foundBus?.id ?? null,
          busRegistrationNumber: foundBus?.busRegistrationNumber ?? null,
          busType: foundBus?.busType ?? null,
          seats: foundBus?.seats ?? null,
          busClass: foundBus?.class ?? null,
          farePerTicket: foundBus?.farePerTicket ?? null,
          driver: {
            driverId: foundDriver?.id ?? null,
            firstName: foundDriver?.firstName ?? null,
            lastName: foundDriver?.lastName ?? null,
            email: foundDriver?.email ?? null,
            profilePicture: foundDriver?.profilePicture ?? null,
          },
          schedule: {
            scheduleId: checkScheduleExists.id,
            estimatedepartureTimeDate:
              checkScheduleExists.estimatedDepartureTimeDate,
            estimatedArrivalTimeDate:
              checkScheduleExists.estimatedArrivalTimeDate,
          },
          route: {
            routeId: foundRoute?.id ?? null,
            origin: foundRoute?.origin ?? null,
            destination: foundRoute?.destination ?? null,
            distanceinKm: foundRoute?.distanceInKm ?? null,
            estimatedTimeInMIn: foundRoute?.estimatedTimeInMin ?? null,
          },
          bookedSeats: bookedSeats,
          busPicture: foundBus?.busPicture ?? null,
          createdAt: foundBus?.createdAt ?? null,
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
