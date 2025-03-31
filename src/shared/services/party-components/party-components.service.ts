import { Injectable } from '@nestjs/common'
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  EmbedBuilder,
  MessageFlags,
  ModalSubmitInteraction,
} from 'discord.js'
import { classesEmojiMap, elementEmojiMap } from 'src/shared/constants/emoji-ids'
import { DateTime } from 'luxon'
import {
  AddPartyDescriptionT,
  AddPartyFieldsT,
  AddPartyMembersFieldsT,
  MutatePartyComponentT,
} from './types'
import { ComponentCustomIdEnum } from 'src/shared/enums/component-custom-id'
import { ServerRegionEnum } from 'src/shared/enums/server-region'
import { nestInfoMap } from 'src/shared/constants/nest-info-map'
import { roleIdsMap } from 'src/shared/constants/role-ids'

@Injectable()
export class PartComponentsService {
  mutatePartyComponent({
    elements,
    nest,
    serverRegion,
    timeStart,
    timeEnd,
    classPriorityLoot,
    leader,
    members,
    description,
  }: MutatePartyComponentT) {
    const embeds: EmbedBuilder[] = []
    const nestInfo = nestInfoMap[nest]

    const partybuttons = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setLabel(`Make request ✉️`)
        .setCustomId(ComponentCustomIdEnum.PARTY_MAKE_REQUEST)
        .setStyle(ButtonStyle.Secondary),
    )

    const regionServersEmojis = {
      [ServerRegionEnum.EU]: '🇪🇺',
      [ServerRegionEnum.SEA]: '🌏',
      [ServerRegionEnum.NA]: '🇺🇸',
      [ServerRegionEnum.SA]: '🌎',
    }

    const nestElementsText =
      elements
        .map(element => `<:${element}:${elementEmojiMap[element]}>`)
        .join('') || ''

    const partyEmbed = new EmbedBuilder()
      .setColor(nestInfo.color)
      .setThumbnail(nestInfo.imgOneToOneUrl)
      .addFields(
        {
          name: '',
          value: `<@&${roleIdsMap[nest]}> ${regionServersEmojis[serverRegion]} ${serverRegion}`,
        },
        {
          name: '',
          value: `<:${nest}:${nestInfo.emoji}> ${nestInfo.name} ${nestElementsText}`,
        },
      )

    this.addEmptyFields(partyEmbed)

    this.addPartyTimeFields({
      embed: partyEmbed,
      timeStart: timeStart,
      timeEnd: timeEnd,
    })

    this.addEmptyFields(partyEmbed)

    partyEmbed.addFields({
      name: '',
      value: `> Class priority loot **${classPriorityLoot ? 'ACTIVATED ✅' : 'DISABLED ❌'}**`,
    })

    this.addEmptyFields(partyEmbed)

    this.addPartyMembersFields({
      embed: partyEmbed,
      members,
      leader,
    })

    embeds.push(partyEmbed)

    if (description) {
      const embedDescription = new EmbedBuilder()

      this.addPartyDescription({ embed: embedDescription, description })

      embeds.push(embedDescription)
    }

    return {
      embeds,
      components: [partybuttons],
    }
  }
  addPartyMembersFields({ embed, members, leader }: AddPartyMembersFieldsT) {
    const updatedMemberList = [
      leader,
      ...members.filter(member => member.id !== leader.id),
    ]

    embed.addFields([
      {
        name: '',
        value: `👥 **Members:**`,
      },
      ...updatedMemberList.map((member, index) => {
        const elementsText =
          member.elements
            .map(element => `<:${element}:${elementEmojiMap[element]}>`)
            .join('') || ''

        const classText = `<:${member.class}:${classesEmojiMap[member.class]}>`

        return {
          name: '',
          value: `- ${classText} **${member.name}** ${elementsText} ${!index ? '👑' : ''}`,
        }
      }),
    ])
  }

  addPartyTimeFields({ embed, timeStart, timeEnd }: AddPartyFieldsT) {
    const formattedStartTimeHourse = DateTime.fromMillis(Number(timeStart))
      .setZone('UTC+2')
      .toFormat('HH:mm')
    const formattedEndTimeHourse = DateTime.fromMillis(Number(timeEnd))
      .setZone('UTC+2')
      .toFormat('HH:mm')

    const formattedStartTimeDays = DateTime.fromMillis(Number(timeStart))
      .setZone('UTC+2')
      .toFormat('dd/LL')
    const formattedEndTimeDays = DateTime.fromMillis(Number(timeEnd))
      .setZone('UTC+2')
      .toFormat('dd/LL')

    const isSameDays = formattedStartTimeDays === formattedEndTimeDays

    const unixStart = Math.floor(DateTime.fromMillis(Number(timeStart)).toSeconds())
    const unixEnd = Math.floor(DateTime.fromMillis(Number(timeEnd)).toSeconds())

    if (isSameDays) {
      embed.addFields([
        {
          name: '',
          value: `> **Time Zone**
            > Server time: **${formattedStartTimeDays}** | ${formattedStartTimeHourse} - ${formattedEndTimeHourse}
            > Your time: <t:${unixStart}:D> <t:${unixStart}:t> - <t:${unixEnd}:t>`,
        },
      ])
    } else {
      embed.addFields([
        {
          name: '',
          value: `> **Time Zone**
            > Server-time:
            > **${formattedStartTimeDays}** | ${formattedStartTimeHourse} - start
            > **${formattedEndTimeDays}** | ${formattedEndTimeHourse} - end
            > 
            > Your time:
            > <t:${unixStart}:D> <t:${unixStart}:t> - start
            > <t:${unixEnd}:D> <t:${unixEnd}:t> - end`,
        },
      ])
    }
  }

  addPartyDescription({ embed, description }: AddPartyDescriptionT) {
    embed.setColor(0x131316).addFields([
      {
        name: '',
        value: `📜 **Description:**`,
      },
      {
        name: '',
        value: `${description}`,
      },
    ])
  }

  addEmptyFields(embed: EmbedBuilder) {
    embed.addFields([
      {
        name: '',
        value: ``,
      },
    ])
  }

  async updateMessageToErrorMessage(
    errors: string[],
    interaction: ButtonInteraction,
  ) {
    const updatedEmbed = new EmbedBuilder().setColor(0xf50909).addFields(
      errors.map(e => {
        return {
          name: '',
          value: e,
        }
      }),
    )

    await interaction.update({
      embeds: [updatedEmbed],
      content: '',
      components: [],
    })
  }

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
}
