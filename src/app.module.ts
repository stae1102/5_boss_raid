import { CacheModule, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RedisClientOptions } from 'redis';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RedisClientConfig } from './config/redis-client.config';
import { PrismaModule } from './repository/prisma.module';
import { UserModule } from './user/user.module';
import { BossRaidModule } from './boss-raid/boss-raid.module';

@Module({
  imports: [
    PrismaModule,
    ConfigModule.forRoot({ isGlobal: true }),
    CacheModule.registerAsync<Promise<RedisClientOptions>>(RedisClientConfig),
    UserModule,
    BossRaidModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
