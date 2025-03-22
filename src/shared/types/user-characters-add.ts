import { CharacterClassEnum } from '../enums/character-class'
import { ElementEnum } from '../enums/element'
import { GeneralCharacterClassEnum } from '../enums/general-character-class'

export type UserCharacterAddT = {
  userId: string
  elements: ElementEnum[]
  nickname: string
  class: CharacterClassEnum
  generalClass: GeneralCharacterClassEnum
}
