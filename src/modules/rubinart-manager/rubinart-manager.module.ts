import { Module } from '@nestjs/common'
import { RubinartManagerService } from './rubinart-manager.service'
import GeneralComponentsService from 'src/shared/services/general-components.service'
import { CreatePartyPanelService } from './services'
import { CharListEntity } from 'src/entities/char-list.entity'
import { TypeOrmModule } from '@nestjs/typeorm'

@Module({
  imports: [TypeOrmModule.forFeature([CharListEntity])],
  providers: [
    RubinartManagerService,
    GeneralComponentsService,
    CreatePartyPanelService,
  ],
})
export class RubinartManagerModule {}
