import { log } from '../libs/log';
import { SocketBase } from "./socket_base";
const QUEUE_ROOM = "match-make-queue";
export class SocketGame extends SocketBase
{
    constructor(db, emitInvalid = false)
    {
        super(db, emitInvalid);
        //function binds override:
        this.onMessage = this.onMessage.bind(this);
        this.onSocketConnected = this.onSocketConnected.bind(this);
        this.onSocketDisconnected = this.onSocketDisconnected.bind(this);
        //function binds new:
        this.getGame = this.getGame.bind(this);
        this.getGameWinner = this.getGameWinner.bind(this);
        //data:
        this.activeGames = [];
    }
    onSocketConnected(socket) { }
    onSocketDisconnected(socket, reasonCode, description)
    {
        console.log(`SocketGame.onSocketDisconnected=>looking for socket ${socket.socketId} in cached games.`);
        console.log(`activeGames count=>${this.activeGames.length}`);
        for (var i = 0; i < this.activeGames.length; i++)
        {
            var game = this.activeGames[i];
            for (var j = 0; j < game.players.length; j++)
            {
                //console.log(`lookin in game between =>${JSON.stringify(game.players)}`);
                if (game.players[j].socketId == socket.socketId)
                {
                    console.log('socket was found in game => ' + game._id);
                    game.players[j].isConnected = false;
                    this.setGame(game);
                    socket.respondToRoom('game-' + game._id, 'player-leave', { userId: game.players[j].userId, game: game });
                    console.log('ok done with ' + game._id);
                    break;
                }
            }
        }
    }
    onMessage(socket, eventName, data, headers)
    {
        //console.log(`SocketGame.onMessage=>${eventName} => ${JSON.stringify(data)}`);
        if (eventName == 'join-game')
        {
            if (data.gameId == undefined || data.gameId == "")
            {
                socket.respond(eventName, null, 500, 'Missing gameId');
                return;
            }
            this.getGame(data.gameId, (err, game) =>
            {
                if (err || game == null)
                {
                    socket.respond(eventName, null, 500, err ? err : "Game not found!");
                    return;
                }
                for (var i = 0; i < game.players.length; i++)
                {
                    if (game.players[i].userId == headers.user._id)
                    {
                        game.players[i].isConnected = true;
                        game.players[i].socketId = socket.socketId;
                        break;
                    }
                }
                socket.joinRoom('game-' + game._id);
                this.setGame(game);
                socket.respondToRoom('game-' + game._id, 'player-join', { userId: headers.user._id, game: game });
            });
        }
        else if (eventName == 'game-action')
        {
            if (data.gameId == undefined || data.gameId == "")
            {
                socket.respond(eventName, null, 500, 'Missing gameId');
                return;
            }
            this.getGame(data.gameId, (err, game) =>
            {
                if (err || game == null)
                {
                    socket.respond(eventName, null, 500, err ? err : "Game not found!");
                    return;
                }
                //step 0: check winner , turn:
                if (game.winner != null && game.winner != "")
                {
                    socket.respondError(eventName, "This Game has a winner!");
                    return;
                }
                if (game.turn != headers.user._id.toString())
                {
                    socket.respondError(eventName, "Not your turn!");
                    return;
                }
                if (data.action == 'shoot')
                {
                    //step 1:check if this block was not shot before:
                    var board = undefined;
                    for (var i = 0; i < game.boards.length; i++)
                    {
                        if (game.boards[i].owner != data.userId)
                        {
                            board = game.boards[i];
                            break;
                        }
                    }
                    for (var i = 0; i < board.shotBlocks.length; i++)
                    {
                        var sb = board.shotBlocks[i];
                        if (sb.x == data.location.x && sb.y == data.location.y)
                        {
                            socket.respondError(eventName, "This block was shot before!");
                            return;
                        }
                    }
                    //step 2: else add to shot blocks:
                    board.shotBlocks.push({ x: data.location.x, y: data.location.y });
                    //step 3: update turn,winner:
                    var info = new GameInfo(game);
                    if (!info.hitsShip(board.owner, data.location.x, data.location.y))
                        game.turn = game.turn == game.users[0] ? game.users[1] : game.users[0];
                    info.updateWinner();
                    game.winner = info.game.winner;
                    this.setGame(game);
                    data.game = game;
                    // console.log('reached here!');
                    socket.respondToRoom('game-' + game._id, eventName, data);
                }
                else
                {
                    socket.respondError(eventName, "Invalid action!");
                    return;
                }
            });
        }
        else if (eventName == 'surrender')
        {
            if (data.gameId == undefined || data.gameId == "")
            {
                socket.respond(eventName, null, 500, 'Missing gameId');
                return;
            }
            this.getGame(data.gameId, (err, game) =>
            {
                if (err || game == null)
                {
                    socket.respond(eventName, null, 500, err ? err : "Game not found!");
                    return;
                }
                //step 0: check winner , turn:
                if (game.winner != null && game.winner != "")
                {
                    socket.respondError(eventName, "This Game has a winner!");
                    return;
                }
                if (data.userId != headers.user._id.toString())
                {
                    socket.respondError(eventName, "You cant surrender for opponent!");
                    return;
                }
                game.winner = game.users[0] == data.userId ? game.users[1] : game.users[0];
                game.turn = "winner";
                this.setGame(game);
                socket.respondToRoom('game-' + game._id, eventName, {
                    userId : data.userId,
                    game : game,
                });
            });
        }
    }
    //game functions:
    getGame(_id, callBack)
    {
        this.db.Game.getOne(_id.toString()).then((game) =>
        {
            //update active games:
            if (game.winner == null || game.winner == "")
            {
                var has = false;
                for (var i = 0; i < this.activeGames.length; i++)
                {
                    if (this.activeGames[i]._id == game._id)
                    {
                        has = true;
                        break;
                    }
                }
                if (!has)
                    this.activeGames.push(game);
            }
            //callback:
            callBack(undefined, game);
        }).catch((err) =>
        {
            log.error(`Failed to load game ${_id} =>` + err.toString());
            callBack(err, null);
        });
    }
    setGame(game, callBack = null)
    {
        var data = Object.assign({}, game);
        delete (data._id);
        this.db.Game.edit(game._id.toString(), data).then((game) =>
        {
            //update active games:
            if (game.winner != "" && game.winner != null)
            {
                for (var i = 0; i < this.activeGames.length; i++)
                {
                    if (this.activeGames[i]._id == game._id)
                    {
                        this.activeGames.splice(i, 1);
                        for (var i = 0; i < game.users.length; i++)
                        {
                            this.db.User.edit(game.users[i], { gameId: null }).then((user) =>
                            {
                                console.log('Relased User ' + user._id + ' from game ' + game._id);
                            }).catch((err) =>
                            {
                                console.log('sth went wrong while releasing user =>' + err.toString());
                            });
                        }
                        break;
                    }
                }
            }
            //callback
            if (callBack != null)
                callBack(undefined, game);
        }).catch((err) =>
        {
            log.error(`Failed to edit game ${game._id} => ${err.toString()}`);
            if (callBack != null)
                callBack(err.toString(), null);
        });
    }
    getGameWinner(game)
    {
        var info = new GameInfo(game);
        info.updateWinner();
        return info.game.winner;
    }

}



class GameInfo
{
    constructor(game)
    {
        this.game = game;
        //bind functions:
        this.getBoard = this.getBoard.bind(this);
        this.hitsShip = this.hitsShip.bind(this);
        this.updateWinner = this.updateWinner.bind(this);
        this.isShot = this.isShot.bind(this);
    }
    updateWinner()
    {
        var game = this.game;
        for (var i = 0; i < game.boards.length; i++)
        {
            var board = game.boards[i];
            var oneAlive = false;
            for (var j = 0; j < board.ships.length; j++)
            {
                var ship = board.ships[j];
                var alive = false;
                for (var k = 0; k < ship.size; k++)
                {
                    if (!this.isShot(board, ship.location.x + ship.direction.x * k, ship.location.y + ship.direction.y * k))
                    {
                        alive = true;
                        break;
                    }
                }
                if (alive)
                {
                    oneAlive = true;
                    break;
                }
            }
            if (!oneAlive)
            {
                game.winner = board.owner == game.users[0] ? game.users[1] : game.users[0];
                break;
            }
        }
    }
    isShot(board, x, y)
    {
        for (var i = 0; i < board.shotBlocks.length; i++)
        {
            if (board.shotBlocks[i].x == x && board.shotBlocks[i].y == y)
                return true;
        }
        return false;
    }
    getBoard(owner)
    {
        for (var i = 0; i < this.game.boards.length; i++)
        {
            if (this.game.boards[i].owner == owner)
                return this.game.boards[i];
        }
        return undefined;
    }
    hitsShip(boardOwner, x, y)
    {
        var board = this.getBoard(boardOwner);
        for (var i = 0; i < board.ships.length; i++)
        {
            var ship = board.ships[i];
            for (var j = 0; j < ship.size; j++)
            {
                var loc = { x: ship.location.x + ship.direction.x * j, y: ship.location.y + ship.direction.y * j };
                if (loc.x == x && loc.y == y)
                    return true;
            }
        }
        return false;
    }

}