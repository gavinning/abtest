const redis = require('../mock/redis')
const Abtest = require('../../dist/index').default.register(redis)
const assert = require('assert')

describe('class Abtest test', () => {

    it('test grouping', async () => {
        const abtestId = 'test'
        
        const ips1 = new Array(1000).fill('192.168.0.').map((ip, index) => ip + index)

        ips1.map(async (ip, index) => {
            const group = await Abtest.grouping(abtestId, ip, 30 * 24 * 60 * 60)
            assert.equal(group, index % 2 + 1)

            if (1000 === index + 1) {
                const grouped = await Abtest.grouped(abtestId)
                assert.equal(500, grouped.a)
                assert.equal(500, grouped.b)
                assert.equal(1000, grouped.total)
                // Abtest.expire(abtestId)
            }
        })
    })
})
