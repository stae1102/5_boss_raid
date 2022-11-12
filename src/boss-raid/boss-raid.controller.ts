import { Controller } from '@nestjs/common';
import { BossRaidService } from './boss-raid.service';

@Controller('bossRaid')
export class BossRaidController {
  constructor(private readonly bossRaidService: BossRaidService) {}
}
