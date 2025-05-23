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
import { CharactersListService, CharacterAddService } from './services'
import { PanelEnum } from 'src/shared/enums/panel'
import { CharacterEditService } from './services/character-edit/character-edit.service'

@Injectable()
class AishaManagerPanelService {
  private charListDiscordChalledId: string = process.env.CHARS_LIST_CHANNEL_ID
  private panelChannelId: string = process.env.CHARS_MANAGER_CHANNEL_ID
  private client: Client

  constructor(
    private readonly charactersListService: CharactersListService,
    private readonly characterAddService: CharacterAddService,
    private readonly characterEditService: CharacterEditService,
  ) {
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
      ],
    })
  }

  async onModuleInit() {
    await this.client.login(process.env.AISHA_DISCORD_TOKEN)

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

      if (interaction.isModalSubmit()) {
        const modalInteraction = interaction

        if (
          modalInteraction.customId ===
          ComponentCustomIdEnum.MODAL_INPUT_NICKNAME_FOR_EDIT
        ) {
          await this.characterEditService.editCharacterNameSubmited(modalInteraction)
        }
      }

      if (interaction.isButton()) {
        if (
          interaction.customId.startsWith(
            `${PanelEnum.ADD_CHAR + ComponentCustomIdEnum.SELECT_ELEMENT}_`,
          )
        ) {
          await this.characterAddService.handleElementSelection(interaction)

          return
        }

        if (
          interaction.customId.startsWith(
            `${PanelEnum.EDIT_CHAR + ComponentCustomIdEnum.SELECT_ELEMENT}_`,
          )
        ) {
          await this.characterEditService.handleElementSelection(interaction)

          return
        }

        if (interaction.customId === ComponentCustomIdEnum.SUBMIT_CHARACTER_ADD) {
          const channel = (await this.client.channels.fetch(
            this.charListDiscordChalledId,
          )) as TextChannel

          await this.characterAddService.submitCharacterAdd(interaction, channel)

          return
        }

        if (interaction.customId === ComponentCustomIdEnum.SUBMIT_CHARACTER_EDIT) {
          const channel = (await this.client.channels.fetch(
            this.charListDiscordChalledId,
          )) as TextChannel

          await this.characterEditService.submitCharacterEdit(interaction, channel)

          return
        }

        if (interaction.customId === ComponentCustomIdEnum.SUBMIT_CHARACTER_DELETE) {
          const channel = (await this.client.channels.fetch(
            this.charListDiscordChalledId,
          )) as TextChannel

          await this.characterEditService.submitCharacterDelete(interaction, channel)

          return
        }

        switch (interaction.customId) {
          case ComponentCustomIdEnum.OPEN_PANEL_CHARACTER_MANAGER:
            await this.charactersListService.createPanel(interaction)
            break
          case ComponentCustomIdEnum.OPEN_PANEL_EDIT_CHARACTER:
            await this.characterEditService.createPanel(interaction)
            break
          case ComponentCustomIdEnum.OPEN_MODAL_INPUT_NICKNAME_FOR_EDIT:
            await this.characterEditService.openModalInputNickNameForEditUserCharacter(
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
        if (interaction.customId.startsWith(PanelEnum.ADD_CHAR)) {
          await this.characterAddService.handleSelectMenu(interaction)

          return
        }

        if (
          interaction.customId.startsWith(PanelEnum.EDIT_CHAR) ||
          ComponentCustomIdEnum.SELECT_CHARACTER_FOR_EDIT
        ) {
          await this.characterEditService.handleSelectMenu(interaction)

          return
        }
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
              .setLabel('Char-list')
              .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
              .setCustomId(ComponentCustomIdEnum.OPEN_MODAL_INPUT_NICKNAME)
              .setLabel('Add char')
              .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
              .setCustomId(ComponentCustomIdEnum.OPEN_PANEL_EDIT_CHARACTER)
              .setLabel('Edit char')
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
