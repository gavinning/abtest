Abtest
---
流量均衡AB实验分组策略

### Install
```sh
npm i @4a/abtest
```

### Usage

根据``abtestId``和``id``地址执行流量均衡分组
```ts
// abtest依赖redis
// redis实例需支持promise，推荐配合ioredis使用
import ABTest from '@4a/abtest'

// or
const ABTest = require('@4a/abtest').default.register(redis)

// async函数内调用
return await ABTest.grouping(testId, id) // Number

// 设置redis过期时间，默认7d
// 实验停止后，redis关联key 7天后过期
// 实验期间每次命中实验都会刷新有效期
return await ABTest.grouping(testId, id, 7 * 60 * 60)
```

### Notes
```yaml
# 
# 1、流量均衡分组
# 2、默认分组结果 a:1, b:2, c:0
# 3、根据id来进行固定分组
# 4、可同时进行多个实验，按照abtestId区分
# 
# 5、前端实验分组单步时长，过期时间前端可自行设置
# 
# c:0 C组表示意外分组流量，其他分组失败的流量也会归到C组
#
```

Example
>  
> npm test  
>  
> DEBUG=abtest npm test
>  