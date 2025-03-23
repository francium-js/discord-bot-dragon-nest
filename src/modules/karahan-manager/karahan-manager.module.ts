import { Module } from '@nestjs/common'
import { KarahanManagerService } from './karahan-manager.service'

@Module({
  providers: [KarahanManagerService],
})
export class KarahanManagerModule {}
