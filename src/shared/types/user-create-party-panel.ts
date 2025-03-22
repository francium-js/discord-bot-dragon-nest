import { NestEnum } from 'src/shared/enums/nests'
import { ServerRegionEnum } from 'src/shared/enums/server-region'

export type UserCreatePartyPanelT = {
  userId: string
  elements: string[]
  server: ServerRegionEnum | ''
  nest: NestEnum | ''
  timeStart: string
  timeEnd: string
  classPriorityLoot: boolean
}
