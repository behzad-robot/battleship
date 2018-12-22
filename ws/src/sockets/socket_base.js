import moment from 'moment';
import { API_ENCODE_KEY, ADMIN_TOKEN } from "../constants";
import { JesEncoder } from '../utils/jes-encoder';
import { log } from '../libs/log';
const encoder = new JesEncoder(API_ENCODE_KEY);
export class SocketBase
{
    constructor(db, emitInvalidToken = false)
    {
        this.db = db;
        this.emitInvalidToken = emitInvalidToken;
        //bind functions:
        this.response = this.response.bind(this);
        this.errorResponse = this.errorResponse.bind(this);
        this.gotMessage = this.gotMessage.bind(this);
        this.onMessage = this.onMessage.bind(this);
        this.now = this.now.bind(this);
    }
    response(eventName, data, encoded = true, code = 200, error = null)
    {
        //var encoded = !(headers.adminToken == ADMIN_TOKEN);
        return {
            code: code,
            error: error,
            eventName: eventName,
            _data: encoded ? encoder.encode(data) : data,
        };
    }
    errorResponse(eventName, error, code = 500)
    {
        return this.response(eventName, null, false, code, error);
    }
    gotMessage(socket, msg)
    {
        const eventName = msg.eventName;
        const data = msg._data;
        if (msg.adminToken != ADMIN_TOKEN)
        {
            //TODO :decode _data field!
        }
        else
            socket.isAdmin = true;
        //if (socket.emit == undefined)
        {
            var _res = this.response;
            socket.respond = (eventName, data, code = 200, error = null) =>
            {
                socket.send(_res(eventName, data, !socket.isAdmin, code, error));
                log.print('socket.respond:' + JSON.stringify({
                    socketId : socket.socketId,
                    eventName: eventName,
                    code: code,
                    error: error,
                    _data: data
                }));
            };
            socket.respondToRoom = (roomName, eventName, data, code = 200, error = null) =>
            {
                var clients = socket.getRoomSockets(roomName);
                for (var i = 0; i < clients.length; i++)
                    clients[i].send(_res(eventName, data, !clients[i].isAdmin, code, error))
                log.print('socket.respondToRoom:' + JSON.stringify({
                    roomName : roomName,
                    eventName: eventName,
                    code: code,
                    error: error,
                    _data: data
                }));
                //socket.sendToRoom(roomName, _res(eventName, data, !clients[i].isAdmin, code, error));
            };
            socket.respondError = (eventName, error, code = 500) =>
            {
                socket.respond(eventName, null, code, error);
            };
            socket.respondErrorToRoom = (roomName, eventName, error, code = 500) =>
            {
                socket.respondToRoom(roomName, eventName, null, code, error);
            };
        }
        this.db.User.isValidToken(msg.userToken, (result) =>
        {
            // console.log('token check!');
            // console.log(result);
            // console.log((typeof result));
            if (!result.valid)
            {
                if (this.emitInvalidToken)
                    socket.emit(eventName, null, 400, result.error);
                return;
            }
            this.onMessage(socket, eventName, data, {
                userToken: msg.userToken,
                adminToken: msg.adminToken,
                user: result.user,
            });
        });
    }
    onSocketConnected(socket)
    {
        //console.log('onSocketConnected=>' + socket.socketId);
    }
    onSocketDisconnected(socket, reasonCode, description)
    {
        console.log('onSocketDisconnected=>' + socket.socketId + ' => ' + reasonCode + ' => ' + description);
    }
    onMessage(socket, eventName, data, headers)
    {
        console.log(`onMessage=>${socket.socketId} => ${eventName} => ${JSON.stringify(data)}`);
    }

    now()
    {
        return moment().format('YYYY-MM-DD hh:mm:ss');
    }
}