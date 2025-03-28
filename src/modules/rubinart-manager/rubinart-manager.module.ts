import { Module } from '@nestjs/common'
import { RubinartManagerService } from './rubinart-manager.service'
import GeneralComponentsService from 'src/shared/services/general-components.service'
import { CreatePartyPanelService } from './services'
import { CharListEntity } from 'src/entities/char-list.entity'
import { TypeOrmModule } from '@nestjs/typeorm'
import { UserEntity } from 'src/entities/user.entity'

@Module({
  imports: [TypeOrmModule.forFeature([CharListEntity, UserEntity])],
  providers: [
    RubinartManagerService,
    GeneralComponentsService,
    CreatePartyPanelService,
  ],
})
export class RubinartManagerModule {}
