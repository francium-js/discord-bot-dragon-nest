import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm'
import { UserEntity } from './user.entity'
import { CharacterClassEnum } from '../shared/enums/character-class'
import { ElementEnum } from '../shared/enums/element'

@Entity({ name: 'characters' })
export class CharacterEntity {
  @PrimaryGeneratedColumn()
  id: number

  @Column({
    type: 'enum',
    enum: CharacterClassEnum,
    nullable: false,
  })
  class: CharacterClassEnum

  @Column({
    type: 'enum',
    enum: ElementEnum,
    array: true,
    nullable: true,
  })
  element: ElementEnum[]

  @Column({
    type: 'varchar',
    nullable: false,
  })
  name: string

  @ManyToOne(() => UserEntity, user => user.characters, { onDelete: 'CASCADE' })
  user: UserEntity
}
