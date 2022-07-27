import MpdInterface = require('./MpdInterface');

"use strict";

const mpd = new MpdInterface(6600, '192.168.0.190');

console.log('hello mpd');
console.log(mpd.test());

mpd.connect();

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



//setTimeout(function () { mpd.write("stats\n"); },1000);
