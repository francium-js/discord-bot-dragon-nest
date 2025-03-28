import { Injectable } from '@nestjs/common'
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  EmbedBuilder,
  MessageFlags,
  ModalSubmitInteraction,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} from 'discord.js'
import { classesEmojiMap, elementEmojiMap } from 'src/shared/constants/emoji-ids'
import { ComponentCustomIdEnum } from 'src/shared/enums/component-custom-id'
import { ElementEnum } from 'src/shared/enums/element'
import { CharacterClassEnum } from '../enums/character-class'
import { GeneralCharacterClassEnum } from '../enums/general-character-class'
import { classesMap } from '../constants/classes-map'
import { PanelEnum } from '../enums/panel'

Injectable()

class GeneralComponentsService {
  constructor() {}

  async sendErrorMessage(
    errors: string[],
    interaction: ModalSubmitInteraction | ButtonInteraction,
  ) {
    const updatedEmbed = new EmbedBuilder().setColor(0xf50909).addFields(
      errors.map(e => {
        return {
          name: '',
          value: e,
        }
      }),
    )

    await interaction.reply({
      embeds: [updatedEmbed],
      flags: MessageFlags.Ephemeral,
      fetchReply: true,
    })
  }

  createElementButtons(panelType: PanelEnum, selectedElements: string[] = []) {
    return new ActionRowBuilder<ButtonBuilder>().addComponents(
      Object.values(ElementEnum).map(element =>
        new ButtonBuilder()
          .setCustomId(
            `${panelType + ComponentCustomIdEnum.SELECT_ELEMENT}_${element}`,
          )
          .setEmoji(elementEmojiMap[element])
          .setLabel(element)
          .setStyle(
            selectedElements.includes(element)
              ? ButtonStyle.Success
              : ButtonStyle.Secondary,
          ),
      ),
    )
  }

  createClassSelectMenus(
    selectedClass: CharacterClassEnum,
    selectedGeneralClass: GeneralCharacterClassEnum,
    panelType: PanelEnum,
  ) {
    const generalClassesSelect =
      new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId(panelType + ComponentCustomIdEnum.SELECT_GENERAL_CLASS)
          .setPlaceholder('Select general class')
          .addOptions(
            Object.values(GeneralCharacterClassEnum).map(item => {
              const label = item
                .split('_')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ')

              return new StringSelectMenuOptionBuilder()
                .setEmoji(classesEmojiMap[item])
                .setLabel(label)
                .setValue(item)
                .setDefault(item === selectedGeneralClass)
            }),
          ),
      )

    const component = [generalClassesSelect]

    if (selectedGeneralClass) {
      const classesSelect =
        new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
          new StringSelectMenuBuilder()
            .setCustomId(panelType + ComponentCustomIdEnum.SELECT_CLASS)
            .setPlaceholder('Select class')
            .addOptions(
              classesMap[selectedGeneralClass].map(item => {
                const label = item
                  .split('_')
                  .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                  .join(' ')

                return new StringSelectMenuOptionBuilder()
                  .setEmoji(classesEmojiMap[item])
                  .setLabel(label)
                  .setValue(item)
                  .setDefault(item === selectedClass)
              }),
            ),
        )

      component.push(classesSelect)
    }

    return component
  }
}

export default GeneralComponentsService
