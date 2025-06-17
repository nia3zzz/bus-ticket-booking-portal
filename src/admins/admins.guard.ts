import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { UnauthorizedException } from '@nestjs/common';
import { Session, User } from '@prisma/client';
import * as jwt from 'jsonwebtoken';
import { PrismaService } from 'src/prisma/prisma.service';

// type interface declaration for json web token's verify function which returns a jwt payload
interface JWTInterface extends jwt.JwtPayload {
  id: string | jwt.JwtPayload;
}

// this a admin authentication guard that will check the jwt then will refer to the account's saved data for role varification
@Injectable()
export class AdminsGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // convert the execution context to a http request for accessing the request object
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

    // store the authorized roles that can make an request to admin routes
    const authroizedAdminRoles: string[] = ['ADMIN', 'STAFF'];

    // check if the request has been sent from an admin or official roles through role verification
    if (!authroizedAdminRoles.includes(foundExistingUser.role)) {
      throw new ForbiddenException({
        status: 'error',
        message:
          'Unauthorized, do not have permission to complete this action.',
      });
    }

    // return success
    return true;
  }
}
