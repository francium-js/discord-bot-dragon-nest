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
import CharactersListService from './characters-list/characters-list.service'
import CharacterAddService from './character-add/character-add.service'

@Injectable()
class AishaManagerPanelService {
  private charListDiscordChalledId: string = process.env.CHARS_LIST_CHANNEL_ID

  private client: Client
  private panelChannelId: string

  constructor(
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

    this.panelChannelId = process.env.CHARS_MANAGER_CHANNEL_ID
  }

  async onModuleInit() {
    const token = process.env.AISHA_DISCORD_TOKEN

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

        if (ComponentCustomIdEnum.SUBMIT_CHARACTER_ADD) {
          const channel = (await this.client.channels.fetch(
            this.charListDiscordChalledId,
          )) as TextChannel

          await this.characterAddService.submitCharacterAdd(interaction, channel)

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

    const channelId = process.env.CHARS_MANAGER_CHANNEL_ID
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
