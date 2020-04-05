const debug = require('debug')('abtest')

class ABTest {

    constructor({ id, ip, timeout }) {
        this.id = id
        this.ip = ip

        // 默认7天过期
        this.timeout = timeout || 7 * 24 * 60 * 60
    }

    async map() {
        const key = ABTest.getKey(this.id)
        return ABTest.redis.hget(key.map, this.ip)
    }

    /**
     * 实验分组
     * @return {Number} 分组结果
     */
    async grouping() {
        debug('abtest:', this.ip)

        if (!this.id) {
            debug('abtest id is', this.id)
            return 0
        }

        if (!this.ip || this.ip === '127.0.0.1') {
            debug('abtest ip is', this.ip)
            return 0
        }

        const grouped = await this.map()

        if (grouped) {
            debug('ABTest Group result:', this.ip, 'grouped', grouped)
            return Number(grouped)
        }

        return this.recording()
    }

    async recording() {
        const key = ABTest.getKey(this.id)
        const increment = await ABTest.redis.incr(key.increment)

        // 计算分组
        // 单一increment能准确分组
        const result = increment % 2

        debug('ABTest Group result:', this.ip, 'grouping', result === 1 ? 1 : 2)

        if (result === 1) {
            const group = 1
            ABTest.redis.incr(key.a)
            ABTest.redis.hset(key.map, this.ip, group)
            ABTest.redis.expire(key.a, this.timeout)
            ABTest.redis.expire(key.map, this.timeout)
            ABTest.redis.expire(key.increment, this.timeout)
            return group
        }
        else {
            const group = 2
            ABTest.redis.incr(key.b)
            ABTest.redis.hset(key.map, this.ip, group)
            ABTest.redis.expire(key.b, this.timeout)
            ABTest.redis.expire(key.map, this.timeout)
            ABTest.redis.expire(key.increment, this.timeout)
            return group
        }
    }

    expire(time = 0) {
        ABTest.expire(this.id, time)
    }

    static getKey(id) {
        return {
            a: ['app:abtest', id, 'a'].join(':'),
            b: ['app:abtest', id, 'b'].join(':'),
            map: ['app:abtest', id, 'map'].join(':'),
            increment: ['app:abtest', id, 'increment'].join(':'),
        }
    }

    static expire(id, time = 0) {
        const key = this.getKey(id)
        this.redis.expire(key.a, time)
        this.redis.expire(key.b, time)
        this.redis.expire(key.map, time)
        this.redis.expire(key.increment, time)
    }

    static async grouped(id) {
        const key = this.getKey(id)
        return {
            a: Number(await ABTest.redis.get(key.a)) || 0,
            b: Number(await ABTest.redis.get(key.b)) || 0,
            total: Number(await ABTest.redis.get(key.increment)) || 0,
        }
    }

    static grouping(id, ip) {
        return new ABTest({ id, ip }).grouping()
    }
}

module.exports = (redis) => {
    ABTest.redis = redis
    return ABTest
}
