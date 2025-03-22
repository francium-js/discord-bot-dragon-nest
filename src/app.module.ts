import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { RedisModule } from './shared/redis/redis.module'
import { RubinartManagerModule } from './modules/rubinart-manager/rubinart-manager.module'
import { AishaManagerModule } from './modules/aisha-manager/aisha-manager.module'
import { configSchema } from './config/config.schema'
import appConfig from './config/app.config'
import { AppDataSource } from './config/data-source'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      load: [appConfig],
      validationSchema: configSchema,
      validationOptions: {
        allowUnknown: true,
        abortEarly: true,
      },
    }),
    TypeOrmModule.forRoot(AppDataSource.options),
    RedisModule,
    AishaManagerModule,
    RubinartManagerModule,
  ],
})
export class AppModule {}
