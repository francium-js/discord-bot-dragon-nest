import { Injectable, Inject, Logger } from '@nestjs/common'
import Redis from 'ioredis'

import type { SetCacheProps } from './types'

@Injectable()
export class RedisService {
  private readonly logger = new Logger(RedisService.name)

  constructor(@Inject('REDIS') private readonly redis: Redis) {}

  async setCache<T>({ key, value, ttl }: SetCacheProps<T>): Promise<void> {
    const serializedValue = JSON.stringify(value)

    await this.redis.set(key, serializedValue, 'EX', ttl)
  }

  async getCache<T>(key: string): Promise<T | null> {
    const value = await this.redis.get(key)

    if (!value) return null

    try {
      return JSON.parse(value) as T
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)

      this.logger.error(`Failed to parse cache for key "${key}": ${errorMessage}`)

      return null
    }
  }

  async deleteCache(key: string): Promise<void> {
    await this.redis.del(key)
  }

  //   async getKeysByPatternRecursive(
  //     pattern: string,
  //     cursor = '0',
  //     keys: string[] = [],
  //   ): Promise<string[]> {
  //     const [nextCursor, foundKeys] = await this.redis.scan(
  //       cursor,
  //       'MATCH',
  //       pattern,
  //       'COUNT',
  //       100,
  //     )
  //     keys.push(...foundKeys)

  //     if (nextCursor === '0') return keys

  //     return this.getKeysByPatternRecursive(pattern, nextCursor, keys)
  //   }

  //   async deleteKeysByPattern(pattern: string): Promise<void> {
  //     const keys = await this.getKeysByPatternRecursive(`${pattern}:*`)

  //     if (keys.length > 0) await this.redis.del(...keys)
  //   }
}
