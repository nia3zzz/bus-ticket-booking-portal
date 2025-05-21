import { Controller, Post, HttpCode, Body } from '@nestjs/common';
import { UsersService } from './users.service';
import { FormDataRequest, FileSystemStoredFile } from 'nestjs-form-data';
import { createUserValidator } from './users.zodValidator';

@Controller('users')
export class UsersController {
  constructor(private userService: UsersService) {}

  // setting up a controller function with a custom success status, form data initialization decorator with a declaration of using file system based image loading
  @Post()
  @HttpCode(201)
  @FormDataRequest({ storage: FileSystemStoredFile })
  async createUser(
    @Body() requestBody: typeof createUserValidator,
  ): Promise<{ status: string; message: string }> {
    return await this.userService.createUserService(requestBody);
  }
}
