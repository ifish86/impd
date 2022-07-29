import MpdInterface = require('./MpdInterface');
import MpdClientProxy = require('./MpdClientProxy');

"use strict";

const mpd = new MpdInterface(6600, '192.168.0.190', 'lo');
const mpdProxy = new MpdClientProxy(6599, 6600, '192.168.0.190');

console.log(mpd.test());

mpd.connect();
mpdProxy.create();

type newCmd = {
        cmd: string,
        response: string,
        txtime: number,
        rxtime: number,
        client: string,
        find: RegExp,
        socket: any,
        callback: Function
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

mpd.on('mpdver', function (data: string) {
    mpdProxy.setMpdVer(data);
});
    
mpd.on('status', function (data: mpdStatus) {
    //console.log(data);
});

mpd.on('currentsong', function (data: any) {
    console.log('currentrack:');
    console.log(data);
});

mpd.on('playlist', function (data: any) {
    console.log('playlist:');
    console.log(data);
});

mpdProxy.on('data', function (socket: any, mpdc: any, data: string) {
    
    
});

mpdProxy.on('runDebugCmd', function (socket: any, cmd: string) {
    var data: string = runDebugCmd(cmd, '');
    mpdProxy.write(data, socket);
});

function runDebugCmd(cmd: string, socket: any) {
    cmd = cmd.trim();
    if (cmd == 'cmds') {
        //console.log(mpd.cmds);
        return JSON.stringify(mpd.cmds);
    } else {
        return 'command not defined:'+cmd;
    }
}

//setTimeout(function () { mpd.write("stats\n"); },1000);
