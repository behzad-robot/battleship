
import { log } from './libs/log';
import MyExpressApp from './libs/express';

import { User } from './models/user';
import { Game } from './models/game';
import { AnalyticsEvent } from './models/analytics';
import MongooseDB from './libs/mongoose-db';


import UsersAuthRouter from './routers/users_auth_router';
import { PublicMongooseAPIRouter } from './routers/public-api-mongoose';
import { AppInfoRouter } from './routers/app_info_router';

var fs = require('fs');
var path = require('path');
function IsLocalHost(){
    return fs.existsSync(path.resolve('.localhost'));
}

const express = new MyExpressApp();
console.log('running localhost?=>'+IsLocalHost());
const db = new MongooseDB(IsLocalHost() ? 'mongodb://localhost:27017/battleship' : 'mongodb://admin:polo1374@localhost:27017/corridor');
db.schemas.User = User;
db.schemas.Game = Game;
//log middleware:
express.expressApp.use((req, res, next) =>
{
    const end = res.end;
    res.end = (chunk, encoding) =>
    {
        //override:
        // log.print({
        //     url : req.originalUrl,
        //     request : {
        //         method : req.method,
        //         headers : req.headers,
        //         query :req.query,
        //         body : req.method,
        //         ip : req.ip,
        //     },
        //     response: {
        //         statusCode: res.statusCode,
        //         statusMessage: res.statusMessage,
        //         body : res.body,
        //     }
        // });
        AnalyticsEvent.Helpers.newHttpEvent(req.originalUrl, "http-api", {
            method: req.method,
            headers: req.headers,
            query: req.query,
            body: req.method,
            ip: req.ip,
        }, {
                statusCode: res.statusCode,
            }, res.statusCode).then(() =>
            {
                //super:
                res.end = end;
                res.end(chunk, encoding);
            }).catch((err) =>
            {
                //super:
                res.end = end;
                res.end(chunk, encoding);
            });
        //console.log('Date.now=' + Date.now());
    };
    next();
});
//add routers here:
express.expressApp.get('/', (req, res) =>
{
    res.status(200).send('Welcome to API :)');
});
express.expressApp.use('/api/', new AppInfoRouter().router);
express.expressApp.use('/api/users/', new UsersAuthRouter(User).router);
express.expressApp.use('/api/users/', new PublicMongooseAPIRouter(User, { apiTokenRequired: true }).router);
express.expressApp.use('/api/games/', new PublicMongooseAPIRouter(Game, { apiTokenRequired: true }).router)
express.expressApp.use('/api/analytics/', new PublicMongooseAPIRouter(AnalyticsEvent, { apiTokenRequired: true }).router)
//listen:
const PORT = 4545;
express.http.listen(PORT, function ()
{
    log.success('http server listening on port ' + PORT);
});