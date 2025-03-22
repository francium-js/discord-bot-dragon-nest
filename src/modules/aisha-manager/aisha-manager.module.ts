import { Module } from '@nestjs/common'
import CharactersListService from './characters-list/characters-list.service'
import GeneralComponentsService from 'src/shared/services/general-components.service'
import AishaManagerPanelService from './aisha-manager.service'
import CharacterAddService from './character-add/character-add.service'
import { UserEntity } from 'src/entities/user.entity'
import { TypeOrmModule } from '@nestjs/typeorm'
import { CharacterEntity } from 'src/entities/character.entity'
import { CharListEntity } from 'src/entities/char-list.entity'

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, CharacterEntity, CharListEntity])],
  providers: [
    AishaManagerPanelService,
    GeneralComponentsService,
    CharactersListService,
    CharacterAddService,
  ],
})
export class AishaManagerModule {}
