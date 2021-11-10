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
        path: [/^\/createsalt/, /^\/createsalt/, /^\/register/, /^\/getsalt/, /^\/login/]                    //数组中的路径不需要通过jwt验证
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
            else {
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
                        userinfo[i].practiceRecord = [];
                        userinfo[i].game = 0;
                        userinfo[i].score = 0;
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
                        token,
                        isAdmin: ('isAdmin' in userinfo[i])
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
        console.log(ctx.header);
        const token = ctx.header.authorization  // 获取jwt
        console.log(token, ctx.header);
        let payload
        if (token) {
            payload = await verify(token.split(' ')[1], secret)  // 解密，获取payload
            let name = payload.name
            let userinfo = JSON.parse(fs.readFileSync('./user.json', 'utf-8'));
            let info;
            for (let i in userinfo) {
                if (userinfo[i].name === name) {
                    info = {
                        name: userinfo[i].name,
                        isAdmin: ('isAdmin' in userinfo[i]),
                        game: userinfo[i].game,
                        score: userinfo[i].score
                    };
                    break;
                }
            }
            ctx.body = {
                message: '成功！',
                code: 1,
                info
            }
        } else {
            ctx.body = {
                message: 'token 错误',
                code: -1
            }
        }
    })
    .get('/practiceInfo', async (ctx) => {
        console.log(ctx.header);
        const token = ctx.header.authorization  // 获取jwt
        console.log(token, ctx.header);
        let payload
        if (token) {
            payload = await verify(token.split(' ')[1], secret)  // 解密，获取payload
            let name = payload.name
            let userinfo = JSON.parse(fs.readFileSync('./user.json', 'utf-8'));
            let info;
            for (let i in userinfo) {
                if (userinfo[i].name === name) {
                    info = userinfo[i].practiceRecord;
                    break;
                }
            }
            ctx.body = {
                message: '成功！',
                code: 1,
                info
            }
        } else {
            ctx.body = {
                message: 'token 错误',
                code: -1
            }
        }
    })
    .get('/getwords', async (ctx) => {
        const token = ctx.header.authorization;  // 获取jwt
        let payload;
        if (token) {
            payload = await verify(token.split(' ')[1], secret)  // 解密，获取payload
            // let name = payload.name
            let dicts = JSON.parse(fs.readFileSync('./dict.json', 'utf-8'));
            let words = dicts['words'];
            ctx.body = {
                message: '成功！',
                code: 1,
                words
            }
        } else {
            ctx.body = {
                message: 'token 错误',
                code: -1
            }
        }
    })
    .get('/getpara', async (ctx) => {
        const token = ctx.header.authorization;  // 获取jwt
        let payload;
        if (token) {
            payload = await verify(token.split(' ')[1], secret)  // 解密，获取payload
            // let name = payload.name
            let dicts = JSON.parse(fs.readFileSync('./dict.json', 'utf-8'));
            let paras = dicts['paragraphs'];
            ctx.body = {
                message: '成功！',
                code: 1,
                paras
            }
        } else {
            ctx.body = {
                message: 'token 错误',
                code: -1
            }
        }
    })
    .get('/getgame', async (ctx) => {
        const token = ctx.header.authorization;  // 获取jwt
        let payload;
        if (token) {
            payload = await verify(token.split(' ')[1], secret)  // 解密，获取payload
            // let name = payload.name
            let dicts = JSON.parse(fs.readFileSync('./dict.json', 'utf-8'));
            console.log(ctx.request.query);
            let game = dicts.game[parseInt(ctx.request.query.game)];
            console.log(dicts.game[parseInt(ctx.request.query.game)]);
            ctx.body = {
                message: '成功！',
                code: 1,
                game: game
            }
        } else {
            ctx.body = {
                message: 'token 错误',
                code: -1
            }
        }
    })
    .post('/postwords', async (ctx) => {
        const token = ctx.header.authorization;  // 获取jwt
        const addWords = JSON.parse(ctx.request.body);
        let payload;
        if (token) {
            payload = await verify(token.split(' ')[1], secret);  // 解密，获取payload
            let name = payload.name;
            let dicts = JSON.parse(fs.readFileSync('./dict.json', 'utf-8'));
            addWords.map((word, i) => {
                dicts['words'].push({
                    label: word.label,
                    author: name,
                    text: word.text
                });
            })
            fs.writeFileSync('./dict.json', JSON.stringify(dicts));
            ctx.body = {
                message: '成功！',
                code: 1
            }
        } else {
            ctx.body = {
                message: 'token 错误',
                code: -1
            }
        }
    })
    .post('/uploadRecord', async (ctx) => {
        const token = ctx.header.authorization;  // 获取jwt
        const record = JSON.parse(ctx.request.body.result);
        console.log(record);
        let payload;
        if (token) {
            payload = await verify(token.split(' ')[1], secret);  // 解密，获取payload
            let name = payload.name;
            let userinfo = JSON.parse(fs.readFileSync('./user.json', 'utf-8'));
            for (let i in userinfo) {
                if (userinfo[i].name === name) {
                    // if (!('practiceRecord' in userinfo)) userinfo[i]['practiceRecord'] = []
                    userinfo[i]['practiceRecord'].push(record);
                    break;
                }
            }
            fs.writeFileSync('./user.json', JSON.stringify(userinfo));
            ctx.body = {
                message: '成功！',
                code: 1
            }
        } else {
            ctx.body = {
                message: 'token 错误',
                code: -1
            }
        }
    })
    .get('/adminUserInfo', async (ctx) => {
        console.log(ctx.header);
        const token = ctx.header.authorization  // 获取jwt
        console.log(token, ctx.header);
        let payload
        if (token) {
            payload = await verify(token.split(' ')[1], secret)  // 解密，获取payload
            let name = payload.name
            let userinfo = JSON.parse(fs.readFileSync('./user.json', 'utf-8'));
            let info;
            for (let i in userinfo) {
                if (userinfo[i].name === name) {
                    if ('isAdmin' in userinfo[i] && userinfo[i]['isAdmin'] == true) {
                        info = userinfo
                        break;
                    }
                }
            }
            ctx.body = {
                message: '成功！',
                code: 1,
                info
            }
        } else {
            ctx.body = {
                message: 'token 错误',
                code: -1
            }
        }
    })
    .get('/deleteUser', async (ctx) => {
        console.log(ctx.header);
        const token = ctx.header.authorization  // 获取jwt
        console.log(token, ctx.header);
        let payload
        if (token) {
            payload = await verify(token.split(' ')[1], secret)  // 解密，获取payload
            let name = payload.name
            let userinfo = JSON.parse(fs.readFileSync('./user.json', 'utf-8'));
            let ok = false, admin = false;
            for (let i in userinfo) {
                if (userinfo[i].name === name) {
                    if ('isAdmin' in userinfo[i] && userinfo[i]['isAdmin'] == true) {
                        admin = true;
                        for (let j in userinfo) {
                            if (userinfo[j].name == ctx.request.query.name) {
                                userinfo.splice(j, 1);
                                fs.writeFileSync('./user.json', JSON.stringify(userinfo));
                                ok = true;
                                break;
                            }
                        }
                        break;
                    }
                }
            }
            if (admin) {
                if (ok) ctx.body = {
                    message: '成功！',
                    code: 1
                }
                else ctx.body = {
                    message: '没有找到用户！',
                    code: -1
                }
            } else {
                ctx.body = {
                    message: '无权限！',
                    code: -1
                }
            }
        } else {
            ctx.body = {
                message: 'token 错误',
                code: -1
            }
        }
    })
    .post('/postGame', async (ctx) => {
        const token = ctx.header.authorization;  // 获取jwt
        let payload;
        if (token) {
            payload = await verify(token.split(' ')[1], secret);  // 解密，获取payload
            let name = payload.name;
            let userinfo = JSON.parse(fs.readFileSync('./user.json', 'utf-8'));
            for (let i in userinfo) {
                if (userinfo[i].name === name) {
                    userinfo[i].game = ctx.request.body.game;
                    userinfo[i].score = ctx.request.body.score;
                    break;
                }
            }
            fs.writeFileSync('./user.json', JSON.stringify(userinfo));
            ctx.body = {
                message: '成功！',
                code: 1
            }
        } else {
            ctx.body = {
                message: 'token 错误',
                code: -1
            }
        }
    })
    .get('/getrank', async (ctx) => {
        const token = ctx.header.authorization  // 获取jwt
        let payload
        if (token) {
            payload = await verify(token.split(' ')[1], secret)  // 解密，获取payload
            let name = payload.name
            let userinfo = JSON.parse(fs.readFileSync('./user.json', 'utf-8'));
            let rank = [];
            for (let i in userinfo) {
                rank.push({ name: userinfo[i].name, score: userinfo[i].score });
            }
            ctx.body = {
                message: '成功！',
                code: 1,
                rank
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