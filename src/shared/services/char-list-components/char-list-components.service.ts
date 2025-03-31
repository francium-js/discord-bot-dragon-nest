import { EmbedBuilder } from 'discord.js'
import { classesEmojiMap, elementEmojiMap } from 'src/shared/constants/emoji-ids'
import { MutateCharListT } from './types'

export class CharListComponentsService {
  mutateCharList({ charList, userDiscordId }: MutateCharListT): {
    embeds: EmbedBuilder[]
  } {
    const characterFields = () => {
      if (!charList?.length) {
        return [{ name: '', value: '🛑 The player has not added any characters' }]
      }

      return charList.map(char => {
        const elementsText =
          char.elements
            .map(element => `<:${element}:${elementEmojiMap[element]}>`)
            .join('') || ''

        const classText = char.class
          ? `<:${char.class}:${classesEmojiMap[char.class]}>`
          : ''

        return {
          name: '',
          value: `${classText} **${char.name}** ${elementsText}`,
        }
      })
    }

    const embed = new EmbedBuilder().setColor(0xdbc907).addFields(
      {
        name: '',
        value: `<@${userDiscordId}>`,
      },
      ...characterFields(),
    )

    return { embeds: [embed] }
  }
}
