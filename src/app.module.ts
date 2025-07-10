import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { AdminsModule } from './admins/admins.module';
import { BusesModule } from './buses/buses.module';

@Module({
  imports: [PrismaModule, UsersModule, AdminsModule, BusesModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
