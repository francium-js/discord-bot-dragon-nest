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

@Entity({ name: 'partys' })
export class PartyEntity {
  @PrimaryGeneratedColumn()
  id: number

  @ManyToOne(() => UserEntity, user => user.createdPartys, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  createdBy: UserEntity

  @OneToMany(() => UserEntity, user => user.joinedParty, { nullable: true })
  members: UserEntity[]

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
}
