import { Module } from '@nestjs/common'
import CharactersListService from './characters-list/characters-list.service'
import GeneralComponentsService from 'src/shared/services/general-components.service'
import AishaManagerPanelService from './aisha-manager.service'
import CharacterAddService from './character-add/character-add.service'

@Module({
  providers: [
    AishaManagerPanelService,
    GeneralComponentsService,
    CharactersListService,
    CharacterAddService,
  ],
})
export class AishaManagerModule {}
