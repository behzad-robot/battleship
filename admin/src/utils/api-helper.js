import { API_URL, API_TOKEN, ADMIN_TOKEN } from "../constants";
import fetch from 'node-fetch';
export class APICollection 
{
    constructor(slug, settings = {})
    {
        //data:
        this.slug = slug;
        this.headers = {
            'api-token': API_TOKEN,
            'admin-token': ADMIN_TOKEN,
            'localhost-caller': settings.caller ? settings.caller : 'api-helper',
        }
        //bind functions:
        this.apiCall = this.apiCall.bind(this);
        this.getOne = this.getOne.bind(this);
        this.find = this.find.bind(this);
        this.insert = this.insert.bind(this);
        this.edit = this.edit.bind(this);
        this.delete = this.delete.bind(this);
    }
    apiCall(query, method, body)
    {
        var postHeaders = Object.assign({}, this.headers);
        postHeaders['Content-Type'] = 'application/json';
        var settings = {
            method: method,
            headers: postHeaders,
        };
        if (method == 'POST')
            settings.body = JSON.stringify(body);
        return fetch(API_URL + this.slug + '/' + query, settings).then(res => res.text());
    }
    getOne(_id)
    {
        return fetch(API_URL + this.slug + '/' + _id + '/', {
            headers: this.headers,
        }).then(res => res.json());
    }
    find(query = undefined, limit = 50, offset = 0)//can be anything that api supports!
    {
        var q = `?limit=${limit}&offset=${offset}`;
        if (query != undefined)
        {
            var keys = Object.keys(query);
            for (var i = 0; i < keys.length; i++)
            {
                q += "&" + keys[i] + "=" + query[keys[i]];
            }
        }
        console.log(q);
        return fetch(API_URL + this.slug + '/' + q, {
            headers: this.headers,
        }).then(res => res.json());
    }
    insert(doc)
    {
        var postHeaders = Object.assign({}, this.headers);
        postHeaders['Content-Type'] = 'application/json';
        return fetch(API_URL + this.slug + '/new', {
            method: "POST",
            headers: postHeaders,
            body: JSON.stringify(doc),
        }).then(res => res.json());
    }
    edit(_id, doc)
    {
        var postHeaders = Object.assign({}, this.headers);
        postHeaders['Content-Type'] = 'application/json';
        return fetch(API_URL + this.slug + '/' + _id + '/edit', {
            method: "POST",
            headers: postHeaders,
            body: JSON.stringify(doc),
        }).then(res => res.text());
    }
    delete(_id)
    {
        return fetch(API_URL + this.slug + '/' + _id + '/delete/', {
            headers: this.headers,
        }).then(res => res.json());
    }
}