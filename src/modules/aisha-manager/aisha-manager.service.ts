import { Injectable } from '@nestjs/common'
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Client,
  Events,
  GatewayIntentBits,
  TextChannel,
} from 'discord.js'

import { ComponentCustomIdEnum } from 'src/shared/enums/component-custom-id'
import { ConfigService } from '@nestjs/config'
import CharactersListService from './characters-list/characters-list.service'
import CharacterAddService from './character-add/character-add.service'

@Injectable()
class AishaManagerPanelService {
  private client: Client
  private panelChannelId: string

  constructor(
    private configService: ConfigService,
    private readonly charactersListService: CharactersListService,
    private readonly characterAddService: CharacterAddService,
  ) {
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
      ],
    })

    this.panelChannelId = this.configService.get<string>('CHARS_MANAGER_CHANNEL_ID')
  }

  async onModuleInit() {
    const token = this.configService.get<string>('AISHA_DISCORD_TOKEN')

    if (!token) {
      return
    }

    await this.client.login(token)

    this.client.on(Events.InteractionCreate, async interaction => {
      if (
        !interaction.isButton() &&
        !interaction.isStringSelectMenu() &&
        !interaction.isModalSubmit()
      ) {
        return
      }

      if (interaction.isModalSubmit()) {
        const modalInteraction = interaction

        if (
          modalInteraction.customId === ComponentCustomIdEnum.MODAL_INPUT_NICKNAME
        ) {
          await this.characterAddService.openPanelUserCharacterAdd(modalInteraction)
        }
      }

      if (interaction.isButton()) {
        if (
          interaction.customId.startsWith(`${ComponentCustomIdEnum.SELECT_ELEMENT}_`)
        ) {
          await this.characterAddService.handleElementSelection(interaction)

          return
        }

        switch (interaction.customId) {
          case ComponentCustomIdEnum.OPEN_PANEL_CHARACTER_MANAGER:
            await this.charactersListService.createPanel(interaction)
            break
          case ComponentCustomIdEnum.MODAL_INPUT_NICKNAME:
            await this.characterAddService.openModalInputNickNameForCreateUserCharacter(
              interaction,
            )
            break
          case ComponentCustomIdEnum.SUBMIT_CHARACTER_ADD:
            await this.characterAddService.submitCharacterAdd(interaction)
            break
          case ComponentCustomIdEnum.OPEN_MODAL_INPUT_NICKNAME:
            await this.characterAddService.openModalInputNickNameForCreateUserCharacter(
              interaction,
            )
            break
        }
      }

      if (interaction.isStringSelectMenu()) {
        await this.characterAddService.handleSelectMenu(interaction)
      }
    })

    const channelId = this.configService.get<string>('CHARS_MANAGER_CHANNEL_ID')
    const channel = (await this.client.channels.fetch(channelId)) as TextChannel

    if (!channel) {
      return
    }

    const messages = await channel.messages.fetch({ limit: 1 })

    if (messages.size === 0) {
      await this.createButtonsManager()
    }
  }

  async createButtonsManager() {
    const panelChannel = (await this.client.channels.fetch(
      this.panelChannelId,
    )) as TextChannel

    if (!panelChannel) return

    try {
      const messages = await panelChannel.messages.fetch({ limit: 20 })
      const existingPanel = messages.find(
        msg => msg.author.id === this.client.user?.id,
      )

      if (existingPanel) await existingPanel.delete()

      await panelChannel.send({
        components: [
          new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
              .setCustomId(ComponentCustomIdEnum.OPEN_PANEL_CHARACTER_MANAGER)
              .setLabel('Character manager')
              .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
              .setCustomId(ComponentCustomIdEnum.OPEN_MODAL_INPUT_NICKNAME)
              .setLabel('Add character')
              .setStyle(ButtonStyle.Secondary),
          ),
        ],
      })
    } catch (error) {
      console.log(error)
    }
  }
}

export default AishaManagerPanelService
