import { HttpService } from '@nestjs/axios';
import { CACHE_MANAGER, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RaidHistory } from '@prisma/client';
import { Cache } from 'cache-manager';
import { firstValueFrom } from 'rxjs';
import { RaidHistoryRepository } from '../repository/raidHistory.repository';
import { EnterBossRaidDto } from './dto/enter-boss-raid.dto';

@Injectable()
export class BossRaidService {
  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly raidHistoryRepository: RaidHistoryRepository,
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {}

  /**
   * 입장 가능 조건: 한 번에 한 명의 유저만 보스레이드 가능
   * 1. 아무도 보스레이드를 시작한 기록이 없다면 시작 가능(캐시 값이 null or undefined라면)
   * 2. 시작한 기록이 있다면 마지막으로 시작한 유저가 보스레이드를 종료했거나, 시작한 시간으로부터 레이드 제한시간만큼 경과했어야 함
   * @param enterBossRaidDto { userId, level }
   * @cache { raidRecordId, enterTime, limit, endTime, level, score }
   */
  async enterBossRaid(enterBossRaidDto: EnterBossRaidDto) {
    const { userId, level } = enterBossRaidDto;

    // 1. 보스레이드 캐시 조회
    let bossRaid: any = await this.cacheManager.get('boss-raid');
    if (!bossRaid) {
      bossRaid = await this.cacheBossRaidAndReturn();
    }

    // 2. 보스레이드 기록 캐시 조회
    let bossRaidHistory: RaidHistory = await this.cacheManager.get(
      'boss-raid-history',
    );

    if (!bossRaidHistory) {
      // TODO 1. 보스레이드 정적 데이터 불러와서 제한 시간, 점수 가져오기
      // TODO 2. 레이드 기록 데이터 저장
      const bossRaidLimitSeconds = bossRaid.bossRaidLimitSeconds;
      const bossRaidInfo = bossRaid.levels.find((data) => data.level === level);

      await this.cacheManager.set(
        'boss-raid-history',
        bossRaidHistory,
        bossRaidLimitSeconds,
      );
      bossRaidHistory = await this.raidHistoryRepository.create({
        data: {
          // 스코어를 미리 저장하면 ttl로 인해 삭제될 때 레이드가 성공한 것으로 처리되므로 따로 저장하지 않음.
          enterTime: String(Date.now()),
          limitTime: String(Date.now() + bossRaidLimitSeconds),
          level: bossRaidInfo.level,
          userId,
        },
      });
      return { isEntered: true, raidRecordId: bossRaidHistory.raidRecordId };
    } else {
      return { isEnterd: false };
    }
  }

  async inquireBossRaid() {
    const isInProgress: RaidHistory = await this.cacheManager.get(
      'boss-raid-history',
    );

    if (isInProgress) {
      const enteredUserId = isInProgress.userId;
      return { canEnter: false, enteredUserId };
    }

    return { canEnter: true };
  }

  private cacheBossRaidAndReturn = async () => {
    const bossRaidUrl = await this.configService.get('BOSSRAID_STATIC_DATA');
    const bossRaid: any = await firstValueFrom(
      this.httpService.get(bossRaidUrl),
    );
    const bossRaidData = bossRaid.data.bossRaids[0];
    await this.cacheManager.set('boss-raid', bossRaidData, 180);
    return bossRaid.data.bossRaids[0];
  };
}
