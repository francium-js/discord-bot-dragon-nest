import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm'
import { UserEntity } from './user.entity'
import { CharacterClassEnum } from '../shared/enums/character-class'
import { ElementEnum } from '../shared/enums/element'
import { CharListEntity } from './char-list.entity'
import { GeneralCharacterClassEnum } from 'src/shared/enums/general-character-class'
import { PartyEntity } from './partys.entity'

@Entity({ name: 'characters' })
export class CharacterEntity {
  @PrimaryGeneratedColumn()
  id: number

  @Column({
    type: 'enum',
    enum: GeneralCharacterClassEnum,
    nullable: false,
  })
  generalClass: GeneralCharacterClassEnum

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
  elements: ElementEnum[]

  @Column({
    type: 'varchar',
    nullable: false,
  })
  name: string

  @ManyToOne(() => UserEntity, user => user.characters, { onDelete: 'CASCADE' })
  user: UserEntity

  @ManyToOne(() => CharListEntity, charList => charList.characters, {
    onDelete: 'CASCADE',
  })
  charList: CharListEntity

  @ManyToOne(() => PartyEntity, party => party.members, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  joinedParty: PartyEntity
}
