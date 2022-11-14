import { HttpModule, HttpService } from '@nestjs/axios';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { redisStore } from 'cache-manager-redis-store';
import { firstValueFrom } from 'rxjs';

export const RedisClientConfig = {
  isGlobal: true,
  imports: [ConfigModule, HttpModule],
  useFactory: async (
    configService: ConfigService,
    httpService: HttpService,
  ) => {
    const bossRaidData = await firstValueFrom(
      httpService.get(await configService.get('BOSSRAID_STATIC_DATA')),
    );
    const limitTime = bossRaidData.data.bossRaids[0].bossRaidLimitSeconds;
    const store = await redisStore({
      socket: {
        host: configService.get('REDIS_HOST'),
        port: configService.get('REDIS_PORT'),
      },
      ttl: limitTime,
    });
    return {
      store: () => store,
    };
  },
  inject: [ConfigService, HttpService],
};
