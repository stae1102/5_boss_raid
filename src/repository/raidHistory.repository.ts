import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';

@Injectable()
export class RaidHistoryRepository
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

  async create(dataQuery) {
    return await this.raidHistory.create(dataQuery);
  }

  async findFirst(whereInput: Prisma.RaidHistoryWhereInput) {
    return await this.raidHistory.findFirst({ where: whereInput });
  }

  async findMany(whereInput: Prisma.RaidHistoryWhereInput) {
    return await this.raidHistory.findMany({ where: whereInput });
  }

  async update(
    dataInput: Prisma.RaidHistoryUpdateInput,
    whereInput: Prisma.RaidHistoryWhereUniqueInput,
  ) {
    return await this.raidHistory.update({
      data: dataInput,
      where: whereInput,
    });
  }
}
