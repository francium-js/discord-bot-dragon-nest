import { CharacterClassEnum } from '../enums/character-class'
import { GeneralCharacterClassEnum } from '../enums/general-character-class'

export const classesMap: Record<GeneralCharacterClassEnum, CharacterClassEnum[]> = {
  [GeneralCharacterClassEnum.WARRIOR]: [
    CharacterClassEnum.GLADIATOR,
    CharacterClassEnum.MOON_LORD,
    CharacterClassEnum.DESTROYER,
    CharacterClassEnum.BARBARIAN,
    CharacterClassEnum.DARK_AVENGER,
  ],
  [GeneralCharacterClassEnum.ARCHER]: [
    CharacterClassEnum.WIND_WALKER,
    CharacterClassEnum.TEMPEST,
    CharacterClassEnum.SNIPER,
    CharacterClassEnum.ARTILLERY,
  ],
  [GeneralCharacterClassEnum.SORCERESS]: [
    CharacterClassEnum.GLACIANA,
    CharacterClassEnum.SALEANA,
    CharacterClassEnum.OBSCURIA,
    CharacterClassEnum.ILLUMIA,
  ],
  [GeneralCharacterClassEnum.CLERIC]: [
    CharacterClassEnum.SAINT,
    CharacterClassEnum.INQUISITOR,
    CharacterClassEnum.GUARDIAN,
    CharacterClassEnum.CRUSADER,
  ],
  [GeneralCharacterClassEnum.ACADEMIC]: [
    CharacterClassEnum.ADEPT,
    CharacterClassEnum.PHYSICIAN,
    CharacterClassEnum.SHOOTING_STAR,

    CharacterClassEnum.GEAR_MASTER,
  ],
  [GeneralCharacterClassEnum.KALI]: [
    CharacterClassEnum.BLADE_DANCER,
    CharacterClassEnum.SOUL_EATER,
    CharacterClassEnum.DARK_SUMMONER,
    CharacterClassEnum.SPIRIT_DANCER,
  ],
  [GeneralCharacterClassEnum.ASSSASIN]: [
    CharacterClassEnum.RIPPER,
    CharacterClassEnum.LIGHT_FURY,
    CharacterClassEnum.RAVEN,
    CharacterClassEnum.ABYSS_WALKER,
  ],
  [GeneralCharacterClassEnum.LANCEA]: [
    CharacterClassEnum.FLURRY,
    CharacterClassEnum.VALKYRIE,
  ],
}
