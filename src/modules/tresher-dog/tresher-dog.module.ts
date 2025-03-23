import { Module } from '@nestjs/common'
import { TresherDogService } from './tresher-dog.service'
import { TypeOrmModule } from '@nestjs/typeorm'
import { UserEntity } from 'src/entities/user.entity'

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity])],
  providers: [TresherDogService],
})
export class TresherDogModule {}
