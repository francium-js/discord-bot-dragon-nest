import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToOne,
  OneToOne,
} from 'typeorm'
import { CharacterEntity } from './character.entity'
import { PartyEntity } from './partys.entity'
import { CharListMessageEntity } from './char-list-message.entity'

@Entity({ name: 'users' })
export class UserEntity {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ type: 'varchar', unique: true })
  discordId: string

  @OneToMany(() => CharacterEntity, character => character.user, { cascade: true })
  characters: CharacterEntity[]

  @OneToMany(() => PartyEntity, party => party.createdBy)
  createdPartys: PartyEntity[]

  @ManyToOne(() => PartyEntity, party => party.members, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  joinedParty: PartyEntity

  @OneToOne(
    () => CharListMessageEntity,
    charListMessageEntity => charListMessageEntity.user,
  )
  charListMessage: CharListMessageEntity
}
