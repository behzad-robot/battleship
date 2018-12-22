import APIRouter from "./api_router";
const fs = require('fs');
const path = require('path');
export class AppInfoRouter extends APIRouter
{
    constructor()
    {
        super();
        this.router.get('/app-info', (req, res) =>
        {
            const appInfo = new AppInfo();
            appInfo.load((err, data) =>
            {
                if (err)
                {
                    this.handleError(req, res, err.toString(), 500);
                    return;
                }
                this.sendResponse(req, res, data);
            });
        });
    }
}
export class AppInfo
{
    constructor()
    {
        this.data = {};
        //bind functions:
        this.load = this.load.bind(this);
    }
    load(callBack)
    {
        fs.readFile(path.resolve('public/app-info.json'), (err, d) =>
        {
            if (err)
            {
                callBack(err, null);
                return;
            }

            this.data = d;
            callBack(err, JSON.parse(d.toString()));
        });
    }
}