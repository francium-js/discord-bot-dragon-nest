import { ButtonInteraction, ModalSubmitInteraction } from 'discord.js'

export type GetCharacterCacheDataT = {
  userDiscordId: string
  interaction?: ButtonInteraction | ModalSubmitInteraction
}
