import { log } from './libs/log';
import { EasySocket } from './libs/easy-socket';
import { API_TOKEN, ADMIN_TOKEN } from './constants';
import { APICollection } from './utils/api-helper';
import { SocketQueue } from './sockets/socket_queue';
import { SocketGame } from './sockets/socket_game';
//run http server:
const http = require('http');
const PORT = 4545;
const httpServer = http.createServer(function (request, response)
{
    console.log((new Date()) + ' Received request for ' + request.url);
    response.writeHead(404);
    response.write(':) This Port is used by Battleship Websocket Server!');
    response.end();
});
httpServer.listen(PORT, function ()
{
    //console.log((new Date().toUTCString()) + ' Server is listening on port '+PORT);
    log.success('Server is running on port ' + PORT);
});
const User = new APICollection('users', { apiToken: API_TOKEN, adminToken: ADMIN_TOKEN });
User.isValidToken = (token, callBack) =>
{
    User.apiCall('check-token/', 'POST', { token: token }).then((res) =>
    {
        // console.log('=============API CALL================');
        // console.log(res.toString());
        // console.log('================PARSE==============');
        // console.log(JSON.parse(res.toString()));
        // console.log('=============================');

        callBack(JSON.parse(res.toString()));
    }).catch((err) =>
    {
        console.log('================CATCH=========');
        console.log(err.toString());
        console.log('=============================');
        callBack({ valid: false, error: "Request Failed=>" + err.toString(), code: -500 });
    });
}
const db = {
    User: User,
    Game: new APICollection('games', { apiToken: API_TOKEN, adminToken: ADMIN_TOKEN }),
};
//routers:
var routers = [
    new SocketQueue(db, true),
    new SocketGame(db),
];
const easySocket = new EasySocket({
    httpServer: httpServer,
    originIsAllowed: (origin) => { return true; },
    onSocketConnected: (connection) =>
    {
        for (var i = 0; i < routers.length; i++)
            routers[i].onSocketConnected(connection);
    },
    onSocketDisconnected: (connection, code, description) =>
    {
        for (var i = 0; i < routers.length; i++)
            routers[i].onSocketDisconnected(connection, code, description);
    },
    onMessage: (connection, str) =>
    {
        if (str.indexOf('{') != -1)
        {
            try
            {
                var msg = JSON.parse(str);
                if (msg.apiToken == API_TOKEN && msg.userToken != undefined)
                {
                    //connection.send(msg); //TESTING ECHO!
                    //pass message to routers:
                    for (var i = 0; i < routers.length; i++)
                    {
                        routers[i].gotMessage(connection, msg);
                    }
                }
                else
                {
                    connection.send({
                        error: "Access Denied.",
                        code: 400,
                        _data: null
                    });
                }
            }
            catch (err)
            {
                console.log("catch! => " + err.toString());
                connection.send({
                    error: "Invalid Data.",
                    code: 400,
                    _data: null
                });
            }
        }
        else
        {
            connection.send({
                error: "Invalid Data.",
                code: 400,
                _data: null
            });
        }
    }
});