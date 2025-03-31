import { Module } from '@nestjs/common'
import { GeneralComponentsService } from 'src/shared/services/general-components/general-components.service'
import AishaManagerPanelService from './aisha-manager.service'
import { CharacterAddService, CharactersListService } from './services'
import { UserEntity } from 'src/entities/user.entity'
import { TypeOrmModule } from '@nestjs/typeorm'
import { CharacterEntity } from 'src/entities/character.entity'
import { CharListEntity } from 'src/entities/char-list.entity'
import { CharacterEditService } from './services/character-edit/character-edit.service'
import { CharListComponentsService } from 'src/shared/services/char-list-components/char-list-components.service'

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, CharacterEntity, CharListEntity])],
  providers: [
    AishaManagerPanelService,
    GeneralComponentsService,
    CharactersListService,
    CharacterAddService,
    CharacterEditService,
    CharListComponentsService,
  ],
})
export class AishaManagerModule {}
