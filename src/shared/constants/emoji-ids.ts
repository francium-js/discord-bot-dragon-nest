import { ElementEnum } from 'src/shared/enums/element'
import { CharacterClassEnum } from '../enums/character-class'
import { GeneralCharacterClassEnum } from '../enums/general-character-class'

export const elementEmojiMap: Record<ElementEnum, string> = {
  [ElementEnum.LIGHT]: '1351967180669063229',
  [ElementEnum.FIRE]: '1351971271834992743',
  [ElementEnum.DARK]: '1351971214394003497',
  [ElementEnum.ICE]: '1351972166400213022',
}

export const classesEmojiMap: Record<
  CharacterClassEnum | GeneralCharacterClassEnum,
  string
> = {
  [GeneralCharacterClassEnum.WARRIOR]: '1352784907369447445',
  [GeneralCharacterClassEnum.ARCHER]: '1352784710010671104',
  [GeneralCharacterClassEnum.SORCERESS]: '1352784711872938027',
  [GeneralCharacterClassEnum.CLERIC]: '1352784713743335465',
  [GeneralCharacterClassEnum.ACADEMIC]: '1352784715773644883',
  [GeneralCharacterClassEnum.KALI]: '1352784717375733921',
  [GeneralCharacterClassEnum.ASSSASIN]: '1352784708542402610',
  [GeneralCharacterClassEnum.LANCEA]: '1352784719154122862',
  [CharacterClassEnum.GLADIATOR]: '1351938746013978676',
  [CharacterClassEnum.MOON_LORD]: '1351938744709677077',
  [CharacterClassEnum.DESTROYER]: '1351938729354199091',
  [CharacterClassEnum.BARBARIAN]: '1351938690615869520',
  [CharacterClassEnum.DARK_AVENGER]: '1351940714002382933',
  [CharacterClassEnum.WIND_WALKER]: '1351938754117500988',
  [CharacterClassEnum.TEMPEST]: '1351938752372543599',
  [CharacterClassEnum.SNIPER]: '1351938750434775181',
  [CharacterClassEnum.ARTILLERY]: '1351938748186759188',
  [CharacterClassEnum.GLACIANA]: '1351939159031414846',
  [CharacterClassEnum.SALEANA]: '1351939157857009866',
  [CharacterClassEnum.OBSCURIA]: '1351939156149932043',
  [CharacterClassEnum.ILLUMIA]: '1351939154677862460',
  [CharacterClassEnum.SAINT]: '1351939088042823720',
  [CharacterClassEnum.INQUISITOR]: '1351939086763692032',
  [CharacterClassEnum.GUARDIAN]: '1351939085081640960',
  [CharacterClassEnum.CRUSADER]: '1351939083508777002',
  [CharacterClassEnum.ADEPT]: '1351939310693384273',
  [CharacterClassEnum.PHYSICIAN]: '1351939309137039471',
  [CharacterClassEnum.SHOOTING_STAR]: '1351939006010757241',
  [CharacterClassEnum.GEAR_MASTER]: '1351939004219658353',
  [CharacterClassEnum.BLADE_DANCER]: '1351939373158891652',
  [CharacterClassEnum.SOUL_EATER]: '1351939371045093457',
  [CharacterClassEnum.DARK_SUMMONER]: '1351939369602256918',
  [CharacterClassEnum.SPIRIT_DANCER]: '1351939367681134654',
  [CharacterClassEnum.RIPPER]: '1351940608784339167',
  [CharacterClassEnum.LIGHT_FURY]: '1351940544724467794',
  [CharacterClassEnum.RAVEN]: '1351940533001519104',
  [CharacterClassEnum.ABYSS_WALKER]: '1351940531378196490',
  [CharacterClassEnum.FLURRY]: '1351939486967271527',
  [CharacterClassEnum.VALKYRIE]: '1351939485964959835',
}
