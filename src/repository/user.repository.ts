import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient, User } from '@prisma/client';

@Injectable()
export class UserRepository
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    super({
      log: [{ emit: 'stdout', level: 'query' }],
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  async create() {
    return await this.user.create({ data: {}, select: { userId: true } });
  }

  async findRaidHistoriesByUserId(userId: User['userId']) {
    return await this.raidHistory.findMany({ where: { userId } });
  }
}
