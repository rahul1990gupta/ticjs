// https://github.com/deucenn/tic-tac-toe


const socket = io(); 

let GameBoard = () =>{
    let board = []
    for (let i=0; i < 3; i++){
        let row = []
        for (let j=0; j<3; j++){
            row.push(" ");
        }
        board.push(row);
    }
    function displayBoard() {
        var rows = []
        for (let i =0; i<3; i++){
            row = board[i].join("|");
            rows.push(row);
        }
        return rows.join("\n");
    }
    function move(player, row, col){
        if(board[row][col] ==" "){
            board[row][col] = player;
            return true;
        }
        return false;

    }
    return{board, move, displayBoard}
}

const GameState = {
    PLAYING: "PLAYING",
    WON: "WON",
    DRAW: "DRAW"
}


let Game = (cs) => {

    this.currentPlayer = "O";
    gameBoard = GameBoard();
    this.turn = true;

    state = GameState.PLAYING;

    function checkDraw(){
        for (let i=0; i<3; i++){
            for (let j =0; j<3; j++){
                if (gameBoard.board[i][j] == " "){
                    return false;
                }
            }
        }
        return true;
    }

    function checkWin() {
        const bd = gameBoard.board;
        const winningCombos = [
            // Horizontal
            [[0, 0], [0, 1], [0, 2]],
            [[1, 0], [1, 1], [1, 2]],
            [[2, 0], [2, 1], [2, 2]],
            // Vertical
            [[0, 0], [1, 0], [2, 0]],
            [[0, 1], [1, 1], [2, 1]],
            [[0, 2], [1, 2], [2, 2]],
            // Diagonal
            [[0, 0], [1, 1], [2, 2]],
            [[0, 2], [1, 1], [2, 0]],
        ];
    
        for (const combo of winningCombos) {
            const [a, b, c] = combo;
            if (bd[a[0]][a[1]] === bd[b[0]][b[1]] && bd[b[0]][b[1]] === bd[c[0]][c[1]] && bd[a[0]][a[1]] !== " ") {
                return bd[a[0]][a[1]];
            }
        }
    
        return " ";
    }
    

    async function play(){
        while (state == GameState.PLAYING) {
            console.log("inside play", this.turn, this.currentPlayer);
            
            const {row, col, key} = await cs.readInput(this.currentPlayer);
            cs.acceptInput(this.currentPlayer, this.turn, key);

            console.log("after  input", this.turn, this.currentPlayer);
            
            if(!this.turn ) continue;
            let moveStatus = gameBoard.move(this.currentPlayer, row, col);
            
            if(!moveStatus) continue;

            gameBoard.displayBoard()
        
            winner = checkWin();
            if (winner == "O" || winner == "X"){
                state = GameState.WON
                console.log(winner, " Won!");
                socket.emit("game-state", this.currentPlayer, state);
            }
            else if(checkDraw()){
                state = GameState.DRAW;
                console.log("Game is Draw.")
                socket.emit("game-state", this.currentPlayer, state);
            }
            cs.updateResult(this.currentPlayer, state);
            this.turn = false;
        }
    }
    return {gameBoard, play, this:currentPlayer, this:turn};
}

const ConsoleScreen = () => {
    function readInput(currentPlayer){
        console.log("Please enter the cell number for player (1-9):", currentPlayer)

        return new Promise((resolve) => {
            process.stdin.resume();
            process.stdin.setEncoding("utf8");

            process.stdin.once("data", function (input) {
                // Trim the input to remove any trailing newline or whitespace
                ix = parseInt(input.trim()) -1;
                row = Math.floor(ix / 3);
                col = ix % 3;
                process.stdin.pause();

                resolve({row, col});
            });
        })
    }
    return {readInput};
}

const DOMWindow = () => {
    function readInput() {
        return new Promise((resolve) => {
            const cells = document.getElementsByClassName("cell");

            function clickHandler(event) {
                console.log("inside clickhandler", event.target.innerText);
                const ix = event.target.dataset.key - 1;
                const key = event.target.dataset.key;
                const row = Math.floor(ix / 3);
                const col = ix % 3;
                
                // Clean up event listeners on all cells
                for (let i = 0; i < cells.length; i++) {
                    cells[i].removeEventListener("click", clickHandler);
                }

                resolve({ row, col, key });
            }

            // Add click event listeners to each cell
            for (let i = 0; i < cells.length; i++) {
                cells[i].addEventListener("click", clickHandler);
            }   
        });
    }

    function acceptInput(currentPlayer, turn, moveKey){
        const cell = document.querySelector(`button[data-key='${moveKey}']`);

        if(cell.innerText == "" && turn){
            cell.innerText = currentPlayer;
            socket.emit("move-key", currentPlayer, moveKey)
        }
    }

    function updateResult(currentPlayer, state){
        if (state == GameState.DRAW || state == GameState.WON){
            document.getElementById("result").innerText=currentPlayer + " "+ state;
        }
    }

    return { readInput, updateResult, acceptInput };
};

var dom  = DOMWindow();
var g;

socket.on("num-players", (num_players) => {
    document.getElementById("num-players").innerText = num_players
})

// Match with another player
socket.on("matched", (symbol, opponent) =>  {
    g = Game(dom);

    console.log("matched", symbol);
    g.currentPlayer = symbol;

    if(symbol == "X") {
        g.turn = false;
    }
    else {
        g.turn = true
    }

    document.getElementById("player").innerText = symbol;
    // document.getElementById("debug").innerText = "Matched with player " + opponent
    g.play();

})

socket.on("move-key", (fromPlayer, moveKey) => {
  // update the button 
  console.log("move-key", fromPlayer, moveKey);

  document.querySelector(`button[data-key='${moveKey}']`).innerText = fromPlayer;

  // update gameboard
  const row = Math.floor((moveKey-1) / 3);
  const col = (moveKey-1) % 3;
  g.gameBoard.move(fromPlayer, row, col);
  g.turn = true;
})

socket.on("game-state", (fromPlayer, state) => {
    g.turn = false;
    dom.updateResult(fromPlayer, state);
})

