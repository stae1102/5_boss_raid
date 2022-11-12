import { Module } from '@nestjs/common';
import { BossRaidService } from './boss-raid.service';
import { BossRaidController } from './boss-raid.controller';

@Module({
  controllers: [BossRaidController],
  providers: [BossRaidService],
})
export class BossRaidModule {}
