import { ButtonInteraction, ModalSubmitInteraction } from 'discord.js'

export type GetCharacterCacheDataT = {
  interaction?: ButtonInteraction | ModalSubmitInteraction
  userDiscordId: string
}
