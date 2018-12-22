
export const API_TOKEN ="forthehorde";
export const API_ENCODE_KEY = "animal";
export const API_URL = "http://localhost:4545/api/";


export const ADMIN_TOKEN ="hamunhamishegi";
export const ADMIN_URL = "http://localhost:4444/admin/";
var fs = require('fs');
var path = require('path');

export function IS_LOCALHOST()
{
    return fs.existsSync(path.resolve('.localhost'));

}