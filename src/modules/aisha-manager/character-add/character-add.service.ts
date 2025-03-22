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
import { successfulCharacterAdding } from 'src/shared/constants/successful-response'

@Injectable()
class CharacterAddService {
  constructor(
    private readonly redisService: RedisService,
    private readonly generalComponentsService: GeneralComponentsService,
  ) {}

  async createPanel(interaction: ModalSubmitInteraction, nickname: string) {
    const payLoad = await this.mutateInteraction({
      ...defaultUserCharacterAdd,
      nickname,
      userId: interaction.user.id,
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
        value: `${classText} **${userData.nickname}** ${elementsText}`,
      },
    ])

    await this.redisService.setCache({
      key: RedisCacheKey.USER_PANEL_CHARACTER_ADD + userData.userId,
      value: userData,
      ttl: RedisCacheDuration.USER_PANEL_CHARACTER_ADD,
    })

    const components = [
      this.generalComponentsService.createElementButtons(userData.elements),
      ...this.generalComponentsService.createClassSelectMenus(
        userData.class,
        userData.generalClass,
      ),
      this.generalComponentsService.createActionButtons(
        ComponentCustomIdEnum.SUBMIT_CHARACTER_ADD,
        'Submit',
        Boolean(!userData.class),
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

    if (interaction.customId === ComponentCustomIdEnum.SELECT_GENERAL_CLASS) {
      userData.generalClass = interaction.values[0] as GeneralCharacterClassEnum
      userData.class = '' as CharacterClassEnum
    }

    if (interaction.customId === ComponentCustomIdEnum.SELECT_CLASS) {
      userData.class = interaction.values[0] as CharacterClassEnum
    }

    const payLoad = await this.mutateInteraction(userData)

    await interaction.update(payLoad)
  }

  async submitCharacterAdd(interaction: ButtonInteraction) {
    const userData = await this.redisService.getCache<UserCharacterAddT>(
      RedisCacheKey.USER_PANEL_CHARACTER_ADD + interaction.user.id,
    )

    await this.redisService.deleteCache(
      RedisCacheKey.USER_PANEL_CHARACTER_ADD + interaction.user.id,
    )

    const linkButtonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setLabel(`Link to your char list`)
        .setStyle(ButtonStyle.Link)
        .setURL(
          'https://discord.com/channels/1351560947105267792/1351560949412270132/1352757387483938929',
        ),
    )

    const elementsText =
      userData.elements
        .map(element => `<:${element}:${elementEmojiMap[element]}>`)
        .join('') || ''

    const classText = userData.class
      ? `<:${userData.class}:${classesEmojiMap[userData.class]}>`
      : ''

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
        value: `${classText} **${userData.nickname}** ${elementsText} added to characters list`,
      },
    )

    await interaction.update({
      embeds: [updatedEmbed],
      components: [linkButtonRow],
    })
  }
}

export default CharacterAddService
