import { CharacterEntity } from 'src/entities/character.entity'
import { NestEnum } from 'src/shared/enums/nests'
import { ServerRegionEnum } from 'src/shared/enums/server-region'
import { UTC } from '../enums/utc'
import { ElementEnum } from '../enums/element'

export type UserCreatePartyPanelT = {
  userDiscordId: string
  elements: ElementEnum[]
  serverRegion: ServerRegionEnum
  nest: NestEnum
  timeStart: string
  timeEnd: string
  classPriorityLoot: boolean
  selectedCharId?: number
  characters: CharacterEntity[]
  timeZoneUTC?: UTC
  isSecontStageOfCreateParty: boolean
  description: string
}
