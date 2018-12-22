
export const API_TOKEN = "forthehorde";
export const API_ENCODE_KEY = "animal";
export const API_URL = "http://localhost:4545/api/";


export const ADMIN_TOKEN = "hamunhamishegi";
export const ADMIN_URL = "http://localhost:4444/admin/";
var fs = require('fs');
var path = require('path');

export function IS_LOCALHOST()
{
    return fs.existsSync(path.resolve('.localhost'));

}
export function GetMongoDBURL()
{
    return IS_LOCALHOST() ? 'mongodb://localhost:27017/battleship' :
        'mongodb://localhost:27017/battleship';
    //'mongodb://admin:polo1374@localhost:27017/corridor';
}