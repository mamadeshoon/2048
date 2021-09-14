// INITIATION
let Width;
let Height;
let vmin;
function changeWindowSize() {
    Width = window.innerWidth;
    Height = window.innerHeight;
    vmin = Math.min(Width, Height) / 100;
}
changeWindowSize();
window.onresize = changeWindowSize;
window.onload = changeWindowSize;

let gameInfo = localStorage.getItem("single-player-board");

/*
gameInfo = {
    "score":1, "best":1,
    "board":[[tile, 0, 0, tile],
             [tile, tile, 0, tile],
             [0, tile, tile, tile],
             [tile, tile, tile, 0]]
} 
tile = {"x": i, "y": j, "value": 2^n}

After all the tiles get loaded, the DOMElement property will be added for linking to UI
But for saving the game info, It will get removed
*/

try {
    gameInfo = JSON.parse(gameInfo);
    if (gameInfo === null) {
        throw "could not find a saved game";
    }
    if (isNaN(parseInt(gameInfo.score)) || isNaN(parseInt(gameInfo.best))) {
        throw "could not find score in gameInfo";
    }
} catch (e) {
    gameInfo = { score: 0, best: 0, board: [] };
    for (let i = 0; i < 4; i++) {
        // creating board
        const l = new Array(4).fill(0);
        gameInfo.board.push(l);
    }
    for (let k = 0; k < 2; k++) {
        // spawning the first two tiles
        gameInfo.board = spawnTile(gameInfo.board)[0];
    }
    const json = JSON.stringify(gameInfo);
    localStorage.setItem("single-player-board", json);
}
gameInfo.board = loadDOMs(gameInfo.board);
const score = document.getElementById("score");
const best = document.getElementById("best");
const newGameBtn = document.getElementById("new-game");
const gameModal = document.getElementById("game-modal");
score.innerHTML = "<br/>" + gameInfo.score;
best.innerHTML = "<br/>" + gameInfo.best;
const state = judge();
if (state.lose && !state.win) {
    window.setTimeout(function() {
        gameModal.classList.add("lose");
    }, 700);
}
if (state.lose && state.win) {
    window.setTimeout(function() {
        gameModal.classList.add("win");
    }, 700);
}

// GAME
let keydown = false;
document.addEventListener("keydown", function (e) {
    if (!keydown) {
        keydown = true;

        let dir = "";
        if (e.code === "ArrowUp" || e.code === "KeyW") {
            dir = "u";
        }
        if (e.code === "ArrowDown" || e.code === "KeyS") {
            dir = "d";
        }
        if (e.code === "ArrowLeft" || e.code === "KeyA") {
            dir = "l";
        }
        if (e.code === "ArrowRight" || e.code === "KeyD") {
            dir = "r";
        }
        if (dir == "u" || dir == "d" || dir == "l" || dir == "r") {
            // copy of board
            let board = [];
            for (let i = 0; i < gameInfo.board.length; i++) {
                let l = [];
                for (let j = 0; j < gameInfo.board[i].length; j++) {
                    l.push(gameInfo.board[i][j]);
                }
                board.push(l);
            }

            board = slide(board, dir);
            let colList;
            const comp = compute(board, dir);
            board = comp[0];
            colList = comp[1];
            board = slide(board, dir);

            let change = false;
            for (let i = 0; i < board.length; i++) {
                for (let j = 0; j < board[i].length; j++) {
                    if (board[i][j].value !== gameInfo.board[i][j].value) {
                        change = true;
                        break;
                    }
                }
                if (change) {
                    break;
                }
            }
            if (change) {
                // move was valid
                for (let i = 0; i < board.length; i++) {
                    for (let j = 0; j < board[i].length; j++) {
                        if (board[i][j] !== 0) {
                            if (board[i][j].x != i || board[i][j].y != j) {
                                board[i][j].x = i;
                                board[i][j].y = j;
                                const cellOrig = document.getElementById(
                                    "cell-0"
                                );
                                const cellDist = document.getElementById(
                                    `cell-${i * 4 + j}`
                                );
                                const distRect = cellDist.getBoundingClientRect();
                                const origRect = cellOrig.getBoundingClientRect();
                                let dx = (distRect.left - origRect.left) / vmin;
                                let dy = (distRect.top - origRect.top) / vmin;

                                board[i][j].DOMElement
                                    .style.transform = `translate(${dx}vmin, ${dy}vmin)`;
                            }
                        }
                    }
                }
                let roundScore = 0;
                for (let i = 0; i < colList.length; i++) {
                    const s1 = colList[i].s1.DOMElement;
                    const s2 = colList[i].s2.DOMElement;
                    const d = colList[i].d;

                    const cellOrig = document.getElementById("cell-0");
                    const origRect = cellOrig.getBoundingClientRect();
                    const distRect = d.DOMElement.getBoundingClientRect();
                    let dx = (distRect.left - origRect.left) / vmin;
                    let dy = (distRect.top - origRect.top) / vmin;
                    s1.style.transform = `translate(${dx}vmin, ${dy}vmin)`;
                    s2.style.transform = `translate(${dx}vmin, ${dy}vmin)`;
                    s1.classList.add("deleted");
                    s2.classList.add("deleted");
                    d.DOMElement.style.opacity = "1";

                    roundScore += d.value;
                }
                window.setTimeout(function() {
                    // remove deleted tiles
                    const deleted = document.getElementsByClassName("deleted");
                    while (deleted.length > 0) {
                        deleted[0].remove();
                    }
                }, 75);
                const sp = spawnTile(board);
                board = sp[0];
                const spi = sp[1];
                const spj = sp[2];
                if (spi !== undefined && spj !== undefined) {
                    const newTile = createDOM(board[spi][spj]);
                    board[spi][spj] = newTile;
                }
                gameInfo.board = board;
                gameInfo.score += roundScore;
                score.innerHTML = "<br/>" + gameInfo.score;
                if (gameInfo.best < gameInfo.score) {
                    gameInfo.best = gameInfo.score;
                    best.innerHTML = "<br/>" + gameInfo.best;
                }
                const savedGame = {
                    score: gameInfo.score,
                    best: gameInfo.best,
                    board: removeDOMs(board)
                };
                const savedJson = JSON.stringify(savedGame);
                localStorage.setItem("single-player-board", savedJson);
            }
            
            // judge the game
            const state = judge();
            if (state.lose && !state.win) {
                window.setTimeout(function() {
                    gameModal.classList.add("lose");
                }, 700);
            }
            if (state.lose && state.win) {
                window.setTimeout(function() {
                    gameModal.classList.add("win");
                }, 700);
            }
        }
    }
});
document.addEventListener("keyup", function (e) {
    keydown = false;
});

newGameBtn.addEventListener("click", function (e) {
    newGame();
});

// FUNCTIONS
function randomChoice(arr) {
    // takes an array and randomly returns an index
    const randomIndex = Math.floor(Math.random() * arr.length); // 0 to arr.length - 1
    return arr[randomIndex];
}

function getEmptyIndex(arr) {
    // takes an array and returns the index (i and j) of cells equal to 0
    let l = [];
    for (let i = 0; i < arr.length; i++) {
        for (let j = 0; j < arr[i].length; j++) {
            if (arr[i][j] === 0) {
                l.push([i, j]);
            }
        }
    }
    return l;
}

function spawnNumber() {
    // randomly returns 2(90%) or 4(10%)
    const random = Math.random();
    if (random < 0.9) {
        return 2;
    }
    return 4;
}

function removeDOMs(arr) {
    // removes the DOMElement from tiles for saving the game
    const res = [];
    for (let i = 0; i < arr.length; i++) {
        const l = []
        for (let j = 0; j < arr[i].length; j++) {
            if (arr[i][j] !== 0) {
                let obj = {
                    x: arr[i][j].x,
                    y: arr[i][j].y,
                    value: arr[i][j].value
                };
                l.push(obj);
            }
            else {
                l.push(0);
            }
        }
        res.push(l)
    }
    return res;
}

function spawnTile(arr) {
    // spawns a tile without a DOMElement related to it
    const newNum = spawnNumber();
    const emptyIndexArr = getEmptyIndex(arr);
    if (emptyIndexArr.length == 0) {
        return [arr, undefined, undefined];
    }
    const rIndex = randomChoice(emptyIndexArr);
    const newTile = { x: rIndex[0], y: rIndex[1], value: newNum };
    arr[rIndex[0]][rIndex[1]] = newTile;
    return [arr, rIndex[0], rIndex[1]];
}

function createDOM(tile, show = true) {
    const div = document.createElement("div");
    div.style.opacity = "0";
    div.classList.add("cell", "tile", `s${tile.value}`);

    const cellOrig = document.getElementById("cell-0");
    const cellDist = document.getElementById(`cell-${tile.x * 4 + tile.y}`);
    const distRect = cellDist.getBoundingClientRect();
    const origRect = cellOrig.getBoundingClientRect();
    let dx = (distRect.left - origRect.left) / vmin;
    let dy = (distRect.top - origRect.top) / vmin;

    div.style.transform = `translate(${dx}vmin, ${dy}vmin)`;
    const gridContainer = document.getElementById("grid-container");
    gridContainer.appendChild(div);
    if (show) {
        window.setTimeout(function () {
            div.style.opacity = "1";
        }, 50);
    }

    tile.DOMElement = div;
    return tile;
}

function loadDOMs(arr) {
    // creates DOMElements for tiles
    for (let i = 0; i < arr.length; i++) {
        for (let j = 0; j < arr[i].length; j++) {
            if (arr[i][j] !== 0) {
                arr[i][j] = createDOM(arr[i][j]);
            }
        }
    }
    return arr;
}

function slide(arr, dir) {
    if (dir === "u") {
        for (let j = 0; j < arr[0].length; j++) {
            let l = [];
            for (let i = 0; i < arr.length; i++) {
                if (arr[i][j] !== 0) {
                    l.push(arr[i][j]);
                }
            }
            const remain = arr.length - l.length;
            for (let k = 0; k < remain; k++) {
                l.push(0);
            }
            for (let i = 0; i < arr.length; i++) {
                arr[i][j] = l[i];
            }
        }
    }
    if (dir === "d") {
        for (let j = 0; j < arr[0].length; j++) {
            let l = [];
            for (let i = arr.length - 1; i > -1; i--) {
                if (arr[i][j] !== 0) {
                    l.push(arr[i][j]);
                }
            }
            const remain = arr.length - l.length;
            for (let k = 0; k < remain; k++) {
                l.push(0);
            }
            for (let i = arr.length - 1; i > -1; i--) {
                arr[i][j] = l[arr.length - 1 - i];
            }
        }
    }
    if (dir === "l") {
        for (let i = 0; i < arr.length; i++) {
            let l = [];
            for (let j = 0; j < arr[i].length; j++) {
                if (arr[i][j] !== 0) {
                    l.push(arr[i][j]);
                }
            }
            const remain = arr.length - l.length;
            for (let k = 0; k < remain; k++) {
                l.push(0);
            }
            for (let j = 0; j < arr[i].length; j++) {
                arr[i][j] = l[j];
            }
        }
    }
    if (dir === "r") {
        for (let i = 0; i < arr.length; i++) {
            let l = [];
            for (let j = arr[i].length - 1; j > -1; j--) {
                if (arr[i][j] !== 0) {
                    l.push(arr[i][j]);
                }
            }
            const remain = arr.length - l.length;
            for (let k = 0; k < remain; k++) {
                l.push(0);
            }
            for (let j = arr[i].length - 1; j > -1; j--) {
                arr[i][j] = l[arr[i].length - 1 - j];
            }
        }
    }
    return arr;
}

function compute(arr, dir) {
    let collisionList = [];
    if (dir === "u") {
        for (let j = 0; j < arr[0].length; j++) {
            for (let i = 0; i < arr.length - 1; i++) {
                if (arr[i][j] !== 0) {
                    if (arr[i][j].value === arr[i + 1][j].value) {
                        // tiles should collide
                        const v1 = arr[i + 1][j].value;
                        const v2 = arr[i][j].value;
                        let newTile = { x: i, y: j, value: v1 + v2 };
                        newTile = createDOM(newTile, false);
                        const collision = {
                            s1: arr[i + 1][j],
                            s2: arr[i][j],
                            d: newTile,
                        };
                        collisionList.push(collision);

                        arr[i][j] = newTile;
                        arr[i + 1][j] = 0;
                    }
                }
            }
        }
    }
    if (dir === "d") {
        for (let j = 0; j < arr[0].length; j++) {
            for (let i = arr.length - 1; i > 0; i--) {
                if (arr[i][j] !== 0) {
                    if (arr[i][j].value === arr[i - 1][j].value) {
                        // tiles should collide
                        const v1 = arr[i - 1][j].value;
                        const v2 = arr[i][j].value;
                        let newTile = { x: i, y: j, value: v1 + v2 };
                        newTile = createDOM(newTile, false);
                        const collision = {
                            s1: arr[i - 1][j],
                            s2: arr[i][j],
                            d: newTile,
                        };
                        collisionList.push(collision);

                        arr[i][j] = newTile;
                        arr[i - 1][j] = 0;
                    }
                }
            }
        }
    }
    if (dir === "l") {
        for (let i = 0; i < arr.length; i++) {
            for (let j = 0; j < arr[i].length - 1; j++) {
                if (arr[i][j] !== 0) {
                    if (arr[i][j].value === arr[i][j + 1].value) {
                        // tiles should collide
                        const v1 = arr[i][j + 1].value;
                        const v2 = arr[i][j].value;
                        let newTile = { x: i, y: j, value: v1 + v2 };
                        newTile = createDOM(newTile, false);
                        const collision = {
                            s1: arr[i][j + 1],
                            s2: arr[i][j],
                            d: newTile,
                        };
                        collisionList.push(collision);

                        arr[i][j] = newTile;
                        arr[i][j + 1] = 0;
                    }
                }
            }
        }
    }
    if (dir === "r") {
        for (let i = 0; i < arr.length; i++) {
            for (let j = arr[i].length - 1; j > 0; j--) {
                if (arr[i][j] !== 0) {
                    if (arr[i][j].value === arr[i][j - 1].value) {
                        // tiles should collide
                        const v1 = arr[i][j - 1].value;
                        const v2 = arr[i][j].value;
                        let newTile = { x: i, y: j, value: v1 + v2 };
                        newTile = createDOM(newTile, false);
                        const collision = {
                            s1: arr[i][j - 1],
                            s2: arr[i][j],
                            d: newTile,
                        };
                        collisionList.push(collision);

                        arr[i][j] = newTile;
                        arr[i][j - 1] = 0;
                    }
                }
            }
        }
    }
    return [arr, collisionList];
}

function newGame() {
    gameInfo.score = 0;
    score.innerHTML = "<br/>" + "0";

    for (let i = 0; i < gameInfo.board.length; i++) {
        for (let j = 0; j < gameInfo.board[i].length; j++) {
            if (gameInfo.board[i][j] !== 0) {
                gameInfo.board[i][j].DOMElement.remove();
                gameInfo.board[i][j] = 0;
            }
        }
    }

    gameModal.classList.remove("lose", "win");

    for (let k = 0; k < 2; k++) {
        // spawning the first two tiles
        gameInfo.board = spawnTile(gameInfo.board)[0];
    }

    const json = JSON.stringify(gameInfo);
    localStorage.setItem("single-player-board", json);
    gameInfo.board = loadDOMs(gameInfo.board);
}

function judge() {
    let board = gameInfo.board;
    let lose = true;
    let win = false;
    // win check
    for (let i = 0; i < board.length; i++) {
        for (let j = 0; j < board[i].length; j++) {
            if (board[i][j] !== 0) {
                if (board[i][j].value >= 2048) {
                    win = true;
                    break;
                }
            }
        }
        if (win) {
            break;
        }
    }
    // lose check
    for (let i = 0; i < board.length; i++) {
        for (let j = 0; j < board[i].length - 1; j++) {
            if (board[i][j] === 0 || board[i][j + 1] === 0) {
                lose = false;
                break;
            }
            if (board[i][j].value === board[i][j + 1].value) {
                lose = false;
                break;
            }
        }
        if (!lose) {
            break;
        }
    }
    for (let j = 0; j < board[0].length; j++) {
        for (let i = 0; i < board.length - 1; i++) {
            if (board[i][j].value === board[i + 1][j].value) {
                lose = false;
                break;
            }
        }
        if (!lose) {
            break;
        }
    }
    return {win: win, lose: lose};
}