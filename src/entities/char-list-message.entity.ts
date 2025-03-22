import { Entity, PrimaryGeneratedColumn, Column, OneToOne } from 'typeorm'
import { UserEntity } from './user.entity'

@Entity({ name: 'char_list_messages' })
export class CharListMessageEntity {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ type: 'varchar', unique: true })
  discordId: string

  @OneToOne(() => UserEntity, user => user.charListMessage, { onDelete: 'CASCADE' })
  user: UserEntity
}
