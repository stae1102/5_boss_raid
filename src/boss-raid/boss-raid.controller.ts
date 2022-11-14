import { Body, Controller, Get, Patch, Post } from '@nestjs/common';
import { BossRaidService } from './boss-raid.service';
import { EndBossRaidDto } from './dto/end-boss-raid.dto';
import { EnterBossRaidDto } from './dto/enter-boss-raid.dto';

@Controller('bossRaid')
export class BossRaidController {
  constructor(private readonly bossRaidService: BossRaidService) {}

  @Post()
  async enterBossRaid(@Body() enterBossRaidDto: EnterBossRaidDto) {
    return this.bossRaidService.enterBossRaid(enterBossRaidDto);
  }

  @Get()
  async inquireBossRaid() {
    return this.bossRaidService.inquireBossRaid();
  }

  @Patch()
  async endBossRaid(@Body() endBossRaidDto: EndBossRaidDto) {
    return this.bossRaidService.endBossRaid(endBossRaidDto);
  }
}
