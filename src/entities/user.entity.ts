import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToOne,
  OneToOne,
  JoinColumn,
} from 'typeorm'
import { CharacterEntity } from './character.entity'
import { PartyEntity } from './partys.entity'
import { CharListEntity } from './char-list.entity'
import { UTC } from 'src/shared/enums/utc'

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
    () => CharListEntity,
    charListMessageEntity => charListMessageEntity.user,
  )
  @JoinColumn()
  charList: CharListEntity

  @Column({ type: 'varchar', unique: true, nullable: true })
  charlistThreadId: string

  @Column({ type: 'enum', enum: UTC, nullable: true })
  timeZoneUTC: UTC
}
