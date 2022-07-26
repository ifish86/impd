import MpdInterface = require('./MpdInterface');

"use strict";

const mpd = new MpdInterface(6600, '192.168.0.190');

console.log('hello mpd');
console.log(mpd.test());

mpd.connect();
//setTimeout(function () { mpd.write("stats\n"); },1000);
