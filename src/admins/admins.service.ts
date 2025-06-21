import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { addDriverValidtor, addRouteValidtor } from './admins.zodValidator';
import { Bus, Route, Schedule, Trip, User } from '@prisma/client';

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

@Injectable()
export class AdminsService {
  constructor(private prisma: PrismaService) {}

  // create driver service for adding a role of a driver to a user after they have done authentication and other measures
  async addDriverService(
    params: any,
  ): Promise<{ status: string; message: string }> {
    // validation of the url parameter provided
    const validatedData = addDriverValidtor.safeParse({
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
    const validatedData = addDriverValidtor.safeParse({
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
  async addRouteService(requestBody: typeof addRouteValidtor): Promise<{
    status: string;
    message: string;
  }> {
    // validation of the request body provided
    const validatedData = addRouteValidtor.safeParse(requestBody);

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
}
