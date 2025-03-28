import { CharacterEntity } from 'src/entities/character.entity'
import { NestEnum } from 'src/shared/enums/nests'
import { ServerRegionEnum } from 'src/shared/enums/server-region'
import { UTC } from '../enums/utc'

export type UserCreatePartyPanelT = {
  userDiscordId: string
  elements: string[]
  server: ServerRegionEnum | ''
  nest: NestEnum | ''
  timeStart: string
  timeEnd: string
  classPriorityLoot: boolean
  selectedCharId?: number
  characters: CharacterEntity[]
  timeZoneUTC?: UTC
  isSecontStageOfCreateParty: boolean
}
