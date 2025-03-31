import { ButtonInteraction, Client, ModalSubmitInteraction } from 'discord.js'
import { UserCreatePartyPanelT } from 'src/shared/types/user-create-party-panel'

export type CreatePartyChannelT = {
  client: Client
  partyFormData: UserCreatePartyPanelT
  partyNumber: number
}

export type HandleCreatePartyT = {
  interaction: ButtonInteraction
  client: Client
}

export type GetPartyFormCacheDataT = {
  interaction?: ButtonInteraction | ModalSubmitInteraction
  userDiscordId: string
}
