import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  EmbedBuilder,
  Interaction,
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
import GeneralComponentsService from 'src/shared/services/general-components.service'
import { UserCharacterEditT } from 'src/shared/types/user-character-edit'
import { Repository } from 'typeorm'

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
  ) {}

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
    userData: UserCharacterEditT,
    userCharListProps?: CharListEntity,
  ) {
    const userCharList =
      userCharListProps ??
      (await this.charListRepository.findOne({
        where: { user: { discordId: userData.userDiscordId } },
        relations: ['characters'],
      }))

    const selectedCharForEdit = userCharList.characters.find(
      char => char.id === userData.selectedCharId,
    )

    let nickNameLabelBefore = ''
    let nickNameLabelAfter = ''

    let fields: { name: string; value: string }[] | null = null

    if (selectedCharForEdit) {
      nickNameLabelBefore = charInfoToString(selectedCharForEdit)
      nickNameLabelAfter = charInfoToString(userData)

      fields = [
        {
          name: '',
          value: userData.name
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
      key: RedisCacheKey.USER_PANEL_CHARACTER_EDIT + userData.userDiscordId,
      value: userData,
      ttl: RedisCacheDuration.USER_PANEL_CHARACTER_EDIT,
    })

    const isRenderComponentsForEditChar = () => {
      if (!userData.selectedCharId)
        return [
          this.createNicknameSelectMenus(
            userData.selectedCharId,
            userCharList.characters,
          ),
        ]

      return [
        this.generalComponentsService.createElementButtons(
          PanelEnum.EDIT_CHAR,
          userData.elements,
        ),
        ...this.generalComponentsService.createClassSelectMenus(
          userData.class,
          userData.generalClass,
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
                !userData.class ||
                  !userData.selectedCharId ||
                  nickNameLabelBefore === nickNameLabelAfter,
              ),
            )
            .setStyle(ButtonStyle.Primary),
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
    const userData = await this.redisService.getCache<UserCharacterEditT>(
      RedisCacheKey.USER_PANEL_CHARACTER_EDIT + interaction.user.id,
    )

    const name = interaction.fields.getTextInputValue(
      ComponentCustomIdEnum.INPUT_NICKNAME_FOR_EDIT,
    )

    if (name) {
      userData.name = name
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

      const payLoad = await this.mutateInteraction(userData)

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

    const userData = await this.redisService.getCache<UserCharacterEditT>(
      RedisCacheKey.USER_PANEL_CHARACTER_EDIT + interaction.user.id,
    )

    if (interaction.customId === ComponentCustomIdEnum.SELECT_CHARACTER_FOR_EDIT) {
      const userCharter = await this.characterRepository.findOne({
        where: {
          id: Number(interaction.values[0]),
          charList: { user: { discordId: interaction.user.id } },
        },
      })

      userData.class = userCharter.class
      userData.generalClass = userCharter.generalClass
      userData.name = userCharter.name
      userData.elements = userCharter.elements
      userData.selectedCharId = userCharter.id
    }

    if (
      interaction.customId ===
      PanelEnum.EDIT_CHAR + ComponentCustomIdEnum.SELECT_GENERAL_CLASS
    ) {
      userData.generalClass = interaction.values[0] as GeneralCharacterClassEnum
      userData.class = '' as CharacterClassEnum
    }

    if (
      interaction.customId ===
      PanelEnum.EDIT_CHAR + ComponentCustomIdEnum.SELECT_CLASS
    ) {
      userData.class = interaction.values[0] as CharacterClassEnum
    }

    const payLoad = await this.mutateInteraction(userData)

    await interaction.update(payLoad)
  }

  async handleElementSelection(interaction: Interaction) {
    if (!interaction.isButton()) return

    const element = Object.values(ElementEnum).find(element =>
      interaction.customId.toLocaleLowerCase().includes(element.toLocaleLowerCase()),
    )

    const userData = await this.redisService.getCache<UserCharacterEditT>(
      RedisCacheKey.USER_PANEL_CHARACTER_EDIT + interaction.user.id,
    )

    if (userData.elements.includes(element)) {
      userData.elements = userData.elements.filter(e => e !== element)
    } else {
      userData.elements.push(element)
    }

    const payLoad = await this.mutateInteraction(userData)

    await interaction.update(payLoad)
  }

  async submitCharacterEdit(
    interaction: ButtonInteraction,
    charListChannel: TextChannel,
  ) {
    const userData = await this.redisService.getCache<UserCharacterEditT>(
      RedisCacheKey.USER_PANEL_CHARACTER_EDIT + interaction.user.id,
    )

    if (!userData) {
      await interaction.deleteReply()
    }

    const nickNameLable = charInfoToString(userData)
    const { selectedCharId, userDiscordId, ...rest } = userData

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
    const userData = await this.redisService.getCache<UserCharacterEditT>(
      RedisCacheKey.USER_PANEL_CHARACTER_EDIT + interaction.user.id,
    )

    if (!userData) {
      await interaction.deleteReply()
    }

    const nickNameLable = charInfoToString(userData)
    const { selectedCharId, userDiscordId } = userData

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

    const characterFields = () => {
      if (!updatedCharList?.characters?.length) {
        return [{ name: '', value: '🛑 The player has not added any characters' }]
      }

      return updatedCharList.characters.map(char => {
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
      })
    }

    const embed = new EmbedBuilder().setColor(0xdbc907).addFields(
      {
        name: '',
        value: `<@${interaction.user.id}>`,
      },
      ...characterFields(),
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
