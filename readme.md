Abtest
---
流量均衡AB实验分组策略

### Usage

根据``abtestId``和``ip``地址执行流量均衡分组
```js
// abtest依赖redis
// redis实例需支持promise，推荐配合ioredis使用
const ABTest = require('@4a/abtest')(redis)

// async函数内调用
return await ABTest.grouping(id, ip) // Number

// 设置redis过期时间，默认7d
// 实验停止后，redis关联key 7天后过期
return await ABTest.grouping(id, ip, 7 * 60 * 60)
```

### Notes
```yaml
# 
# 1、流量均衡分组
# 2、默认分组结果 a:1, b:2, c:0
# 3、根据ip来进行固定分组，同一IP在同一实验id下会固化分组
# 4、可同时进行多个实验，按照abtestId区分
# 
# 5、前端实验分组单步时长，过期时间前端可自行设置
# 
# c:0 C组表示意外分组流量，比如127.0.0.1会被分到C组，其他分组失败的流量也会归到C组
#
```

Example
>  
> npm test  
>  
> DEBUG=abtest npm test
>  