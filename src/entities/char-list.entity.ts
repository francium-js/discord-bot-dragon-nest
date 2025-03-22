import { Entity, PrimaryGeneratedColumn, Column, OneToOne, OneToMany } from 'typeorm'
import { UserEntity } from './user.entity'
import { CharacterEntity } from './character.entity'

@Entity({ name: 'char_list' })
export class CharListEntity {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ type: 'varchar', unique: true, nullable: false })
  discordMessageId: string

  @OneToOne(() => UserEntity, user => user.charList, { onDelete: 'CASCADE' })
  user: UserEntity

  @OneToMany(() => CharacterEntity, character => character.charList, {
    cascade: true,
  })
  characters: CharacterEntity[]
}
