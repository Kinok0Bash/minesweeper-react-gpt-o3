import React, { useState } from 'react';
import './App.css';

const ROWS = 10;
const COLS = 10;
const MINES_COUNT = 15;

// Функция для генерации доски с минами и подсчётом соседних мин
const generateBoard = () => {
  const board = [];
  for (let i = 0; i < ROWS; i++) {
    const row = [];
    for (let j = 0; j < COLS; j++) {
      row.push({
        x: i,
        y: j,
        isMine: false,
        adjacentMines: 0,
        revealed: false,
        flagged: false,
      });
    }
    board.push(row);
  }

  // Расставляем мины случайным образом
  let minesPlaced = 0;
  while (minesPlaced < MINES_COUNT) {
    const randX = Math.floor(Math.random() * ROWS);
    const randY = Math.floor(Math.random() * COLS);
    if (!board[randX][randY].isMine) {
      board[randX][randY].isMine = true;
      minesPlaced++;
    }
  }

  // Подсчитываем количество мин вокруг каждой клетки
  for (let i = 0; i < ROWS; i++) {
    for (let j = 0; j < COLS; j++) {
      if (board[i][j].isMine) continue;
      let mines = 0;
      for (let x = -1; x <= 1; x++) {
        for (let y = -1; y <= 1; y++) {
          const newX = i + x;
          const newY = j + y;
          if (newX >= 0 && newX < ROWS && newY >= 0 && newY < COLS) {
            if (board[newX][newY].isMine) {
              mines++;
            }
          }
        }
      }
      board[i][j].adjacentMines = mines;
    }
  }
  return board;
};

// Компонент отдельной клетки с анимацией открытия
const Cell = ({ cell, onClick, onContextMenu }) => {
  return (
      <div
          className={`cell ${cell.revealed ? 'revealed' : ''} ${cell.isMine && cell.revealed ? 'mine' : ''}`}
          onClick={onClick}
          onContextMenu={onContextMenu}
      >
        {cell.revealed && !cell.isMine && cell.adjacentMines > 0 ? cell.adjacentMines : ''}
        {cell.flagged && !cell.revealed ? '🚩' : ''}
      </div>
  );
};

// Основной компонент доски
const Board = () => {
  const [board, setBoard] = useState(generateBoard());
  const [gameOver, setGameOver] = useState(false);
  const [win, setWin] = useState(false);

  const revealCell = (x, y) => {
    if (gameOver) return;
    // Клонируем доску, чтобы избежать мутаций
    let newBoard = board.map(row => row.map(cell => ({ ...cell })));
    const cell = newBoard[x][y];

    if (cell.revealed || cell.flagged) return;
    cell.revealed = true;

    // Если нажали на мину – игра окончена
    if (cell.isMine) {
      setGameOver(true);
      newBoard = newBoard.map(row => row.map(c => {
        if (c.isMine) c.revealed = true;
        return c;
      }));
      setBoard(newBoard);
      return;
    }

    // Если рядом нет мин – рекурсивно открываем соседей
    if (cell.adjacentMines === 0) {
      const revealNeighbors = (i, j) => {
        for (let dx = -1; dx <= 1; dx++) {
          for (let dy = -1; dy <= 1; dy++) {
            const newX = i + dx;
            const newY = j + dy;
            if (newX >= 0 && newX < ROWS && newY >= 0 && newY < COLS) {
              const neighbor = newBoard[newX][newY];
              if (!neighbor.revealed && !neighbor.flagged) {
                neighbor.revealed = true;
                if (neighbor.adjacentMines === 0 && !neighbor.isMine) {
                  revealNeighbors(newX, newY);
                }
              }
            }
          }
        }
      };
      revealNeighbors(x, y);
    }

    // Проверяем, победил ли игрок
    let safeCells = 0;
    newBoard.forEach(row => row.forEach(c => {
      if (!c.isMine && c.revealed) safeCells++;
    }));
    if (safeCells === ROWS * COLS - MINES_COUNT) {
      setWin(true);
      newBoard = newBoard.map(row => row.map(c => ({ ...c, revealed: true })));
    }
    setBoard(newBoard);
  };

  // Обработка правого клика для установки флага
  const handleRightClick = (e, x, y) => {
    e.preventDefault();
    if (gameOver) return;
    const newBoard = board.map(row => row.map(cell => ({ ...cell })));
    const cell = newBoard[x][y];
    if (!cell.revealed) {
      cell.flagged = !cell.flagged;
      setBoard(newBoard);
    }
  };

  const resetGame = () => {
    setBoard(generateBoard());
    setGameOver(false);
    setWin(false);
  };

  return (
      <div className="board-container">
        <h1>Сапёр</h1>
        {(gameOver || win) && (
            <div className="message">
              {win ? "Победа! Вы обезвредили все мины!" : "Бах! Игра окончена!"}
              <button onClick={resetGame}>Начать заново</button>
            </div>
        )}
        <div className="board">
          {board.map((row, i) => (
              <div key={i} className="row">
                {row.map((cell, j) => (
                    <Cell
                        key={`${i}-${j}`}
                        cell={cell}
                        onClick={() => revealCell(i, j)}
                        onContextMenu={(e) => handleRightClick(e, i, j)}
                    />
                ))}
              </div>
          ))}
        </div>
      </div>
  );
};

const App = () => {
  return (
      <div className="App">
        <Board />
      </div>
  );
};

export default App;
