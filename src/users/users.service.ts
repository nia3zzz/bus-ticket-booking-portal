import {
  Injectable,
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  createUserValidator,
  getDriverClientValidator,
  loginValidator,
  updateProfileValidator,
  verifyEmailValidator,
} from './users.zodValidator';
import {
  BookedSeat,
  Booking,
  Bus,
  Refund,
  Route,
  Schedule,
  Ticket,
  User,
  Verifications,
} from '@prisma/client';
import * as argon2 from 'argon2';
import { cloudinaryConfig, uploadedImageInterface } from 'src/cloudinaryConfig';
import { SendMailToVerifyEmailWithCode } from 'src/nodemailerMailFunctions';
import * as jwt from 'jsonwebtoken';
import { customExpressInterface } from './users.guard';

// defining a type for the get driver by id route for client's data property on it's response body
export interface GetDriverOutputDataPropertyInterfaceClient {
  driverId: string;
  driverFirstName: string;
  driverLastName: string;
  email: string;
  phoneNumber: string;
  profilePicture: string;
  bus: {
    busId: string | null;
    busRegistrationNumber: string | null;
    busType: 'AC_BUS' | 'NONE_AC_BUS' | 'SLEEPER_BUS' | null;
    class: 'ECONOMY' | 'BUSINESS' | 'FIRSTCLASS' | null;
    farePerTicket: number | null;
    busPicture: string | null;
  };
  totalTrips: number;
}

//defining a type interface for the get profile dashboard's data property on it's response body
export interface UserProfileDashboardOutputDataPropertyInterface {
  user: {
    userId: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    profilePicture: string;
    role: 'PASSENGER' | 'DRIVER' | 'ADMIN' | 'STAFF';
    isVerified: boolean;
    joinedOn: Date;
  };
  bookings: {
    tripCompletedBookings: {
      id: string;
      origin: string | null;
      destination: string | null;
      journeyDate: Date;
    }[];
    TripInProgressBookings: {
      id: string;
      busRegistrationNumber: string | null;
      busType: 'AC_BUS' | 'NONE_AC_BUS' | 'SLEEPER_BUS' | null;
      class: 'ECONOMY' | 'BUSINESS' | 'FIRSTCLASS' | null;
      numberOfSeats: number;
      origin: string | null;
      destination: string | null;
      paymentStatus: 'SUCCESS' | 'REFUNDED' | null;
      journeyDate: Date;
    }[];
  };
  refunds: {
    refundId: string | null;
    reason: string | null;
    isMoneyRefunded: boolean | null;
    id: string;
    origin: string | null;
    destination: string | null;
    status: 'PENDING' | 'PAID' | 'CANCELLED';
    refundAmount: number;
    journeyDate: Date;
  }[];
}

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  // setting up a create user controller function with a custom success status, form data initialization decorator with a declaration of using file system based image loading
  async createUserService(
    requestBody: typeof createUserValidator,
  ): Promise<{ status: string; message: string }> {
    // validate the request data using the create user validator incase of error, return error
    const validatedData = createUserValidator.safeParse(requestBody);

    if (!validatedData.success) {
      throw new BadRequestException({
        status: 'error',
        message: 'Failed in type validation.',
        errors: validatedData.error.errors,
      });
    }

    // check for already existing users with the email or phone number
    const checkDuplicateUserByEmail: User | null =
      await this.prisma.user.findUnique({
        where: {
          email: validatedData.data.email,
        },
      });

    if (checkDuplicateUserByEmail !== null) {
      throw new ConflictException({
        status: 'error',
        message: 'This email has been taken.',
      });
    }

    const checkDuplicateUserByPhoneNumber: User | null =
      await this.prisma.user.findUnique({
        where: {
          phoneNumber: validatedData.data.phoneNumber,
        },
      });

    if (checkDuplicateUserByPhoneNumber !== null) {
      throw new ConflictException({
        status: 'error',
        message: 'This phone number has been taken.',
      });
    }

    try {
      // hash the user password using a password hashing library
      const hashedValidatedPassword: string = await argon2.hash(
        validatedData.data.password,
      );

      // upload the profile picture image to cloudinary
      const uploadedImage: uploadedImageInterface =
        await cloudinaryConfig.uploader.upload(
          validatedData.data.profilePicture.path,
        );

      //save the user by creating a new document
      await this.prisma.user.create({
        data: {
          firstName: validatedData.data.firstName,
          lastName: validatedData.data.lastName,
          email: validatedData.data.email,
          phoneNumber: validatedData.data.phoneNumber,
          profilePicture: uploadedImage.secure_url,
          role: 'PASSENGER',
          password: hashedValidatedPassword,
        },
      });

      //return the json body incase of successful completion, status code will be sent by the controller
      return {
        status: 'success',
        message: 'User has been created successfully.',
      };
    } catch (error) {
      throw new InternalServerErrorException({
        status: 'error',
        message: 'Something went wrong.',
      });
    }
  }

  //login service for the login controller which will validate data, do some data processing, generate token cookie and send to the client
  async loginUserService(requestBody: typeof loginValidator): Promise<string> {
    // validate the req body using a zod schema
    const validatedData = loginValidator.safeParse(requestBody);

    if (!validatedData.success) {
      throw new BadRequestException({
        status: 'error',
        message: 'Failed in type validation.',
        errors: validatedData.error.errors,
      });
    }

    // check if the user exists based on the optional fields email or phone number provided
    let foundExistingUser: User | null = null;

    if (validatedData.data.email != null) {
      foundExistingUser = await this.prisma.user.findUnique({
        where: {
          email: validatedData.data.email,
        },
      });
    } else if (validatedData.data.phoneNumber != null) {
      foundExistingUser = await this.prisma.user.findUnique({
        where: {
          phoneNumber: validatedData.data.phoneNumber,
        },
      });
    }

    // return error messages if still theres no users found
    if (foundExistingUser === null) {
      throw new UnauthorizedException({
        status: 'error',
        message: 'Invalid Credentials.',
      });
    }

    // check if the user has been marked as a verified user that has verified their emails using a 6 digit code
    if (foundExistingUser.isVerified === false) {
      // this SendMailToVerifyEmailWithCode returns the hashed string that will be saved in database
      const hashedRandomSixDigitCode =
        await SendMailToVerifyEmailWithCode(foundExistingUser);

      const hashedDocument: Verifications =
        await this.prisma.verifications.create({
          data: {
            userId: foundExistingUser.id,
            hashedCode: hashedRandomSixDigitCode,
          },
        });

      throw new UnauthorizedException({
        status: 'error',
        message: 'A 6 digit code has been sent to your email for verification.',
        verificationId: hashedDocument.id,
      });
    }
    // check and verify the password
    if (
      (await argon2.verify(
        foundExistingUser.password,
        validatedData.data.password,
      )) !== true
    ) {
      throw new UnauthorizedException({
        status: 'error',
        message: 'Invalid Credentials.',
      });
    }
    try {
      // generate a jwt, save a session and set the jwt as cookie to send it to the client
      const token: string = jwt.sign(
        { id: foundExistingUser.id },
        process.env.JWT_SECRET_KEY as string,
        { expiresIn: 60 * 60 * 24 * 30 },
      );

      // save the user session
      await this.prisma.session.create({
        data: {
          userId: foundExistingUser.id,
        },
      });

      return token;
    } catch (error) {
      throw new InternalServerErrorException({
        status: 'error',
        message: 'Something went wrong.',
      });
    }
  }

  // the verify email route that will verify a client's code to mark them as verified after providing server side generate 6 digit code also sent to their email
  async verifyEmailService(requestData: any): Promise<{
    status: string;
    message: string;
  }> {
    // validate the provided param and body's data
    const validatedData = verifyEmailValidator.safeParse({
      verificationId: requestData.params.verificationId,
      sixDigitVerificationCode:
        requestData.requestBody.sixDigitVerificationCode,
    });

    if (!validatedData.success) {
      throw new BadRequestException({
        status: 'error',
        message: 'Failed in type validation.',
        errors: validatedData.error.errors,
      });
    }

    // check if a verificaton document exists with the provided verification id
    const checkVerificationDocumentExists: Verifications | null =
      await this.prisma.verifications.findUnique({
        where: {
          id: validatedData.data.verificationId,
        },
      });

    if (!checkVerificationDocumentExists) {
      throw new NotFoundException({
        status: 'error',
        message:
          'No verification document found with provided verification id.',
      });
    }

    // verify the provided client 6 digit code with the hashed saved code in database
    const checkHashedCodeMatchesWithClientCode: boolean = await argon2.verify(
      checkVerificationDocumentExists.hashedCode,
      validatedData.data.sixDigitVerificationCode,
    );

    if (!checkHashedCodeMatchesWithClientCode) {
      throw new BadRequestException({
        status: 'error',
        message: 'Provided 6 digit code is incorrect.',
      });
    }
    try {
      // update the user's isVerified field as true scince the verification is complete
      await this.prisma.user.update({
        where: {
          id: checkVerificationDocumentExists.userId,
        },
        data: {
          isVerified: true,
        },
      });

      return {
        status: 'success',
        message: 'Your email has been verified successfully.',
      };
    } catch (error) {
      throw new InternalServerErrorException({
        status: 'error',
        message: 'Something went wrong.',
      });
    }
  }

  // the logout controller service class method that works to delete the session of a user's session and sends a success message
  async logoutUserService(request: customExpressInterface): Promise<boolean> {
    try {
      // delete session and return true to indicate success for deleting cookie from the controller
      await this.prisma.session.deleteMany({
        where: {
          userId: request.foundExistingUser.id,
        },
      });

      return true;
    } catch {
      throw new InternalServerErrorException({
        status: 'error',
        message: 'Something went wrong.',
      });
    }
  }

  // the get profile dashboard controller that will retrieve the data of user, booking and refunds to send it to the client in defined format
  async userProfileDashboardService(request: customExpressInterface): Promise<{
    status: string;
    message: string;
    data: UserProfileDashboardOutputDataPropertyInterface;
  }> {
    // no need to retrieve the user as the user will be attached in the req object in the auth guard

    // retrieve the trip completed bookings of the user
    const tripCompletedBookings: Booking[] | null =
      await this.prisma.booking.findMany({
        where: {
          AND: [
            { userId: request.foundExistingUser.id },
            { isTripCompleted: true },
          ],
        },
      });

    // retrieve the trip in progress bookings of the user
    const tripInProgressBookings: Booking[] | null =
      await this.prisma.booking.findMany({
        where: {
          AND: [
            {
              userId: request.foundExistingUser.id,
            },
            {
              status: {
                not: 'CANCELLED',
              },
            },
            {
              isTripCompleted: {
                equals: false,
              },
            },
          ],
        },
      });

    // retrieve the refund booking documents of the user
    const refundBookings: Booking[] | null = await this.prisma.booking.findMany(
      {
        where: {
          AND: [
            {
              userId: request.foundExistingUser.id,
            },
            {
              status: 'CANCELLED',
            },
          ],
        },
      },
    );

    try {
      return {
        status: 'success',
        message: 'User profile data fetched successfully.',
        data: {
          user: {
            userId: request.foundExistingUser.id,
            firstName: request.foundExistingUser.firstName,
            lastName: request.foundExistingUser.lastName,
            email: request.foundExistingUser.email,
            phoneNumber: request.foundExistingUser.phoneNumber,
            profilePicture: request.foundExistingUser.profilePicture,
            role: request.foundExistingUser.role,
            isVerified: request.foundExistingUser.isVerified,
            joinedOn: request.foundExistingUser.createdAt,
          },
          bookings: {
            tripCompletedBookings: await Promise.all(
              tripCompletedBookings.map(async (completedBooking) => {
                // retrieve the schedule document for each of the bookings
                const foundSchedule: Schedule | null =
                  await this.prisma.schedule.findUnique({
                    where: {
                      id: completedBooking.scheduleId,
                    },
                  });

                // retrieve the route document from the schedule
                const foundRoute: Route | null =
                  await this.prisma.route.findUnique({
                    where: {
                      id: foundSchedule?.routeId,
                    },
                  });

                return {
                  id: completedBooking.id,
                  origin: foundRoute?.origin ?? null,
                  destination: foundRoute?.destination ?? null,
                  journeyDate: completedBooking.journeyDate,
                };
              }),
            ),
            TripInProgressBookings: await Promise.all(
              tripInProgressBookings.map(async (tripInProgressBooking) => {
                // retrieve the schedule document for each of the bookings
                const foundSchedule: Schedule | null =
                  await this.prisma.schedule.findUnique({
                    where: {
                      id: tripInProgressBooking.scheduleId,
                    },
                  });

                // retrieve the bus document from the schedule
                const foundBus: Bus | null = await this.prisma.bus.findUnique({
                  where: {
                    id: foundSchedule?.busId,
                  },
                });

                // retrieve the route document from the schedule
                const foundRoute: Route | null =
                  await this.prisma.route.findUnique({
                    where: {
                      id: foundSchedule?.routeId,
                    },
                  });

                // retrieve the booked seats document using the booking document
                const foundBookedSeats: BookedSeat | null =
                  await this.prisma.bookedSeat.findFirst({
                    where: {
                      bookingId: tripInProgressBooking.id,
                    },
                  });

                // retrieve the payment document from the booking document
                const foundPayment = await this.prisma.payment.findFirst({
                  where: {
                    bookingId: tripInProgressBooking.id,
                  },
                });

                //set the type for the seats as its set as a jsonvalue that could of any type
                const bookedSeatObj = foundBookedSeats?.seatNumbers as [
                  string,
                  string,
                ][];

                return {
                  id: tripInProgressBooking.id,
                  busRegistrationNumber:
                    foundBus?.busRegistrationNumber ?? null,
                  busType: foundBus?.busType ?? null,
                  class: foundBus?.class ?? null,
                  numberOfSeats: bookedSeatObj?.length ?? 0,
                  origin: foundRoute?.origin ?? null,
                  destination: foundRoute?.destination ?? null,
                  paymentStatus: foundPayment?.status ?? null,
                  journeyDate: tripInProgressBooking.journeyDate,
                };
              }),
            ),
          },
          refunds: await Promise.all(
            refundBookings.map(async (refundBooking) => {
              // retrieve the schedule document for each of the bookings
              const foundSchedule: Schedule | null =
                await this.prisma.schedule.findUnique({
                  where: {
                    id: refundBooking.scheduleId,
                  },
                });

              // retrieve the route document from the schedule
              const foundRoute: Route | null =
                await this.prisma.route.findUnique({
                  where: {
                    id: foundSchedule?.routeId,
                  },
                });

              // retrieve the ticket document using the booking id
              const foundTicket: Ticket | null =
                await this.prisma.ticket.findFirst({
                  where: {
                    bookingId: refundBooking.id,
                  },
                });

              // retrieve the refund document from the ticket id
              const foundRefund: Refund | null =
                await this.prisma.refund.findFirst({
                  where: {
                    ticketId: foundTicket?.id,
                  },
                });

              return {
                refundId: foundRefund?.id ?? null,
                reason: foundRefund?.reason ?? null,
                isMoneyRefunded: foundRefund?.isMoneyRefunded ?? null,
                id: refundBooking.id,
                origin: foundRoute?.origin ?? null,
                destination: foundRoute?.destination ?? null,
                status: refundBooking.status,
                refundAmount: refundBooking.totalPrice,
                journeyDate: refundBooking.journeyDate,
              };
            }),
          ),
        },
      };
    } catch (error) {
      throw new InternalServerErrorException({
        status: 'error',
        message: 'Something went wrong.',
      });
    }
  }

  // the update profile controller takes in data of the user's profile for updating based on the client request and the userid
  async updateProfileService(
    request: customExpressInterface,
    requestBody: typeof updateProfileValidator,
  ): Promise<
    | {
        status: string;
        message: string;
      }
    | true
  > {
    // validate the provided request body
    const validatedData = updateProfileValidator.safeParse(requestBody);

    if (!validatedData.success) {
      throw new BadRequestException({
        status: 'error',
        message: 'Failed in type validation.',
        errors: validatedData.error.errors,
      });
    }

    // check if a user with the same provided email already exists
    const checkDuplicateUserByEmail: User | null =
      await this.prisma.user.findUnique({
        where: {
          email: validatedData.data.email,
        },
      });

    if (
      checkDuplicateUserByEmail &&
      request.foundExistingUser.email !== checkDuplicateUserByEmail.email
    ) {
      throw new ConflictException({
        status: 'error',
        message: 'User with this email already exists.',
      });
    }

    // check if a user with the same provided phone number already exists
    const checkDuplicateUserByPhoneNumber: User | null =
      await this.prisma.user.findUnique({
        where: {
          phoneNumber: validatedData.data.phoneNumber,
        },
      });

    if (
      checkDuplicateUserByPhoneNumber &&
      request.foundExistingUser.phoneNumber !==
        checkDuplicateUserByPhoneNumber.phoneNumber
    ) {
      throw new ConflictException({
        status: 'error',
        message: 'User with this phone numbers already exists.',
      });
    }

    try {
      // check if the profile picture has been provided as a file or as the uploaded cloudinary image url link already saved in the user
      let cloudinaryUploadedProfilePictureUrl: string | null = null;

      if (typeof validatedData.data.profilePicture === 'string') {
        cloudinaryUploadedProfilePictureUrl =
          request.foundExistingUser.profilePicture;

        // check if no update has been found, using it in this profile picture being string case is because this already makes sure that the profile picture is not a dynamic file
        if (
          request.foundExistingUser.firstName ===
            validatedData.data.firstName &&
          request.foundExistingUser.lastName === validatedData.data.lastName &&
          request.foundExistingUser.email === validatedData.data.email &&
          request.foundExistingUser.phoneNumber ===
            validatedData.data.phoneNumber
        ) {
          throw new ConflictException({
            status: 'error',
            message: 'No changes found to update the user profile.',
          });
        }
      }

      // upload the provided profile picture by the user to cloudinary
      if (typeof validatedData.data.profilePicture === 'object') {
        const uploadedImage: uploadedImageInterface =
          await cloudinaryConfig.uploader.upload(
            validatedData.data.profilePicture.path,
          );

        cloudinaryUploadedProfilePictureUrl = uploadedImage.secure_url;
      }

      // if the email was the same update accordingly by updating the isVerfied using a conditional cheque
      const updatedUserProfile: User | null = await this.prisma.user.update({
        where: {
          id: request.foundExistingUser.id,
        },
        data: {
          firstName: validatedData.data.firstName,
          lastName: validatedData.data.lastName,
          email: validatedData.data.email,
          phoneNumber: validatedData.data.phoneNumber,
          profilePicture:
            cloudinaryUploadedProfilePictureUrl ??
            request.foundExistingUser.profilePicture,
          isVerified:
            request.foundExistingUser.email === validatedData.data.email,
        },
      });

      if (request.foundExistingUser.email !== validatedData.data.email) {
        await SendMailToVerifyEmailWithCode(updatedUserProfile);

        return true;
      }
      return {
        status: 'success',
        message: 'Profile has been updated successfully.',
      };
    } catch (error) {
      throw new InternalServerErrorException({
        status: 'error',
        message: 'Smething went wrong.',
      });
    }
  }

  // the get drivers controller will retrieve data of a driver and will retrieve the bus data binded to the driver
  async getDriverClientService(params: any): Promise<{
    status: string;
    message: string;
    data: GetDriverOutputDataPropertyInterfaceClient;
  }> {
    // validate the client provided url path parameter
    const validatedData = getDriverClientValidator.safeParse(params);

    if (!validatedData.success) {
      throw new BadRequestException({
        status: 'error',
        message: 'Failed in type validation.',
        errors: validatedData.error.errors,
      });
    }

    try {
      // check if a driver exist with the provided driver id
      const checkDriverExists: User | null = await this.prisma.user.findFirst({
        where: {
          AND: [{ id: validatedData.data.driverId }, { role: 'DRIVER' }],
        },
      });

      if (!checkDriverExists) {
        throw new NotFoundException({
          status: 'error',
          message: 'No driver found with provided id',
        });
      }

      // retrieve the binded bus to the driver
      const foundBus: Bus | null = await this.prisma.bus.findFirst({
        where: {
          driverId: checkDriverExists.id,
        },
      });

      // retrieve the ammount of trips the driver has completed
      const foundScheduleThroughBusId: Schedule | null =
        await this.prisma.schedule.findFirst({
          where: {
            busId: foundBus?.id,
          },
        });

      const completedDriverTrips: number = await this.prisma.trip.count({
        where: {
          scheduleId: foundScheduleThroughBusId?.id,
        },
      });

      return {
        status: 'success',
        message: 'Driver data has been retrieved successfully.',
        data: {
          driverId: checkDriverExists.id,
          driverFirstName: checkDriverExists.firstName,
          driverLastName: checkDriverExists.lastName,
          email: checkDriverExists.email,
          phoneNumber: checkDriverExists.phoneNumber,
          profilePicture: checkDriverExists.profilePicture,
          bus: {
            busId: foundBus?.id ?? null,
            busRegistrationNumber: foundBus?.id ?? null,
            busType: foundBus?.busType ?? null,
            class: foundBus?.class ?? null,
            farePerTicket: foundBus?.farePerTicket ?? null,
            busPicture: foundBus?.busPicture ?? null,
          },
          totalTrips: completedDriverTrips,
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
