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
  startTripValidator,
} from './admins.zodValidator';
import { Bus, Route, Schedule, Trip, User } from '@prisma/client';
import { cloudinaryConfig, uploadedImageInterface } from 'src/cloudinaryConfig';

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

// type inteerface declaration for the response body's data property on the get routes service
export interface GetRoutesOutputDataPropertyInterface {
  routeId: string;
  origin: string;
  destination: string;
  distanceInKm: number;
  estimatedTimeInMin: number;
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
      //retireve all the drivers, drivers will contain the driver role
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
          OR: [
            { busId: validatedData.data.busId },
            { routeId: validatedData.data.routeId },
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
            validatedData.data.estimatedDeaurtureTimeDate,
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
}
