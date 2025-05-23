import { Module, Global } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { CleanupService } from './cleanup.service';

@Global()
@Module({
  providers: [PrismaService, CleanupService],
  exports: [PrismaService],
})
export class PrismaModule {}
