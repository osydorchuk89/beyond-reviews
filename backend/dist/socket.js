"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.socket = void 0;
const socket_io_1 = require("socket.io");
const urls_1 = require("./util/urls");
let io;
exports.socket = {
    init: (httpServer) => {
        io = new socket_io_1.Server(httpServer, {
            cors: {
                origin: [urls_1.BASE_CLIENT_URL],
            },
        });
        return io;
    },
    getIO: () => {
        return io;
    },
};
