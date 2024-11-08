// https://github.com/deucenn/tic-tac-toe


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
        for (let i =0; i<3; i++){
            console.log(board[i].join("|"));
        }
        
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

GameState = {
    PLAYING: "PLAYING",
    WON: "WON",
    DRAW: "DRAW"
}


let Game = (cs) => {
    gameBoard = GameBoard();
    currentPlayer = "O";

    state = GameState.PLAYING;

    function switchPlayer(){
        if (currentPlayer =="O"){
            currentPlayer = "X";
        }
        else currentPlayer ="O";
    }
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
            const {row, col} = await cs.readInput(currentPlayer);
    
            let moveStatus = gameBoard.move(currentPlayer, row, col);
    
            gameBoard.displayBoard()
        
            winner = checkWin();
            if (winner == "O" || winner == "X"){
                state = GameState.WON
                console.log(winner, " Won!");
            }
            else if(checkDraw()){
                state = GameState.DRAW;
                console.log("Game is Draw.")
            }
            else {
                // if last move was legal
                if (moveStatus) switchPlayer();
            }        
        }
    }
    return {gameBoard, play};
}

ConsoleScreen = () => {
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


DOMWindow = () => {
    function readInput(currentPlayer) {
        document.getElementById("player").innerText = currentPlayer;

        return new Promise((resolve) => {
            const cells = document.getElementsByClassName("cell");

            function clickHandler(event) {
                const ix = event.target.dataset.key - 1;
                const row = Math.floor(ix / 3);
                const col = ix % 3;

                // Update the cell's text with the current player's symbol
                event.target.innerText = currentPlayer;

                // Clean up event listeners on all cells
                for (let i = 0; i < cells.length; i++) {
                    cells[i].removeEventListener("click", clickHandler);
                }

                resolve({ row, col });
            }

            // Add click event listeners to each cell
            for (let i = 0; i < cells.length; i++) {
                cells[i].addEventListener("click", clickHandler);
            }
        });
    }

    return { readInput };
};

//  c = ConsoleScreen();

 c  = DOMWindow()
Game(c).play()