import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  addDriverValidator,
  addRouteValidator,
  createBusValidator,
  createScheduleValidator,
  deleteRouteValidator,
  getBookedSeatsDataValidator,
  getBusesValidator,
  getBusValidator,
  getRefundsValidator,
  getRefundValidator,
  getSchedulesValidator,
  getTicketDataValidator,
  getTripsValidator,
  getTripValidator,
  startTripValidator,
  updateBusValidator,
  updateMoneyRefundValidator,
  updateScheduleValidator,
  updateTripStatusValidator,
} from './admins.zodValidator';
import {
  BookedSeat,
  Booking,
  Bus,
  Payment,
  Prisma,
  Refund,
  Route,
  Schedule,
  Ticket,
  Trip,
  User,
} from '@prisma/client';
import { cloudinaryConfig, uploadedImageInterface } from 'src/cloudinaryConfig';
import { BusTypes } from '@prisma/client';
import { JsonValue } from '@prisma/client/runtime/library';

// type interface declaration for the reponse body's data propery on the get driver service
export interface GetDriversOutputDataPropertyInterface {
  driverId: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  profilePicture: string;
  totalCompletedTrips: number;
  busInfo: {
    busId: string | null;
    busRegistrationNumber: string | null;
    busType: string | null;
    busPicture: string | null;
  };
  joinedOn: Date;
}

// type interface declaration for the response body's data property on the get routes service
export interface GetRoutesOutputDataPropertyInterface {
  routeId: string;
  origin: string;
  destination: string;
  distanceInKm: number;
  estimatedTimeInMin: number;
  createdAt: Date;
}

// type interface declaration for the response body's data property on the get trips service
export interface GetTripsOutputDataPropertyInterface {
  tripId: string | null;
  scheduleId: string | null;
  status: 'UNTRACKED' | 'PENDING' | 'COMPLETED' | null;
  driverId: string | null;
  driverFirstName: string | null;
  busId: string | null;
  busRegistrationNumber: string | null;
  createdAt: Date | null;
}

// type interface declaration for the response body's data property on the get trip using trip id service
export interface GetTripOutputDataPropertyInterface {
  tripId: string;
  status: string;
  scheduleId: string | null;
  routeId: string | null;
  origin: string | null;
  destination: string | null;
  estimatedDepartureTimeDate: Date | null;
  driver: {
    driverId: string | null;
    driverFirstName: string | null;
    driverLastName: string | null;
    driverPhoneNumber: string | null;
    driverEmail: string | null;
  };
  bus: {
    busId: string | null;
    busRegistrationNumber: string | null;
    busPicture: string | null;
  };

  createdAt: Date;
}

//type interface declaration for the get buses response objects data property
export interface GetBusesOutputDataPropertyInterface {
  busId: string;
  busRegistrationNumber: string;
  busType: 'AC_BUS' | 'NONE_AC_BUS' | 'SLEEPER_BUS';
  driverId: string | null;
  driverFirstName: string | null;
  schedule: {
    scheduleId: string | null;
    origin: string | null;
    destination: string | null;
  };
  createdAt: Date;
}

// type interface declaration of the get bus's data property in the response object's body
export interface GetBusOutputDataPropertyInterface {
  busId: string;
  busRegistrationNumber: string;
  busType: 'AC_BUS' | 'NONE_AC_BUS' | 'SLEEPER_BUS';
  seats: JsonValue;
  class: 'ECONOMY' | 'BUSINESS' | 'FIRSTCLASS';
  farePerTicket: number;
  busPicture: string;
  driver: {
    driverId: string | null;
    driverFirstName: string | null;
    driverLastName: string | null;
    driverEmail: string | null;
    driverPhoneNumber: string | null;
    totalTripsCompleted: number;
  };
  schedule: {
    scheduleId: string | null;
    origin: string | null;
    destination: string | null;
    routeId: string | null;
    estimatedDepertureTime: Date | null;
    estimatedArrivalTime: Date | null;
  };
  createdAt: Date;
}

// type interface declaration of the get schedules data property in the response body
export interface GetSchedulesOutputPropertyInterface {
  scheduleId: string;
  driverId: string | null;
  driverFirstName: string | null;
  busId: string | null;
  busRegistrationNumber: string | null;
  busType: 'AC_BUS' | 'NONE_AC_BUS' | 'SLEEPER_BUS' | null;
  routeId: string | null;
  origin: string | null;
  destination: string | null;
  createdAt: Date;
}

// type interface declaration of the get schedule's data property in the response body
export interface GetScheduleOutputPropertyInterface {
  scheduleId: string;
  driver: {
    driverId: string | null;
    driverFirstName: string | null;
    driverLastName: string | null;
    driverEmail: string | null;
    driverPhoneNumber: string | null;
    driverProfilePicture: string | null;
  };
  bus: {
    busId: string | null;
    busType: 'AC_BUS' | 'NONE_AC_BUS' | 'SLEEPER_BUS' | null;
    busRegistrationNumber: string | null;
    busPicture: string | null;
  };
  route: {
    routeId: string | null;
    origin: string | null;
    destination: string | null;
  };
  estimatedDepartureTimeDate: Date;
  estimatedArrivalTimeDate: Date;
  createdAt: Date;
}

//type declaration for the interface of get ticket data service's data property withtin the response body
export interface GetTicketDataOutputPropertyInterface {
  user: {
    userId: string;
    userFirstName: string;
    userLastName: string;
    userEmail: string;
    userPhoneNumber: string;
  };
  schedule: {
    scheduleId: string;
    estimatedDepartureTimeDate: Date;
    estimatedArrivalTimeDate: Date;
  };
  bus: {
    busId: string;
    busRegistrationNumber: string;
    busType: 'AC_BUS' | 'NONE_AC_BUS' | 'SLEEPER_BUS';
    class: 'ECONOMY' | 'BUSINESS' | 'FIRSTCLASS';
  };
  route: {
    routeId: string;
    origin: string;
    destination: string;
  };
  booking: {
    bookingId: string;
    status: 'PAID';
    journeyDate: Date;
    bookedSeats: JsonValue;
    paymentStatus: 'SUCCESS';
    ticketPdfUrl: string;
  };
}

// type declaration for the interface of the Get Booked Seats Data Service's data property in the response body
export interface GetBookedSeatsDataOutputPropertyInterface {
  busId: string | null;
  busRegistrationNumber: string | null;
  driverId: string | null;
  driverFirstName: string | null;
  driverLastName: string | null;
  bookedSeatData: {
    bookingId: string;
    userId: string;
    userFirstName: string | null;
    userLastName: string | null;
    userPhoneNumber: string | null;
    status: 'PENDING' | 'PAID' | 'CANCELLED';
    bookedSeats: JsonValue | null;
  }[];
}

//type declaration for the interface of the Get Refunds Service's data property in it's response body
export interface GetRefundsOutputPropertyInterface {
  refundId: string;
  isMoneyRefunded: boolean;
  busId: string | null;
  busRegistrationNumber: string | null;
  busType: 'AC_BUS' | 'NONE_AC_BUS' | 'SLEEPER_BUS' | null;
  busClass: 'ECONOMY' | 'BUSINESS' | 'FIRSTCLASS' | null;
  origin: string | null;
  destination: string | null;
  userId: string | null;
  userFirstName: string | null;
  userLastName: string | null;
  totalPrice: number | null;
  journeyDate: Date | null;
}

//type declaration for the interface of the Get Refund Service's data property in it's response body
export interface GetRefundOutputPropertyInterface {
  refundId: string;
  ticketPdfUrl: string | null;
  reason: string;
  isMoneyRefunded: boolean;
  refundedAt: Date;
  bus: {
    busId: string | null;
    busRegistrationNumber: string | null;
    busType: 'AC_BUS' | 'NONE_AC_BUS' | 'SLEEPER_BUS' | null;
    busClass: 'ECONOMY' | 'BUSINESS' | 'FIRSTCLASS' | null;
    farePerTicket: number | null;
    busPicture: string | null;
  };
  route: {
    origin: string | null;
    destination: string | null;
  };
  user: {
    userId: string | null;
    userFirstName: string | null;
    userLastName: string | null;
    userEmail: string | null;
    userPhoneNumber: string | null;
    userProfilePicture: string | null;
  };
  totalPrice: number | null;
  paymentMethod: 'ONLINE' | 'CASH' | null;
  journeyDate: Date | null;
}

// declaring a bunch of variables that will be tasked to define the seatings of bus model depending on their class and types
const NONE_AC_BUS_ECONOMY_CLASS_SEATS: { [key: number]: string } = {
  1: '1A',
  2: '1B',
  3: '1C',
  4: '1D',
  5: '2A',
  6: '2B',
  7: '2C',
  8: '2D',
  9: '3A',
  10: '3B',
  11: '3C',
  12: '3D',
  13: '4A',
  14: '4B',
  15: '4C',
  16: '4D',
  17: '5A',
  18: '5B',
  19: '5C',
  20: '5D',
  21: '6A',
  22: '6B',
  23: '6C',
  24: '6D',
  25: '7A',
  26: '7B',
  27: '7C',
  28: '7D',
  29: '8A',
  30: '8B',
  31: '8C',
  32: '8D',
  33: '9A',
  34: '9B',
  35: '9C',
  36: '9D',
  37: '10A',
  38: '10B',
  39: '10C',
  40: '10D',
  41: '11A',
  42: '11B',
  43: '11C',
  44: '11D',
  45: '12A',
  46: '12B',
  47: '12C',
  48: '12D',
  49: '13A',
  50: '13B',
  51: '13C',
  52: '13D',
  53: '14A',
  54: '14B',
  55: '14C',
  56: '14D',
  57: '15A',
  58: '15B',
  59: '15C',
  60: '15D',
};

const AC_BUS_BUSINESS_CLASS_SEATS: { [key: number]: string } = {
  1: '1A',
  2: '1B',
  3: '1C',
  4: '2A',
  5: '2B',
  6: '2C',
  7: '3A',
  8: '3B',
  9: '3C',
  10: '4A',
  11: '4B',
  12: '4C',
  13: '5A',
  14: '5B',
  15: '5C',
  16: '6A',
  17: '6B',
  18: '6C',
  19: '7A',
  20: '7B',
  21: '7C',
  22: '8A',
  23: '8B',
  24: '8C',
  25: '9A',
  26: '9B',
  27: '9C',
  28: '10A',
  29: '10B',
  30: '10C',
  31: '11A',
  32: '11B',
  33: '11C',
  34: '12A',
  35: '12B',
  36: '12C',
  37: '13A',
  38: '13B',
  39: '13C',
  40: '14A',
};

const AC_BUS_FIRST_CLASS_SEATS: { [key: number]: string } = {
  1: '1A',
  2: '1B',
  3: '2A',
  4: '2B',
  5: '3A',
  6: '3B',
  7: '4A',
  8: '4B',
  9: '5A',
  10: '5B',
  11: '6A',
  12: '6B',
  13: '7A',
  14: '7B',
  15: '8A',
  16: '8B',
  17: '9A',
  18: '9B',
  19: '10A',
  20: '10B',
  21: '11A',
  22: '11B',
  23: '12A',
  24: '12B',
  25: '13A',
  26: '13B',
  27: '14A',
  28: '14B',
  29: '15A',
  30: '15B',
};

const SLEEPER_BUS_FIRST_CLASS_SEATS: { [key: number]: string } = {
  1: '1A',
  2: '1B',
  3: '2A',
  4: '2B',
  5: '3A',
  6: '3B',
  7: '4A',
  8: '4B',
  9: '5A',
  10: '5B',
  11: '6A',
  12: '6B',
  13: '7A',
  14: '7B',
  15: '8A',
  16: '8B',
  17: '9A',
  18: '9B',
  19: '10A',
  20: '10B',
};

@Injectable()
export class AdminsService {
  constructor(private prisma: PrismaService) {}

  // create driver service for adding a role of a driver to a user after they have done authentication and other measures
  async addDriverService(
    params: any,
  ): Promise<{ status: string; message: string }> {
    // validation of the url parameter provided
    const validatedData = addDriverValidator.safeParse({
      driverId: params.driverId,
    });

    if (!validatedData.success) {
      throw new BadRequestException({
        status: 'error',
        message: 'Failed in type validation',
        errors: validatedData.error.errors,
      });
    }

    // check if a user currently exists with the provided user id
    const checkProvidedUserExists: User | null =
      await this.prisma.user.findUnique({
        where: {
          id: validatedData.data.driverId,
        },
      });

    if (!checkProvidedUserExists) {
      throw new NotFoundException({
        status: 'error',
        message: 'No user found with the provided id.',
      });
    }

    // check if the user has been verified
    if (checkProvidedUserExists.isVerified === false) {
      throw new UnauthorizedException({
        status: 'error',
        message: 'User is not verified.',
      });
    }

    //check if the user's role is not already set as a driver
    if (checkProvidedUserExists.role === 'DRIVER') {
      throw new ConflictException({
        status: 'error',
        message: 'This user is already a driver.',
      });
    }

    try {
      // change the role of the user to a driver
      await this.prisma.user.update({
        where: {
          id: checkProvidedUserExists.id,
        },
        data: {
          role: 'DRIVER',
        },
      });

      //   return success message
      return {
        status: 'success',
        message: "User's role has been changes to driver.",
      };
    } catch (error) {
      throw new InternalServerErrorException({
        status: 'error',
        message: 'Someting went wrong.',
      });
    }
  }

  // this service removes the driver role of an already exisiting driver to a default role
  async removeDriverService(
    params: any,
  ): Promise<{ status: string; message: string }> {
    // validation of the url parameter provided
    // using the createDriverValidator for validating remove driver route as it holds the same properties
    const validatedData = addDriverValidator.safeParse({
      driverId: params.driverId,
    });

    if (!validatedData.success) {
      throw new BadRequestException({
        status: 'error',
        message: 'Failed in type validation',
        errors: validatedData.error.errors,
      });
    }

    // check if a user currently exists with the provided user id
    const checkProvidedUserExists: User | null =
      await this.prisma.user.findUnique({
        where: {
          id: validatedData.data.driverId,
        },
      });

    if (!checkProvidedUserExists) {
      throw new NotFoundException({
        status: 'error',
        message: 'No driver found with the provided id.',
      });
    }

    if (checkProvidedUserExists.role === 'PASSENGER') {
      throw new ConflictException({
        status: 'error',
        message: 'User is already a passenger.',
      });
    }

    // check if the driver is eligable to be removed of their driver role
    if (checkProvidedUserExists.role !== 'DRIVER') {
      throw new ConflictException({
        status: 'error',
        message: 'User is not a driver.',
      });
    }

    try {
      // update the user's role to a default role of a passanger
      await this.prisma.user.update({
        where: {
          id: checkProvidedUserExists.id,
        },
        data: {
          role: 'PASSENGER',
        },
      });

      return {
        status: 'success',
        message: "Driver's role has been changed to user.",
      };
    } catch (error) {
      throw new InternalServerErrorException({
        status: 'error',
        message: 'Something went wrong.',
      });
    }
  }

  // defining service functions and business logics for the creation of a route for busses to travel with with
  async addRouteService(requestBody: typeof addRouteValidator): Promise<{
    status: string;
    message: string;
  }> {
    // validation of the request body provided
    const validatedData = addRouteValidator.safeParse(requestBody);

    if (!validatedData.success) {
      throw new BadRequestException({
        status: 'error',
        message: 'Failed in type validation.',
        errors: validatedData.error.errors,
      });
    }

    // check if a route with this origin and destination already exists
    const checkRouteExists: Route | null = await this.prisma.route.findFirst({
      where: {
        origin: validatedData.data.origin,
        destination: validatedData.data.destination,
        distanceInKm: validatedData.data.distanceInKm,
        estimatedTimeInMin: validatedData.data.estimatedTimeInMin,
      },
    });

    if (checkRouteExists) {
      throw new ConflictException({
        status: 'error',
        message: 'A route with this properties already exists.',
      });
    }

    try {
      // save the route with the provided properties in the request body
      await this.prisma.route.create({
        data: {
          origin: validatedData.data.origin,
          destination: validatedData.data.destination,
          distanceInKm: validatedData.data.distanceInKm,
          estimatedTimeInMin: validatedData.data.estimatedTimeInMin,
        },
      });

      return {
        status: 'success',
        message: 'Route has been created successfully.',
      };
    } catch (error) {
      throw new InternalServerErrorException({
        status: 'error',
        message: 'Something went wrong.',
      });
    }
  }

  // defining the controller function for the getting all the created drivers saved in the database
  async getDriversService(): Promise<{
    status: string;
    message: string;
    data: GetDriversOutputDataPropertyInterface[];
  }> {
    try {
      //retrieve all the drivers, drivers will contain the driver role
      const retrievedDriversFound: User[] | [] =
        await this.prisma.user.findMany({
          where: {
            role: 'DRIVER',
          },
        });

      // retrieve all the busses that are designated with the drivers
      const retrievedBussesFound: (Bus | null)[] = await Promise.all(
        retrievedDriversFound.map(async (driver) => {
          return await this.prisma.bus.findFirst({
            where: {
              driverId: driver.id,
            },
          });
        }),
      );

      // using the index parameter with the map function as our array that holds the busses are already retrieved according to the index of the drivers
      return {
        status: 'success',
        message: `${retrievedDriversFound.length} drivers have been found.`,
        data: await Promise.all(
          retrievedDriversFound.map(async (driver, index) => {
            const bus: Bus | null = retrievedBussesFound[index];

            // check the trip count of the driver
            const retrievedScheduleFound: Schedule | null =
              await this.prisma.schedule.findFirst({
                where: {
                  busId: bus?.id,
                },
              });

            // from the found scedule we need to find the trip that is connected with it
            const retrievedTripFound: (Trip | null)[] =
              await this.prisma.trip.findMany({
                where: {
                  scheduleId: retrievedScheduleFound?.id,
                },
              });

            return {
              driverId: driver.id,
              firstName: driver.firstName,
              lastName: driver.lastName,
              email: driver.email,
              phoneNumber: driver.phoneNumber,
              profilePicture: driver.profilePicture,
              totalCompletedTrips: retrievedTripFound.length,
              busInfo: {
                busId: bus?.id ?? null,
                busRegistrationNumber: bus?.busRegistrationNumber ?? null,
                busType: bus?.busType ?? null,
                busPicture: bus?.busPicture ?? null,
              },
              joinedOn: driver.createdAt,
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

  // defining a controller function for the sending a list of all the routes that the buses covers to the client
  async getRoutesService(): Promise<{
    status: string;
    message: string;
    data: GetRoutesOutputDataPropertyInterface[];
  }> {
    try {
      // retrieve all the routes saved in the database
      const retrievedRoutesFound: (Route | null)[] =
        await this.prisma.route.findMany();

      // filter all the empty elements by going through all the elements of the original array
      const filteredRetrievedRoutesFound: Route[] = retrievedRoutesFound.filter(
        (route) => {
          return route != null;
        },
      );

      // send the client the elements of the newly created filtered array
      return {
        status: 'success',
        message: `${filteredRetrievedRoutesFound.length} routes have been found.`,
        data: filteredRetrievedRoutesFound.map((route) => {
          return {
            routeId: route.id,
            origin: route.origin,
            destination: route.destination,
            distanceInKm: route.distanceInKm,
            estimatedTimeInMin: route.estimatedTimeInMin,
            createdAt: route.createdAt,
          };
        }),
      };
    } catch (error) {
      throw new InternalServerErrorException({
        status: 'error',
        message: 'Something went wrong.',
      });
    }
  }

  // defining a controller function for deleting a route and send a success message to the client
  async deleteRouteService(params: any): Promise<{
    status: string;
    message: string;
  }> {
    // validation of the route id given as a parameter
    const validatedData = deleteRouteValidator.safeParse({
      routeId: params.routeId,
    });

    if (!validatedData.success) {
      throw new BadRequestException({
        status: 'error',
        message: 'Failed in type validation.',
        errors: validatedData.error.errors,
      });
    }

    // check if a route with the given route id exists in the database
    const checkRouteExists: Route | null = await this.prisma.route.findUnique({
      where: {
        id: validatedData.data.routeId,
      },
    });

    if (!checkRouteExists) {
      throw new NotFoundException({
        status: 'error',
        message: 'No route found with the provided route id.',
      });
    }

    try {
      // delete the route found using the  provided path parameter
      await this.prisma.route.delete({
        where: {
          id: checkRouteExists.id,
        },
      });

      return { status: 'success', message: 'Route has been deleted.' };
    } catch (error) {
      throw new InternalServerErrorException({
        status: 'error',
        message: 'Something went wrong.',
      });
    }
  }

  //defining a controller function for the creation of a bus using the data provided in the request body
  async createBusService(requestBody: typeof createBusValidator): Promise<{
    status: string;
    message: string;
  }> {
    // validate the request body using a defined validator
    const validatedData = createBusValidator.safeParse(requestBody);

    if (!validatedData.success) {
      throw new BadRequestException({
        status: 'error',
        message: 'Failed in type validation.',
        errors: validatedData.error.errors,
      });
    }

    // check if a driver exists with the provided id
    const checkDriverExists: User | null = await this.prisma.user.findUnique({
      where: {
        id: validatedData.data.driverId,
        role: 'DRIVER',
      },
    });

    if (!checkDriverExists) {
      throw new NotFoundException({
        status: 'error',
        message: 'No driver found with the driver id.',
      });
    }

    // check if a bus already exits using the registration number or the driver is already mapped to a bus
    const checkBusAlreadyExists: Bus | null = await this.prisma.bus.findFirst({
      where: {
        OR: [
          { busRegistrationNumber: validatedData.data.busRegistrationNumber },
          { driverId: checkDriverExists.id },
        ],
      },
    });

    if (checkBusAlreadyExists) {
      throw new ConflictException({
        status: 'error',
        message:
          'A bus with this registration number or driver already exists.',
      });
    }

    try {
      // upload the bus image to cloudinary and save it
      const uploadedImage: uploadedImageInterface =
        await cloudinaryConfig.uploader.upload(
          validatedData.data.busPicture.path,
        );

      let seats: { [key: number]: string } = {};

      if (
        validatedData.data.busType === 'NONE_AC_BUS' &&
        validatedData.data.class === 'ECONOMY'
      ) {
        seats = NONE_AC_BUS_ECONOMY_CLASS_SEATS;
      } else if (
        validatedData.data.busType === 'NONE_AC_BUS' &&
        validatedData.data.class === 'BUSINESS'
      ) {
        seats = AC_BUS_BUSINESS_CLASS_SEATS;
      } else if (
        validatedData.data.busType === 'AC_BUS' &&
        validatedData.data.class === 'FIRSTCLASS'
      ) {
        seats = AC_BUS_FIRST_CLASS_SEATS;
      } else if (
        validatedData.data.busType === 'SLEEPER_BUS' &&
        validatedData.data.class === 'FIRSTCLASS'
      ) {
        seats = SLEEPER_BUS_FIRST_CLASS_SEATS;
      }

      // save the bus now in the database
      await this.prisma.bus.create({
        data: {
          busRegistrationNumber: validatedData.data.busRegistrationNumber,
          busType: validatedData.data.busType,
          seats: seats,
          class: validatedData.data.class,
          farePerTicket: validatedData.data.farePerTicket,
          driverId: validatedData.data.driverId,
          busPicture: uploadedImage.secure_url,
        },
      });

      return {
        status: 'success',
        message: 'A bus has been created successfully.',
      };
    } catch (error) {
      throw new InternalServerErrorException({
        status: 'error',
        message: 'Something went wrong.',
      });
    }
  }

  async getBusesService(requestQueries: any): Promise<{
    status: string;
    message: string;
    data: GetBusesOutputDataPropertyInterface[];
  }> {
    // validate the request queries recieved
    const validatedData = getBusesValidator.safeParse(requestQueries);

    if (!validatedData.success) {
      throw new BadRequestException({
        status: 'error',
        message: 'Failed in type validation.',
        errors: validatedData.error.errors,
      });
    }

    try {
      // query filter variable
      let where: any = {};

      // if bus type is provided
      if (validatedData.data.busType) {
        where.busType = { equals: validatedData.data.busType as BusTypes };
      }

      // retrieve all the buses using the potential provided filter
      const retrievedBussesFound = await this.prisma.bus.findMany({
        where,
      });

      return {
        status: 'success',
        message: `${retrievedBussesFound.length} buses have been found.`,
        data: await Promise.all(
          retrievedBussesFound.map(async (retrievedBus) => {
            //retrieve the driver that is linked to the bus
            const retrievedDriver: User | null =
              await this.prisma.user.findUnique({
                where: {
                  id: retrievedBus.driverId,
                },
              });

            //retrieve the schedule which will be linked with the bus id
            const retrievedSchedule: Schedule | null =
              await this.prisma.schedule.findFirst({
                where: {
                  busId: retrievedBus.id,
                },
              });

            //retrieve the route from the schedule for each bus
            const retrievedRoute: Route | null =
              await this.prisma.route.findFirst({
                where: {
                  id: retrievedSchedule?.routeId,
                },
              });

            return {
              busId: retrievedBus.id,
              busRegistrationNumber: retrievedBus.busRegistrationNumber,
              busType: retrievedBus.busType,
              class: retrievedBus.class,
              driverId: retrievedDriver?.id ?? null,
              driverFirstName: retrievedDriver?.firstName ?? null,
              schedule: {
                scheduleId: retrievedSchedule?.id ?? null,
                origin: retrievedRoute?.origin ?? null,
                destination: retrievedRoute?.destination ?? null,
              },
              createdAt: retrievedBus.createdAt,
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

  //defining a controller function that will retrieve informations related to a bus using the unique identifier
  async getBusService(params: any): Promise<{
    status: string;
    message: string;
    data: GetBusOutputDataPropertyInterface;
  }> {
    // validate the request parameter
    const validatedData = getBusValidator.safeParse(params);

    if (!validatedData.success) {
      throw new BadRequestException({
        status: 'error',
        message: 'Failed in type validation.',
        errors: validatedData.error.errors,
      });
    }

    // check if a bus exists with the provided bus id
    const checkBusExists: Bus | null = await this.prisma.bus.findUnique({
      where: {
        id: validatedData.data.busId,
      },
    });

    if (!checkBusExists) {
      throw new NotFoundException({
        status: 'error',
        message: 'No bus found with the provided bus id.',
      });
    }

    // retrieve the driver from the bus
    const retrieveDriver: User | null = await this.prisma.user.findUnique({
      where: {
        id: checkBusExists.driverId,
      },
    });

    // retrieve the schedule and route from the bus
    const retrievedSchedule: Schedule | null =
      await this.prisma.schedule.findFirst({
        where: {
          busId: checkBusExists.id,
        },
      });

    const retrievedRoute: Route | null = await this.prisma.route.findFirst({
      where: {
        id: retrievedSchedule?.routeId,
      },
    });

    // retrieve the count of trips using the schedule id
    const tripCountOfDriver: number | null = await this.prisma.trip.count({
      where: {
        scheduleId: retrievedSchedule?.id,
      },
    });

    try {
      return {
        status: 'success',
        message: 'Bus data has been fetched.',
        data: {
          busId: checkBusExists.id,
          busRegistrationNumber: checkBusExists.busRegistrationNumber,
          busType: checkBusExists.busType,
          seats: checkBusExists.seats,
          class: checkBusExists.class,
          farePerTicket: checkBusExists.farePerTicket,
          busPicture: checkBusExists.busPicture,
          driver: {
            driverId: retrieveDriver?.id ?? null,
            driverFirstName: retrieveDriver?.firstName ?? null,
            driverLastName: retrieveDriver?.lastName ?? null,
            driverEmail: retrieveDriver?.email ?? null,
            driverPhoneNumber: retrieveDriver?.phoneNumber ?? null,
            totalTripsCompleted: tripCountOfDriver,
          },
          schedule: {
            scheduleId: retrievedSchedule?.id ?? null,
            origin: retrievedRoute?.origin ?? null,
            destination: retrievedRoute?.destination ?? null,
            routeId: retrievedRoute?.id ?? null,
            estimatedDepertureTime:
              retrievedSchedule?.estimatedDepartureTimeDate ?? null,
            estimatedArrivalTime:
              retrievedSchedule?.estimatedArrivalTimeDate ?? null,
          },
          createdAt: checkBusExists.createdAt,
        },
      };
    } catch (error) {
      throw new InternalServerErrorException({
        status: 'error',
        message: 'Something went wrong.',
      });
    }
  }

  //defining a controller function that will update informations of a bus found by bus id parameter
  async updateBusService(requestData: any): Promise<{
    status: string;
    message: string;
  }> {
    // validate the data object provided from controller class
    const validatedData = updateBusValidator.safeParse({
      busId: requestData.params.busId,
      driverId: requestData.requestBody.driverId,
      busPicture: requestData.requestBody.busPicture,
    });

    if (!validatedData.success) {
      throw new BadRequestException({
        status: 'error',
        message: 'Failed in type validation.',
        errors: validatedData.error.errors,
      });
    }

    //  check if a bus exists with the provded bus id
    const checkBusExists: Bus | null = await this.prisma.bus.findUnique({
      where: {
        id: validatedData.data.busId,
      },
    });

    if (!checkBusExists) {
      throw new NotFoundException({
        status: 'error',
        message: 'No bus found with the provided bus id.',
      });
    }

    // check if the bus's values are different from provided values
    if (
      checkBusExists.driverId === validatedData.data.driverId &&
      !validatedData.data.busPicture
    ) {
      throw new ConflictException({
        status: 'error',
        message: 'No changes found for the bus to be updated.',
      });
    }

    // check if the driver exists using the driver id
    const checkDriverExists: User | null = await this.prisma.user.findUnique({
      where: {
        id: validatedData.data.driverId,
      },
    });

    if (!checkDriverExists) {
      throw new NotFoundException({
        status: 'error',
        message: 'No driver found with the provided driver id.',
      });
    }

    try {
      let uploadedImage: uploadedImageInterface | null = null;

      if (validatedData.data.busPicture) {
        // upload the image to the cloudinary
        uploadedImage = await cloudinaryConfig.uploader.upload(
          validatedData.data.busPicture.path,
        );
      }

      // update the bus document
      await this.prisma.bus.update({
        where: {
          id: validatedData.data.busId,
        },
        data: {
          driverId: validatedData.data.driverId,
          busPicture: uploadedImage?.secure_url ?? checkBusExists.busPicture,
        },
      });

      return {
        status: 'success',
        message: 'Bus has been updated successfully.',
      };
    } catch (error) {
      throw new InternalServerErrorException({
        status: 'error',
        message: 'Something went wrong.',
      });
    }
  }

  //defining a controller function that will delete a bus retrieved from provided bus id path parameter
  async deleteBusService(params: any): Promise<{
    status: string;
    message: string;
  }> {
    //validate the provided request url path parameter
    const validatedData = getBusValidator.safeParse(params);

    if (!validatedData.success) {
      throw new BadRequestException({
        status: 'error',
        message: 'Failed in type validation.',
        errors: validatedData.error.errors,
      });
    }

    // check if a bus exists with the provided bus id
    const checkBusExists: Bus | null = await this.prisma.bus.findUnique({
      where: {
        id: validatedData.data.busId,
      },
    });

    if (!checkBusExists) {
      throw new NotFoundException({
        status: 'error',
        message: 'No bus found with the provided bus id.',
      });
    }

    try {
      // delete the schedule associated with the bus
      const foundSchedule: Schedule | null =
        await this.prisma.schedule.findFirst({
          where: {
            busId: validatedData.data.busId,
          },
        });

      await this.prisma.trip.deleteMany({
        where: {
          scheduleId: foundSchedule?.id,
        },
      });

      if (foundSchedule) {
        await this.prisma.schedule.delete({
          where: {
            id: foundSchedule?.id,
          },
        });
      }

      // delete the bus after going through all the checks
      await this.prisma.bus.delete({
        where: {
          id: checkBusExists.id,
        },
      });

      return {
        status: 'success',
        message: 'Bus has been deleted successfully.',
      };
    } catch (error) {
      throw new InternalServerErrorException({
        status: 'error',
        message: 'Something went wrong.',
      });
    }
  }

  // defining a controller function for starting a trip with schedule id and sending a success message to the client
  async createScheduleService(
    requestBody: typeof createScheduleValidator,
  ): Promise<{
    status: string;
    message: string;
  }> {
    // validate the request body object recieved from the string
    const validatedData = createScheduleValidator.safeParse(requestBody);

    if (!validatedData.success) {
      throw new BadRequestException({
        status: 'error',
        message: 'Failed in type validation.',
        errors: validatedData.error.errors,
      });
    }

    // check if a bus exists using the given bus id
    const checkBusExists: Bus | null = await this.prisma.bus.findUnique({
      where: {
        id: validatedData.data.busId,
      },
    });

    if (!checkBusExists) {
      throw new NotFoundException({
        status: 'error',
        message: 'No bus found with the provided bus id.',
      });
    }

    // check if a route exists using te given route id
    const checkRouteExists: Route | null = await this.prisma.route.findUnique({
      where: {
        id: validatedData.data.routeId,
      },
    });

    if (!checkRouteExists) {
      throw new NotFoundException({
        status: 'error',
        message: 'No route found with the provided route id.',
      });
    }

    // check if a schedule exists with one of the error causing duplicate data, route or bus
    const checkScheduleExists: Schedule | null =
      await this.prisma.schedule.findFirst({
        where: {
          AND: [
            { busId: validatedData.data.busId },
            { routeId: validatedData.data.routeId },
            {
              estimatedArrivalTimeDate:
                validatedData.data.estimatedArrivalTimeDate,
            },
            {
              estimatedDepartureTimeDate:
                validatedData.data.estimatedDepartureTimeDate,
            },
          ],
        },
      });

    if (checkScheduleExists) {
      throw new ConflictException({
        status: 'error',
        message: 'A schedule with this configuration already exists.',
      });
    }

    try {
      // after all the checks are passed create the schedule
      await this.prisma.schedule.create({
        data: {
          routeId: checkRouteExists.id,
          busId: checkBusExists.id,
          estimatedDepartureTimeDate:
            validatedData.data.estimatedDepartureTimeDate,
          estimatedArrivalTimeDate: validatedData.data.estimatedArrivalTimeDate,
        },
      });

      return {
        status: 'success',
        message: 'A schedule has been created successfully.',
      };
    } catch (error) {
      throw new InternalServerErrorException({
        status: 'error',
        message: 'Something went wrong.',
      });
    }
  }

  // defining a controller function for starting a trip with schedule id and sending a success message to the client
  async startTripService(requestBody: typeof startTripValidator): Promise<{
    status: string;
    message: string;
  }> {
    // validate the request body from the requestbody parameter passed from the controller file
    const validatedData = startTripValidator.safeParse(requestBody);

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
        statuss: 'error',
        message: 'No schedule found with the provided schedule id.',
      });
    }

    // check if a trip is attempting to be created while the previous one with the same schedule id is marked as completed
    const checkTripIsAvailable: Trip | null = await this.prisma.trip.findFirst({
      where: {
        scheduleId: validatedData.data.scheduleId,
        NOT: {
          status: 'COMPLETED',
        },
      },
    });

    if (checkTripIsAvailable) {
      throw new ConflictException({
        status: 'error',
        message:
          'Can not start another trip, first one has not been completed.',
      });
    }

    try {
      // create a trip in database
      await this.prisma.trip.create({
        data: {
          scheduleId: validatedData.data.scheduleId,
          status: 'PENDING',
        },
      });

      return {
        status: 'success',
        message: 'Trip has been completed successfully.',
      };
    } catch (error) {
      throw new InternalServerErrorException({
        status: 'error',
        message: 'Something went wrong.',
      });
    }
  }

  // defining a controller function for retrieving a list of schedules through queries
  async getSchedulesService(requestQueries: any): Promise<{
    status: string;
    message: string;
    data: GetSchedulesOutputPropertyInterface[];
  }> {
    // validate the request queries provided in the url
    const validatedData = getSchedulesValidator.safeParse(requestQueries);

    if (!validatedData.success) {
      throw new BadRequestException({
        status: 'error',
        message: 'Failed in type validation.',
        errors: validatedData.error.errors,
      });
    }

    try {
      //build up a filter object and push filters in it
      let where: any = {};

      if (validatedData.data.driverId) {
        where.driverId = validatedData.data.driverId;
      }

      if (validatedData.data.routeId) {
        where.routeId = validatedData.data.routeId;
      }

      // retrieve the schedules using the builded up filters
      const retrievedSchedules: Schedule[] | null =
        await this.prisma.schedule.findMany({
          where,
          take: validatedData.data.limit ?? 10,
          skip: validatedData.data.skip ?? 0,
        });

      return {
        status: 'success',
        message: 'Schedule data has been fetched.',
        data: await Promise.all(
          retrievedSchedules.map(async (retrievedSchedule) => {
            // retireve the bus associated with this schedules
            const retrievedBus: Bus | null = await this.prisma.bus.findUnique({
              where: { id: retrievedSchedule.busId },
            });

            // retrieve the driver associated with this bus
            const retrievedDriver: User | null =
              await this.prisma.user.findUnique({
                where: { id: retrievedBus?.id },
              });

            // retrieved the route associated with the schedule id
            const retrievedRoute: Route | null =
              await this.prisma.route.findUnique({
                where: { id: retrievedSchedule.routeId },
              });

            return {
              scheduleId: retrievedSchedule.id,
              driverId: retrievedDriver?.id ?? null,
              driverFirstName: retrievedDriver?.firstName ?? null,
              busId: retrievedBus?.id ?? null,
              busRegistrationNumber:
                retrievedBus?.busRegistrationNumber ?? null,
              busType: retrievedBus?.busType ?? null,
              routeId: retrievedRoute?.id ?? null,
              origin: retrievedRoute?.origin ?? null,
              destination: retrievedRoute?.destination ?? null,
              createdAt: retrievedSchedule.createdAt,
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

  // defining a controller function for retrieveing information related of a schedule through it's id
  async getScheduleService(params: any): Promise<{
    status: string;
    message: string;
    data: GetScheduleOutputPropertyInterface;
  }> {
    // validate the provided url parameter, using the start trip validator instead of creating a new one because both will be having th same property and error message for client
    const validatedData = startTripValidator.safeParse(params);

    if (!validatedData.success) {
      throw new BadRequestException({
        status: 'error',
        message: 'Failed in type validation.',
        errors: validatedData.error.errors,
      });
    }

    // check if a schedule exists in the database using the provided url parameter
    const checkScheduleExists: Schedule | null =
      await this.prisma.schedule.findUnique({
        where: {
          id: validatedData.data.scheduleId,
        },
      });

    if (!checkScheduleExists) {
      throw new NotFoundException({
        status: 'error',
        message: 'No schedule was found with the provided schedule id.',
      });
    }
    try {
      // retrieve the bus, driver and route from the found schedule
      const foundBus: Bus | null = await this.prisma.bus.findUnique({
        where: {
          id: checkScheduleExists.busId,
        },
      });

      const foundDriver: User | null = await this.prisma.user.findUnique({
        where: {
          id: foundBus?.driverId,
        },
      });

      const foundRoute: Route | null = await this.prisma.route.findUnique({
        where: {
          id: checkScheduleExists.routeId,
        },
      });

      return {
        status: 'success',
        message: 'Schedule data has been fetched.',
        data: {
          scheduleId: checkScheduleExists.id,
          driver: {
            driverId: foundDriver?.id ?? null,
            driverFirstName: foundDriver?.firstName ?? null,
            driverLastName: foundDriver?.lastName ?? null,
            driverEmail: foundDriver?.email ?? null,
            driverPhoneNumber: foundDriver?.phoneNumber ?? null,
            driverProfilePicture: foundDriver?.profilePicture ?? null,
          },
          bus: {
            busId: foundBus?.id ?? null,
            busType: foundBus?.busType ?? null,
            busRegistrationNumber: foundBus?.busRegistrationNumber ?? null,
            busPicture: foundBus?.busPicture ?? null,
          },
          route: {
            routeId: foundRoute?.id ?? null,
            origin: foundRoute?.origin ?? null,
            destination: foundRoute?.destination ?? null,
          },
          estimatedDepartureTimeDate:
            checkScheduleExists.estimatedDepartureTimeDate,
          estimatedArrivalTimeDate:
            checkScheduleExists.estimatedArrivalTimeDate,
          createdAt: checkScheduleExists.createdAt,
        },
      };
    } catch (error) {
      throw new InternalServerErrorException({
        status: 'error',
        message: 'Something went wrong.',
      });
    }
  }

  // defining a controller function for updating data fields of a schedule through it's id
  async updateScheduleService(requestData: any): Promise<{
    status: string;
    message: string;
  }> {
    // validate the request body that had came from the client
    const validatedData = updateScheduleValidator.safeParse({
      scheduleId: requestData.params.scheduleId,
      busId: requestData.requestBody.busId,
      routeId: requestData.requestBody.routeId,
      estimatedDepartureTimeDate:
        requestData.requestBody.estimatedDepartureTimeDate,
      estimatedArrivalTimeDate:
        requestData.requestBody.estimatedArrivalTimeDate,
    });

    if (!validatedData.success) {
      throw new BadRequestException({
        status: 'error',
        message: 'Failed in type validation.',
        errors: validatedData.error.errors,
      });
    }

    // check if the schedule exists
    const checkScheduleExists: Schedule | null =
      await this.prisma.schedule.findUnique({
        where: {
          id: validatedData.data.scheduleId,
        },
      });

    if (!checkScheduleExists) {
      throw new NotFoundException({
        status: 'error',
        message: 'No schedule was found with the provided schedule id.',
      });
    }

    // check if the provided data is same as the already saved data
    if (
      checkScheduleExists.busId === validatedData.data.busId &&
      checkScheduleExists.routeId === validatedData.data.routeId &&
      new Date(checkScheduleExists.estimatedDepartureTimeDate).getTime() ===
        new Date(validatedData.data.estimatedDepartureTimeDate).getTime() &&
      new Date(checkScheduleExists.estimatedArrivalTimeDate).getTime() ===
        new Date(validatedData.data.estimatedArrivalTimeDate).getTime()
    ) {
      throw new BadRequestException({
        status: 'error',
        message: 'No changes found to update the schedule.',
      });
    }

    // check if the foreign keys provided for mapping them in database are infact valid to use
    const checkBusExists: Bus | null = await this.prisma.bus.findUnique({
      where: {
        id: validatedData.data.busId,
      },
    });

    if (!checkBusExists) {
      throw new NotFoundException({
        status: 'error',
        message: 'No bus was found with the provided bus id.',
      });
    }

    const checkRouteExists: Route | null = await this.prisma.route.findUnique({
      where: {
        id: validatedData.data.routeId,
      },
    });

    if (!checkRouteExists) {
      throw new NotFoundException({
        status: 'error',
        message: 'No route was found with the provided route id.',
      });
    }
    try {
      // update the schedule document
      await this.prisma.schedule.update({
        where: {
          id: checkScheduleExists.id,
        },
        data: {
          busId: validatedData.data.busId,
          routeId: validatedData.data.routeId,
          estimatedDepartureTimeDate:
            validatedData.data.estimatedDepartureTimeDate,
          estimatedArrivalTimeDate: validatedData.data.estimatedArrivalTimeDate,
        },
      });

      return {
        status: 'success',
        message: 'Schedule has been updated successfully.',
      };
    } catch (error) {
      throw new InternalServerErrorException({
        status: 'error',
        message: 'Something went wrong.',
      });
    }
  }

  //definig a controller function for deleting an existing schedule using the schedule id
  async deleteScheduleService(params: any): Promise<{
    status: string;
    message: string;
  }> {
    // validate the provided url parameter, using the start trip validator instead of creating a new one because both will be having th same property and error message for client
    const validatedData = startTripValidator.safeParse(params);

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

    try {
      await this.prisma.schedule.delete({
        where: {
          id: checkScheduleExists.id,
        },
      });

      return {
        status: 'success',
        message: 'Schedule has been deleted successfully.',
      };
    } catch (error) {
      throw new InternalServerErrorException({
        status: 'error',
        message: 'Something went wrong.',
      });
    }
  }

  //defining a controller function that will retrieve a list of trips based on filter and pagination queries
  async getTripsService(requestQueries: any): Promise<{
    status: string;
    message: string;
    data: GetTripsOutputDataPropertyInterface[];
  }> {
    // validate the recieved request queries from the controller
    const validatedQueries = getTripsValidator.safeParse(requestQueries);

    if (!validatedQueries.success) {
      throw new BadRequestException({
        status: 'error',
        message: 'Failed in type validation.',
        errors: validatedQueries.error.errors,
      });
    }

    try {
      //if the queries busid and route id are provided in the url path retieve all schedules using the queries
      if (validatedQueries.data.busId || validatedQueries.data.routeId) {
        // create a query filter object that would be used to store queres and filter schedules based on them
        const orConditions: Prisma.ScheduleWhereInput[] = [];

        if (validatedQueries.data.busId) {
          orConditions.push({ busId: validatedQueries.data.busId });
        }

        if (validatedQueries.data.routeId) {
          orConditions.push({ routeId: validatedQueries.data.routeId });
        }

        const retrievedSchedules: Schedule[] | null =
          await this.prisma.schedule.findMany({
            where: {
              OR: orConditions.length > 0 ? orConditions : undefined,
            },
            take: validatedQueries.data.limit ?? 10,
            skip: validatedQueries.data.skip ?? 0,
          });

        return {
          status: 'success',
          message: 'Trip data has been fetched.',
          data: await Promise.all(
            retrievedSchedules.map(async (retrievedSchedule) => {
              // retrieve the bus from the schedule id
              const retrivedBus: Bus | null = await this.prisma.bus.findUnique({
                where: {
                  id: retrievedSchedule.busId,
                },
              });

              // retrieve the driver from the bus id
              const retrivedDriver: User | null =
                await this.prisma.user.findUnique({
                  where: {
                    id: retrivedBus?.driverId,
                  },
                });

              const retrievedTrip: Trip | null =
                await this.prisma.trip.findFirst({
                  where: {
                    scheduleId: retrievedSchedule.id,
                  },
                });

              return {
                tripId: retrievedTrip?.id ?? null,
                scheduleId: retrievedSchedule.id,
                status: retrievedTrip?.status ?? null,
                driverId: retrivedDriver?.id ?? null,
                driverFirstName: retrivedDriver?.firstName ?? null,
                busId: retrivedDriver?.id ?? null,
                busRegistrationNumber:
                  retrivedBus?.busRegistrationNumber ?? null,
                createdAt: retrievedTrip?.createdAt ?? null,
              };
            }),
          ),
        };
      }

      // if the query schedule id is provided only
      if (validatedQueries.data.scheduleId) {
        // retrieve all the trips using the provided schedule id
        const retrievedTrips: Trip[] | null = await this.prisma.trip.findMany({
          where: {
            scheduleId: validatedQueries.data.scheduleId,
          },
          take: validatedQueries.data.limit ?? 10,
          skip: validatedQueries.data.skip ?? 0,
        });

        return {
          status: 'success',
          message: 'Trip data has been fetched.',
          data: await Promise.all(
            retrievedTrips.map(async (retrievedTrip) => {
              // retrieve the schedule from all the the found trips
              const retrievedSchedule: Schedule | null =
                await this.prisma.schedule.findFirst({
                  where: {
                    id: retrievedTrip.scheduleId,
                  },
                });

              // retrieve the bus from the schedule id
              const retrieveBus: Bus | null = await this.prisma.bus.findUnique({
                where: {
                  id: retrievedSchedule?.busId,
                },
              });

              // retrieve the driver from the bus id
              const retrieveDriver: User | null =
                await this.prisma.user.findUnique({
                  where: {
                    id: retrieveBus?.driverId,
                  },
                });

              return {
                tripId: retrievedTrip.id ?? null,
                scheduleId: retrievedSchedule?.id ?? null,
                status: retrievedTrip.status ?? null,
                driverId: retrieveDriver?.id ?? null,
                driverFirstName: retrieveDriver?.firstName ?? null,
                busId: retrieveBus?.id ?? null,
                busRegistrationNumber:
                  retrieveBus?.busRegistrationNumber ?? null,
                createdAt: retrievedTrip.createdAt ?? null,
              };
            }),
          ),
        };
      }

      // now keeping the default case in mind where no queries are provided
      const retrievedTrips: Trip[] | null = await this.prisma.trip.findMany({
        take: validatedQueries.data.limit ?? 10,
        skip: validatedQueries.data.skip ?? 0,
      });

      return {
        status: 'success',
        message: 'Trip data has been fetched.',
        data: await Promise.all(
          retrievedTrips.map(async (retrievedTrip) => {
            // retrieve all the schedules from the retrieved trip
            const retrievedSchedule: Schedule | null =
              await this.prisma.schedule.findUnique({
                where: {
                  id: retrievedTrip.scheduleId,
                },
              });

            // retrieve the bus from the schedule
            const retrievedBus: Bus | null = await this.prisma.bus.findUnique({
              where: {
                id: retrievedSchedule?.busId,
              },
            });

            // retrieve the driver from the bus
            const retrievedDriver: User | null =
              await this.prisma.user.findUnique({
                where: {
                  id: retrievedBus?.driverId,
                },
              });

            return {
              tripId: retrievedTrip?.id ?? null,
              scheduleId: retrievedSchedule?.id ?? null,
              status: retrievedTrip?.status ?? null,
              driverId: retrievedDriver?.id ?? null,
              driverFirstName: retrievedDriver?.firstName ?? null,
              busId: retrievedBus?.id ?? null,
              busRegistrationNumber:
                retrievedBus?.busRegistrationNumber ?? null,
              createdAt: retrievedTrip.createdAt ?? null,
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

  //defining a controller function that will retrieve data related to a trip
  async getTripService(params: any): Promise<{
    status: string;
    message: string;
    data: GetTripOutputDataPropertyInterface;
  }> {
    // validate the request trip id parameter provided
    const validatedData = getTripValidator.safeParse(params);

    if (!validatedData.success) {
      throw new BadRequestException({
        status: 'error',
        message: 'Failed in type validation.',
        errors: validatedData.error.errors,
      });
    }

    // check if a trip with the provided trip id parameter exists
    const checkTripExists: Trip | null = await this.prisma.trip.findUnique({
      where: {
        id: validatedData.data.tripId,
      },
    });

    if (!checkTripExists) {
      throw new NotFoundException({
        status: 'error',
        message: 'No trip found with the provided id.',
      });
    }

    try {
      // retrieve all the data fields required to complete this route
      const retrievedSchedule: Schedule | null =
        await this.prisma.schedule.findUnique({
          where: {
            id: checkTripExists.scheduleId,
          },
        });

      const retrievedBus: Bus | null = await this.prisma.bus.findUnique({
        where: {
          id: retrievedSchedule?.busId,
        },
      });

      const retrievedRoute: Route | null = await this.prisma.route.findUnique({
        where: {
          id: retrievedSchedule?.routeId,
        },
      });

      const retrievedDriver: User | null = await this.prisma.user.findUnique({
        where: {
          id: retrievedBus?.driverId,
        },
      });

      // return the data in format of the declared type
      return {
        status: 'success',
        message: 'Trip data has been fetched successfully.',
        data: {
          tripId: checkTripExists.id,
          status: checkTripExists.status,
          scheduleId: retrievedSchedule?.id ?? null,
          routeId: retrievedRoute?.id ?? null,
          origin: retrievedRoute?.origin ?? null,
          destination: retrievedRoute?.destination ?? null,
          estimatedDepartureTimeDate:
            retrievedSchedule?.estimatedDepartureTimeDate ?? null,
          driver: {
            driverId: retrievedDriver?.id ?? null,
            driverFirstName: retrievedDriver?.firstName ?? null,
            driverLastName: retrievedDriver?.lastName ?? null,
            driverPhoneNumber: retrievedDriver?.phoneNumber ?? null,
            driverEmail: retrievedDriver?.email ?? null,
          },
          bus: {
            busId: retrievedBus?.id ?? null,
            busRegistrationNumber: retrievedBus?.busRegistrationNumber ?? null,
            busPicture: retrievedBus?.busPicture ?? null,
          },

          createdAt: checkTripExists.createdAt,
        },
      };
    } catch (error) {
      throw new InternalServerErrorException({
        status: 'error',
        message: 'Something went wrong.',
      });
    }
  }

  // defining a controller function that will update the status of a trip that is in default pendind status
  async updateTripStatusService(requestParamBody: any): Promise<{
    status: string;
    message: string;
  }> {
    // validate the data coming from the client to make sure it matches the expected type
    const validatedData = updateTripStatusValidator.safeParse({
      tripId: requestParamBody.params.tripId,
      status: requestParamBody.requestBody.status,
    });

    if (!validatedData.success) {
      throw new BadRequestException({
        status: 'error',
        message: 'Failed in type validation.',
        errors: validatedData.error.errors,
      });
    }

    // check if a trip exists withh the provided trip id
    const checkTripExists: Trip | null = await this.prisma.trip.findUnique({
      where: {
        id: validatedData.data.tripId,
      },
    });

    if (!checkTripExists) {
      throw new NotFoundException({
        status: 'error',
        message: 'No trip found with the provided trip id.',
      });
    }

    // elgebility checks before updating status
    if (checkTripExists.status === 'COMPLETED') {
      throw new ConflictException({
        status: 'error',
        message: 'This trip is already completed cannot update status.',
      });
    }

    if (checkTripExists.status === validatedData.data.status) {
      throw new ConflictException({
        status: 'error',
        message: `This trip status is already marked as ${validatedData.data.status}.`,
      });
    }

    try {
      // if all the checks have passed update the status of the trip
      await this.prisma.trip.update({
        where: {
          id: checkTripExists.id,
        },
        data: {
          status: validatedData.data.status,
        },
      });

      return {
        status: 'success',
        message: 'Status of this trip has been updated successfully.',
      };
    } catch (error) {
      throw new InternalServerErrorException({
        status: 'error',
        message: 'Something went wrong.',
      });
    }
  }

  // defining a controller function that will delete an existing trip
  async deleteTripService(params: any): Promise<{
    status: string;
    message: string;
  }> {
    // validating the parameter of trip id using the same validator as get trip for it's same property
    const validatedData = getTripValidator.safeParse(params);

    if (!validatedData.success) {
      throw new BadRequestException({
        status: 'error',
        message: 'Failed in type validation.',
        errors: validatedData.error.errors,
      });
    }

    // check if a trip exists with the provided trip id parameter
    const checkTripExists: Trip | null = await this.prisma.trip.findUnique({
      where: {
        id: validatedData.data.tripId,
      },
    });

    if (!checkTripExists) {
      throw new NotFoundException({
        status: 'success',
        message: 'No trip found with the provided trip id.',
      });
    }

    try {
      // delete the trip after going through all the checks
      await this.prisma.trip.delete({
        where: {
          id: checkTripExists.id,
        },
      });

      return {
        status: 'success',
        message: 'Trip has been deleted.',
      };
    } catch (error) {
      throw new InternalServerErrorException({
        status: 'error',
        message: 'Something went wrong.',
      });
    }
  }

  // defining a controller function that will let a admin get details of a user created booking to specifically verify the ticket by the admin
  async getTicketDataService(params: any): Promise<{
    status: string;
    message: string;
    data: GetTicketDataOutputPropertyInterface;
  }> {
    // validate the requestData recieved from the controller file
    const validatedData = getTicketDataValidator.safeParse(params);

    if (!validatedData.success) {
      throw new BadRequestException({
        status: 'error',
        message: 'Failed in type validation.',
        errors: validatedData.error.errors,
      });
    }

    //check if  a booking document exists with the provided booking document id
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

    //check in the booking document if the payment has been completed
    if (checkBookingExists.status !== 'PAID') {
      throw new ForbiddenException({
        status: 'error',
        message: 'Payment for booked seats has not been completed.',
      });
    }

    //retrieve all the required foreign key documents that is linked with this document
    const foundUser: User | null = await this.prisma.user.findUnique({
      where: {
        id: checkBookingExists.userId,
      },
    });

    const foundSchedule: Schedule | null =
      await this.prisma.schedule.findUnique({
        where: {
          id: checkBookingExists.scheduleId,
        },
      });

    const foundBus: Bus | null = await this.prisma.bus.findUnique({
      where: {
        id: foundSchedule?.busId,
      },
    });

    const foundRoute: Route | null = await this.prisma.route.findUnique({
      where: {
        id: foundSchedule?.routeId,
      },
    });

    const foundBookedSeats: BookedSeat | null =
      await this.prisma.bookedSeat.findFirst({
        where: {
          bookingId: checkBookingExists?.id,
        },
      });

    const foundPayment: Payment | null = await this.prisma.payment.findFirst({
      where: {
        bookingId: checkBookingExists?.id,
      },
    });

    const foundTicket: Ticket | null = await this.prisma.ticket.findFirst({
      where: {
        bookingId: checkBookingExists?.id,
      },
    });

    //if one of the required documents are missing send back a internal server exception error message
    if (
      !foundUser ||
      !foundSchedule ||
      !foundBus ||
      !foundRoute ||
      !foundBookedSeats ||
      !foundPayment ||
      !foundTicket
    ) {
      throw new InternalServerErrorException({
        status: 'error',
        message: 'Something went wrong.',
      });
    }

    // check if the ticket has not been refunded after payment
    if (foundPayment.status === 'REFUNDED') {
      throw new ForbiddenException({
        status: 'error',
        message: 'Booked tickets are already refunded.',
      });
    }

    try {
      //return the data in the required type format of the custom interface called getTicketDataOutputPropertyInterface
      return {
        status: 'success',
        message: 'Ticket data has been retrieved successfully.',
        data: {
          user: {
            userId: foundUser.id,
            userFirstName: foundUser.firstName,
            userLastName: foundUser.lastName,
            userEmail: foundUser.email,
            userPhoneNumber: foundUser.phoneNumber,
          },
          schedule: {
            scheduleId: foundSchedule.id,
            estimatedDepartureTimeDate:
              foundSchedule.estimatedDepartureTimeDate,
            estimatedArrivalTimeDate: foundSchedule.estimatedArrivalTimeDate,
          },
          bus: {
            busId: foundBus.id,
            busRegistrationNumber: foundBus.busRegistrationNumber,
            busType: foundBus.busType,
            class: foundBus.class,
          },
          route: {
            routeId: foundRoute.id,
            origin: foundRoute.origin,
            destination: foundRoute.destination,
          },
          booking: {
            bookingId: checkBookingExists.id,
            status: checkBookingExists.status,
            journeyDate: checkBookingExists.journeyDate,
            bookedSeats: foundBookedSeats.seatNumbers,
            paymentStatus: foundPayment.status,
            ticketPdfUrl: foundTicket.ticketPdfUrl,
          },
        },
      };
    } catch (error) {
      throw new InternalServerErrorException({
        status: 'error',
        message: 'Something went wrong.',
      });
    }
  }

  // defining a controller function that will let an admin get booked seats data based on provided scheduleid and date query
  async getBookedSeatsDataService(requestQueries: any): Promise<{
    status: string;
    message: string;
    data: GetBookedSeatsDataOutputPropertyInterface;
  }> {
    // validate the recieved queries from the client
    const validatedQueries =
      getBookedSeatsDataValidator.safeParse(requestQueries);

    if (!validatedQueries.success) {
      throw new BadRequestException({
        status: 'error',
        message: 'Failed in type validation.',
        errors: validatedQueries.error.errors,
      });
    }

    // check if a schedule with the name of the provided schedule id exists in the database
    const checkScheduleExists: Schedule | null =
      await this.prisma.schedule.findUnique({
        where: {
          id: validatedQueries.data.scheduleId,
        },
      });

    if (!checkScheduleExists) {
      throw new NotFoundException({
        status: 'error',
        message: 'No schedule found with provided schedule id.',
      });
    }

    // retrieve the bus document set as a foreign key in the schedule document
    const foundBus: Bus | null = await this.prisma.bus.findUnique({
      where: {
        id: checkScheduleExists.busId,
      },
    });

    // retrieve the driver that is set as a foreign key in the bus document
    const foundDriver: User | null = await this.prisma.user.findUnique({
      where: {
        id: foundBus?.driverId,
      },
    });

    // now retrieve all the bookings based on the found schedule and provided journeyDate
    const foundBookingsFromScheduleAndJourneyDate: Booking[] | null =
      await this.prisma.booking.findMany({
        where: {
          AND: [
            {
              scheduleId: checkScheduleExists.id,
            },
            {
              journeyDate: validatedQueries.data.journeyDate,
            },
          ],
        },
      });

    try {
      // build the data to be returned and the bookings to send an array of declared type interface's data
      return {
        status: 'success',
        message: 'Booked seats data is retrieved successfully.',
        data: {
          busId: foundBus?.id ?? null,
          busRegistrationNumber: foundBus?.busRegistrationNumber ?? null,
          driverId: foundDriver?.id ?? null,
          driverFirstName: foundDriver?.firstName ?? null,
          driverLastName: foundDriver?.lastName ?? null,
          bookedSeatData: await Promise.all(
            foundBookingsFromScheduleAndJourneyDate.map(async (booking) => {
              // retrieve the customer detail from the user id booking document
              const foundUser: User | null = await this.prisma.user.findUnique({
                where: {
                  id: booking.userId,
                },
              });

              // retrieve the booked seats booked by the user
              const foundBookedSeats: BookedSeat | null =
                await this.prisma.bookedSeat.findFirst({
                  where: {
                    bookingId: booking.id,
                  },
                });

              return {
                bookingId: booking.id,
                userId: booking.userId,
                userFirstName: foundUser?.firstName ?? null,
                userLastName: foundUser?.lastName ?? null,
                userPhoneNumber: foundUser?.phoneNumber ?? null,
                status: booking.status,
                bookedSeats: foundBookedSeats?.seatNumbers ?? null,
              };
            }),
          ),
        },
      };
    } catch (error) {
      throw new InternalServerErrorException({
        status: 'error',
        message: 'Something went wrong',
      });
    }
  }

  // defining a controller function that will let an admin get a list of all refunds based on provided queries
  async getRefundsService(requestQueries: any): Promise<{
    status: string;
    message: string;
    data: GetRefundsOutputPropertyInterface[];
  }> {
    // validate the request queries from the client
    const validatedQueries = getRefundsValidator.safeParse(requestQueries);

    if (!validatedQueries.success) {
      throw new BadRequestException({
        status: 'error',
        message: 'Failed in type validation.',
        errors: validatedQueries.error.errors,
      });
    }

    // build up a where object to filter the refunds based on the queries provided
    const where: any = {};

    // retrieve all the refunds based on the where query
    if (validatedQueries.data.isMoneyRefunded === 'true') {
      where.isMoneyRefunded = true;
    } else if (validatedQueries.data.isMoneyRefunded === 'false') {
      where.isMoneyRefunded = false;
    }

    const retrievedRefunds: Refund[] | null = await this.prisma.refund.findMany(
      {
        where,
      },
    );

    try {
      return {
        status: 'success',
        message: `${retrievedRefunds.length} refunds have been retrieved.`,
        data: await Promise.all(
          retrievedRefunds.map(async (refund) => {
            // retrieve the ticket document from the refund document
            const foundTicket: Ticket | null =
              await this.prisma.ticket.findUnique({
                where: {
                  id: refund.ticketId,
                },
              });

            // retrieve the booking document from the ticket document
            const foundBooking: Booking | null =
              await this.prisma.booking.findUnique({
                where: {
                  id: foundTicket?.bookingId,
                },
              });

            // retrieve the user document from the booking document
            const foundUser: User | null = await this.prisma.user.findUnique({
              where: {
                id: foundBooking?.userId,
              },
            });

            // retrieve the schedule document from the booking document
            const foundSchedule: Schedule | null =
              await this.prisma.schedule.findUnique({
                where: {
                  id: foundBooking?.scheduleId,
                },
              });

            // retrieve the bus document from the schedule document
            const foundBus: Bus | null = await this.prisma.bus.findUnique({
              where: {
                id: foundSchedule?.busId,
              },
            });

            // retrieve the route document from the schedule document
            const foundRoute: Route | null = await this.prisma.route.findUnique(
              {
                where: {
                  id: foundSchedule?.routeId,
                },
              },
            );

            return {
              refundId: refund.id,
              isMoneyRefunded: refund.isMoneyRefunded,
              busId: foundBus?.id ?? null,
              busRegistrationNumber: foundBus?.busRegistrationNumber ?? null,
              busType: foundBus?.busType ?? null,
              busClass: foundBus?.class ?? null,
              origin: foundRoute?.origin ?? null,
              destination: foundRoute?.destination ?? null,
              userId: foundUser?.id ?? null,
              userFirstName: foundUser?.firstName ?? null,
              userLastName: foundUser?.lastName ?? null,
              totalPrice: foundBooking?.totalPrice ?? null,
              journeyDate: foundBooking?.journeyDate ?? null,
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

  // defining a controller function that will let an admin get related data on provided refund id as url path parameter
  async getRefundService(params: any): Promise<{
    status: string;
    message: string;
    data: GetRefundOutputPropertyInterface;
  }> {
    // validate the request parameter from the client
    const validatedData = getRefundValidator.safeParse(params);

    if (!validatedData.success) {
      throw new BadRequestException({
        status: 'error',
        message: 'Failed in type validation.',
        errors: validatedData.error.errors,
      });
    }

    //check if a refund exists with the provided refund id
    const checkRefundExists: Refund | null =
      await this.prisma.refund.findUnique({
        where: {
          id: validatedData.data.refundId,
        },
      });

    if (!checkRefundExists) {
      throw new NotFoundException({
        status: 'error',
        message: 'No refund found with the provided refund id.',
      });
    }

    // retrieve the ticket document from the refund document
    const foundTicket: Ticket | null = await this.prisma.ticket.findUnique({
      where: {
        id: checkRefundExists.ticketId,
      },
    });

    // retrieve the booking document from the ticket document
    const foundBooking: Booking | null = await this.prisma.booking.findUnique({
      where: {
        id: foundTicket?.bookingId,
      },
    });

    // retrieve the schedule document from the booking document
    const foundSchedule: Schedule | null =
      await this.prisma.schedule.findUnique({
        where: {
          id: foundBooking?.scheduleId,
        },
      });

    // retrieve the bus document from the schedule document
    const foundBus: Bus | null = await this.prisma.bus.findUnique({
      where: {
        id: foundSchedule?.busId,
      },
    });

    // retrieve the route document from the schedule document
    const foundRoute: Route | null = await this.prisma.route.findUnique({
      where: {
        id: foundSchedule?.routeId,
      },
    });

    // retrieve the user document from the booking document
    const foundUser: User | null = await this.prisma.user.findUnique({
      where: {
        id: foundBooking?.userId,
      },
    });

    // retrieve the payment document
    const foundPayment: Payment | null = await this.prisma.payment.findFirst({
      where: {
        bookingId: foundBooking?.id,
      },
    });
    try {
      // return the data to the client in the required format as defined in the interface
      return {
        status: 'success',
        message: 'Refund details retrieved successfully.',
        data: {
          refundId: checkRefundExists.id,
          ticketPdfUrl: foundTicket?.ticketPdfUrl ?? null,
          reason: checkRefundExists.reason,
          isMoneyRefunded: checkRefundExists.isMoneyRefunded,
          refundedAt: checkRefundExists.createdAt,
          bus: {
            busId: foundBus?.id ?? null,
            busRegistrationNumber: foundBus?.busRegistrationNumber ?? null,
            busType: foundBus?.busType ?? null,
            busClass: foundBus?.class ?? null,
            farePerTicket: foundBus?.farePerTicket ?? null,
            busPicture: foundBus?.busPicture ?? null,
          },
          route: {
            origin: foundRoute?.origin ?? null,
            destination: foundRoute?.destination ?? null,
          },
          user: {
            userId: foundUser?.id ?? null,
            userFirstName: foundUser?.firstName ?? null,
            userLastName: foundUser?.lastName ?? null,
            userEmail: foundUser?.email ?? null,
            userPhoneNumber: foundUser?.phoneNumber ?? null,
            userProfilePicture: foundUser?.profilePicture ?? null,
          },
          totalPrice: foundBooking?.totalPrice ?? null,
          paymentMethod: foundPayment?.method ?? null,
          journeyDate: foundBooking?.journeyDate ?? null,
        },
      };
    } catch (error) {
      throw new InternalServerErrorException({
        status: 'error',
        message: 'Something went wrong.',
      });
    }
  }

  // defining a controller function that will let an admin get a list of all users
  async updateMoneyRefundService(params: any): Promise<{
    status: string;
    message: string;
  }> {
    // validate the path parameter from the client
    const validatedData = updateMoneyRefundValidator.safeParse(params);

    if (!validatedData.success) {
      throw new BadRequestException({
        status: 'error',
        message: 'Failed in type validation.',
        errors: validatedData.error.errors,
      });
    }

    // check if a refund exists with the provided refund id
    const checkRefundExists: Refund | null =
      await this.prisma.refund.findUnique({
        where: {
          id: validatedData.data.refundId,
        },
      });

    if (!checkRefundExists) {
      throw new NotFoundException({
        status: 'error',
        message: 'No refund found with the provided refund id.',
      });
    }

    // check if the money is already refunded
    if (checkRefundExists.isMoneyRefunded) {
      throw new ForbiddenException({
        status: 'error',
        message: 'The money has already been refunded.',
      });
    }
    
    try {
      // retrieve the ticket document from the refund document
      const foundTicket: Ticket | null = await this.prisma.ticket.findUnique({
        where: {
          id: checkRefundExists.ticketId,
        },
      });

      // retrieve the booking document from the ticket document
      const foundBooking: Booking | null = await this.prisma.booking.findUnique(
        {
          where: {
            id: foundTicket?.bookingId,
          },
        },
      );

      // retrieve the booked seat document from the booking document
      const foundBookedSeat: BookedSeat | null =
        await this.prisma.bookedSeat.findFirst({
          where: {
            bookingId: foundBooking?.id,
          },
        });

      // delete the user's booked seats to make them available once again
      await this.prisma.bookedSeat.delete({
        where: {
          id: foundBookedSeat?.id,
        },
      });

      // update the booking document status to cancled
      await this.prisma.booking.update({
        where: {
          id: foundBooking?.id,
        },
        data: {
          status: 'CANCELLED',
        },
      });

      // update the refund document to mark the money as refunded
      await this.prisma.refund.update({
        where: {
          id: checkRefundExists.id,
        },
        data: {
          isMoneyRefunded: true,
        },
      });

      return {
        status: 'success',
        message: `Please pay ${foundBooking?.totalPrice} to the client at counter.`,
      };
    } catch (error) {
      throw new InternalServerErrorException({
        status: 'error',
        message: 'Something went wrong.',
      });
    }
  }
}
