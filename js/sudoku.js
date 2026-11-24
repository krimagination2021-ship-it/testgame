/**
 * NW Mini-Games: Sudoku Game
 * Unique namespace prefix: NWMG_ / nwmg-
 */

(function (window) {
  'use strict';

  const NWMG_Sudoku = {
    solutionGrid: [],
    initialGrid: [],
    currentGrid: [],
    notesGrid: [],
    historyStack: [],
    selectedCell: null, // { r, c }
    pencilMode: false,
    mistakes: 0,
    hintsUsed: 0,
    startTime: null,
    timerInterval: null,
    isSolved: false,

    init: function () {
      this.cacheDom();
      this.bindEvents();
      this.startNewGame();
    },

    cacheDom: function () {
      this.boardEl = document.getElementById('nwmg-sudoku-board');
      this.timerEl = document.getElementById('nwmg-sudoku-timer');
      this.mistakesEl = document.getElementById('nwmg-sudoku-mistakes');
      this.restartBtn = document.getElementById('nwmg-sudoku-restart-btn');
      this.keypad = document.getElementById('nwmg-sudoku-keypad');
      this.pencilBtn = document.getElementById('nwmg-tool-pencil');
      this.eraseBtn = document.getElementById('nwmg-tool-erase');
      this.hintBtn = document.getElementById('nwmg-tool-hint');
      this.undoBtn = document.getElementById('nwmg-tool-undo');
      this.modalOverlay = document.getElementById('nwmg-modal-overlay');
      this.modalStats = document.getElementById('nwmg-modal-stats');
      this.modalPlayAgain = document.getElementById('nwmg-modal-play-again');
    },

    bindEvents: function () {
      if (this.restartBtn) {
        this.restartBtn.addEventListener('click', () => this.startNewGame());
      }

      if (this.pencilBtn) {
        this.pencilBtn.addEventListener('click', () => this.togglePencilMode());
      }

      if (this.eraseBtn) {
        this.eraseBtn.addEventListener('click', () => this.eraseCurrentCell());
      }

      if (this.hintBtn) {
        this.hintBtn.addEventListener('click', () => this.provideHint());
      }

      if (this.undoBtn) {
        this.undoBtn.addEventListener('click', () => this.undoLastMove());
      }

      if (this.keypad) {
        this.keypad.addEventListener('click', (e) => {
          const btn = e.target.closest('.nwmg-key-btn');
          if (!btn) return;
          const val = parseInt(btn.dataset.val, 10);
          if (val >= 1 && val <= 9) {
            this.handleInput(val);
          }
        });
      }

      // Keyboard input
      window.addEventListener('keydown', (e) => {
        // Only handle if Sudoku game card is currently visible
        const sudokuCard = document.getElementById('nwmg-game-sudoku');
        if (!sudokuCard || !sudokuCard.classList.contains('nwmg-active')) return;

        if (this.isSolved) return;

        if (e.key >= '1' && e.key <= '9') {
          this.handleInput(parseInt(e.key, 10));
        } else if (e.key === 'Backspace' || e.key === 'Delete') {
          this.eraseCurrentCell();
        } else if (e.key === 'n' || e.key === 'N') {
          this.togglePencilMode();
        } else if (e.key === 'h' || e.key === 'H') {
          this.provideHint();
        } else if (e.key === 'z' && (e.ctrlKey || e.metaKey)) {
          this.undoLastMove();
        } else if (this.selectedCell) {
          let { r, c } = this.selectedCell;
          if (e.key === 'ArrowUp' && r > 0) this.selectCell(r - 1, c);
          else if (e.key === 'ArrowDown' && r < 8) this.selectCell(r + 1, c);
          else if (e.key === 'ArrowLeft' && c > 0) this.selectCell(r, c - 1);
          else if (e.key === 'ArrowRight' && c < 8) this.selectCell(r, c + 1);
        }
      });

      if (this.modalPlayAgain) {
        this.modalPlayAgain.addEventListener('click', () => {
          this.hideModal();
          this.startNewGame();
        });
      }
    },

    startNewGame: function () {
      this.isSolved = false;
      this.mistakes = 0;
      this.hintsUsed = 0;
      this.historyStack = [];
      this.selectedCell = null;
      this.pencilMode = false;
      if (this.pencilBtn) this.pencilBtn.classList.remove('nwmg-active-tool');
      if (this.mistakesEl) this.mistakesEl.textContent = '0';
      this.startTimer();
      this.hideModal();

      // Generate a fresh mathematical Sudoku grid on every load/restart
      this.generateSudoku();
      this.renderBoard();
      // Select first non-fixed cell by default
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          if (this.initialGrid[r][c] === 0) {
            this.selectCell(r, c);
            return;
          }
        }
      }
    },

    // Sudoku Generator & Solver
    generateSudoku: function () {
      // 1. Generate full solved 9x9 board
      const board = Array.from({ length: 9 }, () => Array(9).fill(0));
      this.fillBoardBacktrack(board);
      this.solutionGrid = board.map(row => [...row]);

      // 2. Create playable puzzle by removing numbers
      // Standard 1-level: ~33-35 clues
      const puzzle = board.map(row => [...row]);
      const targetClues = 34;
      const cellsToRemove = 81 - targetClues;

      const positions = [];
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          positions.push({ r, c });
        }
      }
      this.shuffleArray(positions);

      let removed = 0;
      for (let i = 0; i < positions.length && removed < cellsToRemove; i++) {
        const { r, c } = positions[i];
        puzzle[r][c] = 0;
        removed++;
      }

      this.initialGrid = puzzle.map(row => [...row]);
      this.currentGrid = puzzle.map(row => [...row]);
      this.notesGrid = Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => []));
    },

    fillBoardBacktrack: function (grid) {
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          if (grid[r][c] === 0) {
            const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9];
            this.shuffleArray(digits);

            for (let num of digits) {
              if (this.isValidPlacement(grid, r, c, num)) {
                grid[r][c] = num;
                if (this.fillBoardBacktrack(grid)) {
                  return true;
                }
                grid[r][c] = 0;
              }
            }
            return false;
          }
        }
      }
      return true;
    },

    isValidPlacement: function (grid, row, col, num) {
      for (let i = 0; i < 9; i++) {
        if (grid[row][i] === num) return false;
        if (grid[i][col] === num) return false;
      }
      const boxStartRow = Math.floor(row / 3) * 3;
      const boxStartCol = Math.floor(col / 3) * 3;
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          if (grid[boxStartRow + r][boxStartCol + c] === num) return false;
        }
      }
      return true;
    },

    shuffleArray: function (arr) {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
    },

    renderBoard: function () {
      if (!this.boardEl) return;
      this.boardEl.innerHTML = '';

      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          const cell = document.createElement('div');
          cell.className = 'nwmg-cell';
          cell.dataset.row = r;
          cell.dataset.col = c;
          cell.id = `nwmg-cell-${r}-${c}`;

          cell.addEventListener('click', () => this.selectCell(r, c));

          this.boardEl.appendChild(cell);
          this.updateCellDisplay(r, c);
        }
      }
    },

    selectCell: function (r, c) {
      this.selectedCell = { r, c };
      this.updateHighlights();
    },

    updateHighlights: function () {
      const selected = this.selectedCell;
      const selectedVal = selected ? this.currentGrid[selected.r][selected.c] : null;

      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          const cellEl = document.getElementById(`nwmg-cell-${r}-${c}`);
          if (!cellEl) continue;

          cellEl.classList.remove('nwmg-selected', 'nwmg-highlighted-peer', 'nwmg-highlighted-match');

          if (!selected) continue;

          // Selected cell
          if (r === selected.r && c === selected.c) {
            cellEl.classList.add('nwmg-selected');
          }
          // Same row, column, or 3x3 block
          else if (
            r === selected.r ||
            c === selected.c ||
            (Math.floor(r / 3) === Math.floor(selected.r / 3) && Math.floor(c / 3) === Math.floor(selected.c / 3))
          ) {
            cellEl.classList.add('nwmg-highlighted-peer');
          }

          // Same number across board
          if (selectedVal && selectedVal !== 0 && this.currentGrid[r][c] === selectedVal) {
            cellEl.classList.add('nwmg-highlighted-match');
          }
        }
      }
    },

    updateCellDisplay: function (r, c) {
      const cellEl = document.getElementById(`nwmg-cell-${r}-${c}`);
      if (!cellEl) return;

      const isFixed = this.initialGrid[r][c] !== 0;
      const val = this.currentGrid[r][c];
      const notes = this.notesGrid[r][c];

      cellEl.innerHTML = '';
      cellEl.classList.remove('nwmg-fixed', 'nwmg-user-entered', 'nwmg-conflict');

      if (isFixed) {
        cellEl.classList.add('nwmg-fixed');
        cellEl.textContent = val;
      } else if (val !== 0) {
        cellEl.classList.add('nwmg-user-entered');
        cellEl.textContent = val;

        // Check if value violates rules against peer cells
        if (this.hasConflict(r, c, val)) {
          cellEl.classList.add('nwmg-conflict');
        }
      } else if (notes && notes.length > 0) {
        // Render 3x3 pencil notes inside cell
        const notesGrid = document.createElement('div');
        notesGrid.className = 'nwmg-notes-grid';
        for (let i = 1; i <= 9; i++) {
          const noteDigit = document.createElement('div');
          noteDigit.className = 'nwmg-note-digit';
          noteDigit.textContent = notes.includes(i) ? i : '';
          notesGrid.appendChild(noteDigit);
        }
        cellEl.appendChild(notesGrid);
      }
    },

    hasConflict: function (row, col, num) {
      // Check row & col
      for (let i = 0; i < 9; i++) {
        if (i !== col && this.currentGrid[row][i] === num) return true;
        if (i !== row && this.currentGrid[i][col] === num) return true;
      }
      // Check 3x3 box
      const startRow = Math.floor(row / 3) * 3;
      const startCol = Math.floor(col / 3) * 3;
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          const currR = startRow + r;
          const currC = startCol + c;
          if ((currR !== row || currC !== col) && this.currentGrid[currR][currC] === num) {
            return true;
          }
        }
      }
      return false;
    },

    handleInput: function (num) {
      if (!this.selectedCell || this.isSolved) return;
      const { r, c } = this.selectedCell;

      // Fixed cells cannot be changed
      if (this.initialGrid[r][c] !== 0) return;

      if (this.pencilMode) {
        // Toggle note
        const notes = this.notesGrid[r][c];
        const idx = notes.indexOf(num);
        this.saveHistory({ type: 'notes', r, c, prevNotes: [...notes], prevVal: this.currentGrid[r][c] });

        if (idx >= 0) {
          notes.splice(idx, 1);
        } else {
          notes.push(num);
          notes.sort();
        }
        this.currentGrid[r][c] = 0; // Clear main val when writing note
        this.updateCellDisplay(r, c);
        this.playPopSound(500);
      } else {
        // Enter number
        const prevVal = this.currentGrid[r][c];
        const prevNotes = [...this.notesGrid[r][c]];

        this.saveHistory({ type: 'val', r, c, prevVal, prevNotes });
        this.currentGrid[r][c] = num;
        this.notesGrid[r][c] = []; // Clear notes for this cell

        // Check conflict
        const isConflict = this.hasConflict(r, c, num);
        if (isConflict) {
          this.mistakes++;
          if (this.mistakesEl) this.mistakesEl.textContent = this.mistakes;
          this.playErrorSound();
        } else {
          this.playPopSound(360 + num * 30);
        }

        this.updateCellDisplay(r, c);
        this.updateHighlights();

        this.checkVictory();
      }
    },

    eraseCurrentCell: function () {
      if (!this.selectedCell || this.isSolved) return;
      const { r, c } = this.selectedCell;
      if (this.initialGrid[r][c] !== 0) return;

      if (this.currentGrid[r][c] !== 0 || this.notesGrid[r][c].length > 0) {
        this.saveHistory({
          type: 'erase',
          r,
          c,
          prevVal: this.currentGrid[r][c],
          prevNotes: [...this.notesGrid[r][c]]
        });
        this.currentGrid[r][c] = 0;
        this.notesGrid[r][c] = [];
        this.updateCellDisplay(r, c);
        this.updateHighlights();
        this.playPopSound(250);
      }
    },

    togglePencilMode: function () {
      this.pencilMode = !this.pencilMode;
      if (this.pencilBtn) {
        if (this.pencilMode) {
          this.pencilBtn.classList.add('nwmg-active-tool');
        } else {
          this.pencilBtn.classList.remove('nwmg-active-tool');
        }
      }
    },

    provideHint: function () {
      if (this.isSolved) return;

      // Find all empty or incorrect non-fixed cells
      const candidates = [];
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          if (this.initialGrid[r][c] === 0 && this.currentGrid[r][c] !== this.solutionGrid[r][c]) {
            candidates.push({ r, c });
          }
        }
      }

      if (candidates.length === 0) return;

      // Pick selected cell if it's candidate, otherwise random
      let target = candidates[Math.floor(Math.random() * candidates.length)];
      if (this.selectedCell) {
        const matching = candidates.find(item => item.r === this.selectedCell.r && item.c === this.selectedCell.c);
        if (matching) target = matching;
      }

      const { r, c } = target;
      this.saveHistory({
        type: 'hint',
        r,
        c,
        prevVal: this.currentGrid[r][c],
        prevNotes: [...this.notesGrid[r][c]]
      });

      this.currentGrid[r][c] = this.solutionGrid[r][c];
      this.notesGrid[r][c] = [];
      this.hintsUsed++;
      this.selectCell(r, c);
      this.updateCellDisplay(r, c);
      this.playPopSound(600);

      this.checkVictory();
    },

    saveHistory: function (action) {
      this.historyStack.push(action);
      if (this.historyStack.length > 50) this.historyStack.shift();
    },

    undoLastMove: function () {
      if (this.isSolved || this.historyStack.length === 0) return;
      const last = this.historyStack.pop();
      const { r, c, prevVal, prevNotes } = last;

      this.currentGrid[r][c] = prevVal;
      this.notesGrid[r][c] = prevNotes || [];
      this.selectCell(r, c);
      this.updateCellDisplay(r, c);
      this.playPopSound(280);
    },

    checkVictory: function () {
      // Board must be fully filled and match solution
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          if (this.currentGrid[r][c] !== this.solutionGrid[r][c]) {
            return;
          }
        }
      }

      // Solved!
      this.isSolved = true;
      this.stopTimer();
      this.playWinSound();
      this.triggerConfetti();

      setTimeout(() => {
        this.showVictoryModal();
      }, 400);
    },

    startTimer: function () {
      this.stopTimer();
      this.startTime = Date.now();
      if (this.timerEl) this.timerEl.textContent = '00:00';
      this.timerInterval = setInterval(() => {
        const elapsedSec = Math.floor((Date.now() - this.startTime) / 1000);
        const mins = String(Math.floor(elapsedSec / 60)).padStart(2, '0');
        const secs = String(elapsedSec % 60).padStart(2, '0');
        if (this.timerEl) this.timerEl.textContent = `${mins}:${secs}`;
      }, 1000);
    },

    stopTimer: function () {
      if (this.timerInterval) {
        clearInterval(this.timerInterval);
        this.timerInterval = null;
      }
    },

    getFinalTimeString: function () {
      if (!this.startTime) return '00:00';
      const elapsedSec = Math.floor((Date.now() - this.startTime) / 1000);
      const mins = String(Math.floor(elapsedSec / 60)).padStart(2, '0');
      const secs = String(elapsedSec % 60).padStart(2, '0');
      return `${mins}:${secs}`;
    },

    showVictoryModal: function () {
      if (!this.modalOverlay) return;
      document.getElementById('nwmg-modal-title').textContent = 'Sudoku Mastered!';
      document.getElementById('nwmg-modal-msg').textContent = 'Brilliant logic! You completed the Sudoku puzzle without breaking the grid.';
      if (this.modalStats) {
        this.modalStats.innerHTML = `
          <div class="nwmg-modal-stat-item">
            <span class="nwmg-modal-stat-label">Time</span>
            <span class="nwmg-modal-stat-val">${this.getFinalTimeString()}</span>
          </div>
          <div class="nwmg-modal-stat-item">
            <span class="nwmg-modal-stat-label">Mistakes</span>
            <span class="nwmg-modal-stat-val">${this.mistakes}</span>
          </div>
          <div class="nwmg-modal-stat-item">
            <span class="nwmg-modal-stat-label">Hints</span>
            <span class="nwmg-modal-stat-val">${this.hintsUsed}</span>
          </div>
        `;
      }
      this.modalOverlay.classList.add('nwmg-modal-show');
    },

    hideModal: function () {
      if (this.modalOverlay) {
        this.modalOverlay.classList.remove('nwmg-modal-show');
      }
    },

    playPopSound: function (freq) {
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        gain.gain.setValueAtTime(0.06, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.08);
      } catch (e) {}
    },

    playErrorSound: function () {
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(140, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(100, ctx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.12);
      } catch (e) {}
    },

    playWinSound: function () {
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();
        const chords = [523.25, 659.25, 783.99, 1046.50];
        chords.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.1);
          gain.gain.setValueAtTime(0.1, ctx.currentTime + idx * 0.1);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.1 + 0.4);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + idx * 0.1);
          osc.stop(ctx.currentTime + idx * 0.1 + 0.4);
        });
      } catch (e) {}
    },

    triggerConfetti: function () {
      const canvas = document.getElementById('nwmg-confetti-canvas');
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      const particles = [];
      const colors = ['#38bdf8', '#818cf8', '#34d399', '#f43f5e', '#fbbf24'];

      for (let i = 0; i < 75; i++) {
        particles.push({
          x: canvas.width / 2,
          y: canvas.height * 0.4,
          vx: (Math.random() - 0.5) * 14,
          vy: (Math.random() - 0.7) * 14,
          size: Math.random() * 8 + 4,
          color: colors[Math.floor(Math.random() * colors.length)],
          rotation: Math.random() * 360,
          rotationSpeed: (Math.random() - 0.5) * 8
        });
      }

      let frame = 0;
      function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(p => {
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.32;
          p.rotation += p.rotationSpeed;

          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
          ctx.restore();
        });

        frame++;
        if (frame < 120) {
          requestAnimationFrame(animate);
        } else {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
      }
      animate();
    }
  };

  window.NWMG_Sudoku = NWMG_Sudoku;
})(window);
