import { registerAs } from '@nestjs/config'
import { join } from 'path'

export default registerAs('database', () => ({
  type: 'postgres',
  name: 'default',
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT, 10) || 3306,
  username: process.env.POSTGRES_USER || 'root',
  password: process.env.POSTGRES_PASSWORD || 'root',
  database: process.env.POSTGRES_DATABASE || 'root',
  entities: [join(__dirname, '**', '*.entity.{ts,js}')],
  synchronize: false,
  migrationsRun: false,
  migrations: ['migrations/*{.ts,.js}'],
  migrationsTableName: 'migrations_typeorm',
}))
