import { HttpService } from '@nestjs/axios';
import {
  BadRequestException,
  CACHE_MANAGER,
  HttpStatus,
  Inject,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RaidHistory } from '@prisma/client';
import { Cache } from 'cache-manager';
import { firstValueFrom } from 'rxjs';
import { RaidHistoryRepository } from '../repository/raidHistory.repository';
import { EndBossRaidDto } from './dto/end-boss-raid.dto';
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
      // TODO 레벨 검사 - dto에서 유효성 검사하기
      const bossRaidLimitSeconds = bossRaid.bossRaidLimitSeconds;
      const bossRaidInfo = bossRaid.levels.find((data) => data.level === level);
      bossRaidHistory = await this.raidHistoryRepository.create({
        data: {
          // 스코어를 미리 저장하면 ttl로 인해 삭제될 때 레이드가 성공한 것으로 처리되므로 따로 저장하지 않음.
          enterTime: String(Date.now()),
          limitTime: String(Date.now() + bossRaidLimitSeconds * 1000),
          level: bossRaidInfo.level,
          userId,
        },
      });
      // cache-manager-redis-store에서 ttl이 적용되지 않아 임시로
      // bossRaid 정적 데이터를 받아 기본 ttl 값을 정적 데이터의 시간으로 저장했습니다.
      // 직접 ttl 문제를 해결하면서 겸사겸사 임시 해결 방안을 해당 패키지 이슈에 기록했습니다.
      // https://github.com/dabroek/node-cache-manager-redis-store/issues/40
      await this.cacheManager.set(
        'boss-raid-history',
        bossRaidHistory,
        bossRaidLimitSeconds,
      );
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

  /**
   * 랭킹 결과를 계속 업데이트 하면서 캐싱 저장
   * @param endBossRaid { userId, raidRecordId }
   */
  async endBossRaid(endBossRaid: EndBossRaidDto) {
    // 캐시에서 불러오지 말고 내 DB에서 레이드 기록 불러오기
    // 1. Check userId & raidRecordId in Request Body
    const { userId, raidRecordId } = endBossRaid;
    const currentBossRaid: RaidHistory =
      await this.raidHistoryRepository.findFirst({ raidRecordId });
    const {
      userId: currentRaidUserId,
      raidRecordId: currentRaidRecordId,
      limitTime: currentRaidLimitTime,
      endTime: currentRaidEndTime,
      level: currentRaidLevel,
    } = currentBossRaid;

    const notMatchedUser = userId !== currentRaidUserId;
    const notMatchedRecord = raidRecordId !== currentRaidRecordId;
    const alreadyEndedRaid = currentRaidEndTime !== null;

    if (notMatchedUser || notMatchedRecord || alreadyEndedRaid) {
      throw new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: ['유효하지 않은 요청입니다.'],
      });
    }

    const result = await this.raidHistoryRepository.$transaction(async () => {
      // 트랜잭션 시작
      // 끝난 시간을 현재로 지정
      const updatedEndTime = await this.raidHistoryRepository.update(
        { endTime: String(Date.now()) },
        { raidRecordId },
      );

      // 2. Check time limit
      const raidTimeOver = +currentRaidLimitTime < Date.now();
      if (raidTimeOver) {
        throw new BadRequestException({
          statusCode: HttpStatus.BAD_REQUEST,
          message: ['제한 클리어 시간이 지났습니다.'],
        });
      }

      // 3. Bring up BossRaid Data
      // 보스 레이드 데이터 타입은 추후에 지정
      let bossRaidData: any = await this.cacheManager.get('boss-raid');
      if (!bossRaidData) {
        bossRaidData = await this.cacheBossRaidAndReturn();
      }
      const bossRaidLevelInfo = bossRaidData.levels.find(
        (data) => data.level === currentRaidLevel,
      );
      let bossRaidScore = bossRaidLevelInfo.score;

      const endedBossRaidRecord = await this.raidHistoryRepository.update(
        { score: bossRaidScore },
        { raidRecordId },
      );
      // 4. 랭킹 리스트 조회/생성 및 해당 유저 랭킹 등록/수정
      // 4-1. 랭킹 리스트 조회
      const allRanking: number[] =
        (await this.cacheManager.get('all_raid_ranking')) || [];
      allRanking.push(userId);
      await this.cacheManager.set('all_raid_ranking', allRanking, -1);

      // 4-2. 해당 유저 랭킹 등록/수정
      const myRankingInfo: Partial<RankingInfo> = await this.cacheManager.get(
        `${userId}_raid`,
      );
      if (myRankingInfo) {
        bossRaidScore += myRankingInfo.totalScore;
      }
      // 유저 랭킹 등록/수정
      await this.cacheManager.set(
        `${userId}_raid`,
        { userId, totalScore: bossRaidScore },
        -1,
      );
      return { updatedEndTime, endedBossRaidRecord };
    });
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
