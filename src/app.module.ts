import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AppConfig, DatabaseConfig } from './config'
import { RedisModule } from './shared/redis/redis.module'
import { RubinartManagerModule } from './modules/rubinart-manager/rubinart-manager.module'
import { AishaManagerModule } from './modules/aisha-manager/aisha-manager.module'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      load: [AppConfig, DatabaseConfig],
    }),
    RedisModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        ...configService.get('database'),
      }),
      inject: [ConfigService],
    }),
    AishaManagerModule,
    RubinartManagerModule,
  ],
})
export class AppModule {}
