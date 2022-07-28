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


var mpdclientproxy: any;

"use strict";
class MpdClientProxy extends EventEmitter {
    port: number;
    cmds: newCmd[] = []
    socket: any;
    running: boolean;
    constructor(p: number) {
        super();
        this.port = p;
        this.running = false;
    }
    
    public create() {
        const net = require("net");
        const server = net.createServer((socket: any)=>{
            socket.write("Hello From Server!")
            console.log(socket);
            socket.on("data",(data: any)=>{
                //console.log(data.toString())
                this.emit("data", data.toString());
            });
            socket.on("close",()=>{
                console.log("Connection closed.!!!")
            })
        });
        this.socket = server;
        server.listen(this.port);
        
    }
}


export = MpdClientProxy;
