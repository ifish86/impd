import net = require('net');
const EventEmitter = require("events");

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
    
type mpdStatus = {
        repeat: number,
        random: number,
        single: number,
        consume: number,
        playlist: number,
        playlistlength: number,
        mixrampdb: number,
        state: string,
        song: number,
        songid: number,
        time: number,
        elapsed: number,
        bitrate: number,
        duration: number,
        audio: string,
        updating_db: number,
        nextsong: number,
        nextsongid: number
    };

type mpdTrack = {
        file: string,
        "Last-Modified": string,
        Artist: string,
        Title: string,
        Album: string,
        Track: string,
        Genre: string,
        Date: string,
        AlbumArtist: string,
        Time: number,
        duration: number,
        Pos: number,
        Id: number
    };
//var cmds: newCmd[] = [];
var mpdinterface: any;

"use strict";
class MpdInterface extends EventEmitter {
    port: number;
    addr: string;
    socket: any;
    cmds: newCmd[] = [];
    stats: mpdStats;
    status: mpdStatus;
    currentsong: mpdTrack;
    playlist: mpdTrack[] = [];
    connected: boolean;
    mpdVer: string;
    lastCmdTxTimestamp = 0;
    cmdTxSpacing = 0.05;
    constructor(p: number, a: string) {
        super();
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
        this.status = {
            repeat: 0,
            random: 0,
            single: 0,
            consume: 0,
            playlist: 0,
            playlistlength: 0,
            mixrampdb: 0,
            state: "stop",
            song: 0,
            songid: 0,
            time: 0,
            elapsed: 0,
            bitrate: 0,
            duration: 0,
            audio: "",
            updating_db: 0,
            nextsong: 0,
            nextsongid: 0
        };
        this.currentsong = {
            file: "",
            "Last-Modified": "",
            Artist: "",
            Title: "",
            Album: "",
            Track: "",
            Genre: "",
            Date: "",
            AlbumArtist: "",
            Time: 0,
            duration: 0,
            Pos: 0,
            Id: 0
        }
        this.connected = false;
        this.mpdVer = "0.0.0";
        
    }

    public connect () {
        this.socket = net.createConnection(this.port, this.addr);
        mpdinterface=this;
        this.socket.on('data', function(data: any) {
            var temp = data.toString().split("\n");
            if (temp[0].substr(0,8) != 'repeat: ') {
                console.log('Mpd Rx:'+temp[0]);
            }
            MpdInterface.processResponse(data.toString());
            if (temp[0].substr(0,9) == 'OK MPD 0.') {
                var ver = temp[0].split(' ');
                mpdinterface.mpdVer = ver[ver.length-1];
            }
            mpdinterface.processCmdQueue(true);
        });
        
        this.socket.on('connect', function () {
            console.log('mpd connected!');
            if (!mpdinterface.connected) {
                MpdInterface.writeCmd("stats", 'localhost', /^uptime: /, function (data: newCmd) { mpdinterface.decodeStats(data); });
                MpdInterface.writeCmd("status", 'localhost', /^repeat: /, function (data: newCmd) { mpdinterface.decodeStatus(data); });
                mpdinterface.connected=true;
            } else {
                console.log('reconnecting!');
            }
        });
        
        this.socket.on('close', function () {
            console.log('connection closed');
            mpdinterface.connect();
        });
    }
    
    public write(data: string) {
        if (data != 'status') {
            console.log('Mpd Tx:'+mpdinterface.cmds.length+';'+data);
        }
        this.socket.write(data+"\n");
    }
    
    static writeCmd(cmd: string, client: string, find: RegExp, callback: Function) {
        //var timestamp = new Date().getTime()/1000;
        mpdinterface.cmds[mpdinterface.cmds.length] = {cmd: cmd, response: "", txtime: 0, rxtime: 0, client: client, find: find, callback: callback};
        if (mpdinterface.cmds.length > 100) {
            mpdinterface.cmds.shift();
        }
        if (mpdinterface.mpdVer != "0.0.0") {
            mpdinterface.processCmdQueue(true);
        }
    }
    
    private processCmdQueue(yup: boolean) {
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
                    mpdinterface.cmds[i].response = data;
                    mpdinterface.cmds[i].rxtime = timestamp;
                    //console.log(mpdinterface.cmds);
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
        var temp = data.response.split("\n");
        var updateingdb = false;
        var pushUpdate = false;
        var updateCurrentTrack = false;
        for (var i = 0; temp[i]; ++i) {
            var values = temp[i].split(': ');
            if (mpdinterface.status[values[0]] != values[1]) {
                pushUpdate = true;
            }
            
            if (mpdinterface.status[values[0]] != values[1] && values[0] == 'playlist') {
                MpdInterface.writeCmd("playlistinfo", 'localhost', /^file: /, function (data: newCmd) { mpdinterface.decodePlaylistinfo(data); });
            } else if (mpdinterface.status[values[0]] != values[1] && values[0] == 'songid') {
                MpdInterface.writeCmd("currentsong", 'localhost', /^file: /, function (data: newCmd) { mpdinterface.decodeCurrentsong(data); });
            }
            
            if (values.length > 1) {
                mpdinterface.status[values[0]]=values[1]
                if (values[0] == 'updating_db') {
                    updateingdb = true;
                }
            }
        }
        if (!updateingdb && mpdinterface.status.updating_db) {
            mpdinterface.status.updating_db=0;
        }
        if (pushUpdate) {
            this.emit("status", mpdinterface.status);
        }
        setTimeout(function () { MpdInterface.writeCmd("status", 'localhost', /^repeat: /, function (data: newCmd) { mpdinterface.decodeStatus(data); }); }, (mpdinterface.cmdTxSpacing*10000));
    }
    
    private decodeCurrentsong(data: newCmd) {
        var temp = data.response.split("\n");
        
        for (const [key, value] of Object.entries(mpdinterface.currentsong)) {
            if (typeof(mpdinterface.currentsong[key]) == 'number') {
                mpdinterface.currentsong[key]=0;
            } else if (typeof(mpdinterface.currentsong[key]) == 'string') {
                mpdinterface.currentsong[key]='';
            }
        }
        
        for (var i = 0; temp[i]; ++i) {
            var values = temp[i].split(': ');
            if (values.length > 1) {
                mpdinterface.currentsong[values[0]]=values[1];
            }
        }
        
        this.emit("currentsong", mpdinterface.currentsong);
    }
    
    private decodePlaylistinfo(data: newCmd) {
        var temp = data.response.split("\n");
        if (mpdinterface.playlist.length > 0) {
            mpdinterface.playlist=[];
        }
        var t = -1;
        for (var i = 0; temp[i]; ++i) {
            var values = temp[i].split(': ');
            if (values.length > 1) {
                if (values[0] == 'file') {
                    ++t;
                    mpdinterface.playlist[t]={
                        file: "",
                        "Last-Modified": "",
                        Artist: "",
                        Title: "",
                        Album: "",
                        Track: "",
                        Genre: "",
                        Date: "",
                        AlbumArtist: "",
                        Time: 0,
                        duration: 0,
                        Pos: 0,
                        Id: 0
                    }
                }
                mpdinterface.playlist[t][values[0]]=values[1];
            }
        }
        this.emit("playlist", mpdinterface.playlist);
    }
    
    private logConsole(msg: string) {
        
    }
    
    public test() {
        return `${this.addr} on port ${this.port}`;
    }
}

export = MpdInterface;
