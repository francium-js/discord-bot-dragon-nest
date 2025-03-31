import { CharacterEntity } from 'src/entities/character.entity'

export type MutateCharListT = {
  charList: CharacterEntity[]
  userDiscordId: string
}
