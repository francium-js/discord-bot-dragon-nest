import { Injectable } from '@nestjs/common'
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  Interaction,
  ButtonInteraction,
  EmbedBuilder,
  StringSelectMenuInteraction,
  ColorResolvable,
  ModalBuilder,
  TextInputStyle,
  TextInputBuilder,
  ModalSubmitInteraction,
  MessageFlags,
} from 'discord.js'
import { NestEnum } from 'src/shared/enums/nests'
import { defaultBannerForPanel } from 'src/shared/constants/photo-links'
import { nestInfoMap } from 'src/shared/constants/nest-info-map'
import { ServerRegionEnum } from 'src/shared/enums/server-region'
import { defaultUserCreatePartyPanel } from 'src/shared/constants/default-user-create-party-panel'
import { ComponentCustomIdEnum } from 'src/shared/enums/component-custom-id'
import { ElementEnum } from 'src/shared/enums/element'
import { RedisService } from 'src/shared/redis/redis.service'
import { RedisCacheKey } from 'src/shared/enums/redis-cache-key'
import { RedisCacheDuration } from 'src/shared/enums/redis-cache-duration'
import { DateTime } from 'luxon'
import { UserCreatePartyPanelT } from 'src/shared/types/user-create-party-panel'
import GeneralComponentsService from 'src/shared/services/general-components.service'

@Injectable()
export class CreatePartyPanelService {
  constructor(
    private readonly redisService: RedisService,
    private readonly generalComponentsService: GeneralComponentsService,
  ) {}

  createTimeButton() {
    return new ButtonBuilder()
      .setCustomId(ComponentCustomIdEnum.OPEN_MODAL_SET_TIME)
      .setLabel('Set Time')
      .setStyle(ButtonStyle.Secondary)
  }

  async handleTimeButton(interaction: ButtonInteraction) {
    const userData = await this.redisService.getCache<UserCreatePartyPanelT>(
      RedisCacheKey.USER_PANEL_CREATE_PARTY + interaction.user.id,
    )

    const { timeStart, timeEnd } = userData

    const formattedStartTime = DateTime.fromMillis(Number(timeStart)).toFormat(
      'HH:mm',
    )
    const formattedEndTime = DateTime.fromMillis(Number(timeEnd)).toFormat('HH:mm')

    const modal = new ModalBuilder()
      .setCustomId(ComponentCustomIdEnum.TIME_MODAL)
      .setTitle('Set diapazon time (Server time)')

    const fromTimeInput = new TextInputBuilder()
      .setCustomId(ComponentCustomIdEnum.TIME_START)
      .setLabel('Start Time (HH:MM)')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('00:00')
      .setRequired(false)

    const toTimeInput = new TextInputBuilder()
      .setCustomId(ComponentCustomIdEnum.TIME_END)
      .setLabel('End Time (HH:MM)')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('00:00')
      .setRequired(false)

    if (timeStart && timeEnd) {
      fromTimeInput.setValue(formattedStartTime)
      toTimeInput.setValue(formattedEndTime)
    }

    modal.addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(fromTimeInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(toTimeInput),
    )

    await interaction.showModal(modal).catch(console.error)
  }

  async createPanel(interaction: ButtonInteraction) {
    const userData = await this.redisService.getCache<UserCreatePartyPanelT>(
      RedisCacheKey.USER_PANEL_CREATE_PARTY + interaction.user.id,
    )

    const payLoad = await this.mutateInteraction(
      userData || {
        ...defaultUserCreatePartyPanel,
        userId: interaction.user.id,
      },
    )

    await interaction.reply({ ...payLoad, flags: MessageFlags.Ephemeral })
  }

  async mutateInteraction(userData: UserCreatePartyPanelT) {
    const selectedNest = nestInfoMap[userData.nest as NestEnum]

    const updatedEmbed = new EmbedBuilder()
      .setColor((selectedNest?.color as ColorResolvable) ?? 0x000000)
      .setImage(selectedNest?.imgUrl || defaultBannerForPanel)

    if (userData.timeStart && userData.timeEnd) {
      const formattedStartTime = DateTime.fromMillis(
        Number(userData.timeStart),
      ).toFormat('HH:mm')
      const formattedEndTime = DateTime.fromMillis(
        Number(userData.timeEnd),
      ).toFormat('HH:mm')

      updatedEmbed.setDescription(
        `⏳ **Time Zone:** ${formattedStartTime} - ${formattedEndTime}`,
      )
    }

    await this.redisService.setCache({
      key: RedisCacheKey.USER_PANEL_CREATE_PARTY + userData.userId,
      value: userData,
      ttl: RedisCacheDuration.USER_PANEL_CREATE_PARTY,
    })

    const isDisabledSubmit =
      !userData.nest || !userData.server || !userData.timeEnd || !userData.timeStart

    const components = [
      this.createServerSelectMenus(userData.server as ServerRegionEnum),
      this.createNestSelectMenus(userData.nest as NestEnum),
      this.generalComponentsService.createElementButtons(userData.elements),
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        this.createTimeButton(),
        this.createClassPriorityLootToggle(userData.classPriorityLoot),
      ),
      this.generalComponentsService.createActionButtons(
        ComponentCustomIdEnum.SUBMIT_CREATE_PARTY,
        'Submit',
        isDisabledSubmit,
      ),
    ]

    return {
      embeds: [updatedEmbed],
      components,
    }
  }

  createServerSelectMenus(selectedServer?: ServerRegionEnum) {
    const serverSelect = new StringSelectMenuBuilder()
      .setCustomId(ComponentCustomIdEnum.SELECT_SERVER)
      .setPlaceholder('Select Server')
      .addOptions(
        new StringSelectMenuOptionBuilder()
          .setEmoji('🇪🇺')
          .setLabel(ServerRegionEnum.EU)
          .setValue(ServerRegionEnum.EU)
          .setDefault(selectedServer === ServerRegionEnum.EU),
        new StringSelectMenuOptionBuilder()
          .setEmoji('🌏')
          .setLabel(ServerRegionEnum.SEA)
          .setValue(ServerRegionEnum.SEA)
          .setDefault(selectedServer === ServerRegionEnum.SEA),
        new StringSelectMenuOptionBuilder()
          .setEmoji('🇺🇸')
          .setLabel(ServerRegionEnum.NA)
          .setValue(ServerRegionEnum.NA)
          .setDefault(selectedServer === ServerRegionEnum.NA),
        new StringSelectMenuOptionBuilder()
          .setEmoji('🌎')
          .setLabel(ServerRegionEnum.SA)
          .setValue(ServerRegionEnum.SA)
          .setDefault(selectedServer === ServerRegionEnum.SA),
      )

    return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
      serverSelect,
    )
  }

  async handleToggleButton(interaction: ButtonInteraction) {
    const userData = await this.redisService.getCache<UserCreatePartyPanelT>(
      RedisCacheKey.USER_PANEL_CREATE_PARTY + interaction.user.id,
    )

    userData.classPriorityLoot = !userData.classPriorityLoot

    const payLoad = await this.mutateInteraction(userData)

    await interaction.update(payLoad)
  }

  createNestSelectMenus(selectedNest?: NestEnum) {
    const nestSelect = new StringSelectMenuBuilder()
      .setCustomId(ComponentCustomIdEnum.SELECT_NEST)
      .setPlaceholder('Select Nest')
      .addOptions(
        ...Object.entries(nestInfoMap).map(([key, value]) => {
          const component = new StringSelectMenuOptionBuilder()
            .setLabel(value.name)
            .setValue(key)
            .setDefault(key === selectedNest)
            .setEmoji(value.emoji)

          return component
        }),
      )

    return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(nestSelect)
  }

  createClassPriorityLootToggle(status: boolean = true) {
    return new ButtonBuilder()
      .setCustomId(ComponentCustomIdEnum.CLASS_PRIORITY_LOOT_TOGGLE)
      .setLabel(
        status ? 'Class Priority Loot ACTIVATED ' : 'Class Priority Loot DISABLED',
      )
      .setStyle(status ? ButtonStyle.Success : ButtonStyle.Danger)
  }

  async handleElementSelection(interaction: Interaction) {
    if (!interaction.isButton()) return

    const element = Object.values(ElementEnum).find(element =>
      interaction.customId.toLocaleLowerCase().includes(element.toLocaleLowerCase()),
    )

    const userData = await this.redisService.getCache<UserCreatePartyPanelT>(
      RedisCacheKey.USER_PANEL_CREATE_PARTY + interaction.user.id,
    )

    if (userData.elements.includes(element)) {
      userData.elements = userData.elements.filter(e => e !== element)
    } else {
      userData.elements.push(element)
    }

    const payLoad = await this.mutateInteraction(userData)

    await interaction.update(payLoad)
  }

  async handleSelectMenu(interaction: StringSelectMenuInteraction) {
    if (!interaction.isStringSelectMenu()) return

    const userData = await this.redisService.getCache<UserCreatePartyPanelT>(
      RedisCacheKey.USER_PANEL_CREATE_PARTY + interaction.user.id,
    )

    if (interaction.customId === ComponentCustomIdEnum.SELECT_NEST) {
      userData.nest = interaction.values[0] as NestEnum
    }

    if (interaction.customId === ComponentCustomIdEnum.SELECT_SERVER) {
      userData.server = interaction.values[0] as ServerRegionEnum
    }

    const payLoad = await this.mutateInteraction(userData)

    await interaction.update(payLoad)
  }

  async handleTimeSubmit(interaction: ModalSubmitInteraction) {
    if (!interaction.isModalSubmit()) return

    const fromTimeRaw = interaction.fields.getTextInputValue(
      ComponentCustomIdEnum.TIME_START,
    )
    const toTimeRaw = interaction.fields.getTextInputValue(
      ComponentCustomIdEnum.TIME_END,
    )

    const fromTime = DateTime.fromFormat(fromTimeRaw, 'HH:mm')
    const toTime = DateTime.fromFormat(toTimeRaw, 'HH:mm')

    if (!fromTime.isValid || !toTime.isValid) {
      await this.generalComponentsService.sendErrorMessage(
        ['❌ **Wrong format:** Need `HH:MM` format (Example, `12:30`)'],
        interaction,
      )

      return
    }

    const now = DateTime.now()
    const timeStart = now
      .set({ hour: fromTime.hour, minute: fromTime.minute })
      .toMillis()
    const timeEnd = now.set({ hour: toTime.hour, minute: toTime.minute }).toMillis()

    const oneHourLater = now.plus({ hours: 1 }).toMillis()

    if (timeEnd < oneHourLater) {
      await this.generalComponentsService.sendErrorMessage(
        ['❌ **Error:** Start time must be at least **1 hour** from server time.'],
        interaction,
      )

      return
    }

    if (timeEnd - timeStart < 30 * 60 * 1000) {
      await this.generalComponentsService.sendErrorMessage(
        ['❌ **Error:** The time range must be at least **30 minutes**.'],
        interaction,
      )

      return
    }

    const userData = await this.redisService.getCache<UserCreatePartyPanelT>(
      RedisCacheKey.USER_PANEL_CREATE_PARTY + interaction.user.id,
    )

    userData.timeEnd = `${timeEnd}`
    userData.timeStart = `${timeStart}`

    try {
      await interaction.deferUpdate()

      const payLoad = await this.mutateInteraction(userData)

      await interaction.editReply(payLoad)
    } catch (error) {
      console.error('❌ Error updating panel:', error)
    }
  }

  async handleCreateParty(interaction: ButtonInteraction) {
    // const userId = interaction.user.id
    // const userData = await this.redisService.getCache<UserCreatePartyPanelT>(RedisCacheKey.USER_PANEL_CREATE_PARTY + interaction.user.id)

    const userData = await this.redisService.getCache<UserCreatePartyPanelT>(
      RedisCacheKey.USER_PANEL_CREATE_PARTY + interaction.user.id,
    )

    await this.redisService.deleteCache(
      RedisCacheKey.USER_PANEL_CREATE_PARTY + interaction.user.id,
    )

    const linkButtonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setLabel(`Link to your party`)
        .setStyle(ButtonStyle.Link)
        .setURL(
          'https://discord.com/channels/1351560947105267792/1351560949412270132/1352757387483938929',
        ),
      new ButtonBuilder()
        .setLabel(`Link to DS raid branch`)
        .setStyle(ButtonStyle.Link)
        .setURL(
          'https://discord.com/channels/1351560947105267792/1351560949412270132/1352757387483938929',
        ),
    )

    const nestInfo = nestInfoMap[userData.nest as NestEnum]

    const updatedEmbed = new EmbedBuilder().setColor(0x1deb0c).addFields(
      { name: '', value: `<:${userData.nest}:${nestInfo.emoji}> ${nestInfo.name}` },
      {
        name: '',
        value: '✅ Party created',
      },
    )

    await interaction.update({
      embeds: [updatedEmbed],
      components: [linkButtonRow],
    })
  }
}
