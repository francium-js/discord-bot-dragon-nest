import { Global, Module } from '@nestjs/common'
import { ConfigService, ConfigModule } from '@nestjs/config'
import Redis from 'ioredis'
import { RedisService } from './redis.service'

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'REDIS',
      useFactory: (configService: ConfigService): Redis => {
        return new Redis({
          host: configService.get('REDIS_HOST'),
          port: configService.get('REDIS_PORT'),
        })
      },
      inject: [ConfigService],
    },
    RedisService,
  ],
  exports: ['REDIS', RedisService],
})
export class RedisModule {}
