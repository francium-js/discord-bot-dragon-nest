import { CharacterClassEnum } from 'src/shared/enums/character-class'
import { ElementEnum } from 'src/shared/enums/element'

export type CharInfoToStringT = {
  class: CharacterClassEnum
  name: string
  elements: ElementEnum[]
}
