import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { UnauthorizedException } from '@nestjs/common';
import { Session, User } from '@prisma/client';
import { Request } from 'express';
import * as jwt from 'jsonwebtoken';
import { PrismaService } from 'src/prisma/prisma.service';

// type interface declaration for json web token's verify function which returns a jwt payload
interface JWTInterface extends jwt.JwtPayload {
  id: string | jwt.JwtPayload;
}

// extending the type interface of express request for using in controllers and services to make the userid available for use with type safety in those places
export interface customExpressInterface extends Request {
  foundExistingUser: User;
}

// authentication guard used for checking the ssession and validation of the token cookig
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // convert the context to http
    const request = context.switchToHttp().getRequest();

    // the raw token cookie value after spliting from the token suffix
    const rawTokenCookieValue: string | undefined =
      request.headers.cookie?.split('=')[1];

    if (!rawTokenCookieValue) {
      throw new UnauthorizedException({
        status: 'error',
        message: 'Unauthorized, login first.',
      });
    }

    // validation of the raw token cookie value after spliting from the token suffix
    const tokenCookieValidation = jwt.verify(
      rawTokenCookieValue,
      process.env.JWT_SECRET_KEY as string,
    ) as JWTInterface;

    if (!tokenCookieValidation.id) {
      throw new UnauthorizedException({
        status: 'error',
        message: 'Unauthorized, login first.',
      });
    }

    // check if the session currently exits with the name of this user
    const foundSessionFromId: Session[] | null =
      await this.prisma.session.findMany({
        where: {
          userId: tokenCookieValidation.id as string,
        },
      });

    if (foundSessionFromId.length === 0) {
      throw new UnauthorizedException({
        status: 'error',
        message: 'Unauthorized, login first.',
      });
    }

    // find the user from the session
    const foundExistingUser: User | null = await this.prisma.user.findUnique({
      where: {
        id: foundSessionFromId[0].userId,
      },
    });

    // attatch the user in the request object
    request.foundExistingUser = foundExistingUser;

    // if the user indicates null
    if (!foundExistingUser) {
      throw new UnauthorizedException({
        status: 'error',
        message: 'Unauthorized, login first.',
      });
    }

    // check if the user is marked as unverified
    if (!foundExistingUser.isVerified) {
      throw new UnauthorizedException({
        status: 'error',
        message: 'Unauthorized, login first.',
      });
    }

    // return success
    return true;
  }
}
