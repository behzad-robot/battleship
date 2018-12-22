import mongoose from 'mongoose';
import { JesEncoder } from '../utils/jes-encoder';
import { API_ENCODE_KEY } from '../constants';
const encoder = new JesEncoder(API_ENCODE_KEY);
export const UserSchema = new mongoose.Schema({
    token: String,
    username: String,
    password: String,
    email: String,

    gameId: String,
    profileImage: String,
    score: Number,

    createdAt: String,
    updatedAt: String,
    lastLogin: String,
});
export const User = mongoose.model('User', UserSchema);
User.Helpers = {
    public: (doc) =>
    {
        delete (doc.token);
        delete (doc.password);
        delete (doc.email);
        return doc;
    },
    fields: () =>
    {
        var fields = Object.keys(UserSchema.paths);
        var results = [];
        for (var i = 0; i < fields.length; i++)
        {
            var settings = UserSchema.paths[fields[i]];
            results.push({
                name: fields[i],
                type: settings.instance,
                defaultValue: settings.defaultValue,
                multiline: fields[i] == 'ss' ? true : undefined, //adding custom field options example! (recommended : multiline , readOnly )
            });
        }
        return results;
    },
    isValidToken: (token, callBack) =>
    {
        //console.log('isValidToken=>' + token);
        User.findOne({ token: token }).exec((err, user) =>
        {
            if (err || user == null)
            {
                callBack({
                    valid: false,
                    error: err ? err : "Invalid Token!",
                    user: null,
                });
                return;
            }
            var decoded = encoder.decode(token);
            //console.log(decoded);
            if (Date.now() > decoded.payload.expiresIn)
            {
                callBack({
                    valid: false,
                    error: 'Token Expired!',
                    user: null,
                });
                return;
            }
            callBack({
                valid: true,
                token: decoded,
                error: null,
                user: user,
            });
        });
    },
}
/*
export const GameSchema = new mongoose.Schema({
    encode: String,
    users: Array,
    players: Array,
    userInfos: Array,
    walls: Array,
    turn: String,
    turnStartTime:String,
    winner: String,
    hasNaggedThisTurn : Boolean,
    defaultTurnTime : Number,
    nagTurnTime : Number,
    
    logs: Array,

    createdAt: String,
    updatedAt: String,
});
export const Game = mongoose.model('Game', GameSchema);
const GAME_BASE_URL = API_BASE_URL + 'games/';
const GAME_BASE_ADMIN_URL = BASE_URL + 'admin/games/';
Game.URLS = {
    apiSlug: () => '/api/games',
    adminSlug: () => '/admin/games',

    baseUrl: () => GAME_BASE_URL,
    get: () => GAME_BASE_URL,
    getOne: (id) => GAME_BASE_URL + id + '/',
    delete: (id) => GAME_BASE_URL + id + '/delete/',
    new: () => GAME_BASE_URL + 'new/',
    edit: (id) => GAME_BASE_URL + id + '/edit/',

    admin_new: () => GAME_BASE_ADMIN_URL + 'new/',
    admin_edit: (id) => GAME_BASE_ADMIN_URL + id + '/',


};
Game.Helpers = {
    public: (game) =>
    {

    },

};
Game.Helpers.public = (game) =>
{

};*/