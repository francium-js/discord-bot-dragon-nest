import { Module } from '@nestjs/common'
import RubinartManagerService from './rubinart-manager.service'
import GeneralComponentsService from 'src/shared/services/general-components.service'
import CreatePartyPanelService from './create-party-panel/create-party-panel.service'

@Module({
  providers: [
    RubinartManagerService,
    GeneralComponentsService,
    CreatePartyPanelService,
  ],
})
export class RubinartManagerModule {}
