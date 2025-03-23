import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { RedisModule } from './shared/redis/redis.module'
import { RubinartManagerModule } from './modules/rubinart-manager/rubinart-manager.module'
import { AishaManagerModule } from './modules/aisha-manager/aisha-manager.module'
import { KarahanManagerModule } from './modules/karahan-manager/karahan-manager.module'
import { ArgentaManagerModule } from './modules/argenta-manager/argenta-manager.module'
import { AppConfig, DatabaseConfig } from './config'
import { TresherDogModule } from './modules/tresher-dog/tresher-dog.module'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      load: [AppConfig, DatabaseConfig],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        ...configService.get('database'),
      }),
      inject: [ConfigService],
    }),
    RedisModule,
    TresherDogModule,
    ArgentaManagerModule,
    AishaManagerModule,
    RubinartManagerModule,
    KarahanManagerModule,
  ],
})
export class AppModule {}
