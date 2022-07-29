import net = require('net');
import MpdInterface = require('./MpdInterface');
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


var mpdclientproxy: any;

"use strict";
class MpdClientProxy extends EventEmitter {
    port: number;
    mpdPort: number;
    mpdHost: string;
    cmds: newCmd[] = []
    socket: any;
    running: boolean;
    mpdVer: string;
    server: any;
    constructor(p: number, mp: number, mh: string) {
        super();
        this.port = p;
        this.mpdPort = mp;
        this.mpdHost = mh;
        this.running = false;
        this.mpdVer = "0.0.0";
        this.server = net.createServer((socket: any)=>{
            var temp = socket.remoteAddress.toString().split(':');
            const mpdsocket = net.createConnection(this.mpdPort, this.mpdHost);
            socket.on("data",(data: any)=>{
                console.log('proxy says:'+socket.remoteAddress.toString()+';'+data);
                var cmds = data.toString().split("\n");
                for (var i = 0; i < cmds.length; ++i) {
                    //console.log(cmds[i]);
                    if (cmds[i] != "") {
                        if (cmds[i].substr(0,6) == 'debug.') {
                            this.emit("runDebugCmd", socket, cmds[i].substr(6));
                        } else {
                            mpdsocket.write(cmds[i]+"\n");
                        }
                    }
                }
            });
            mpdsocket.on("data",(data:any)=>{
                socket.write(data.toString());
            });
            socket.on("close",()=>{
                console.log("Connection closed.!!!")
            });
            
           
            
        });
    }
    
    public create() {
        const net = require("net");
        
        //this.socket = this.server;
        this.server.listen(this.port);
        this.running = true;
        mpdclientproxy=this;
    }
    
    public write(data: string, socket: any) {
        socket.write(data);
    }
    
    public setMpdVer(v: string) {
        this.mpdVer = v;
    }
}


export = MpdClientProxy;
