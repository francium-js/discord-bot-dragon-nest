import { CharacterClassEnum } from '../enums/character-class'
import { ElementEnum } from '../enums/element'
import { GeneralCharacterClassEnum } from '../enums/general-character-class'

export type UserCharacterEditT = {
  userDiscordId: string
  elements: ElementEnum[]
  name: string
  class: CharacterClassEnum
  selectedCharId: number
  generalClass: GeneralCharacterClassEnum
}
