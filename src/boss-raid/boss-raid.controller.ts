import { Body, Controller, Get, Patch, Post } from '@nestjs/common';
import { BossRaidService } from './boss-raid.service';
import { EndBossRaidDto } from './dto/end-boss-raid.dto';
import { EnterBossRaidDto } from './dto/enter-boss-raid.dto';
import { GetRankerDto } from './dto/get-ranker.dto';

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

  @Get('topRankerList')
  async getRankerList(@Body() getRankerDto: GetRankerDto) {
    return this.bossRaidService.getRankerList(getRankerDto);
  }
}
