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
  TextChannel,
  ChannelType,
} from 'discord.js'
import { NestEnum } from 'src/shared/enums/nests'
import {
  allValidUTCPng,
  defaultBannerForPanelPng,
} from 'src/shared/constants/photo-links'
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
import { GeneralComponentsService } from 'src/shared/services/general-components/general-components.service'
import { PanelEnum } from 'src/shared/enums/panel'
import { InjectRepository } from '@nestjs/typeorm'
import { CharListEntity } from 'src/entities/char-list.entity'
import { Repository } from 'typeorm'
import { classesEmojiMap } from 'src/shared/constants/emoji-ids'
import { CharacterEntity } from 'src/entities/character.entity'
import { UTC } from 'src/shared/enums/utc'
import { UserEntity } from 'src/entities/user.entity'
import { PartyEntity } from 'src/entities/partys.entity'
import {
  CreatePartyChannelT,
  GetPartyFormCacheDataT,
  HandleCreatePartyT,
} from './types'
import { PartComponentsService } from 'src/shared/services/party-components/party-components.service'

@Injectable()
export class CreatePartyPanelService {
  private partyListDiscordChalledId: string = process.env.PARTY_LIST_CHANNEL_ID

  constructor(
    private readonly redisService: RedisService,
    private readonly generalComponentsService: GeneralComponentsService,
    private readonly partComponentsService: PartComponentsService,
    @InjectRepository(CharListEntity)
    private readonly charListRepository: Repository<CharListEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(PartyEntity)
    private readonly partyRepository: Repository<PartyEntity>,
    @InjectRepository(CharacterEntity)
    private readonly characterRepository: Repository<CharacterEntity>,
  ) {}

  async getPartyFormCacheData({
    interaction,
    userDiscordId,
  }: GetPartyFormCacheDataT): Promise<UserCreatePartyPanelT> {
    const formData = await this.redisService.getCache<UserCreatePartyPanelT>(
      RedisCacheKey.USER_PANEL_CREATE_PARTY + userDiscordId,
    )

    if (!formData) {
      if (interaction) {
        await this.generalComponentsService.sendErrorMessage(
          [`🛑 **Error:**`, `Oops, something went wrong, try again.`],
          interaction,
        )
      }

      return
    }

    return formData
  }

  async openModalSetUTC(interaction: ButtonInteraction) {
    const partyFormData = await this.getPartyFormCacheData({
      interaction,
      userDiscordId: interaction.user.id,
    })

    if (!partyFormData) return

    const modal = new ModalBuilder()
      .setCustomId(ComponentCustomIdEnum.SET_UTC_MODAL)
      .setTitle('Set your UTC like +2, -7, +8:45...')

    const utcInput = new TextInputBuilder()
      .setCustomId(ComponentCustomIdEnum.SET_UTC_MODAL_INPUT)
      .setLabel('I will save your UTC for next times <3')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder(`Example "+9:30"`)
      .setRequired(false)

    if (partyFormData.timeZoneUTC) {
      utcInput.setValue(partyFormData.timeZoneUTC)
    }

    modal.addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(utcInput),
    )

    await interaction.showModal(modal).catch(console.error)
  }

  async openModalTimeSet(interaction: ButtonInteraction) {
    const partyFormData = await this.getPartyFormCacheData({
      interaction,
      userDiscordId: interaction.user.id,
    })

    if (!partyFormData) return

    const zone = 'UTC' + (partyFormData.timeZoneUTC || '+2')

    const { timeStart, timeEnd } = partyFormData

    const formattedStartTime = DateTime.fromMillis(Number(timeStart))
      .setZone(zone)
      .toFormat('HH:mm dd/LL')
    const formattedEndTime = DateTime.fromMillis(Number(timeEnd))
      .setZone(zone)
      .toFormat('HH:mm dd/LL')

    const datePlus2 = DateTime.now()
      .setZone(zone)
      .plus({ days: 3 })
      .toFormat('dd/LL')

    const modal = new ModalBuilder()
      .setCustomId(ComponentCustomIdEnum.TIME_MODAL)
      .setTitle(
        `Set diapazon time ${partyFormData.timeZoneUTC ? '' : '(Server time)'}`,
      )

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

  async openModalSetDescription(interaction: ButtonInteraction) {
    const partyFormData = await this.getPartyFormCacheData({
      interaction,
      userDiscordId: interaction.user.id,
    })

    if (!partyFormData) return

    const modal = new ModalBuilder()
      .setCustomId(ComponentCustomIdEnum.PARTY_DESCRIPTION_MODAL)
      .setTitle(`Set party description`)

    const input = new TextInputBuilder()
      .setCustomId(ComponentCustomIdEnum.PARTY_DESCRIPTION_INPUT)
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(false)
      .setLabel('Description')
      .setMaxLength(400)

    if (partyFormData.description) {
      input.setValue(partyFormData.description)
    }

    modal.addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(input),
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

    const allPartyOfPlayer = await this.partyRepository.find({
      where: { leader: { discordId: interaction.user.id } },
    })

    if (allPartyOfPlayer.length >= 5) {
      await this.generalComponentsService.sendErrorMessage(
        [
          `You can't have more than 5 parties at the same time`,
          `To create a new one, delete an existing party or wait until one expires`,
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
        value: `⏳ Server time is +1 ⏳`,
      },
    ])

    updatedEmbed.setImage(allValidUTCPng)

    await interaction.reply({
      embeds: [updatedEmbed],
      flags: MessageFlags.Ephemeral,
    })
  }

  async moveToStage2CreateParty(interaction: ButtonInteraction) {
    const partyFormData = await this.getPartyFormCacheData({
      interaction,
      userDiscordId: interaction.user.id,
    })

    if (!partyFormData) return

    partyFormData.isSecontStageOfCreateParty = true

    const payLoad = await this.mutateInteraction(partyFormData)

    await interaction.update(payLoad)
  }

  async mutateInteraction(partyFormData: UserCreatePartyPanelT) {
    const selectedNest = nestInfoMap[partyFormData.nest]

    const embeds = []

    const updatedEmbed = new EmbedBuilder()
    const descriptionEmbed = new EmbedBuilder()

    await this.redisService.setCache({
      key: RedisCacheKey.USER_PANEL_CREATE_PARTY + partyFormData.userDiscordId,
      value: partyFormData,
      ttl: RedisCacheDuration.USER_PANEL_CREATE_PARTY,
    })

    const isDisabledSubmit =
      !partyFormData.nest ||
      !partyFormData.serverRegion ||
      !partyFormData.timeEnd ||
      !partyFormData.timeStart

    const isRenderComponentsForEditChar = () => {
      if (
        !partyFormData.selectedCharId ||
        !partyFormData.isSecontStageOfCreateParty
      ) {
        if (partyFormData.timeZoneUTC) {
          embeds.push(updatedEmbed)

          updatedEmbed
            .setColor(0x000000)
            .setFields([
              { name: '', value: `🕒  Your UTC: ${partyFormData.timeZoneUTC}` },
            ])
        } else {
          updatedEmbed
            .setColor(0x000000)
            .setFields([{ name: '', value: `🕒  Default UTC: +1 (Server Time)` }])
        }

        return [
          this.createNicknameSelectMenus(
            partyFormData.selectedCharId,
            partyFormData.characters,
          ),
          new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
              .setCustomId(
                ComponentCustomIdEnum.OPEN_MODAL_INPUT_UTC_FOR_CREATE_PARTY,
              )
              .setLabel(`${partyFormData.timeZoneUTC ? 'Update' : 'Set'} UTC`)
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
              .setDisabled(!partyFormData.selectedCharId),
          ),
        ]
      }

      updatedEmbed
        .setColor((selectedNest?.color as ColorResolvable) ?? 0x000000)
        .setImage(selectedNest?.imgUrl || defaultBannerForPanelPng)

      if (partyFormData.timeStart && partyFormData.timeEnd) {
        const { timeStart, timeEnd } = partyFormData

        this.partComponentsService.addPartyTimeFields({
          embed: updatedEmbed,
          timeStart,
          timeEnd,
        })
      }

      embeds.push(updatedEmbed)

      if (partyFormData.description) {
        this.partComponentsService.addPartyDescription({
          embed: descriptionEmbed,
          description: partyFormData.description,
        })

        embeds.push(descriptionEmbed)
      }

      return [
        this.createServerSelectMenus(partyFormData.serverRegion),
        this.createNestSelectMenus(partyFormData.nest),
        this.generalComponentsService.createElementButtons(
          PanelEnum.CREATE_PARTY,
          partyFormData.elements,
        ),
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId(ComponentCustomIdEnum.OPEN_MODAL_SET_TIME)
            .setLabel('Set Time')
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId(ComponentCustomIdEnum.OPEN_MODAL_PARTY_DESCRIPTION)
            .setLabel('Description')
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId(ComponentCustomIdEnum.CLASS_PRIORITY_LOOT_TOGGLE)
            .setLabel(
              partyFormData.classPriorityLoot
                ? 'Class Priority Loot ACTIVATED '
                : 'Class Priority Loot DISABLED',
            )
            .setStyle(
              partyFormData.classPriorityLoot
                ? ButtonStyle.Success
                : ButtonStyle.Danger,
            ),
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
      ...(embeds.length ? { embeds } : {}),
    }
  }

  createNicknameSelectMenus(selectedCharId: number, characters?: CharacterEntity[]) {
    const serverSelect = new StringSelectMenuBuilder()
      .setCustomId(ComponentCustomIdEnum.SELECT_CHARACTER_FOR_CREATE_PARTY)
      .setPlaceholder('Select your character')
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
    const partyFormData = await this.getPartyFormCacheData({
      interaction,
      userDiscordId: interaction.user.id,
    })

    if (!partyFormData) return

    partyFormData.classPriorityLoot = !partyFormData.classPriorityLoot

    const payLoad = await this.mutateInteraction(partyFormData)

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

  async handleElementSelection(interaction: Interaction) {
    if (!interaction.isButton()) return

    const partyFormData = await this.getPartyFormCacheData({
      interaction,
      userDiscordId: interaction.user.id,
    })

    if (!partyFormData) return

    const element = Object.values(ElementEnum).find(element =>
      interaction.customId.toLocaleLowerCase().includes(element.toLocaleLowerCase()),
    )

    if (partyFormData.elements.includes(element)) {
      partyFormData.elements = partyFormData.elements.filter(e => e !== element)
    } else {
      partyFormData.elements.push(element)
    }

    const payLoad = await this.mutateInteraction(partyFormData)

    await interaction.update(payLoad)
  }

  async handleSelectMenu(interaction: StringSelectMenuInteraction) {
    if (!interaction.isStringSelectMenu()) return

    const partyFormData = await this.getPartyFormCacheData({
      userDiscordId: interaction.user.id,
    })

    if (!partyFormData) return

    if (
      interaction.customId ===
      ComponentCustomIdEnum.SELECT_CHARACTER_FOR_CREATE_PARTY
    ) {
      partyFormData.selectedCharId = Number(interaction.values[0])
    }

    if (interaction.customId === ComponentCustomIdEnum.SELECT_NEST) {
      partyFormData.nest = interaction.values[0] as NestEnum
    }

    if (interaction.customId === ComponentCustomIdEnum.SELECT_SERVER) {
      partyFormData.serverRegion = interaction.values[0] as ServerRegionEnum
    }

    const payLoad = await this.mutateInteraction(partyFormData)

    await interaction.update(payLoad)
  }

  async handleTimeSubmit(interaction: ModalSubmitInteraction) {
    if (!interaction.isModalSubmit()) return

    const partyFormData = await this.getPartyFormCacheData({
      userDiscordId: interaction.user.id,
    })

    if (!partyFormData) return

    const fromTimeRaw = interaction.fields.getTextInputValue(
      ComponentCustomIdEnum.TIME_START,
    )
    const toTimeRaw = interaction.fields.getTextInputValue(
      ComponentCustomIdEnum.TIME_END,
    )
    const zone = 'UTC' + (partyFormData.timeZoneUTC || '+2')

    const fromTime = DateTime.fromFormat(fromTimeRaw, 'HH:mm dd/LL', {
      zone,
    })
    const toTime = DateTime.fromFormat(toTimeRaw, 'HH:mm dd/LL', {
      zone,
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

    partyFormData.timeEnd = `${timeEnd}`
    partyFormData.timeStart = `${timeStart}`

    try {
      await interaction.deferUpdate()

      const payLoad = await this.mutateInteraction(partyFormData)

      await interaction.editReply(payLoad)
    } catch (error) {
      console.error('❌ Error updating panel:', error)
    }
  }

  async handleUserUTC(interaction: ModalSubmitInteraction) {
    if (!interaction.isModalSubmit()) return

    const partyFormData = await this.getPartyFormCacheData({
      interaction,
      userDiscordId: interaction.user.id,
    })

    if (!partyFormData) return

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

    partyFormData.timeZoneUTC = userUTC as UTC

    try {
      await this.userRepository.update(
        { discordId: partyFormData.userDiscordId },
        { timeZoneUTC: partyFormData.timeZoneUTC || null },
      )
    } catch {
      await this.generalComponentsService.sendErrorMessage(
        [`🛑 **Error:**`, `Oops, something went wrong, please write to Admin`],
        interaction,
      )

      return
    }

    try {
      await interaction.deferUpdate()

      const payLoad = await this.mutateInteraction(partyFormData)

      await interaction.editReply(payLoad)
    } catch (error) {
      console.error('❌ Error updating panel:', error)
    }
  }

  async handlePartyDescription(interaction: ModalSubmitInteraction) {
    if (!interaction.isModalSubmit()) return

    const partyFormData = await this.getPartyFormCacheData({
      interaction,
      userDiscordId: interaction.user.id,
    })

    if (!partyFormData) return

    const partyDascription = interaction.fields.getTextInputValue(
      ComponentCustomIdEnum.PARTY_DESCRIPTION_INPUT,
    )

    partyFormData.description = partyDascription || ''

    try {
      await interaction.deferUpdate()

      const payLoad = await this.mutateInteraction(partyFormData)

      await interaction.editReply(payLoad)
    } catch (error) {
      console.error('❌ Error updating panel:', error)
    }
  }

  async handleCreateParty({ interaction, client }: HandleCreatePartyT) {
    await interaction.deferUpdate()

    const partyFormData = await this.getPartyFormCacheData({
      interaction,
      userDiscordId: interaction.user.id,
    })

    if (!partyFormData) return

    const charListChannel = (await client.channels.fetch(
      this.partyListDiscordChalledId,
    )) as TextChannel

    const newPartyListMessage = await charListChannel.send({
      content: `Creating new party..`,
    })

    const { partyCategoryId, privatePartyTextChannelId } =
      await this.createPrivatePartyChannel({
        partyFormData,
        partyNumber: 234,
        client,
      })

    const nestInfo = nestInfoMap[partyFormData.nest]

    await newPartyListMessage.startThread({
      name: `Party info`,
      autoArchiveDuration: 60,
      reason: nestInfo.name,
    })

    const user = await this.userRepository.findOne({
      where: { discordId: partyFormData.userDiscordId },
    })

    const userCharacter = await this.characterRepository.findOne({
      where: { id: partyFormData.selectedCharId },
    })

    const userParty = this.partyRepository.create({
      leader: user,
      members: [userCharacter],
      element: partyFormData.elements,
      classPriorityLoot: partyFormData.classPriorityLoot,
      timeStart: partyFormData.timeStart,
      timeEnd: partyFormData.timeEnd,
      serverRegion: partyFormData.serverRegion,
      discordMessageId: newPartyListMessage.id,
      partyCategoryId: partyCategoryId,
    })

    await this.partyRepository.save(userParty)

    const { components, embeds } = this.partComponentsService.mutatePartyComponent({
      ...partyFormData,
      leader: userCharacter,
      members: [userCharacter],
    })

    await newPartyListMessage.edit({
      content: '',
      components,
      embeds,
    })

    const linkButtonRow = [
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setLabel(`Link to your party in party-list`)
          .setStyle(ButtonStyle.Link)
          .setURL(
            `${process.env.DISCORD_GUILD_LINK}${process.env.PARTY_LIST_CHANNEL_ID}/${newPartyListMessage.id}`,
          ),
      ),
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setLabel(`Link to your PRIVATE party category`)
          .setStyle(ButtonStyle.Link)
          .setURL(`${process.env.DISCORD_GUILD_LINK}${privatePartyTextChannelId}`),
      ),
    ]

    const updatedEmbed = new EmbedBuilder().setColor(0x1deb0c).addFields(
      {
        name: '',
        value: `<:${partyFormData.nest}:${nestInfo.emoji}> ${nestInfo.name}`,
      },
      {
        name: '',
        value: '✅ Party created',
      },
    )

    await interaction.editReply({
      embeds: [updatedEmbed],
      components: [...linkButtonRow],
    })

    await this.redisService.deleteCache(
      RedisCacheKey.USER_PANEL_CREATE_PARTY + interaction.user.id,
    )
  }

  async createPrivatePartyChannel({
    client,
    partyFormData,
    partyNumber,
  }: CreatePartyChannelT): Promise<{
    partyCategoryId: string
    privatePartyTextChannelId: string
  }> {
    const guild = await client.guilds.fetch(process.env.DISCORD_GUILD_ID)

    const category = await guild.channels.create({
      name: `Party-${partyNumber}|${partyFormData.nest}`,
      type: ChannelType.GuildCategory,
      permissionOverwrites: [
        {
          id: guild.roles.everyone,
          deny: ['ViewChannel'],
        },
        {
          id: partyFormData.userDiscordId,
          allow: ['ViewChannel'],
        },
      ],
    })

    const textChannels = ['🔧settings', '📩requests', '💬chat']

    let privatePartyTextChannelId = ''

    for (const name of textChannels) {
      const textBranch = await guild.channels.create({
        name,
        type: ChannelType.GuildText,
        parent: category,
        permissionOverwrites: category.permissionOverwrites.cache.map(p => p),
      })

      if (name === textChannels[2]) {
        privatePartyTextChannelId = textBranch.id
      }
    }

    await guild.channels.create({
      name: '📢raids',
      type: ChannelType.GuildVoice,
      parent: category,
      permissionOverwrites: category.permissionOverwrites.cache.map(p => p),
    })

    await guild.channels.create({
      name: '👥',
      type: ChannelType.GuildVoice,
      parent: category,
      userLimit: 2,
      permissionOverwrites: category.permissionOverwrites.cache.map(p => p),
    })

    await guild.channels.create({
      name: '👥',
      type: ChannelType.GuildVoice,
      parent: category,
      userLimit: 2,
      permissionOverwrites: category.permissionOverwrites.cache.map(p => p),
    })

    return { partyCategoryId: category.id, privatePartyTextChannelId }
  }
}
