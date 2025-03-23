import { Injectable, OnModuleInit } from '@nestjs/common'
import {
  Client,
  GatewayIntentBits,
  Events,
  EmbedBuilder,
  PublicThreadChannel,
  PrivateThreadChannel,
} from 'discord.js'
import { UserEntity } from 'src/entities/user.entity'
import { Repository } from 'typeorm'
import { InjectRepository } from '@nestjs/typeorm'
import { tresherDogQuotes } from 'src/shared/constants/npc-response'

@Injectable()
export class TresherDogService implements OnModuleInit {
  private client: Client

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
      ],
    })
  }

  async onModuleInit() {
    const token = process.env.TRESHER_DOG_DISCORD_TOKEN

    await this.client.login(token)

    this.client.on(Events.MessageCreate, async message => {
      const thread = message.channel

      if (!thread.isThread()) return

      if (message.author.bot) return

      const parentChannelId = (
        thread as PublicThreadChannel<boolean> | PrivateThreadChannel
      ).parentId

      if (parentChannelId !== process.env.CHARS_LIST_CHANNEL_ID) return

      try {
        const user = await this.userRepository.findOne({
          where: { discordId: message.author.id },
        })

        const isOwnThread = user?.charlistThreadId === thread.id

        if (!isOwnThread) {
          const randomQuote =
            tresherDogQuotes[Math.floor(Math.random() * tresherDogQuotes.length)]

          const errorEmbed = new EmbedBuilder().setColor(0xf50909).addFields([
            {
              name: '',
              value: `❌ ${randomQuote}`,
            },
          ])

          const warning = await message.reply({
            embeds: [errorEmbed],
            allowedMentions: { repliedUser: true },
          })

          await message.delete()

          setTimeout(async () => {
            await warning.delete().catch(() => {})
            await thread.setArchived(true)
          }, 10_000)
        }
      } catch (err) {
        console.error(`❌ Error while checking message thread:`, err)
      }
    })
  }
}
