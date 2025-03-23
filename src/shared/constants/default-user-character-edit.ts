import { CharacterClassEnum } from '../enums/character-class'
import { GeneralCharacterClassEnum } from '../enums/general-character-class'
import { UserCharacterEditT } from '../types/user-character-edit'

export const defaultUserCharacterEdit: UserCharacterEditT = {
  name: '',
  class: '' as CharacterClassEnum,
  generalClass: '' as GeneralCharacterClassEnum,
  elements: [],
  userDiscordId: null!,
  selectedCharId: null!,
}
