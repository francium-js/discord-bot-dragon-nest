import { Injectable, OnModuleInit } from '@nestjs/common'
import {
  Client,
  GatewayIntentBits,
  TextChannel,
  EmbedBuilder,
  Events,
  GuildMember,
  SlashCommandBuilder,
  PermissionFlagsBits,
  REST,
  Collection,
  Routes,
} from 'discord.js'
import { UserEntity } from 'src/entities/user.entity'
import { Repository } from 'typeorm'
import { InjectRepository } from '@nestjs/typeorm'
import { ArgentaCommandsService } from './services'

@Injectable()
export class ArgentaManagerService implements OnModuleInit {
  private client: Client
  private panelChannelId: string
  private commands: ArgentaCommandsService[] = []
  private commandMap = new Collection<string, ArgentaCommandsService>()

  public data = new SlashCommandBuilder()
    .setName('adduser')
    .setDescription('Add a new user to the database')
    .addUserOption(option =>
      option.setName('user').setDescription('User to add').setRequired(true),
    )
    .setDMPermission(false)
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private argentaCommandsService: ArgentaCommandsService,
  ) {
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
      ],
    })

    this.panelChannelId = process.env.GUID_MANAGER_CHANNEL_ID
  }

  async onModuleInit() {
    this.client.on(Events.GuildMemberAdd, async (member: GuildMember) => {
      const newUser = this.userRepository.create({
        discordId: member.user.id,
      })

      await this.userRepository.save(newUser)
    })

    const token = process.env.ARGENTA_DISCORD_TOKEN

    await this.client.login(token)

    const channelId = process.env.GUID_MANAGER_CHANNEL_ID
    const channel = (await this.client.channels.fetch(channelId)) as TextChannel

    if (!channel) return

    const messages = await channel.messages.fetch({ limit: 1 })

    if (messages.size === 0) {
      await this.createGuidMessage()
    }

    this.commands = [this.argentaCommandsService]

    const rest = new REST({ version: '10' }).setToken(
      process.env.ARGENTA_DISCORD_TOKEN,
    )
    const body = this.commands.map(cmd => cmd.data.toJSON())

    await rest.put(Routes.applicationCommands(process.env.ARGENTA_CLIENT_ID), {
      body,
    })

    for (const cmd of this.commands) {
      this.commandMap.set(cmd.data.name, cmd)
    }

    this.client.on(Events.InteractionCreate, async interaction => {
      if (!interaction.isChatInputCommand()) return

      const command = this.commandMap.get(interaction.commandName)

      if (!command) return

      await command.execute(interaction)
    })
  }

  async createGuidMessage() {
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

      const argentaGuid = new EmbedBuilder().setColor(0x9e0808).addFields([
        {
          name: '',
          value:
            'Hi human, this server was created to improve raid group search, improve your communication and raid planning.',
        },
      ])

      const karahanGuid = new EmbedBuilder().setColor(0xb30dac).addFields([
        {
          name: 'Roles',
          value: `Choose your **server region** and the **nests** you are interested in.
          https://discord.com/channels/1351560947105267792/1352991618960986176`,
        },
      ])

      const aishaGuid = new EmbedBuilder().setColor(0xdbc907).addFields([
        {
          name: 'Manage your characters',
          value: `Here you can manage your **characters**.
          View, add, edit, delete.
          https://discord.com/channels/1351560947105267792/1352722554623627284
          
          And the list itself will be viewable by all players in this channel.
          If you want, you can add screenshots of your gear to your own message-branch, bottom the your chat-list.
          https://discord.com/channels/1351560947105267792/1352722738430873701
          `,
        },
      ])

      const rubinartGuid = new EmbedBuilder().setColor(0xd60404).addFields([
        {
          name: 'Create party',
          value: `And of course creating groups.
          https://discord.com/channels/1351560947105267792/1352007725495877723

When you create a group, a private category will be created for you, with:
- voice and text chat.
- chat for viewing other players' requests
- as well as manage-party where you can delete/edit your team and change party leader.

When creating, select your **free time** range.

When other players create a **request**, they will indicate their free time and the characters they can play as, a link to their char-list will automatically be added where you can see their gear.

And choose the players that suit you best.
https://discord.com/channels/1351560947105267792/1352008196994367608`,
        },
      ])

      await panelChannel.send({
        embeds: [argentaGuid, karahanGuid, aishaGuid, rubinartGuid],
      })
    } catch (error) {
      console.log('Guid info error:', error)
    }
  }
}
