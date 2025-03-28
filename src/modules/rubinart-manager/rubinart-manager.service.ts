import { Injectable, OnModuleInit } from '@nestjs/common'
import {
  Client,
  GatewayIntentBits,
  TextChannel,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Events,
} from 'discord.js'
import { ComponentCustomIdEnum } from 'src/shared/enums/component-custom-id'
import { CreatePartyPanelService } from './services'
import { PanelEnum } from 'src/shared/enums/panel'

@Injectable()
export class RubinartManagerService implements OnModuleInit {
  private client: Client
  private panelChannelId: string

  constructor(private createPartyPanelService: CreatePartyPanelService) {
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
      ],
    })

    this.panelChannelId = process.env.PARTY_MANAGER_CHANNEL_ID
  }

  async onModuleInit() {
    const token = process.env.RUBINART_DISCORD_TOKEN

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

        if (modalInteraction.customId === ComponentCustomIdEnum.TIME_MODAL) {
          await this.createPartyPanelService.handleTimeSubmit(modalInteraction)
        }

        if (modalInteraction.customId === ComponentCustomIdEnum.SET_UTC_MODAL) {
          await this.createPartyPanelService.handleUserUTC(modalInteraction)
        }
      }

      if (interaction.isButton()) {
        if (
          interaction.customId.startsWith(
            `${PanelEnum.CREATE_PARTY + ComponentCustomIdEnum.SELECT_ELEMENT}_`,
          )
        ) {
          await this.createPartyPanelService.handleElementSelection(interaction)

          return
        }

        switch (interaction.customId) {
          case ComponentCustomIdEnum.OPEN_PANEL_CREATE_PARTY:
            await this.createPartyPanelService.createPanel(interaction)
            break

          case ComponentCustomIdEnum.OPEN_MODAL_SET_TIME:
            await this.createPartyPanelService.handleTimeButton(interaction)
            break

          case ComponentCustomIdEnum.OPEN_MODAL_INPUT_UTC_FOR_CREATE_PARTY:
            await this.createPartyPanelService.openModalSetUTC(interaction)
            break

          case ComponentCustomIdEnum.CHECK_MORE_INFO_ABOUT_UTC:
            await this.createPartyPanelService.giveInfoAboutUTC(interaction)
            break

          case ComponentCustomIdEnum.CREATE_PARTY_MOVE_TO_STAGE_2:
            await this.createPartyPanelService.moveToStage2CreateParty(interaction)
            break

          case ComponentCustomIdEnum.CLASS_PRIORITY_LOOT_TOGGLE:
            await this.createPartyPanelService.handleToggleButton(interaction)
            break

          case ComponentCustomIdEnum.SUBMIT_CREATE_PARTY:
            await this.createPartyPanelService.handleCreateParty(interaction)
            break
        }
      }

      if (interaction.isStringSelectMenu()) {
        if (
          interaction.customId ===
          ComponentCustomIdEnum.SELECT_CHARACTER_FOR_CREATE_PARTY
        ) {
          await this.createPartyPanelService.handleSelectMenu(interaction)

          return
        }

        await this.createPartyPanelService.handleSelectMenu(interaction)
      }
    })

    const channelId = process.env.PARTY_MANAGER_CHANNEL_ID
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
              .setCustomId(ComponentCustomIdEnum.OPEN_PANEL_CREATE_PARTY)
              .setLabel('Create party')
              .setStyle(ButtonStyle.Secondary),
          ),
        ],
      })
    } catch (error) {
      console.log(error)
    }
  }
}
