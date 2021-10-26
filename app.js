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
app
    .use(jwtKoa({ secret }).unless({
        path: [/^\/login/] //数组中的路径不需要通过jwt验证
    }))
router
    .get('/getsalt',async (ctx, next) => {
        const user = ctx.request.body;
        if(user && user.name) {
            file = fs.open('./user.json');
            fs.close();
            ctx.body = {

            }
        }
    })
    
    .post('/register', async (ctx, next) => {
        const user = ctx.request.body;
        if (user && user.name && user.password) {
            ctx.body = {
                
            };
        }
    })
    .post('/login', async (ctx, next) => {
        const user = ctx.request.body;
        if (user && user.name && user.password) {

            let userToken = {
                name: user.name,
                password: user.password
            }
            const token = jwt.sign(userToken, secret, { expiresIn: '1h' })  //token签名 有效期为1小时
            ctx.body = {
                message: '获取token成功',
                code: 1,
                token
            }
        } else {
            ctx.body = {
                message: '参数错误',
                code: -1
            }
        }
    })
    .get('/userInfo', async (ctx) => {
        const token = ctx.header.authorization  // 获取jwt
        let payload
        if (token) {
            payload = await verify(token.split(' ')[1], secret)  // 解密，获取payload
            let name = payload.name
            let password = payload.password
            ctx.body = {
                name, password
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
app.listen(3000, () => {
    console.log('app listening 3000...')
})