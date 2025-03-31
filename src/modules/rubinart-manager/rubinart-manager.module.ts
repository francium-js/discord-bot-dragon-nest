import { Module } from '@nestjs/common'
import { RubinartManagerService } from './rubinart-manager.service'
import { GeneralComponentsService } from 'src/shared/services/general-components/general-components.service'
import { CreatePartyPanelService } from './services'
import { CharListEntity } from 'src/entities/char-list.entity'
import { TypeOrmModule } from '@nestjs/typeorm'
import { UserEntity } from 'src/entities/user.entity'
import { PartyEntity } from 'src/entities/partys.entity'
import { CharacterEntity } from 'src/entities/character.entity'
import { PartComponentsService } from 'src/shared/services/party-components/party-components.service'

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CharListEntity,
      UserEntity,
      PartyEntity,
      CharacterEntity,
    ]),
  ],
  providers: [
    RubinartManagerService,
    GeneralComponentsService,
    CreatePartyPanelService,
    PartComponentsService,
  ],
})
export class RubinartManagerModule {}
