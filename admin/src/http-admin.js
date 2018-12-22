import MyExpressApp from "./libs/express";
import { log } from "./libs/log";
import AdminSocketRouter from './routers/admin_socket';
import { APICollection } from "./utils/api-helper";
import AdminAnalyticsRouter from "./routers/admin_analytics";
import { API_TOKEN, ADMIN_TOKEN } from "../../api/src/constants";
//db:
const User = new APICollection('users',{apiToken : API_TOKEN , adminToken : ADMIN_TOKEN});
const Game = new APICollection('games',{apiToken : API_TOKEN , adminToken : ADMIN_TOKEN});
const AnalyticsEvent = new APICollection('analytics');
//express:
const express = new MyExpressApp();
//add general middlewares here:
express.expressApp.disable('etag'); //fully disable cache!
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
        // AnalyticsEvent.Helpers.newHttpEvent(req.originalUrl, "http-site", {
        //     method: req.method,
        //     headers: req.headers,
        //     query: req.query,
        //     body: req.method,
        //     ip: req.ip,
        // }, {
        //         statusCode: res.statusCode,
        //     }, res.statusCode);

        //super
        res.end = end;
        res.end(chunk, encoding);
    };

    next();
});
express.expressApp.get('/', (req, res) =>
{
    res.send(':) hello this admin panel route!');
    // //get one:
    // User.getOne(':Dsfdsfsd').then((json) => { 
    //     res.send(json);
    // }).catch((err) =>
    // {
    //     res.send(err.toString());
    // });
    //find:
    // User.find(req.query).then((json) => { 
    //     res.send(json);
    // }).catch((err) =>
    // {
    //     res.send(err.toString());
    // });
    //insert:
    // Game.insert({ trash: true , users : [2,3,345,321321] }).then((json) =>
    // {
    //     res.send(json);
    // }).catch((err) =>
    // {
    //     res.send(err.toString());
    // });
    //edit:
    // Game.edit(req.query.id, { trash: true, users: [6, 8, 9, 7, 8, 20] }).then((json) =>
    // {
    //     res.send(json);
    // }).catch((err) =>
    // {
    //     res.send(err.toString());
    // });
    // //delete:
    // Game.delete(req.query.id).then((json) =>
    // {
    //     res.send(json);
    // }).catch((err) =>
    // {
    //     res.send(err.toString());
    // });

});
express.expressApp.get('/admin', (req, res) =>
{
    res.send("Imaginary admin panel!");
});
express.expressApp.use('/', new AdminSocketRouter(User, Game).router)
express.expressApp.use('/', new AdminAnalyticsRouter(AnalyticsEvent).router)
//listen:
const PORT = 4444;
express.http.listen(PORT, function ()
{
    log.success('http server listening on port ' + PORT);
});