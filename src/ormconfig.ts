import { DataSource } from 'typeorm'
import { join } from 'path'
import * as dotenv from 'dotenv'

dotenv.config()

import { DataSourceOptions } from 'typeorm/data-source/DataSourceOptions'

const {
  POSTGRES_PORT,
  POSTGRES_HOST,
  POSTGRES_DB,
  POSTGRES_USER,
  POSTGRES_PASSWORD,
} = process.env

export const dataSourceOptions: DataSourceOptions = {
  port: parseInt(POSTGRES_PORT),
  host: POSTGRES_HOST,
  database: POSTGRES_DB,
  username: POSTGRES_USER,
  password: POSTGRES_PASSWORD,
  type: 'postgres',
  name: 'default',
  synchronize: false,
  migrationsRun: false,
  migrationsTableName: 'migrations_typeorm',
  entities: [join(__dirname, '**', '*.entity.{ts,js}')],
  migrations: ['migrations/*{.ts,.js}'],
}
export const dbConnectionSource = new DataSource(dataSourceOptions)
