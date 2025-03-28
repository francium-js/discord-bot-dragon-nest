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
import { allValidUTC, defaultBannerForPanel } from 'src/shared/constants/photo-links'
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
import { PanelEnum } from 'src/shared/enums/panel'
import { InjectRepository } from '@nestjs/typeorm'
import { CharListEntity } from 'src/entities/char-list.entity'
import { Repository } from 'typeorm'
import { classesEmojiMap } from 'src/shared/constants/emoji-ids'
import { CharacterEntity } from 'src/entities/character.entity'
import { UTC } from 'src/shared/enums/utc'
import { UserEntity } from 'src/entities/user.entity'

@Injectable()
export class CreatePartyPanelService {
  constructor(
    private readonly redisService: RedisService,
    private readonly generalComponentsService: GeneralComponentsService,
    @InjectRepository(CharListEntity)
    private readonly charListRepository: Repository<CharListEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  createTimeButton() {
    return new ButtonBuilder()
      .setCustomId(ComponentCustomIdEnum.OPEN_MODAL_SET_TIME)
      .setLabel('Set Time')
      .setStyle(ButtonStyle.Secondary)
  }

  async openModalSetUTC(interaction: ButtonInteraction) {
    const userData = await this.redisService.getCache<UserCreatePartyPanelT>(
      RedisCacheKey.USER_PANEL_CREATE_PARTY + interaction.user.id,
    )

    const modal = new ModalBuilder()
      .setCustomId(ComponentCustomIdEnum.SET_UTC_MODAL)
      .setTitle('Set your UTC like +2, -7, +8:45...')

    const utcInput = new TextInputBuilder()
      .setCustomId(ComponentCustomIdEnum.SET_UTC_MODAL_INPUT)
      .setLabel('I will save your UTC for next times <3')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder(`Example "+9:30"`)
      .setRequired(false)

    if (userData.timeZoneUTC) {
      utcInput.setValue(userData.timeZoneUTC)
    }

    modal.addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(utcInput),
    )

    await interaction.showModal(modal).catch(console.error)
  }

  async handleTimeButton(interaction: ButtonInteraction) {
    const userData = await this.redisService.getCache<UserCreatePartyPanelT>(
      RedisCacheKey.USER_PANEL_CREATE_PARTY + interaction.user.id,
    )

    const { timeStart, timeEnd } = userData

    const formattedStartTime = DateTime.fromMillis(Number(timeStart)).toFormat(
      'HH:mm dd/LL',
    )
    const formattedEndTime = DateTime.fromMillis(Number(timeEnd)).toFormat(
      'HH:mm dd/LL',
    )

    const datePlus2 = DateTime.now().plus({ days: 2 }).toFormat('dd/LL')

    const modal = new ModalBuilder()
      .setCustomId(ComponentCustomIdEnum.TIME_MODAL)
      .setTitle('Set diapazon time (Server time)')

    const fromTimeInput = new TextInputBuilder()
      .setCustomId(ComponentCustomIdEnum.TIME_START)
      .setLabel('Start Time (HH:MM dd/mm)')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder(`Example "12:30 ${datePlus2}"`)
      .setRequired(false)

    const toTimeInput = new TextInputBuilder()
      .setCustomId(ComponentCustomIdEnum.TIME_END)
      .setLabel('End Time (HH:MM dd/mm)')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder(`Example "17:45 ${datePlus2}"`)
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
    const userCharList = await this.charListRepository.findOne({
      where: { user: { discordId: interaction.user.id } },
      relations: ['characters', 'user'],
    })

    if (!userCharList || !userCharList?.characters?.length) {
      await this.generalComponentsService.sendErrorMessage(
        [
          'You have not characters',
          `You can create character here ${process.env.DISCORD_GUILD_LINK}${process.env.CHARS_MANAGER_CHANNEL_ID}`,
        ],
        interaction,
      )

      return
    }

    const payLoad = await this.mutateInteraction({
      ...defaultUserCreatePartyPanel,
      userDiscordId: interaction.user.id,
      characters: userCharList?.characters,
      timeZoneUTC: userCharList.user.timeZoneUTC,
    })

    await interaction.reply({ ...payLoad, flags: MessageFlags.Ephemeral })
  }

  async giveInfoAboutUTC(interaction: ButtonInteraction) {
    const updatedEmbed = new EmbedBuilder().setColor(0x000000).addFields([
      {
        name: '❓ WHAT THE UTC?🤬 For what need?💢💢 ❓',
        value: `- It's the difference between your time and the time of someone from another country.`,
      },
      {
        name: '',
        value: `- If you set your **UTC**, we'll save it for next time. After that, you can just enter your local time, and we'll automatically convert it to **SERVER TIME**.`,
      },
      {
        name: '',
        value: ``,
      },
      {
        name: 'If need, you can check more about UTC on this wiki',
        value: 'https://en.wikipedia.org/wiki/List_of_UTC_offsets',
      },
      {
        name: '',
        value: ``,
      },
      {
        name: '**All valid UTC**',
        value: `⏳ Server time it's +2 ⏳`,
      },
    ])

    updatedEmbed.setImage(allValidUTC)

    await interaction.reply({
      embeds: [updatedEmbed],
      flags: MessageFlags.Ephemeral,
    })
  }

  async moveToStage2CreateParty(interaction: ButtonInteraction) {
    const userData = await this.redisService.getCache<UserCreatePartyPanelT>(
      RedisCacheKey.USER_PANEL_CREATE_PARTY + interaction.user.id,
    )

    userData.isSecontStageOfCreateParty = true

    const payLoad = await this.mutateInteraction(userData)

    await interaction.update(payLoad)
  }

  async mutateInteraction(userData: UserCreatePartyPanelT) {
    const selectedNest = nestInfoMap[userData.nest as NestEnum]

    let updatedEmbed: null | EmbedBuilder = null

    await this.redisService.setCache({
      key: RedisCacheKey.USER_PANEL_CREATE_PARTY + userData.userDiscordId,
      value: userData,
      ttl: RedisCacheDuration.USER_PANEL_CREATE_PARTY,
    })

    const isDisabledSubmit =
      !userData.nest || !userData.server || !userData.timeEnd || !userData.timeStart

    const isRenderComponentsForEditChar = () => {
      if (
        !userData.selectedCharId ||
        !userData.timeZoneUTC ||
        !userData.isSecontStageOfCreateParty
      ) {
        if (userData.timeZoneUTC) {
          updatedEmbed = new EmbedBuilder()
            .setColor(0x000000)
            .setFields([
              { name: '', value: `🕒  Your UTC: ${userData.timeZoneUTC}` },
            ])
        } else {
          updatedEmbed = new EmbedBuilder()
            .setColor(0x000000)
            .setFields([{ name: '', value: `🕒  Default UTC: +2 (Server Time)` }])
        }

        return [
          this.createNicknameSelectMenus(
            userData.selectedCharId,
            userData.characters,
          ),
          new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
              .setCustomId(
                ComponentCustomIdEnum.OPEN_MODAL_INPUT_UTC_FOR_CREATE_PARTY,
              )
              .setLabel('Set UTC')
              .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
              .setCustomId(ComponentCustomIdEnum.CHECK_MORE_INFO_ABOUT_UTC)
              .setLabel('Info about UTC')
              .setStyle(ButtonStyle.Secondary),
          ),
          new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
              .setCustomId(ComponentCustomIdEnum.CREATE_PARTY_MOVE_TO_STAGE_2)
              .setLabel('Continue')
              .setStyle(ButtonStyle.Success)
              .setDisabled(!userData.selectedCharId),
          ),
        ]
      }

      updatedEmbed = new EmbedBuilder()
        .setColor((selectedNest?.color as ColorResolvable) ?? 0x000000)
        .setImage(selectedNest?.imgUrl || defaultBannerForPanel)

      if (userData.timeStart && userData.timeEnd) {
        const { timeStart, timeEnd } = userData

        const formattedStartTimeHourse = DateTime.fromMillis(Number(timeStart))
          .setZone('Europe/Berlin')
          .toFormat('HH:mm')
        const formattedEndTimeHourse = DateTime.fromMillis(Number(timeEnd))
          .setZone('Europe/Berlin')
          .toFormat('HH:mm')

        const formattedStartTimeDays = DateTime.fromMillis(Number(timeStart))
          .setZone('Europe/Berlin')
          .toFormat('dd/LL')
        const formattedEndTimeDays = DateTime.fromMillis(Number(timeEnd))
          .setZone('Europe/Berlin')
          .toFormat('dd/LL')

        const isSameDays = formattedStartTimeDays === formattedEndTimeDays

        updatedEmbed.setTitle('⏳ **Time Zone** ⏳')

        const unixStart = Math.floor(
          DateTime.fromMillis(Number(timeStart)).toSeconds(),
        )
        const unixEnd = Math.floor(DateTime.fromMillis(Number(timeEnd)).toSeconds())

        if (isSameDays) {
          updatedEmbed.setDescription(
            `Server time: **${formattedStartTimeDays}** | ${formattedStartTimeHourse} - ${formattedEndTimeHourse}
          Your time: <t:${unixStart}:D> <t:${unixStart}:t> - <t:${unixEnd}:t>`,
          )
        } else {
          updatedEmbed.setDescription(
            `Server-time:
          **${formattedStartTimeDays}** | ${formattedStartTimeHourse} - start
          **${formattedEndTimeDays}** | ${formattedEndTimeHourse} - end
          
          Your time:
          <t:${unixStart}:D> <t:${unixStart}:t> - start
          <t:${unixEnd}:D> <t:${unixEnd}:t> - end`,
          )
        }
      }

      return [
        this.createServerSelectMenus(userData.server as ServerRegionEnum),
        this.createNestSelectMenus(userData.nest as NestEnum),
        this.generalComponentsService.createElementButtons(
          PanelEnum.CREATE_PARTY,
          userData.elements,
        ),
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          this.createTimeButton(),
          this.createClassPriorityLootToggle(userData.classPriorityLoot),
        ),
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId(ComponentCustomIdEnum.SUBMIT_CREATE_PARTY)
            .setLabel('Submit')
            .setDisabled(isDisabledSubmit)
            .setStyle(ButtonStyle.Success),
        ),
      ]
    }

    return {
      components: isRenderComponentsForEditChar(),
      ...(updatedEmbed ? { embeds: [updatedEmbed] } : {}),
    }
  }

  createNicknameSelectMenus(selectedCharId: number, characters?: CharacterEntity[]) {
    const serverSelect = new StringSelectMenuBuilder()
      .setCustomId(ComponentCustomIdEnum.SELECT_CHARACTER_FOR_CREATE_PARTY)
      .setPlaceholder('Select your char')
      .addOptions(
        ...characters.map(char =>
          new StringSelectMenuOptionBuilder()
            .setEmoji(classesEmojiMap[char.class])
            .setLabel(char.name)
            .setValue(String(char.id))
            .setDefault(selectedCharId === char.id),
        ),
      )

    return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
      serverSelect,
    )
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

    if (
      interaction.customId ===
      ComponentCustomIdEnum.SELECT_CHARACTER_FOR_CREATE_PARTY
    ) {
      userData.selectedCharId = Number(interaction.values[0])
    }

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

    const userData = await this.redisService.getCache<UserCreatePartyPanelT>(
      RedisCacheKey.USER_PANEL_CREATE_PARTY + interaction.user.id,
    )

    const fromTimeRaw = interaction.fields.getTextInputValue(
      ComponentCustomIdEnum.TIME_START,
    )
    const toTimeRaw = interaction.fields.getTextInputValue(
      ComponentCustomIdEnum.TIME_END,
    )

    const fromTime = DateTime.fromFormat(fromTimeRaw, 'HH:mm dd/LL', {
      zone: userData.timeZoneUTC,
    })
    const toTime = DateTime.fromFormat(toTimeRaw, 'HH:mm dd/LL', {
      zone: userData.timeZoneUTC,
    })

    if (!fromTime.isValid || !toTime.isValid) {
      const datePlus2 = DateTime.now().plus({ days: 2 }).toFormat('dd/LL')

      await this.generalComponentsService.sendErrorMessage(
        [
          `🛑 **Wrong format:**`,
          `Need **HH:MM dd/mm** format`,
          `Example: **12:30 ${datePlus2}**`,
        ],
        interaction,
      )

      return
    }

    const now = DateTime.now().toUTC()

    const timeStart = fromTime.toUTC().toMillis()
    const timeEnd = toTime.toUTC().toMillis()

    const oneHourLater = now.plus({ hours: 1 }).toMillis()

    if (timeStart < oneHourLater) {
      await this.generalComponentsService.sendErrorMessage(
        ['🛑 **Error:** Start time must be at least **1 hour** from now.'],
        interaction,
      )

      return
    }

    if (timeEnd - timeStart < 30 * 60 * 1000) {
      await this.generalComponentsService.sendErrorMessage(
        ['🛑 **Error:** The time range must be at least **30 minutes**.'],
        interaction,
      )

      return
    }

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

  async handleUserUTC(interaction: ModalSubmitInteraction) {
    if (!interaction.isModalSubmit()) return

    const userData = await this.redisService.getCache<UserCreatePartyPanelT>(
      RedisCacheKey.USER_PANEL_CREATE_PARTY + interaction.user.id,
    )

    const userUTC = interaction.fields.getTextInputValue(
      ComponentCustomIdEnum.SET_UTC_MODAL_INPUT,
    )

    const isValidUTC = Object.values(UTC).includes(userUTC as UTC)

    if (!isValidUTC && userUTC !== '') {
      await this.generalComponentsService.sendErrorMessage(
        [`🛑 **Wrong format:**`, `Must be **+1**, **+3**, **+8:45**, **-12**...`],
        interaction,
      )

      return
    }

    userData.timeZoneUTC = userUTC as UTC

    try {
      await this.userRepository.update(
        { discordId: userData.userDiscordId },
        { timeZoneUTC: userData.timeZoneUTC || null },
      )
    } catch {
      if (!isValidUTC && userUTC !== '') {
        await this.generalComponentsService.sendErrorMessage(
          [`🛑 **Error:**`, `Oops, something went wrong, please write to Admin`],
          interaction,
        )

        return
      }
    }

    try {
      await interaction.deferUpdate()

      const payLoad = await this.mutateInteraction(userData)

      await interaction.editReply(payLoad)
    } catch (error) {
      console.error('❌ Error updating panel:', error)
    }
  }

  async handleCreateParty(interaction: ButtonInteraction) {
    // const userDiscordId = interaction.user.id
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
          `${process.env.DISCORD_GUILD_LINK}${process.env.PARTY_LIST_CHANNEL_ID}`,
        ),
      new ButtonBuilder()
        .setLabel(`Link to DS to your private party branch`)
        .setStyle(ButtonStyle.Link)
        .setURL(
          `${process.env.DISCORD_GUILD_LINK}${process.env.PARTY_LIST_CHANNEL_ID}`,
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
