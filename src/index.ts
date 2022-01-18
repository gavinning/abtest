import { Redis } from 'ioredis'
import debugFactory from 'debug'

const debug = debugFactory('abtest')

export type Options = {
    id: string
    testId: string
    timeout?: number
}

export class ABTest {
    id: string
    testId: string
    timeout: number
    static redis: Redis

    constructor({ testId, id, timeout }: Options) {
        this.id = id
        this.testId = testId

        // 默认7天过期
        this.timeout = timeout || 7 * 24 * 60 * 60
    }

    private async map() {
        const key = ABTest.getKey(this.testId)
        return ABTest.redis.hget(key.map, this.id)
    }

    /// 实验分组
    private async grouping(): Promise<number> {
        debug('abtest:', this.id)

        if (!this.testId) {
            debug('abtest id is', this.testId)
            return 0
        }

        if (!this.id || this.id === '127.0.0.1') {
            debug('abtest ip is', this.id)
            return 0
        }

        const grouped = await this.map()

        if (grouped) {
            debug('ABTest Group result:', this.id, 'grouped', grouped)
            return Number(grouped)
        }

        return this.recording()
    }

    private async recording(): Promise<number> {
        const key = ABTest.getKey(this.testId)
        const increment = await ABTest.redis.incr(key.increment)

        // 计算分组
        // 单一increment能准确分组
        const result = increment % 2

        debug('ABTest Group result:', this.id, 'grouping', result === 1 ? 1 : 2)

        if (result === 1) {
            const group = 1
            ABTest.redis.incr(key.a)
            ABTest.redis.hset(key.map, this.id, group)
            ABTest.redis.expire(key.a, this.timeout)
            ABTest.redis.expire(key.map, this.timeout)
            ABTest.redis.expire(key.increment, this.timeout)
            return group
        } else {
            const group = 2
            ABTest.redis.incr(key.b)
            ABTest.redis.hset(key.map, this.id, group)
            ABTest.redis.expire(key.b, this.timeout)
            ABTest.redis.expire(key.map, this.timeout)
            ABTest.redis.expire(key.increment, this.timeout)
            return group
        }
    }

    private expire(time = 0) {
        ABTest.expire(this.testId, time)
    }

    private static getKey(testId: string) {
        return {
            a: ['app:abtest', testId, 'a'].join(':'),
            b: ['app:abtest', testId, 'b'].join(':'),
            map: ['app:abtest', testId, 'map'].join(':'),
            increment: ['app:abtest', testId, 'increment'].join(':'),
        }
    }

    private static expire(testId: string, time = 0) {
        const key = this.getKey(testId)
        this.redis.expire(key.a, time)
        this.redis.expire(key.b, time)
        this.redis.expire(key.map, time)
        this.redis.expire(key.increment, time)
    }

    static register(redis: Redis) {
        this.redis = redis
        return this
    }

    static async grouped(testId: string) {
        const key = this.getKey(testId)
        return {
            a: Number(await ABTest.redis.get(key.a)) || 0,
            b: Number(await ABTest.redis.get(key.b)) || 0,
            total: Number(await ABTest.redis.get(key.increment)) || 0,
        }
    }

    static grouping(testId: string, id: string, timeout?: number) {
        return new ABTest({ testId, id, timeout }).grouping()
    }
}

export default ABTest
