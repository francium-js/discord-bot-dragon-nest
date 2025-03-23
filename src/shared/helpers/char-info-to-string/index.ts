import { classesEmojiMap, elementEmojiMap } from 'src/shared/constants/emoji-ids'
import { CharInfoToStringT } from './types'

export const charInfoToString = (userData: CharInfoToStringT): string => {
  const elementsText = userData.elements
    ? userData.elements
        .map(element => `<:${element}:${elementEmojiMap[element]}>`)
        .join('')
    : ''

  const classText = userData.class
    ? `<:${userData.class}:${classesEmojiMap[userData.class]}>`
    : ''

  return `${classText} **${userData.name}** ${elementsText}`
}
