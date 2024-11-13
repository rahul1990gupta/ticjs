import express from 'express';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import path from 'node:path';
import {Server} from "socket.io";


const app = express();
const server = createServer(app);
const io = new Server(server)

const __dirname = dirname(fileURLToPath(import.meta.url));


// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));


app.get('/', (req, res) => {
  res.sendFile(join(__dirname, 'index.html'));
});

var playersWaiting = [];
var playersPlaying = new Map();


io.on("connection", (socket) =>{

    // handle players lifecyle
    playersWaiting.push(socket.id);
    
    console.log(playersWaiting);
    console.log(playersPlaying);

    if(playersWaiting.length >=2){
        var firstPlayer = playersWaiting.shift();
        var secondPlayer = playersWaiting.shift();

        playersPlaying.set(firstPlayer, secondPlayer);
        playersPlaying.set(secondPlayer, firstPlayer);
        console.log("players", firstPlayer, secondPlayer);
        io.to(firstPlayer).emit("matched", secondPlayer);
        io.to(secondPlayer).emit("matched", firstPlayer);
        io.to(secondPlayer).emit("change-player");
    }

    socket.on("disconnect", () => {
        if(playersPlaying.has(socket.id)){
            var partner = playersPlaying.get(socket.id);
            playersPlaying.delete(partner);
            playersPlaying.delete(socket.id);
        }
    })

    // handle draw/win event 
    socket.on("game-state", (fromPlayer, state) =>{
        console.log("game-state", fromPlayer, state);
        var opponent = playersPlaying[socket.id];
        io.to(opponent).emit("game-state", fromPlayer, state);
    })

    
    // handle move 
    socket.on("move-key", (fromPlayer, moveKey) => {
        console.log("move-key", fromPlayer, moveKey);
        var opponent = playersPlaying[socket.id];
        io.to(opponent).emit("move-key", fromPlayer, moveKey);
    })

})

server.listen(3000, () => {
    console.log('server running at http://localhost:3000');
});