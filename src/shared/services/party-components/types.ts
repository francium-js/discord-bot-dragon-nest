import { EmbedBuilder } from 'discord.js'
import { CharacterEntity } from 'src/entities/character.entity'
import { ElementEnum } from 'src/shared/enums/element'
import { NestEnum } from 'src/shared/enums/nests'
import { ServerRegionEnum } from 'src/shared/enums/server-region'

export type MutatePartyComponentT = {
  elements: ElementEnum[]
  nest: NestEnum
  serverRegion: ServerRegionEnum
  timeStart: string
  timeEnd: string
  members: CharacterEntity[]
  leader: CharacterEntity
  classPriorityLoot: boolean
  description: string
}

export type AddPartyMembersFieldsT = { embed: EmbedBuilder } & Pick<
  MutatePartyComponentT,
  'leader' | 'members'
>

export type AddPartyFieldsT = { embed: EmbedBuilder } & Pick<
  MutatePartyComponentT,
  'timeStart' | 'timeEnd'
>

export type AddPartyDescriptionT = { embed: EmbedBuilder } & Pick<
  MutatePartyComponentT,
  'description'
>
