// as prisma officially doesnt support any method of deleting documents after a specified time, this task has to be handled by a node background task manager here is the script of doing so

import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import * as cron from 'node-cron';
import { PrismaService } from './prisma.service';

@Injectable()
export class CleanupService implements OnModuleInit, OnModuleDestroy {
  private cleanupTask?: cron.ScheduledTask;

  constructor(private readonly prisma: PrismaService) {}

  onModuleInit() {
    // this will run the task every 5 min
    this.cleanupTask = cron.schedule('*/5 * * * *', async () => {
      const now = new Date();

      try {
        // delete the verifications docs or rows that are expired
        const deletedVerificationsDocs =
          await this.prisma.verifications.deleteMany({
            where: {
              createdAt: { lt: new Date(now.getTime() - 30 * 60 * 1000) },
            },
          });

        // delete the user sessions that have created 30 days ago
        const deletedSessionsDocs = await this.prisma.session.deleteMany({
          where: {
            createdAt: {
              lt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
            },
          },
        });

        console.log(
          `[${new Date().toISOString()}] Deleted ${deletedVerificationsDocs.count} hashed docs and ${deletedSessionsDocs.count} sessions.`,
        );
      } catch (error) {
        console.error('Cleanup error:', error);
      }
    });
  }

  onModuleDestroy() {
    this.cleanupTask?.stop();
  }
}
