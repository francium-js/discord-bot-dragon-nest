import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { RedisModule } from './shared/redis/redis.module'
import { RubinartManagerModule } from './modules/rubinart-manager/rubinart-manager.module'
import { AishaManagerModule } from './modules/aisha-manager/aisha-manager.module'
import { configSchema } from './config.schema'
import { dataSourceOptions } from './ormconfig'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: configSchema,
      validationOptions: {
        allowUnknown: true,
        abortEarly: true,
      },
    }),
    RedisModule,
    TypeOrmModule.forRoot({
      ...dataSourceOptions,
      migrations: [],
    }),
    AishaManagerModule,
    RubinartManagerModule,
  ],
})
export class AppModule {}
