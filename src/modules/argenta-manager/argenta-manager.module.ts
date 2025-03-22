import { Module } from '@nestjs/common'
import ArgentaManagerService from './argenta-manager.service'

@Module({
  providers: [ArgentaManagerService],
})
export class ArgentaManagerModule {}
