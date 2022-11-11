import { Global, Module } from '@nestjs/common';
import { RaidHistoryRepository } from './raidHistory.repository';
import { UserRepository } from './user.repository';

@Global()
@Module({
  providers: [RaidHistoryRepository, UserRepository],
  exports: [RaidHistoryRepository, UserRepository],
})
export class PrismaModule {}
