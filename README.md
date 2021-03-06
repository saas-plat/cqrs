# cqrs-fx

## 概述

定义为一个 Configurable 可配置、Extensible 可扩展、EventSourced 事件溯源、Object-oriented 面向对象 的CQRS框架。

Introduction to CQRS
https://www.codeproject.com/Articles/555855/Introduction-to-CQRS

## 安装：

```
npm install cqrs-fx --save
```

## 使用：

```js
import {App} from 'cqrs-fx';
import path from 'path';

const cqrs = new App({
  appPath: path.join(__dirname, 'demo'),
  mongo:{
    url: 'mongodb://localhost:27017/cqrs'
  }
});

cqrs.run();

cqrs.publishCommand('createAccount',
  {
    key1: 1,
    key2: {
      a:'hello',
      b: 28
    }
  });
```

**App不要创建多个实例，整个系统都是单例的**

## 配置性 && 扩展性：

可以通过构造App实例时配置系统

```js
new App({
  appPath: path.join(__dirname, 'demo'),
  bus: {
    dispatcher : 'message_dipatcher',
    commandBus : 'direct',
    eventBus : 'mq',
    eventMQ : {
      name: 'eventqueue',
      port: 6379,
      host: '127.0.0.1'
    }
  },
  event: {
    storage: 'mongo_domain_event'
    collection: 'events',
    mongo:{
      ...
    },
    mysql:{
      ...
    },
    redis:{
      ...
    }
  },
  repository: {
    type: 'event_sourced'
  },
  snapshot: {
    provider: 'event_number',
    storage: 'mongo',  // redis mysql mongo ...
    collection: 'snapshots',
    // immediate: Indicates that immediate snapshot create/update should be performed.
    // postpone: Indicates that the creating/updating of the snapshots  would be postponed to a later scenario.
    option: 'immediate',
    // 快照的保存周期，默认每100个事件保存一次快照
    numberOfEvents: 100,
    mongo:{
      ...
    },
    mysql:{
      ...
    },
    redis:{
      ...
    }
  },
  mongo:{
    url: 'mongodb://localhost:27017/cqrs'
  },
  mysql: {
    host: 'localhost',
    user: 'root',
    password: '123456',
    database: 'cqrsdb'
  },
  redis:{
    host: "127.0.0.1",
    port: 6379,
    password: "",
    timeout: 0
  }
});
```

可以配置为一个对象或加载函数

```js
new App({
  bus: {
    commandBus: MyCommandBus,
    eventBus: ()=> new MyEventBus({...})
  },
  event: {
    storage: eventBus: ()=> new MyEventStorage({...})
  },
  repository: {
    type: eventBus: ()=> new MyRepository({...})
  },
  snapshot: {
    provider: eventBus: ()=> new MySnapshotProvider({...})
  }
});
```

## 开发：

模块采用面向对象的开发，可以执行较复杂的项目，所以划分了模块，每个模块建议是一个完整的业务领域  

+ module1
  + command
    + AccountCommandHandler.js
  + domain
    + Account.js
    + AdminAccount.js
    + UserAccount.js
  + event
    + AccountEventHandler.js
+ module2
...


### 领域对象

放在每个模块的domain文件夹里

```js
import {Aggregate} from 'cqrs-fx';

export default class Account extends Aggregate {
  userName;
  password;
  displayName;
  email;

}

export default class UserAccount extends Account {
  contactPhone;
  contactAddress;

  static create(
    userName,
    password,
    ...others) {
    if (!userName) {
      throw Error('用户名不能为空');
    }
    if (!password || password.length < 5) {
      throw Error('密码不能少于5位');
    }
    let userAccount = new UserAccount();
    userAccount.raiseEvent('created', {
      userName,
      password,
      ...others
    });
    return userAccount;
  }

  when({
    name,
    data
  }) {
    console.log(name, data);
  }

  created({
    contactPhone,
    userName,
    password,
    displayName,
    email,
    ...contactAddress
  }) {
    this.userName = userName;
    this.password = password;
    this.displayName = displayName;
    this.email = email;
    this.contactPhone = contactPhone;
    this.contactAddress = contactAddress;
  }
}

```

### 命令

由name和data组成

```js
{
  name: 'createAccount',
  data:{
    name: 'xxxx',
    email: 'xxxx'
  }
}
```

### 事件

和命令对象雷同

```js
{
  name: 'accountCreated',
  data:{
    name: 'xxxx',
    email: 'xxxx'
  }
}
```

### 命令执行Handler

放在command文件夹里

```js
import {CommandHandler} from 'cqrs-fx';

export default class AccountCommandHandler extends CommandHandler {
  async createAccount(message) {
    this.repository.use(async() => {
      const userAccount = this.getAggregate('UserAccount').create(message);
      await this.repository.save(userAccount);
      await this.repository.commit();
    });
  }

  deleteAccount(message) {
    this.repository.use(() => {
        const userAccount = this.repository.get('UserAccount');
        userAccount.delete();
        this.repository.save(userAccount);
        this.repository.commit();
      }
    }
  }
```

### 业务事件的Handler

放在event文件夹里

```js
import {EventHandler} from 'cqrs-fx';

export default class AccountEventHandler extends EventHandler {
  db = mysql;

  accountCreated({userName, email}) {
    db.query('insert AccountTable (id, email) values (?userName,?email)', {userName,email});
  }

  accountDeleted({userName}){
    db.query('delete from AccountTable where id = ?userName', {userName})
  }
}
```

处理其他模块的事件可以用command或event装饰器实现

```js
import {command,event} from 'cqrs-fx';

export default class AccountCommandHandler2 extends CommandHandler {
  @command('module1/createAccount')
  createAccount2(message) {
    console.log('AccountCommandHandler2 createAccount2 ok');
  }

  @command('module1', 'createAccount')
  createAccount3(message) {
    console.log('AccountCommandHandler2 createAccount3 ok');
  }
}
```



## 快照

默认保存所有非跟对象属性，但是可以重写

```js
export default class AdminAccount extends Account {
  ...

  doCreateSnapshot() {
    return {userName: this.userName, password: this.password, displayName: this.displayName, email: this.email};
  }

  doBuildFromSnapshot({userName, password, displayName, email}) {
    this.userName = userName;
    this.password = password;
    this.displayName = displayName;
    this.email = email;
    this.isAdmin = true;
  }
}
```

## 异常处理

command执行不管成功或失败都不会返回任何结果，我们通常挂接MessageDispatcher的事件处理，客户端监听到某个command结果后继续执行。

```js

  bus.getCommandDispatcher().addListener(null, ({module, name})=>{
     // send success
   }, {{module, name, error})=>{
     // send fail
   });

```

## 查询

查询结果需要在EventHandler中保存到数据库中，查询直接查找即可

**如果你需要一个完整可以运行的系统，可以看看<https://github.com/saas-plat/saas-plat-server>项目**
