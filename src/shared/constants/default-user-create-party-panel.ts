import { UserCreatePartyPanelT } from 'src/shared/types/user-create-party-panel'

export const defaultUserCreatePartyPanel: UserCreatePartyPanelT = {
  elements: [],
  serverRegion: null!,
  nest: null!,
  timeStart: '',
  timeEnd: '',
  classPriorityLoot: false,
  userDiscordId: null!,
  selectedCharId: null!,
  characters: [],
  isSecontStageOfCreateParty: false,
  description: '',
}
