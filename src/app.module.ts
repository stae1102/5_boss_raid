import { CacheModule, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RedisClientOptions } from 'redis';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RedisClientConfig } from './config/redis-client.config';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    CacheModule.registerAsync<Promise<RedisClientOptions>>(RedisClientConfig),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
