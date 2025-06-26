import {
  Injectable,
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { createUserValidator, loginValidator } from './users.zodValidator';
import { User } from '@prisma/client';
import * as argon2 from 'argon2';
import { cloudinaryConfig, uploadedImageInterface } from 'src/cloudinaryConfig';
import { SendMailToVerifyEmailWithCode } from 'src/nodemailerMailFunctions';
import * as jwt from 'jsonwebtoken';
import { customExpressInterface } from './users.guard';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

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
}
