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
} from './users.zodValidator';
import { Bus, Schedule, User } from '@prisma/client';
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

      await this.prisma.verifications.create({
        data: {
          userId: foundExistingUser.id,
          hashedCode: hashedRandomSixDigitCode,
        },
      });

      throw new UnauthorizedException({
        status: 'error',
        message: 'A 6 digit code has been sent to your email for verification.',
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

  // the update profile controller takes in data of the user's profile for updating based on the client request and the userid
  async updateProfileService(
    request: customExpressInterface,
    requestBody: typeof updateProfileValidator,
  ): Promise<{
    status: string;
    message: string;
  }> {
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

      await SendMailToVerifyEmailWithCode(updatedUserProfile);

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
