import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToOne,
} from 'typeorm'
import { CharacterEntity } from './character.enity'
import { PartyEntity } from './partys.entity'

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
}
