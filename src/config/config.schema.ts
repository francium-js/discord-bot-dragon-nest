import * as Joi from 'joi'
import { ENV_ENUM } from '../shared/enums/env'

const PARAMS = {
  // general
  PORT: Joi.number().default(8080),
  NODE_ENV: Joi.string()
    .valid(...Object.values(ENV_ENUM))
    .default(ENV_ENUM.DEV)
    .required(),

  // database
  POSTGRES_HOST: Joi.string().default('localhost').required(),
  POSTGRES_PORT: Joi.number().required(),
  POSTGRES_DB: Joi.string().required(),
  POSTGRES_USER: Joi.string(),
  POSTGRES_PASSWORD: Joi.string(),

  // redis
  REDIS_HOST: Joi.string().required(),
  REDIS_PORT: Joi.number().default(6380),
}

export const configSchema = Joi.object<typeof PARAMS>(PARAMS)
