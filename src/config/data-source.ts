// src/data-source.ts або data-source.ts
import { DataSource } from 'typeorm'
import { join } from 'path'
import * as dotenv from 'dotenv'

dotenv.config()

const {
  POSTGRES_PORT,
  POSTGRES_HOST,
  POSTGRES_DB,
  POSTGRES_USER,
  POSTGRES_PASSWORD,
} = process.env

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: POSTGRES_HOST,
  port: parseInt(POSTGRES_PORT, 10),
  username: POSTGRES_USER,
  password: POSTGRES_PASSWORD,
  database: POSTGRES_DB,
  synchronize: false,
  migrationsRun: false,
  migrationsTableName: 'migrations_typeorm',
  entities: [join(__dirname, '**', '*.entity.{ts,js}')],
  migrations: ['migrations/*{.ts,.js}'],
})
