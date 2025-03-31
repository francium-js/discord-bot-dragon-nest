import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  EmbedBuilder,
  MessageFlags,
  ModalBuilder,
  ModalSubmitInteraction,
  StringSelectMenuBuilder,
  StringSelectMenuInteraction,
  StringSelectMenuOptionBuilder,
  TextChannel,
  TextInputBuilder,
  TextInputStyle,
} from 'discord.js'
import { CharListEntity } from 'src/entities/char-list.entity'
import { CharacterEntity } from 'src/entities/character.entity'
import { UserEntity } from 'src/entities/user.entity'
import { defaultUserCharacterEdit } from 'src/shared/constants/default-user-character-edit'
import { classesEmojiMap, elementEmojiMap } from 'src/shared/constants/emoji-ids'
import { successfulCharacterAdding } from 'src/shared/constants/npc-response'
import { CharacterClassEnum } from 'src/shared/enums/character-class'
import { ComponentCustomIdEnum } from 'src/shared/enums/component-custom-id'
import { ElementEnum } from 'src/shared/enums/element'
import { GeneralCharacterClassEnum } from 'src/shared/enums/general-character-class'
import { PanelEnum } from 'src/shared/enums/panel'
import { RedisCacheDuration } from 'src/shared/enums/redis-cache-duration'
import { RedisCacheKey } from 'src/shared/enums/redis-cache-key'
import { charInfoToString } from 'src/shared/helpers/char-info-to-string'
import { RedisService } from 'src/shared/redis/redis.service'
import { CharListComponentsService } from 'src/shared/services/char-list-components/char-list-components.service'
import { GeneralComponentsService } from 'src/shared/services/general-components/general-components.service'
import { UserCharacterEditT } from 'src/shared/types/user-character-edit'
import { Repository } from 'typeorm'
import { GetCharacterCacheDataT } from './types'

@Injectable()
export class CharacterEditService {
  private charListDiscordChalledId: string = process.env.CHARS_LIST_CHANNEL_ID

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(CharListEntity)
    private readonly charListRepository: Repository<CharListEntity>,
    @InjectRepository(CharacterEntity)
    private readonly characterRepository: Repository<CharacterEntity>,
    private readonly redisService: RedisService,
    private readonly generalComponentsService: GeneralComponentsService,
    private readonly charListComponentsService: CharListComponentsService,
  ) {}

  async getCharacterCacheData({
    interaction,
    userDiscordId,
  }: GetCharacterCacheDataT): Promise<UserCharacterEditT> {
    const userCharacterData = await this.redisService.getCache<UserCharacterEditT>(
      RedisCacheKey.USER_PANEL_CHARACTER_EDIT + userDiscordId,
    )

    if (!userCharacterData) {
      if (interaction) {
        await this.generalComponentsService.sendErrorMessage(
          [`🛑 **Error:**`, `Oops, something went wrong, try again.`],
          interaction,
        )
      }

      return
    }

    return userCharacterData
  }

  async createPanel(interaction: ButtonInteraction) {
    const userCharList = await this.charListRepository.findOne({
      where: { user: { discordId: interaction.user.id } },
      relations: ['characters'],
    })

    if (!userCharList?.characters.length) {
      await this.generalComponentsService.sendErrorMessage(
        ['You have not characters', 'Be first create some char'],
        interaction,
      )

      return
    }

    await this.redisService.deleteCache(
      RedisCacheKey.USER_PANEL_CHARACTER_EDIT + interaction.user.id,
    )

    const payload = await this.mutateInteraction(
      {
        ...defaultUserCharacterEdit,
        userDiscordId: interaction.user.id,
      },
      userCharList,
    )

    await interaction.reply({ ...payload, flags: MessageFlags.Ephemeral })
  }

  async mutateInteraction(
    userCharData: UserCharacterEditT,
    userCharListProps?: CharListEntity,
  ) {
    const userCharList =
      userCharListProps ??
      (await this.charListRepository.findOne({
        where: { user: { discordId: userCharData.userDiscordId } },
        relations: ['characters'],
      }))

    const selectedCharForEdit = userCharList.characters.find(
      char => char.id === userCharData.selectedCharId,
    )

    let nickNameLabelBefore = ''
    let nickNameLabelAfter = ''

    let fields: { name: string; value: string }[] | null = null

    if (selectedCharForEdit) {
      nickNameLabelBefore = charInfoToString(selectedCharForEdit)
      nickNameLabelAfter = charInfoToString(userCharData)

      fields = [
        {
          name: '',
          value: userCharData.name
            ? `Before: ${nickNameLabelBefore}`
            : 'Select character what you wanna edit',
        },
        {
          name: '',
          value: `After: ${nickNameLabelAfter}`,
        },
      ]
    }

    await this.redisService.setCache({
      key: RedisCacheKey.USER_PANEL_CHARACTER_EDIT + userCharData.userDiscordId,
      value: userCharData,
      ttl: RedisCacheDuration.USER_PANEL_CHARACTER_EDIT,
    })

    const isRenderComponentsForEditChar = () => {
      if (!userCharData.selectedCharId)
        return [
          this.createNicknameSelectMenus(
            userCharData.selectedCharId,
            userCharList.characters,
          ),
        ]

      return [
        this.generalComponentsService.createElementButtons(
          PanelEnum.EDIT_CHAR,
          userCharData.elements,
        ),
        ...this.generalComponentsService.createClassSelectMenus(
          userCharData.class,
          userCharData.generalClass,
          PanelEnum.EDIT_CHAR,
        ),
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId(ComponentCustomIdEnum.OPEN_MODAL_INPUT_NICKNAME_FOR_EDIT)
            .setLabel('Edit name')
            .setStyle(ButtonStyle.Primary),
        ),
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId(ComponentCustomIdEnum.SUBMIT_CHARACTER_EDIT)
            .setLabel('Submit ' + selectedCharForEdit.name)
            .setDisabled(
              Boolean(
                !userCharData.class ||
                  !userCharData.selectedCharId ||
                  nickNameLabelBefore === nickNameLabelAfter,
              ),
            )
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId(ComponentCustomIdEnum.SUBMIT_CHARACTER_DELETE)
            .setLabel('Delete ' + selectedCharForEdit.name)
            .setStyle(ButtonStyle.Danger),
        ),
      ]
    }

    const components = [...isRenderComponentsForEditChar()]

    const embed = selectedCharForEdit
      ? [new EmbedBuilder().setColor(0xdbc907).addFields(fields)]
      : null

    return {
      embeds: embed,
      components,
    }
  }

  async openModalInputNickNameForEditUserCharacter(interaction: ButtonInteraction) {
    const userCharData = await this.getCharacterCacheData({
      interaction,
      userDiscordId: interaction.user.id,
    })

    if (!userCharData) return

    const modal = new ModalBuilder()
      .setCustomId(ComponentCustomIdEnum.MODAL_INPUT_NICKNAME_FOR_EDIT)
      .setTitle('Input nickname of you character')

    const inputNickname = new TextInputBuilder()
      .setCustomId(ComponentCustomIdEnum.INPUT_NICKNAME_FOR_EDIT)
      .setLabel('Nickname')
      .setStyle(TextInputStyle.Short)
      .setRequired(true)

    modal.addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(inputNickname),
    )

    await interaction.showModal(modal).catch(console.error)
  }

  async editCharacterNameSubmited(interaction: ModalSubmitInteraction) {
    const userCharData = await this.getCharacterCacheData({
      interaction,
      userDiscordId: interaction.user.id,
    })

    if (!userCharData) return

    const name = interaction.fields.getTextInputValue(
      ComponentCustomIdEnum.INPUT_NICKNAME_FOR_EDIT,
    )

    if (name) {
      userCharData.name = name
    }

    if (name.length > 25) {
      await this.generalComponentsService.sendErrorMessage(
        ['🛑 **Error:** Max character name length is 25.'],
        interaction,
      )

      return
    }

    try {
      await interaction.deferUpdate()

      const payLoad = await this.mutateInteraction(userCharData)

      await interaction.editReply(payLoad)
    } catch (error) {
      console.error('❌ Error updating panel:', error)
    }
  }

  createNicknameSelectMenus(selectedCharId: number, characters?: CharacterEntity[]) {
    const serverSelect = new StringSelectMenuBuilder()
      .setCustomId(ComponentCustomIdEnum.SELECT_CHARACTER_FOR_EDIT)
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

  async handleSelectMenu(interaction: StringSelectMenuInteraction) {
    if (!interaction.isStringSelectMenu()) return

    const userCharData = await this.getCharacterCacheData({
      userDiscordId: interaction.user.id,
    })

    if (!userCharData) return

    if (interaction.customId === ComponentCustomIdEnum.SELECT_CHARACTER_FOR_EDIT) {
      const userCharter = await this.characterRepository.findOne({
        where: {
          id: Number(interaction.values[0]),
          charList: { user: { discordId: interaction.user.id } },
        },
      })

      userCharData.class = userCharter.class
      userCharData.generalClass = userCharter.generalClass
      userCharData.name = userCharter.name
      userCharData.elements = userCharter.elements
      userCharData.selectedCharId = userCharter.id
    }

    if (
      interaction.customId ===
      PanelEnum.EDIT_CHAR + ComponentCustomIdEnum.SELECT_GENERAL_CLASS
    ) {
      userCharData.generalClass = interaction.values[0] as GeneralCharacterClassEnum
      userCharData.class = '' as CharacterClassEnum
    }

    if (
      interaction.customId ===
      PanelEnum.EDIT_CHAR + ComponentCustomIdEnum.SELECT_CLASS
    ) {
      userCharData.class = interaction.values[0] as CharacterClassEnum
    }

    const payLoad = await this.mutateInteraction(userCharData)

    await interaction.update(payLoad)
  }

  async handleElementSelection(interaction: ButtonInteraction) {
    const userCharData = await this.getCharacterCacheData({
      interaction,
      userDiscordId: interaction.user.id,
    })

    if (!userCharData) return

    const element = Object.values(ElementEnum).find(element =>
      interaction.customId.toLocaleLowerCase().includes(element.toLocaleLowerCase()),
    )

    if (userCharData.elements.includes(element)) {
      userCharData.elements = userCharData.elements.filter(e => e !== element)
    } else {
      userCharData.elements.push(element)
    }

    const payLoad = await this.mutateInteraction(userCharData)

    await interaction.update(payLoad)
  }

  async submitCharacterEdit(
    interaction: ButtonInteraction,
    charListChannel: TextChannel,
  ) {
    const userCharData = await this.getCharacterCacheData({
      interaction,
      userDiscordId: interaction.user.id,
    })

    if (!userCharData) return

    const nickNameLable = charInfoToString(userCharData)
    const { selectedCharId, userDiscordId, ...rest } = userCharData

    const user = await this.userRepository.findOne({
      where: { discordId: userDiscordId },
    })

    if (!user) return

    const userCharList = await this.charListRepository.findOne({
      where: { user: { id: user.id } },
    })

    const charListDiscordMessage = userCharList
      ? await charListChannel.messages.fetch(userCharList.discordMessageId)
      : null

    await this.characterRepository.update(selectedCharId, rest)

    const updatedCharList = await this.charListRepository.findOne({
      where: { user: { id: user.id } },
      relations: ['characters'],
    })

    const embed = new EmbedBuilder().setColor(0xdbc907).addFields(
      {
        name: '',
        value: `<@${interaction.user.id}>`,
      },
      ...updatedCharList.characters.map(char => {
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
      }),
    )

    await charListDiscordMessage.edit({ embeds: [embed], content: '' })

    const linkButtonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setLabel(`Link to your char-list`)
        .setStyle(ButtonStyle.Link)
        .setURL(
          `${process.env.DISCORD_GUILD_LINK}${this.charListDiscordChalledId}/${charListDiscordMessage.id}`,
        ),
    )

    const updatedEmbed = new EmbedBuilder().setColor(0x1deb0c).addFields(
      {
        name: '',
        value: `✅ ${
          successfulCharacterAdding[
            Math.floor(Math.random() * successfulCharacterAdding.length)
          ]
        }`,
      },
      {
        name: '',
        value: `${nickNameLable} updated`,
      },
    )

    await interaction.update({
      embeds: [updatedEmbed],
      components: [linkButtonRow],
    })

    await this.redisService.deleteCache(
      RedisCacheKey.USER_PANEL_CHARACTER_ADD + interaction.user.id,
    )
  }

  async submitCharacterDelete(
    interaction: ButtonInteraction,
    charListChannel: TextChannel,
  ) {
    const userCharData = await this.getCharacterCacheData({
      interaction,
      userDiscordId: interaction.user.id,
    })

    if (!userCharData) return

    const nickNameLable = charInfoToString(userCharData)
    const { selectedCharId, userDiscordId } = userCharData

    const user = await this.userRepository.findOne({
      where: { discordId: userDiscordId },
    })

    if (!user) return

    const userCharList = await this.charListRepository.findOne({
      where: { user: { id: user.id } },
    })

    const charListDiscordMessage = userCharList
      ? await charListChannel.messages.fetch(userCharList.discordMessageId)
      : null

    await this.characterRepository.delete(selectedCharId)

    const updatedCharList = await this.charListRepository.findOne({
      where: { user: { id: user.id } },
      relations: ['characters'],
    })

    const { embeds } = this.charListComponentsService.mutateCharList({
      charList: updatedCharList.characters,
      userDiscordId: interaction.user.id,
    })

    await charListDiscordMessage.edit({ embeds, content: '' })

    const linkButtonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setLabel(`Link to your char-list`)
        .setStyle(ButtonStyle.Link)
        .setURL(
          `${process.env.DISCORD_GUILD_LINK}${this.charListDiscordChalledId}/${charListDiscordMessage.id}`,
        ),
    )

    const updatedEmbed = new EmbedBuilder().setColor(0x1deb0c).addFields(
      {
        name: '',
        value: `✅ ${
          successfulCharacterAdding[
            Math.floor(Math.random() * successfulCharacterAdding.length)
          ]
        }`,
      },
      {
        name: '',
        value: `${nickNameLable} deleted`,
      },
    )

    await interaction.update({
      embeds: [updatedEmbed],
      components: [linkButtonRow],
    })

    await this.redisService.deleteCache(
      RedisCacheKey.USER_PANEL_CHARACTER_ADD + interaction.user.id,
    )
  }
}
