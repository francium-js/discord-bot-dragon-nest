import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  GuildMember,
  MessageFlags,
} from 'discord.js'
import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { UserEntity } from 'src/entities/user.entity'

@Injectable()
export class ArgentaCommandsService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  public data = new SlashCommandBuilder()
    .setName('adduser')
    .setDescription('Add a new user to the database')
    .addUserOption(option =>
      option.setName('user').setDescription('User to add').setRequired(true),
    )
    .setDMPermission(false)
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)

  public async execute(interaction: ChatInputCommandInteraction) {
    const executor = interaction.member as GuildMember

    if (executor.id !== interaction.guild?.ownerId) {
      await interaction.reply({
        content: '⛔ Only the **server owner** can use this command.',
        flags: MessageFlags.Ephemeral,
      })

      return
    }

    const targetUser = interaction.options.getUser('user', true)

    const exists = await this.userRepository.findOne({
      where: { discordId: targetUser.id },
    })

    if (exists) {
      await interaction.reply({
        content: `⚠️ User <@${targetUser.id}> is already in the database.`,
        flags: MessageFlags.Ephemeral,
      })

      return
    }

    const newUser = this.userRepository.create({
      discordId: targetUser.id,
    })

    await this.userRepository.save(newUser)

    await interaction.reply({
      content: `✅ User <@${targetUser.id}> was added to the database.`,
      flags: MessageFlags.Ephemeral,
    })
  }
}
