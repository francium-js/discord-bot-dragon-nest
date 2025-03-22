// src/data-source.ts або data-source.ts
import { DataSource } from 'typeorm'
import { join } from 'path'
import * as dotenv from 'dotenv'

dotenv.config()

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.POSTGRES_HOST,
  port: parseInt(process.env.POSTGRES_PORT, 10),
  username: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
  synchronize: false,
  migrationsRun: false,
  migrationsTableName: 'migrations_typeorm',
  entities: [join(__dirname, '**', '*.entity.{ts,js}')],
  migrations: ['migrations/*{.ts,.js}'],
})
