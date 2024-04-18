import { Server } from "socket.io";
import { BASE_CLIENT_URL } from "./util/urls";

let io: Server;

export const socket = {
    init: (httpServer: any) => {
        io = new Server(httpServer, {
            cors: {
                origin: [BASE_CLIENT_URL],
            },
        });
        return io;
    },
    getIO: () => {
        return io;
    },
};
