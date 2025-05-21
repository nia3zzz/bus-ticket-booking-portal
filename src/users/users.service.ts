import {
  Injectable,
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { createUserValidator } from './users.zodValidator';
import { User } from '@prisma/client';
import * as argon2 from 'argon2';
import { cloudinaryConfig } from 'src/cloudinaryConfig';

// interface to mark what we need from result of cloudinary upload function
interface uploadedImageInterface {
  secure_url: string;
}

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
}
