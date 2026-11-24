/**
 * NW Mini-Games: Carousel Puzzle Game
 * Unique namespace prefix: NWMG_ / nwmg-
 */

(function (window) {
  'use strict';

  const NWMG_CarouselPuzzle = {
    cols: 4,
    rows: 4,
    stripOffsets: [0, 0, 0, 0], // Current shift (0 to rows-1) for each column
    moves: 0,
    startTime: null,
    timerInterval: null,
    isSolved: false,
    currentThemeIndex: 0,
    artworkCanvas: null,

    themes: [
      {
        name: "Sunset Horizon",
        render: function (ctx, width, height) {
          // Sky gradient
          const sky = ctx.createLinearGradient(0, 0, 0, height);
          sky.addColorStop(0, '#f97316');
          sky.addColorStop(0.35, '#ec4899');
          sky.addColorStop(0.65, '#8b5cf6');
          sky.addColorStop(1, '#1e1b4b');
          ctx.fillStyle = sky;
          ctx.fillRect(0, 0, width, height);

          // Glowing Sun
          const sunGrad = ctx.createRadialGradient(width * 0.5, height * 0.45, 10, width * 0.5, height * 0.45, 75);
          sunGrad.addColorStop(0, '#fef08a');
          sunGrad.addColorStop(0.5, '#fde047');
          sunGrad.addColorStop(1, 'rgba(253, 224, 71, 0)');
          ctx.fillStyle = sunGrad;
          ctx.beginPath();
          ctx.arc(width * 0.5, height * 0.45, 75, 0, Math.PI * 2);
          ctx.fill();

          // Mountains back
          ctx.fillStyle = '#4c1d95';
          ctx.beginPath();
          ctx.moveTo(0, height * 0.65);
          ctx.lineTo(width * 0.25, height * 0.48);
          ctx.lineTo(width * 0.55, height * 0.62);
          ctx.lineTo(width * 0.8, height * 0.42);
          ctx.lineTo(width, height * 0.65);
          ctx.lineTo(width, height);
          ctx.lineTo(0, height);
          ctx.fill();

          // Mountains front
          ctx.fillStyle = '#2e1065';
          ctx.beginPath();
          ctx.moveTo(0, height * 0.72);
          ctx.lineTo(width * 0.38, height * 0.56);
          ctx.lineTo(width * 0.7, height * 0.7);
          ctx.lineTo(width, height * 0.58);
          ctx.lineTo(width, height);
          ctx.lineTo(0, height);
          ctx.fill();

          // Lake reflection
          const lakeGrad = ctx.createLinearGradient(0, height * 0.75, 0, height);
          lakeGrad.addColorStop(0, '#1e1b4b');
          lakeGrad.addColorStop(1, '#0f172a');
          ctx.fillStyle = lakeGrad;
          ctx.fillRect(0, height * 0.75, width, height * 0.25);

          // Sun reflection ripples
          ctx.fillStyle = 'rgba(253, 224, 71, 0.4)';
          for (let y = height * 0.78; y < height; y += 12) {
            const w = (y - height * 0.75) * 2.2;
            ctx.fillRect(width * 0.5 - w / 2, y, w, 3);
          }

          // Birds
          ctx.strokeStyle = '#fef08a';
          ctx.lineWidth = 2.5;
          [
            [width * 0.25, height * 0.25],
            [width * 0.35, height * 0.2],
            [width * 0.68, height * 0.28]
          ].forEach(([bx, by]) => {
            ctx.beginPath();
            ctx.arc(bx - 10, by, 10, Math.PI * 1.2, 0);
            ctx.arc(bx + 10, by, 10, Math.PI, Math.PI * 1.8);
            ctx.stroke();
          });
        }
      },
      {
        name: "Cyber Neon City",
        render: function (ctx, width, height) {
          // Dark space background
          ctx.fillStyle = '#050515';
          ctx.fillRect(0, 0, width, height);

          // Neon Grid lines (perspective horizon)
          ctx.strokeStyle = '#06b6d4';
          ctx.lineWidth = 1;
          for (let y = height * 0.65; y <= height; y += 16) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
          }
          for (let x = -width; x <= width * 2; x += 36) {
            ctx.beginPath();
            ctx.moveTo(width / 2, height * 0.65);
            ctx.lineTo(x, height);
            ctx.stroke();
          }

          // Cyber Moon
          const moonGrad = ctx.createLinearGradient(0, height * 0.1, 0, height * 0.45);
          moonGrad.addColorStop(0, '#ff007f');
          moonGrad.addColorStop(1, '#ffbc00');
          ctx.fillStyle = moonGrad;
          ctx.beginPath();
          ctx.arc(width * 0.5, height * 0.32, 65, 0, Math.PI * 2);
          ctx.fill();

          // Horizontal neon slices through moon
          ctx.fillStyle = '#050515';
          for (let y = height * 0.25; y < height * 0.45; y += 7) {
            ctx.fillRect(width * 0.25, y, width * 0.5, 3);
          }

          // City skyline buildings
          const buildings = [
            { x: 10, w: 42, h: 140, color: '#111827' },
            { x: 58, w: 38, h: 190, color: '#1f2937' },
            { x: 102, w: 48, h: 110, color: '#111827' },
            { x: 156, w: 52, h: 220, color: '#0f172a' },
            { x: 214, w: 45, h: 170, color: '#1f2937' },
            { x: 265, w: 40, h: 130, color: '#111827' },
            { x: 310, w: 42, h: 180, color: '#1f2937' }
          ];

          buildings.forEach(b => {
            ctx.fillStyle = b.color;
            ctx.fillRect(b.x, height * 0.65 - b.h, b.w, b.h);
            ctx.strokeStyle = '#a855f7';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(b.x, height * 0.65 - b.h, b.w, b.h);

            // Lit windows
            ctx.fillStyle = '#22d3ee';
            for (let wy = height * 0.65 - b.h + 12; wy < height * 0.65 - 12; wy += 18) {
              for (let wx = b.x + 6; wx < b.x + b.w - 6; wx += 12) {
                if (Math.random() > 0.4) {
                  ctx.fillRect(wx, wy, 5, 8);
                }
              }
            }
          });
        }
      },
      {
        name: "Deep Space Cosmos",
        render: function (ctx, width, height) {
          // Deep void background
          ctx.fillStyle = '#020617';
          ctx.fillRect(0, 0, width, height);

          // Nebula cloud
          const nebula = ctx.createRadialGradient(width * 0.35, height * 0.4, 20, width * 0.4, height * 0.4, 180);
          nebula.addColorStop(0, 'rgba(168, 85, 247, 0.6)');
          nebula.addColorStop(0.5, 'rgba(59, 130, 246, 0.4)');
          nebula.addColorStop(1, 'rgba(2, 6, 23, 0)');
          ctx.fillStyle = nebula;
          ctx.fillRect(0, 0, width, height);

          // Stars
          ctx.fillStyle = '#ffffff';
          for (let i = 0; i < 90; i++) {
            const sx = (Math.sin(i * 99) * 0.5 + 0.5) * width;
            const sy = (Math.cos(i * 33) * 0.5 + 0.5) * height;
            const size = (i % 4 === 0) ? 2.5 : 1.2;
            ctx.beginPath();
            ctx.arc(sx, sy, size, 0, Math.PI * 2);
            ctx.fill();
          }

          // Giant ringed planet
          const px = width * 0.68;
          const py = height * 0.55;
          const pr = 60;

          // Back half of planetary ring
          ctx.save();
          ctx.translate(px, py);
          ctx.rotate(-0.35);
          ctx.beginPath();
          ctx.ellipse(0, 0, 110, 26, 0, Math.PI, Math.PI * 2);
          ctx.strokeStyle = 'rgba(251, 191, 36, 0.6)';
          ctx.lineWidth = 14;
          ctx.stroke();
          ctx.restore();

          // Planet sphere
          const planetGrad = ctx.createRadialGradient(px - 18, py - 18, 10, px, py, pr);
          planetGrad.addColorStop(0, '#38bdf8');
          planetGrad.addColorStop(0.7, '#1e3a8a');
          planetGrad.addColorStop(1, '#020617');
          ctx.fillStyle = planetGrad;
          ctx.beginPath();
          ctx.arc(px, py, pr, 0, Math.PI * 2);
          ctx.fill();

          // Front half of ring
          ctx.save();
          ctx.translate(px, py);
          ctx.rotate(-0.35);
          ctx.beginPath();
          ctx.ellipse(0, 0, 110, 26, 0, 0, Math.PI);
          ctx.strokeStyle = 'rgba(251, 191, 36, 0.9)';
          ctx.lineWidth = 14;
          ctx.stroke();
          ctx.restore();
        }
      },
      {
        name: "Geometric Mandala",
        render: function (ctx, width, height) {
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(0, 0, width, height);

          const cx = width / 2;
          const cy = height / 2;

          const colors = ['#f43f5e', '#fb923c', '#fbbf24', '#34d399', '#38bdf8', '#818cf8'];

          for (let r = 160; r > 20; r -= 26) {
            const count = Math.floor(r / 12) * 2;
            ctx.fillStyle = colors[(r / 26) % colors.length];
            for (let i = 0; i < count; i++) {
              const angle = (i * 2 * Math.PI) / count;
              const x = cx + Math.cos(angle) * r;
              const y = cy + Math.sin(angle) * r;
              ctx.beginPath();
              ctx.arc(x, y, 14, 0, Math.PI * 2);
              ctx.fill();
            }
          }

          // Center jewel
          const centerGrad = ctx.createRadialGradient(cx, cy, 5, cx, cy, 35);
          centerGrad.addColorStop(0, '#ffffff');
          centerGrad.addColorStop(0.5, '#ec4899');
          centerGrad.addColorStop(1, '#4c1d95');
          ctx.fillStyle = centerGrad;
          ctx.beginPath();
          ctx.arc(cx, cy, 35, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    ],

    init: function () {
      this.cacheDom();
      this.bindEvents();
      this.startNewGame();
    },

    cacheDom: function () {
      this.stage = document.getElementById('nwmg-carousel-stage');
      this.controlsContainer = document.getElementById('nwmg-carousel-controls');
      this.previewCanvas = document.getElementById('nwmg-carousel-preview');
      this.themeTag = document.getElementById('nwmg-carousel-theme-tag');
      this.movesEl = document.getElementById('nwmg-carousel-moves');
      this.timerEl = document.getElementById('nwmg-carousel-timer');
      this.restartBtn = document.getElementById('nwmg-carousel-restart-btn');
      this.modalOverlay = document.getElementById('nwmg-modal-overlay');
      this.modalStats = document.getElementById('nwmg-modal-stats');
      this.modalPlayAgain = document.getElementById('nwmg-modal-play-again');
    },

    bindEvents: function () {
      if (this.restartBtn) {
        this.restartBtn.addEventListener('click', () => this.startNewGame());
      }
      if (this.modalPlayAgain) {
        this.modalPlayAgain.addEventListener('click', () => {
          this.hideModal();
          this.startNewGame();
        });
      }
    },

    startNewGame: function () {
      this.isSolved = false;
      this.moves = 0;
      this.updateMovesDisplay();
      this.startTimer();
      this.hideModal();

      // Pick random theme different from current if possible
      let nextTheme;
      do {
        nextTheme = Math.floor(Math.random() * this.themes.length);
      } while (nextTheme === this.currentThemeIndex && this.themes.length > 1);
      this.currentThemeIndex = nextTheme;

      const theme = this.themes[this.currentThemeIndex];
      if (this.themeTag) {
        this.themeTag.textContent = theme.name;
      }

      // Generate offscreen master artwork
      this.generateMasterArtwork(theme);

      // Render to target preview canvas
      if (this.previewCanvas) {
        this.previewCanvas.width = 160;
        this.previewCanvas.height = 160;
        const pCtx = this.previewCanvas.getContext('2d');
        pCtx.drawImage(this.artworkCanvas, 0, 0, 160, 160);
      }

      // Initialize strip offsets with non-trivial shuffle
      this.stripOffsets = [];
      let allZero = true;
      for (let c = 0; c < this.cols; c++) {
        // Random offset between 1 and rows - 1 so each column starts scrambled
        const offset = Math.floor(Math.random() * (this.rows - 1)) + 1;
        this.stripOffsets.push(offset);
        if (offset !== 0) allZero = false;
      }
      if (allZero) {
        this.stripOffsets[0] = 1;
        this.stripOffsets[1] = 2;
      }

      this.renderStage();
      this.renderControls();
    },

    generateMasterArtwork: function (theme) {
      this.artworkCanvas = document.createElement('canvas');
      this.artworkCanvas.width = 400;
      this.artworkCanvas.height = 400;
      const ctx = this.artworkCanvas.getContext('2d');
      theme.render(ctx, 400, 400);
    },

    renderStage: function () {
      if (!this.stage) return;
      this.stage.innerHTML = '';

      const colWidthPercent = 100 / this.cols;
      const rowHeightPercent = 100 / this.rows;

      for (let c = 0; c < this.cols; c++) {
        const strip = document.createElement('div');
        strip.className = 'nwmg-carousel-strip';
        strip.dataset.col = c;

        // Inner vertical slider containing duplicated rows for smooth seamless carousel loop
        const inner = document.createElement('div');
        inner.className = 'nwmg-carousel-strip-inner';
        inner.id = `nwmg-strip-inner-${c}`;

        // Build 2 complete cycles of segments (total rows * 2) so shift wrapping is visually seamless
        const totalSegments = this.rows * 2;
        inner.style.height = `${(totalSegments / this.rows) * 100}%`;

        for (let s = 0; s < totalSegments; s++) {
          const rowIdx = s % this.rows;
          const segment = document.createElement('div');
          segment.style.width = '100%';
          segment.style.height = `${100 / totalSegments}%`;
          segment.style.backgroundImage = `url(${this.artworkCanvas.toDataURL()})`;
          segment.style.backgroundSize = `${this.cols * 100}% ${this.rows * 100}%`;
          segment.style.backgroundPosition = `${c * (100 / (this.cols - 1))}% ${rowIdx * (100 / (this.rows - 1))}%`;
          segment.style.backgroundRepeat = 'no-repeat';
          inner.appendChild(segment);
        }

        strip.appendChild(inner);

        // Add mouse / touch drag support for intuitive reel spinning
        this.attachReelDrag(strip, c);

        this.stage.appendChild(strip);
        this.updateStripPosition(c, false);
      }
    },

    renderControls: function () {
      if (!this.controlsContainer) return;
      this.controlsContainer.innerHTML = '';

      for (let c = 0; c < this.cols; c++) {
        const group = document.createElement('div');
        group.className = 'nwmg-strip-btn-group';

        const upBtn = document.createElement('button');
        upBtn.className = 'nwmg-strip-arrow-btn';
        upBtn.innerHTML = '&#9650;';
        upBtn.title = `Rotate column ${c + 1} up`;
        upBtn.addEventListener('click', () => this.rotateStrip(c, -1));

        const downBtn = document.createElement('button');
        downBtn.className = 'nwmg-strip-arrow-btn';
        downBtn.innerHTML = '&#9660;';
        downBtn.title = `Rotate column ${c + 1} down`;
        downBtn.addEventListener('click', () => this.rotateStrip(c, 1));

        group.appendChild(upBtn);
        group.appendChild(downBtn);
        this.controlsContainer.appendChild(group);
      }
    },

    attachReelDrag: function (stripEl, colIndex) {
      let startY = 0;
      let isDragging = false;

      const onStart = (clientY) => {
        if (this.isSolved) return;
        isDragging = true;
        startY = clientY;
      };

      const onEnd = (clientY) => {
        if (!isDragging) return;
        isDragging = false;
        const deltaY = clientY - startY;
        const threshold = 35;
        if (deltaY < -threshold) {
          this.rotateStrip(colIndex, 1);
        } else if (deltaY > threshold) {
          this.rotateStrip(colIndex, -1);
        }
      };

      stripEl.addEventListener('mousedown', (e) => onStart(e.clientY));
      window.addEventListener('mouseup', (e) => {
        if (isDragging) onEnd(e.clientY);
      });

      stripEl.addEventListener('touchstart', (e) => onStart(e.touches[0].clientY), { passive: true });
      stripEl.addEventListener('touchend', (e) => onEnd(e.changedTouches[0].clientY));
    },

    rotateStrip: function (col, dir) {
      if (this.isSolved) return;

      // Wrap around modulo rows
      this.stripOffsets[col] = (this.stripOffsets[col] + dir + this.rows) % this.rows;
      this.moves++;
      this.updateMovesDisplay();
      this.updateStripPosition(col, true);
      this.playTickSound();

      this.checkVictory();
    },

    updateStripPosition: function (col, animate) {
      const inner = document.getElementById(`nwmg-strip-inner-${col}`);
      const stripEl = this.stage.children[col];
      if (!inner) return;

      const offset = this.stripOffsets[col];
      // Target translation: each row is 25% of stage height (1 / rows)
      const translateY = -(offset * (100 / (this.rows * 2)));

      inner.style.transition = animate ? 'transform 0.24s cubic-bezier(0.2, 0.8, 0.2, 1)' : 'none';
      inner.style.transform = `translateY(${translateY}%)`;

      // Visual indicator if this strip is correctly aligned
      if (stripEl) {
        if (offset === 0) {
          stripEl.classList.add('nwmg-strip-aligned');
        } else {
          stripEl.classList.remove('nwmg-strip-aligned');
        }
      }
    },

    checkVictory: function () {
      const allAligned = this.stripOffsets.every(offset => offset === 0);
      if (allAligned && !this.isSolved) {
        this.isSolved = true;
        this.stopTimer();
        this.playWinSound();
        this.triggerConfetti();

        setTimeout(() => {
          this.showVictoryModal();
        }, 350);
      }
    },

    updateMovesDisplay: function () {
      if (this.movesEl) {
        this.movesEl.textContent = this.moves;
      }
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
      document.getElementById('nwmg-modal-title').textContent = 'Carousel Puzzle Solved!';
      document.getElementById('nwmg-modal-msg').textContent = 'Splendid! You aligned all reels and restored the image perfectly.';
      if (this.modalStats) {
        this.modalStats.innerHTML = `
          <div class="nwmg-modal-stat-item">
            <span class="nwmg-modal-stat-label">Moves</span>
            <span class="nwmg-modal-stat-val">${this.moves}</span>
          </div>
          <div class="nwmg-modal-stat-item">
            <span class="nwmg-modal-stat-label">Time</span>
            <span class="nwmg-modal-stat-val">${this.getFinalTimeString()}</span>
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

    // Audio synthesizer via Web Audio API (Offline, Zero external audio assets)
    playTickSound: function () {
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(320, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(140, ctx.currentTime + 0.05);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.05);
      } catch (e) {}
    },

    playWinSound: function () {
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();
        const notes = [440, 554.37, 659.25, 880];
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.1);
          gain.gain.setValueAtTime(0.12, ctx.currentTime + idx * 0.1);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.1 + 0.35);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + idx * 0.1);
          osc.stop(ctx.currentTime + idx * 0.1 + 0.35);
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
          p.vy += 0.32; // Gravity
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

  window.NWMG_CarouselPuzzle = NWMG_CarouselPuzzle;
})(window);
