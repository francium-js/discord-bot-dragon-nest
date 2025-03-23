import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  MessageFlags,
} from 'discord.js'
import { CharListEntity } from 'src/entities/char-list.entity'
import GeneralComponentsService from 'src/shared/services/general-components.service'
import { Repository } from 'typeorm'

@Injectable()
export class CharactersEditService {
  private charListDiscordChalledId: string = process.env.CHARS_LIST_CHANNEL_ID

  constructor(
    @InjectRepository(CharListEntity)
    private readonly charListRepository: Repository<CharListEntity>,
    private readonly generalComponentsService: GeneralComponentsService,
  ) {}

  async createPanel(interaction: ButtonInteraction) {
    const userCharList = await this.charListRepository.findOne({
      where: { user: { discordId: interaction.user.id } },
    })

    if (!userCharList) {
      await this.generalComponentsService.sendErrorMessage(
        ['Oops, something want wrong...', 'Write to Admin pleeease >.<'],
        interaction,
      )

      return
    }

    const linkButtonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setLabel(`Link to your char-list`)
        .setStyle(ButtonStyle.Link)
        .setURL(
          `https://discord.com/channels/1351560947105267792/${this.charListDiscordChalledId}/${userCharList.discordMessageId}`,
        ),
    )

    await interaction.reply({
      components: [linkButtonRow],
      flags: MessageFlags.Ephemeral,
    })
  }
}
