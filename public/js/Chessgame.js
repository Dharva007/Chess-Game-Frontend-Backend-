// Chessgame.js Frontend

const socket = io();
const chess = new Chess();
const boardEl = document.getElementById("chessboard");


let playerRole = null;   // "w" or "b"
let selectedSquare = null;
let currentTurn = "w";   // start white


// unicode map 
const getPieceUnicode = (piece) => {
  const map = {
    p: "♟", r: "♜", n: "♞", b: "♝", q: "♛", k: "♚",
    P: "♙", R: "♖", N: "♘", B: "♗", Q: "♕", K: "♔"
  };
  return map[piece.color === "w" ? piece.type.toUpperCase() : piece.type];
};

// const getPieceUnicode = (piece) => {
//   const map = {
//     p: "♟", r: "♜", n: "♞", b: "♝", q: "♛", k: "♚",
//     P: "♙", R: "♖", N: "♘", B: "♗", Q: "♕", K: "♔"
//   };
//   return piece.color === "w" ? map[piece.type.toUpperCase()] : map[piece.type];
// };


//  render board
let lastMoveSquares = [];

function renderBoard() {
  const board = chess.board();
  boardEl.innerHTML = "";

  const rows = playerRole === "b" ? [...board].reverse() : board;

  rows.forEach((row, r) => {
    const cols = playerRole === "b" ? [...row].reverse() : row;

    cols.forEach((square, c) => {
      const sq = document.createElement("div");
      sq.className = `square ${(r + c) % 2 === 0 ? "light" : "dark"}`;
      
      let file = playerRole === "b" ? 7 - c : c;
      let rank = playerRole === "b" ? r + 1 : 8 - r;
      sq.dataset.square = String.fromCharCode(97 + file) + rank;

      if (square) sq.textContent = getPieceUnicode(square);

      // highlight last move

      lastMoveSquares.forEach(sqName => {
        if (sq.dataset.square === sqName) sq.classList.add("highlight");
      });

      boardEl.appendChild(sq);
    });
  });
}

socket.on('move', (move) => {
  chess.move(move);
  lastMoveSquares = [move.from, move.to];
  renderBoard();
});


// click handling
// boardEl.addEventListener("click", (e) => {
//   const sq = e.target.dataset.square;
//   if (!sq || !playerRole) return;

boardEl.addEventListener("click", (e) => {
  const sq = e.target.dataset.square; // define square
  if (!sq) {
    selectedSquare = null;
    document.querySelectorAll(".square").forEach(s => s.classList.remove("highlight"));
    return;
  }

  // only allow move on your turn

  if (playerRole !== currentTurn) {
    console.log("⏳ Wait for your turn!");
    return;
  }

  if (!selectedSquare) {
    selectedSquare = sq;
    e.target.classList.add("highlight");
  } else {
    const move = { from: selectedSquare, to: sq };
    socket.emit("move", move);
    selectedSquare = null;
    document.querySelectorAll(".square").forEach((s) =>
      s.classList.remove("highlight")
    );
  }
});


// SOCKET EVENTS
socket.on("turn", (turn) => {
  currentTurn = turn;
  const statusEl = document.getElementById("status");
  statusEl.textContent =
    playerRole === turn
      ? "⏳ Taro Varo Che le ne bhai "
      : `Rahh jo Same Valo Teno Da ley che  ${turn === "w" ? "White" : "Black"}`;
});


// echo "# Chess-Game-Frontend-Backend-" >> README.md
// git init
// git add README.md
// git commit -m "first commit"
// git branch -M main
// git remote add origin https://github.com/Dharva007/Chess-Game-Frontend-Backend-.git
// git push -u origin main


// assign player
socket.on("playerColor", (color) => {
  playerRole = color;
  console.log("🎮 You are", color === "w" ? "White" : "Black");
  renderBoard();
});

// Just a spectator
socket.on("spectatorRole", () => {
  console.log("👀 You are a spectator");
});

// on move from server
socket.on("move", (move) => {
  chess.move(move);
  renderBoard();
});

//  board update
socket.on("boardState", (fen) => {
  chess.load(fen);
  renderBoard();
});

//your turn update
socket.on("turn", (turn) => {
  currentTurn = turn;
  console.log("👉 This is your turn:", turn === "w" ? "White" : "Black");
});

// for invalid move
socket.on("invalidMove", (msg) => {
  console.warn("❌ Sorry Bro Stay patient", msg.reason);
});

renderBoard();
