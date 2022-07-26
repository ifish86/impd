import net = require('net');

type newCmd = {
        cmd: string,
        response: string,
        txtime: number,
        rxtime: number,
        client: string,
        find: RegExp,
        callback: Function
    };

type mpdStats = {
        uptime: number,
        playtime: number,
        artists: number,
        albums: number,
        songs: number,
        db_playtime: number,
        db_update: number
    };
//var cmds: newCmd[] = [];
var mpdinterface: any;

"use strict";
class MpdInterface {
    port: number;
    addr: string;
    socket: any;
    cmds: newCmd[] = [];
    stats: mpdStats;
    connected: boolean;
    
    lastCmdTxTimestamp = 0;
    cmdTxSpacing = 0.5;
    constructor(p: number, a: string) {
        this.port = p;
        this.addr = a;
        this.stats = {
            uptime: 0,
            playtime: 0,
            artists: 0,
            albums: 0,
            songs: 0,
            db_playtime: 0,
            db_update: 0
        };
        this.connected = true;
    }
    
    public connect () {
        this.socket = net.createConnection(this.port, this.addr);
        mpdinterface=this;
        this.socket.on('data', function(data: any) {
            var temp = data.toString().split("\n");
            console.log('Mpd Rx:'+temp[0]);
            MpdInterface.processResponse(data.toString());
        });
        
        this.socket.on('connect', function () {
            console.log('mpd connected!');
            MpdInterface.writeCmd("stats\n", 'localhost', /^uptime: /, function (data: newCmd) { mpdinterface.decodeStats(data); });
            MpdInterface.writeCmd("status\n", 'localhost', /^uptime: /, function (data: newCmd) { mpdinterface.decodeStatus(data); });
        });
        
        this.socket.on('close', function () {
            console.log('connection closed');
            mpdinterface.connect();
        });
    }
    
    public write(data: string) {
        console.log('Mpd Tx:'+data);
        //console.log(data);
        this.socket.write(data);
    }
    
    static writeCmd(cmd: string, client: string, find: RegExp, callback: Function) {
        console.log('adding cmd to queue:');
        console.log(cmd);
        //var timestamp = new Date().getTime()/1000;
        mpdinterface.cmds[mpdinterface.cmds.length] = {cmd: cmd, response: "", txtime: 0, rxtime: 0, client: client, find: find, callback: callback};
        mpdinterface.processCmdQueue(true);
    }
    
    private processCmdQueue(yup: boolean) {
        console.log('running cmd queue');
        var timestamp = new Date().getTime()/1000;
        if (mpdinterface.cmds.length > 0) {
            for (var i = 0; i < mpdinterface.cmds.length; ++i) {
                if (mpdinterface.cmds[i].txtime == 0 && mpdinterface.cmds[i].response == "" && mpdinterface.lastCmdTxTimestamp < (timestamp - mpdinterface.cmdTxSpacing)) {
                    mpdinterface.lastCmdTxTimestamp=timestamp;
                    mpdinterface.cmds[i].txtime=timestamp;
                    mpdinterface.write(mpdinterface.cmds[i].cmd);
                } else if (mpdinterface.cmds[i].txtime == 0 && mpdinterface.cmds[i].response == "" && mpdinterface.lastCmdTxTimestamp > (timestamp - mpdinterface.cmdTxSpacing)) {
                    setTimeout(function () { mpdinterface.processCmdQueue(true); }, (mpdinterface.cmdTxSpacing * 1000));
                }
            }
        }
    }
    
    static processResponse(data: string) {
        var timestamp = new Date().getTime()/1000;
        if (mpdinterface.cmds.length > 0) {
            for (var i = 0; i < mpdinterface.cmds.length; ++i) {
                if (mpdinterface.cmds[i].txtime != 0 && mpdinterface.cmds[i].response == "" && mpdinterface.cmds[i].find.test(data)) {
                    console.log('matched');
                    mpdinterface.cmds[i].response = data;
                    mpdinterface.cmds[i].rxtime = timestamp;
                    mpdinterface.cmds[i].callback(mpdinterface.cmds[i]);
                    i=mpdinterface.cmds.length;
                }
            }
        } else {
            console.log('sporadic');
        }
    }
    
    private decodeStats(data: newCmd) {
        var temp = data.response.split("\n");
        for (var i = 0; temp[i]; ++i) {
            var values = temp[i].split(': ');
            if (values.length > 1) {
                mpdinterface.stats[values[0]]=values[1]
            }
        }
    }
    
    private decodeStatus(data: newCmd) {
        console.log('sort status');
    }
    
    public test() {
        return `${this.addr} on port ${this.port}`;
    }
}


/*
class newCmd {
    cmd: string;
    response: string;
    time: number;
    client: string;
    
    constructor(cmd: string, client: string) {
        var timestamp = new Date().getTime()/1000;
        this.cmd = cmd;
        this.response = '';
        this.time = timestamp;
        this.client = client;
    }
    
}
*/

/*
function newCmd(cmd: string, client: string) {
    var timestamp = new Date().getTime()/1000;
    return {"cmd": cmd, "response":"", "time": timestamp, "client": client};
}
*/

export = MpdInterface;
