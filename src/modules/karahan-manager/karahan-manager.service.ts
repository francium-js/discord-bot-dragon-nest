import { Injectable, OnModuleInit } from '@nestjs/common'
import {
  Client,
  GatewayIntentBits,
  TextChannel,
  Events,
  EmbedBuilder,
  MessageReaction,
  User,
  PartialMessageReaction,
  PartialUser,
  Partials,
} from 'discord.js'
import { ConfigService } from '@nestjs/config'
import { nestInfoMap } from 'src/shared/constants/nest-info-map'
import { NestEnum } from 'src/shared/enums/nests'
import { roleIdsMap } from 'src/shared/constants/role-ids'

@Injectable()
class KarahanManagerService implements OnModuleInit {
  private client: Client
  private panelChannelId: string
  private regionServersRoles: Record<string, string>
  private nestRoles: Record<string, string>

  constructor(private configService: ConfigService) {
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessageReactions,
      ],
      partials: [Partials.Message, Partials.Channel, Partials.Reaction],
    })

    this.panelChannelId = this.configService.get<string>('ROLES_MANAGER_CHANNEL_ID')

    this.regionServersRoles = {
      '🇪🇺': 'EU',
      '🌏': 'SEA',
      '🇺🇸': 'NA',
      '🌎': 'SA',
    }

    let nestRoles = {}

    Object.values(NestEnum).forEach(nest => {
      nestRoles = { ...nestRoles, [nestInfoMap[nest].emoji]: nest }
    })

    this.nestRoles = nestRoles as Record<NestEnum, string>
  }

  async onModuleInit() {
    const token = this.configService.get<string>('KARAHAN_DISCORD_TOKEN')

    if (!token) return

    await this.client.login(token)

    this.client.on(Events.MessageReactionAdd, async (reaction, user) => {
      await this.toggleRole(reaction, user, true)
    })

    this.client.on(Events.MessageReactionRemove, async (reaction, user) => {
      await this.toggleRole(reaction, user, false)
    })

    const channelId = this.configService.get<string>('ROLES_MANAGER_CHANNEL_ID')
    const channel = (await this.client.channels.fetch(channelId)) as TextChannel

    if (!channel) return

    const messages = await channel.messages.fetch({ limit: 1 })

    if (messages.size === 0) {
      await this.createReactionPanel()
    }
  }

  private async toggleRole(
    reaction: MessageReaction | PartialMessageReaction,
    user: User | PartialUser,
    isAdding: boolean,
  ) {
    if (user.bot) return

    if (reaction.partial) await reaction.fetch()

    const { message, emoji } = reaction
    const member = await message.guild?.members.fetch(user.id)

    if (!member) return

    const roleName = this.regionServersRoles[emoji.name] || emoji.name
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const roleId = roleIdsMap[roleName]

    if (!roleId) return

    const role = message.guild?.roles.cache.get(roleId as string)

    if (!role) return

    const hasRole = member.roles.cache.has(roleId as string)

    const userReactions = await message.reactions
      .resolve(emoji.id || emoji.name)
      ?.users.fetch()

    const userHasReacted = userReactions?.has(user.id)

    if (isAdding && !hasRole && userHasReacted) {
      await member.roles.add(role)
    }

    if (!isAdding && hasRole && !userHasReacted) {
      await member.roles.remove(role)
    }
  }

  async createReactionPanel() {
    const panelChannel = (await this.client.channels.fetch(
      this.panelChannelId,
    )) as TextChannel

    if (!panelChannel) return

    try {
      const messages = await panelChannel.messages.fetch({ limit: 20 })
      const existingMessages = messages.filter(
        msg => msg.author.id === this.client.user?.id,
      )

      for (const [, msg] of existingMessages) {
        await msg.delete()
      }

      const regionEmber = new EmbedBuilder().setColor(0xb30dac).addFields([
        {
          name: '',
          value: 'Choose your **server region**',
        },
      ])

      const regionMessage = await panelChannel.send({ embeds: [regionEmber] })

      for (const emoji of Object.keys(this.regionServersRoles)) {
        await regionMessage.react(emoji)
      }

      const nestEmbed = new EmbedBuilder().setColor(0xb30dac).addFields([
        {
          name: '',
          value: `Select the **nests** you're interested in, and we'll **ping** you when a party for that nest is **created**`,
        },
      ])

      const nestsMessage = await panelChannel.send({ embeds: [nestEmbed] })

      for (const emoji of Object.keys(this.nestRoles)) {
        await nestsMessage.react(emoji)
      }
    } catch (error) {
      console.log('Reaction panel error:', error)
    }
  }
}

export default KarahanManagerService
