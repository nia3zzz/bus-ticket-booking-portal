import {
  BadRequestException,
  ConflictException,
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
  getBusesValidator,
  getBusValidator,
  getSchedulesValidator,
  getTripsValidator,
  getTripValidator,
  startTripValidator,
  updateBusValidator,
  updateScheduleValidator,
  updateTripStatusValidator,
} from './admins.zodValidator';
import { Bus, Prisma, Route, Schedule, Trip, User } from '@prisma/client';
import { cloudinaryConfig, uploadedImageInterface } from 'src/cloudinaryConfig';
import { BusTypes } from '@prisma/client';

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
export interface GetBuseOutputDataPropertyInterface {
  busId: string;
  busRegistrationNumber: string;
  busType: 'AC_BUS' | 'NONE_AC_BUS' | 'SLEEPER_BUS';
  totalSeats: number;
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

      // save the bus now in the database
      await this.prisma.bus.create({
        data: {
          busRegistrationNumber: validatedData.data.busRegistrationNumber,
          busType: validatedData.data.busType,
          totalSeats: validatedData.data.totalSeats,
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

      if (validatedData.data.minSeats || validatedData.data.maxSeats) {
        where.totalSeats = {};
        if (validatedData.data.minSeats) {
          where.totalSeats.gte = validatedData.data.minSeats;
        }
        if (validatedData.data.maxSeats) {
          where.totalSeats.lte = validatedData.data.maxSeats;
        }
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
              totalSeats: retrievedBus.totalSeats,
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
    data: GetBuseOutputDataPropertyInterface;
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

    try {
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

      return {
        status: 'success',
        message: 'Bus data has been fetched.',
        data: {
          busId: checkBusExists.id,
          busRegistrationNumber: checkBusExists.busRegistrationNumber,
          busType: checkBusExists.busType,
          totalSeats: checkBusExists.totalSeats,
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
      totalSeats: requestData.requestBody.totalSeats,
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
      checkBusExists.totalSeats === validatedData.data.totalSeats &&
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
          totalSeats: validatedData.data.totalSeats,
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

      await this.prisma.schedule.delete({
        where: {
          id: foundSchedule?.id,
        },
      });

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
}
