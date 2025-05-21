
import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

// copy pasted everything from the official nestjs prisma intigration tutorial with a slight modification of a logger https://docs.nestjs.com/recipes/prisma#use-prisma-client-in-your-nestjs-services
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
   await this.$connect();
    console.log(`📧 Connected to database. TimeStamp: ${new Date}.`)
  }
}
