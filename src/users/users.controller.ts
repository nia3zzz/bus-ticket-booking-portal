import {
  Controller,
  Post,
  HttpCode,
  Body,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { FormDataRequest, FileSystemStoredFile } from 'nestjs-form-data';
import { createUserValidator, loginValidator } from './users.zodValidator';
import { Response } from 'express';
import { AuthGuard, customExpressInterface } from './users.guard';

@Controller('users')
export class UsersController {
  constructor(private userService: UsersService) {}

  // setting up a create user controller function with a custom success status, form data initialization decorator with a declaration of using file system based image loading
  @Post()
  @HttpCode(201)
  @FormDataRequest({ storage: FileSystemStoredFile })
  async createUser(
    @Body() requestBody: typeof createUserValidator,
  ): Promise<{ status: string; message: string }> {
    return await this.userService.createUserService(requestBody);
  }

  // a login user controller function implimentation that will check for the verified email, will create a token cookie for verification and send it to the client
  @Post('/login')
  async login(
    @Body() requestBody: typeof loginValidator,
    @Res() response: Response,
  ): Promise<Response> {
    const token = await this.userService.loginUserService(requestBody);
    return response.status(200).cookie('token', token).json({
      status: 'success',
      message: 'User has been logged in.',
    });
  }

  // the logout controller for implimenting the logics of a user logging out by using sessions and checking authorization and authentication of user
  @Post('/logout')
  @UseGuards(AuthGuard)
  async logout(
    @Req() request: customExpressInterface,
    @Res() response: Response,
  ): Promise<Response> {
    await this.userService.logoutUserService(request);
    return response.status(200).clearCookie('token').json({
      status: 'success',
      message: 'User has been logged out.',
    });
  }
}
