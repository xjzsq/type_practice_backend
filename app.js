const Koa = require('koa')
const fs = require('fs')
const Router = require('koa-router')
const bodyParser = require('koa-bodyparser')
const jwt = require('jsonwebtoken')
const jwtKoa = require('koa-jwt')
const util = require('util')
const verify = util.promisify(jwt.verify) // 解密
const secret = 'chtholly'
const app = new Koa()
const router = new Router()
app.use(bodyParser())
const errbody = {                                                                           // 参数错误统一返回 errbody
    message: '参数错误',
    code: -1
}
app
    .use(jwtKoa({ secret }).unless({
        path: [/^\/createsalt/,/^\/createsalt/, /^\/register/, /^\/getsalt/, /^\/login/]                    //数组中的路径不需要通过jwt验证
    }))
router
    .get('/createsalt/check', async (ctx, next) => {
        const user = ctx.request.query;
        if (user && user.name) {
            let hasRegistration = false;
            let userinfo = JSON.parse(fs.readFileSync('./user.json', 'utf-8'));             // 读取用户信息
            for (let i in userinfo) {
                if (userinfo[i] && userinfo[i].name && userinfo[i].name === user.name) {    // 是否已经注册
                    hasRegistration = true;
                    break;
                }
            }
            if (hasRegistration) {                                                          // 已经注册则返回已存在
                ctx.body = {
                    message: '用户名已存在',
                    code: -1
                }
            }
            else{
                ctx.body = {
                    message: '用户名可以注册',
                    code: 1
                }
            }
        }
        else {
            ctx.body = errbody;
        }
    })
    .get('/createsalt', async (ctx, next) => {                                              // 新用户注册创建salt
        const user = ctx.request.query;
        if (user && user.name) {
            let hasRegistration = false;
            let userinfo = JSON.parse(fs.readFileSync('./user.json', 'utf-8'));             // 读取用户信息
            for (let i in userinfo) {
                if (userinfo[i] && userinfo[i].name && userinfo[i].name === user.name) {    // 是否已经注册
                    hasRegistration = true;
                    break;
                }
            }
            if (hasRegistration) {                                                          // 已经注册则返回已存在
                ctx.body = {
                    message: '用户名已存在',
                    code: -1
                }
            } else {
                let salt = Math.random().toString(36).slice(-8);                            // 随机生成salt
                let systeminfo = JSON.parse(fs.readFileSync('./system.json', 'utf-8'));     // 读取系统配置
                userinfo.push({
                    "id": ++systeminfo.userNum,                                             // 增加系统总人数
                    "name": user.name,
                    "salt": salt
                })
                fs.writeFileSync('./system.json', JSON.stringify(systeminfo));              // 写入系统信息
                fs.writeFileSync('./user.json', JSON.stringify(userinfo));                  // 写入用户信息
                ctx.body = {
                    message: 'salt 生成成功！',
                    code: 1,
                    salt
                }
            }
        }
        else {
            ctx.body = errbody;
        }
    })
    .post('/register', async (ctx, next) => {
        const user = ctx.request.body;
        if (user && user.name && user.password) {
            let userinfo = JSON.parse(fs.readFileSync('./user.json', 'utf-8'));
            for (let i in userinfo) {
                if (userinfo[i].name === user.name) {
                    if (userinfo[i].hasOwnProperty("password")) {
                        ctx.body = {
                            message: '注册失败！',
                            code: -1
                        }
                    } else {
                        userinfo[i].password = user.password;
                        fs.writeFileSync('./user.json', JSON.stringify(userinfo));
                        ctx.body = {
                            message: '注册成功！',
                            code: 1
                        }
                    }
                    break;
                }
            }
        } else {
            ctx.body = errbody;
        }
    })
    .get('/getsalt', async (ctx, next) => {
        const user = ctx.request.query;
        let salt = null;
        if (user && user.name) {
            let userinfo = JSON.parse(fs.readFileSync('./user.json', 'utf-8'));
            for (let i in userinfo) {
                if (userinfo[i].name === user.name) {
                    salt = userinfo[i].salt;
                    break;
                }
            }
            if (salt === null) {
                ctx.body = {
                    message: '用户名或密码错误！',
                    code: -1
                }
            }
            else {
                ctx.body = {
                    message: '获取salt成功',
                    code: 1,
                    salt
                }
            }
        } else {
            ctx.body = errbody
        }
    })
    .post('/login', async (ctx, next) => {
        const user = ctx.request.body;
        console.log(user, ctx.request);
        if (user && user.name && user.password) {
            let userinfo = JSON.parse(fs.readFileSync('./user.json', 'utf-8'));
            let success = false;
            for (let i in userinfo) {
                if (userinfo[i].name === user.name && userinfo[i].password === user.password) {
                    let userToken = {
                        name: user.name
                    }
                    const token = jwt.sign(userToken, secret, { expiresIn: '1h' })  //token签名 有效期为1小时
                    success = true;
                    ctx.body = {
                        message: '登陆成功！',
                        code: 1,
                        token
                    }
                    break;
                }
            }
            if (!success) {
                ctx.body = {
                    message: '用户名或密码错误',
                    code: -1
                }
            }
        } else {
            ctx.body = errbody;
        }
    })
    .get('/userInfo', async (ctx) => {
        const token = ctx.header.authorization  // 获取jwt
        let payload
        if (token) {
            payload = await verify(token.split(' ')[1], secret)  // 解密，获取payload
            let name = payload.name
            let userinfo = JSON.parse(fs.readFileSync('./user.json', 'utf-8'));
            let info;
            for (let i in userinfo) {
                if (userinfo[i].name === name) {
                    info = userinfo[i];
                    break;
                }
            }
            ctx.body = {
                message: '成功！',
                info
            }
        } else {
            ctx.body = {
                message: 'token 错误',
                code: -1
            }
        }
    })
app
    .use(router.routes())
    .use(router.allowedMethods())
app.listen(6088, () => {
    console.log('app listening 6088...')
})