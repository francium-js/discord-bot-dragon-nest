import { Module } from '@nestjs/common'
import ArgentaManagerService from './argenta-manager.service'
import { TypeOrmModule } from '@nestjs/typeorm'
import { UserEntity } from 'src/entities/user.entity'
import { ArgentaCommandsService } from './services/argenta-commands.service'

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity])],
  providers: [ArgentaManagerService, ArgentaCommandsService],
})
export class ArgentaManagerModule {}
