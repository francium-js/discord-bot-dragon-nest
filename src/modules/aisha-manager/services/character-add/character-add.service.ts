import { Injectable } from '@nestjs/common'
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
  StringSelectMenuInteraction,
  TextChannel,
  TextInputBuilder,
  TextInputStyle,
} from 'discord.js'
import { RedisCacheDuration } from 'src/shared/enums/redis-cache-duration'
import { RedisCacheKey } from 'src/shared/enums/redis-cache-key'

import { RedisService } from 'src/shared/redis/redis.service'
import { UserCharacterAddT } from 'src/shared/types/user-characters-add'
import { ElementEnum } from 'src/shared/enums/element'
import GeneralComponentsService from 'src/shared/services/general-components.service'
import { defaultUserCharacterAdd } from 'src/shared/constants/default-user-character-add'
import { ComponentCustomIdEnum } from 'src/shared/enums/component-custom-id'
import { classesEmojiMap, elementEmojiMap } from 'src/shared/constants/emoji-ids'
import { CharacterClassEnum } from 'src/shared/enums/character-class'
import { GeneralCharacterClassEnum } from 'src/shared/enums/general-character-class'
import { successfulCharacterAdding } from 'src/shared/constants/npc-response'
import { InjectRepository } from '@nestjs/typeorm'
import { UserEntity } from 'src/entities/user.entity'
import { Repository } from 'typeorm'
import { CharacterEntity } from 'src/entities/character.entity'
import { CharListEntity } from 'src/entities/char-list.entity'
import { PanelEnum } from 'src/shared/enums/panel'

@Injectable()
export class CharacterAddService {
  private charListDiscordChalledId: string = process.env.CHARS_LIST_CHANNEL_ID

  constructor(
    private readonly redisService: RedisService,
    private readonly generalComponentsService: GeneralComponentsService,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(CharacterEntity)
    private readonly characterRepository: Repository<CharacterEntity>,
    @InjectRepository(CharListEntity)
    private readonly charListRepository: Repository<CharListEntity>,
  ) {}

  async createPanel(interaction: ModalSubmitInteraction, name: string) {
    if (name.length > 25) {
      await this.generalComponentsService.sendErrorMessage(
        ['🛑 **Error:** Max character name length is 25.'],
        interaction,
      )

      return
    }

    const payLoad = await this.mutateInteraction({
      ...defaultUserCharacterAdd,
      name,
      userDiscordId: interaction.user.id,
    })

    await interaction.reply({ ...payLoad, flags: MessageFlags.Ephemeral })
  }

  async mutateInteraction(userData: UserCharacterAddT) {
    const elementsText =
      userData.elements
        .map(element => `<:${element}:${elementEmojiMap[element]}>`)
        .join('') || ''

    const classText = userData.class
      ? `<:${userData.class}:${classesEmojiMap[userData.class]}>`
      : ''

    const newCharacterEmbed = new EmbedBuilder().setColor(0xdbc907).addFields([
      {
        name: '',
        value: `${classText} **${userData.name}** ${elementsText}`,
      },
    ])

    await this.redisService.setCache({
      key: RedisCacheKey.USER_PANEL_CHARACTER_ADD + userData.userDiscordId,
      value: userData,
      ttl: RedisCacheDuration.USER_PANEL_CHARACTER_ADD,
    })

    const components = [
      this.generalComponentsService.createElementButtons(
        PanelEnum.ADD_CHAR,
        userData.elements,
      ),
      ...this.generalComponentsService.createClassSelectMenus(
        userData.class,
        userData.generalClass,
        PanelEnum.ADD_CHAR,
      ),
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId(ComponentCustomIdEnum.SUBMIT_CHARACTER_ADD)
          .setLabel('Create')
          .setDisabled(Boolean(!userData.class))
          .setStyle(ButtonStyle.Success),
      ),
    ]

    return {
      embeds: [newCharacterEmbed],
      components,
    }
  }

  async openModalInputNickNameForCreateUserCharacter(
    interaction: ButtonInteraction,
  ) {
    const user = await this.userRepository.findOne({
      where: { discordId: interaction.user.id },
      relations: ['characters'],
    })

    if (!user) {
      await this.generalComponentsService.sendErrorMessage(
        ['Oops, something want wrong...', 'Write to Admin pleeease >.<'],
        interaction,
      )

      return
    }

    if (user.characters.length > 20) {
      await this.generalComponentsService.sendErrorMessage(
        ['Max character count is 20'],
        interaction,
      )

      return
    }

    const modal = new ModalBuilder()
      .setCustomId(ComponentCustomIdEnum.MODAL_INPUT_NICKNAME)
      .setTitle('Input nickname of you character')

    const inputNickname = new TextInputBuilder()
      .setCustomId(ComponentCustomIdEnum.INPUT_NICKNAME)
      .setLabel('Nickname')
      .setStyle(TextInputStyle.Short)
      .setRequired(true)

    modal.addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(inputNickname),
    )

    await interaction.showModal(modal).catch(console.error)
  }

  async openPanelUserCharacterAdd(interaction: ModalSubmitInteraction) {
    const nickname = interaction.fields.getTextInputValue(
      ComponentCustomIdEnum.INPUT_NICKNAME,
    )

    await this.createPanel(interaction, nickname)
  }

  async handleElementSelection(interaction: Interaction) {
    if (!interaction.isButton()) return

    const element = Object.values(ElementEnum).find(element =>
      interaction.customId.toLocaleLowerCase().includes(element.toLocaleLowerCase()),
    )

    const userData = await this.redisService.getCache<UserCharacterAddT>(
      RedisCacheKey.USER_PANEL_CHARACTER_ADD + interaction.user.id,
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

    const userData = await this.redisService.getCache<UserCharacterAddT>(
      RedisCacheKey.USER_PANEL_CHARACTER_ADD + interaction.user.id,
    )

    if (
      interaction.customId ===
      PanelEnum.ADD_CHAR + ComponentCustomIdEnum.SELECT_GENERAL_CLASS
    ) {
      userData.generalClass = interaction.values[0] as GeneralCharacterClassEnum
      userData.class = '' as CharacterClassEnum
    }

    if (
      interaction.customId ===
      PanelEnum.ADD_CHAR + ComponentCustomIdEnum.SELECT_CLASS
    ) {
      userData.class = interaction.values[0] as CharacterClassEnum
    }

    const payLoad = await this.mutateInteraction(userData)

    await interaction.update(payLoad)
  }

  async submitCharacterAdd(
    interaction: ButtonInteraction,
    charListChannel: TextChannel,
  ) {
    const userData = await this.redisService.getCache<UserCharacterAddT>(
      RedisCacheKey.USER_PANEL_CHARACTER_ADD + interaction.user.id,
    )

    if (!userData) {
      await interaction.deleteReply()
    }

    const elementsText =
      userData.elements
        .map(element => `<:${element}:${elementEmojiMap[element]}>`)
        .join('') || ''

    const classText = userData.class
      ? `<:${userData.class}:${classesEmojiMap[userData.class]}>`
      : ''

    let user = await this.userRepository.findOne({
      where: { discordId: userData.userDiscordId },
    })

    if (!user) return

    let userCharList = await this.charListRepository.findOne({
      where: { user: { id: user.id } },
    })

    let charListDiscordMessage = userCharList
      ? await charListChannel.messages.fetch(userCharList.discordMessageId)
      : null

    if (!userCharList) {
      const newCharListMessage = await charListChannel.send({
        content: `Creating new char-list..`,
      })

      charListDiscordMessage = newCharListMessage

      const thread = await newCharListMessage.startThread({
        name: `Gear info`,
        autoArchiveDuration: 60,
        reason: `Char list for ${interaction.user.tag}`,
      })

      await thread.setArchived(true)

      userCharList = this.charListRepository.create({
        user,
        discordMessageId: newCharListMessage.id,
      })

      await this.userRepository.update(user.id, { charlistThreadId: thread.id })
      await this.charListRepository.save(userCharList)

      user = await this.userRepository.findOne({ where: { id: user.id } })

      userCharList = await this.charListRepository.findOne({
        where: { user: { id: user.id } },
      })
    }

    const newCharacter = this.characterRepository.create({
      name: userData.name,
      user,
      elements: userData.elements,
      class: userData.class,
      generalClass: userData.generalClass,
      charList: userCharList,
    })

    await this.characterRepository.save(newCharacter)

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
        value: `${classText} **${userData.name}** ${elementsText} added to characters list`,
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
