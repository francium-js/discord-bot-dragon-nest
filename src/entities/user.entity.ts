import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
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

  @OneToMany(() => PartyEntity, party => party.leader)
  partys: PartyEntity[]

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
