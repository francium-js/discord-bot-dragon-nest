import { Injectable } from '@nestjs/common'
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  MessageFlags,
} from 'discord.js'

@Injectable()
class CharactersListService {
  async createPanel(interaction: ButtonInteraction) {
    const payLoad = this.mutateInteraction()

    await interaction.reply({ ...payLoad, flags: MessageFlags.Ephemeral })
  }

  mutateInteraction() {
    const linkButtonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setLabel(`Link to your char list`)
        .setStyle(ButtonStyle.Link)
        .setURL(
          'https://discord.com/channels/1351560947105267792/1351560949412270132/1352757387483938929',
        ),
    )

    return {
      components: [linkButtonRow],
    }
  }
}

export default CharactersListService
