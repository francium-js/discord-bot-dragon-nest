import { CharacterClassEnum } from '../enums/character-class'
import { GeneralCharacterClassEnum } from '../enums/general-character-class'
import { UserCharacterAddT } from '../types/user-characters-add'

export const defaultUserCharacterAdd: UserCharacterAddT = {
  name: '',
  class: '' as CharacterClassEnum,
  generalClass: '' as GeneralCharacterClassEnum,
  elements: [],
  userDiscordId: null!,
}
