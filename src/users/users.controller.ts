import { Controller, Post, HttpCode, Body, Req, Res } from '@nestjs/common';
import { UsersService } from './users.service';
import { FormDataRequest, FileSystemStoredFile } from 'nestjs-form-data';
import { createUserValidator, loginValidator } from './users.zodValidator';
import { Request, Response } from 'express';
import { json } from 'stream/consumers';

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
    const token = await this.userService.login(requestBody);
    return response.status(200).cookie('token', token).json({
      status: 'success',
      message: 'User has been logged in.',
    });
  }
}
