import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
} from 'typeorm'
import { UserEntity } from './user.entity'
import { ElementEnum } from '../shared/enums/element'
import { ServerRegionEnum } from '../shared/enums/server-region'
import { CharacterEntity } from './character.entity'

@Entity({ name: 'partys' })
export class PartyEntity {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ type: 'varchar', unique: true, nullable: false })
  discordMessageId: string

  @Column({ type: 'varchar', unique: true, nullable: false })
  partyCategoryId: string

  @ManyToOne(() => UserEntity, user => user.partys, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  leader: UserEntity

  @OneToMany(() => CharacterEntity, user => user.joinedParty, { nullable: true })
  members: CharacterEntity[]

  @Column({
    type: 'enum',
    enum: ElementEnum,
    array: true,
    nullable: true,
  })
  element: ElementEnum[]

  @Column({
    type: 'boolean',
    default: true,
  })
  classPriorityLoot: boolean

  @Column({
    type: 'timestamp',
    nullable: false,
  })
  timeStart: Date

  @Column({
    type: 'timestamp',
    nullable: false,
  })
  timeEnd: Date

  @Column({
    type: 'enum',
    enum: ServerRegionEnum,
    nullable: true,
  })
  serverRegion: ServerRegionEnum

  @Column({ type: 'varchar', nullable: true })
  description: string
}
