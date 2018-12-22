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
express.expressApp.get('/', (req, res) =>
{
    res.send(':) hello this admin panel route!');
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