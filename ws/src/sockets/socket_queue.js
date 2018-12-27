import { SocketBase } from "./socket_base";
const QUEUE_ROOM = "match-make-queue";
export class SocketQueue extends SocketBase
{
    constructor(db, emitInvalid = false)
    {
        super(db, emitInvalid);
        //function binds override:
        this.onMessage = this.onMessage.bind(this);
        this.onSocketDisconnected = this.onSocketDisconnected.bind(this);
        //function binds new:
        this.getSocket = this.getSocket.bind(this);
        this.getQueueMember = this.getQueueMember.bind(this);
        this.logQueue = this.logQueue.bind(this);
        this.checkQueue = this.checkQueue.bind(this);

        //queue things:
        this.queue = [];
        this.sockets = [];
        this.checkQueue();

    }
    onSocketDisconnected(socket, reasonCode, description)
    {
        console.log(`onSocketDisconnected=>looking for socket ${socket.socketId} in queue.`);
        this.leaveQueue(socket);
        //TODO: clean sockets!
    }
    onMessage(socket, eventName, data, headers)
    {
        //console.log(`SocketQueue.onMessage=>${eventName} => ${JSON.stringify(data)}`);
        if (eventName == 'join-queue')
        {
            console.log('join-queue=>'+headers.user._id.toString());
            var queueMember = {
                userId: headers.user._id.toString(),
                username: headers.user.username,
                socketId: socket.socketId,
                score: data.score ? data.score : 0,
                board: data.board,
                joinedAt: new Date(Date.now()).toLocaleString()
            };
            var q = this.getQueueMember(queueMember.userId);
            if (q == undefined) //first join: add to queue:
            {
                this.queue.push(queueMember);
            }
            else
            {
                this.queue[q.index] = queueMember;
            }
            this.sockets.push(socket);
            var data = Object.assign({}, queueMember);
            data.message = q == undefined ? "Joined Queue Successfully" : "Was Already in Queue! Updating info";
            data.alreadyInQueue = q != undefined;
            socket.joinRoom(QUEUE_ROOM);
            socket.respondToRoom(QUEUE_ROOM, 'join-queue-success', data);
            this.logQueue();
        }
        else if (eventName == 'leave-queue')
        {
            this.leaveQueue(socket);
            this.logQueue();
        }

    }
    //socket functions:
    getSocket(socketId)
    {
        for (var i = 0; i < this.sockets.length; i++)
            if (this.sockets[i].socketId == socketId)
                return this.sockets[i];
        return undefined;
    }
    //queue functions:
    getQueueMember(val)
    {
        if (typeof val == 'string') //userId
        {
            for (var i = 0; i < this.queue.length; i++)
                if (this.queue[i].userId.toString() == val)
                    return { index: i, value: this.queue[i] };
            return undefined;
        }
        else //socketId
        {
            for (var i = 0; i < this.queue.length; i++)
                if (this.queue[i].socketId == val)
                    return { index: i, value: this.queue[i] };
        }
    }
    leaveQueue(socket)
    {
        console.log('leaveQueue=>' + socket.socketId);
        socket.leaveRoom(QUEUE_ROOM);
        var q = this.getQueueMember(socket.socketId);
        if (q == undefined)
        {
            console.log('this socket was not in queue!');
            return;
        }
        socket.respond('leave-queue', q.value);
        socket.respondToRoom(QUEUE_ROOM, 'leave-queue', q.value);
        this.queue.splice(q.index, 1);
    }
    checkQueue()
    {
        if (this.queue.length < 2)
        {
            if (this.queue.length != 0)
                console.log('players in queue =>' + this.queue.length);
            setTimeout(this.checkQueue, 2000);
            return;
        }
        //create game and match make people:
        var users = [this.queue[0].userId, this.queue[1].userId];
        var players = [];
        for (var i = 0; i < users.length; i++)
            players.push({ userId: users[i], socketId: this.queue[i].socketId, isConnected: false });
        var boards = [];
        for (var i = 0; i < users.length; i++)
        {
            var qm = this.queue[i];
            boards.push({
                owner: users[i],
                ships: qm.board.ships ? qm.board.ships : [],
                shotBlocks: [],
            });
        }
        var game = {
            users: users,
            turn: users[Date.now() % 2],
            winner: "",
            createdAt: this.now(),
            updatedAt: "",
            players: players,
            boards: boards,
            logs: [],
        };
        this.db.Game.insert(game).then((game) =>
        {
            const gameId = game._id.toString();
            this.db.User.edit(users[0], { gameId: gameId }).then((user1) =>
            {
                this.db.User.edit(users[1], { gameId: gameId }).then((user2) =>
                {
                    //remove users from queue:
                    this.queue.splice(0, 2);
                    //notify sockets:
                    for (var i = 0; i < game.players.length; i++)
                    {
                        var s = this.getSocket(game.players[i].socketId);
                        if (s != undefined)
                            s.send(this.response('match-found', game, !s.isAdmin));
                        //console.log(this.response('match-found', game, { adminToken: s.isAdmin ? ADMIN_TOKEN : '' }));
                    }
                    //end:
                    console.log('match make shodim raft dg boro!=>' + JSON.stringify(game));
                    setTimeout(this.checkQueue, 2000);
                }).catch((err) =>
                {
                    console.log(`sth went wrong while updating user ${users[1]}=>` + err.toString());
                });
            }).catch((err) =>
            {
                console.log(`sth went wrong while updating user ${users[0]}=>` + err.toString());
            });
        }).catch((err) =>
        {
            console.log('sth went wrong while creating game =>' + err.toString());
        });
    }
    logQueue()
    {
        var queue = [];
        for (var i = 0; i < this.queue.length; i++)
        {
            var q = Object.assign({}, this.queue[i]);
            delete (q.socket);
            queue.push(q);
        }
        console.log('=====================');
        console.log('Match Making Queue: ' + this.queue.length);
        console.log(JSON.stringify(queue));
        console.log('=====================');
    }
}