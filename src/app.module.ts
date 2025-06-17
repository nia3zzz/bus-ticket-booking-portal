import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { AdminsModule } from './admins/admins.module';

@Module({
  imports: [PrismaModule, UsersModule, AdminsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
