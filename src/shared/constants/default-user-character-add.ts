import { CharacterClassEnum } from '../enums/character-class'
import { GeneralCharacterClassEnum } from '../enums/general-character-class'
import { UserCharacterAddT } from '../types/user-characters-add'

export const defaultUserCharacterAdd: UserCharacterAddT = {
  nickname: '',
  class: '' as CharacterClassEnum,
  generalClass: '' as GeneralCharacterClassEnum,
  elements: [],
  userId: null!,
}
