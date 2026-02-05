const tileTypes = [
  { name: "horizontal", connections: ["left", "right"], className: "track-horizontal" },
  { name: "vertical", connections: ["top", "bottom"], className: "track-vertical" },
  { name: "turn-tr", connections: ["top", "right"], className: "track-turn-tr" },
  { name: "turn-rb", connections: ["right", "bottom"], className: "track-turn-rb" },
  { name: "turn-bl", connections: ["bottom", "left"], className: "track-turn-bl" },
  { name: "turn-lt", connections: ["left", "top"], className: "track-turn-lt" },
];

const directions = {
  top: [-1, 0],
  right: [0, 1],
  bottom: [1, 0],
  left: [0, -1],
};

const opposite = { top: "bottom", right: "left", bottom: "top", left: "right" };

const stages = [
  { id: 1, size: 4, targetScore: 800 },
  { id: 2, size: 5, targetScore: 1200 },
  { id: 3, size: 6, targetScore: 1600 },
];

const state = {
  stageIndex: 0,
  grid: [],
  nextTile: null,
  countdown: 60,
  timerHandle: null,
  trainStarted: false,
  trainHandle: null,
  trainPos: { r: 0, c: 0 },
  trainEnterFrom: "left",
  score: 0,
  isWon: false,
};

const gridEl = document.getElementById("grid");
const nextTileEl = document.getElementById("next-tile");
const timerEl = document.getElementById("timer");
const scoreEl = document.getElementById("score");
const leaderboardEl = document.getElementById("leaderboard");
const dialog = document.getElementById("achievement-dialog");
const achievementMessage = document.getElementById("achievement-message");
const titleEl = document.querySelector(".game-panel h1");
const subtitleEl = document.querySelector(".subtitle");

document.getElementById("reset-round")?.addEventListener("click", () => initStage(state.stageIndex));
document.getElementById("next-round")?.addEventListener("click", () => {
  dialog.close();
  initStage((state.stageIndex + 1) % stages.length);
});

function randomTile() {
  return { ...tileTypes[Math.floor(Math.random() * tileTypes.length)] };
}

function createEmptyGrid(size) {
  return Array.from({ length: size }, () => Array.from({ length: size }, () => ({ type: null })));
}

function initStage(index) {
  clearInterval(state.timerHandle);
  clearInterval(state.trainHandle);
  state.stageIndex = index;
  const stage = stages[index];
  state.grid = createEmptyGrid(stage.size);
  state.nextTile = randomTile();
  state.countdown = 60;
  state.trainStarted = false;
  state.trainPos = { r: 0, c: 0 };
  state.trainEnterFrom = "left";
  state.isWon = false;
  state.score = 0;
  titleEl.textContent = `Tutorial Round ${stages[index].id}: Build the Line!`;
  subtitleEl.textContent = `Grid: ${stages[index].size}x${stages[index].size}. Connect START (top-left) to GOAL (bottom-right).`;
  render();
  startCountdown();
}

function startCountdown() {
  state.timerHandle = setInterval(() => {
    if (state.countdown <= 0) {
      clearInterval(state.timerHandle);
      startTrain();
      return;
    }
    state.countdown -= 1;
    renderTimer();
  }, 1000);
}

function startTrain() {
  if (state.trainStarted) return;
  state.trainStarted = true;
  state.trainHandle = setInterval(() => {
    if (state.isWon) {
      clearInterval(state.trainHandle);
      return;
    }
    moveTrainStep();
    renderGrid();
  }, 1300);
}

function placeTile(r, c) {
  if (state.grid[r][c].type || (r === 0 && c === 0) || (r === state.grid.length - 1 && c === state.grid.length - 1)) return;
  state.grid[r][c].type = state.nextTile;
  state.score += 20;
  state.nextTile = randomTile();
  render();
}

function resolveConnections(r, c) {
  if (r === 0 && c === 0) return ["right", "bottom"];
  const last = state.grid.length - 1;
  if (r === last && c === last) return ["left", "top"];
  return state.grid[r][c].type?.connections || [];
}

function stepFrom(position, enterFrom) {
  const exits = resolveConnections(position.r, position.c);
  if (!exits.includes(enterFrom)) return null;
  const exitTo = exits.find((d) => d !== enterFrom);
  if (!exitTo) return null;
  const [dr, dc] = directions[exitTo];
  const nr = position.r + dr;
  const nc = position.c + dc;
  if (nr < 0 || nc < 0 || nr >= state.grid.length || nc >= state.grid.length) return null;
  const nextConnections = resolveConnections(nr, nc);
  if (!nextConnections.includes(opposite[exitTo])) return null;
  return { r: nr, c: nc, enterFrom: opposite[exitTo] };
}

function moveTrainStep() {
  const next = stepFrom(state.trainPos, state.trainEnterFrom);
  if (!next) {
    clearInterval(state.trainHandle);
    return;
  }
  state.trainPos = { r: next.r, c: next.c };
  state.trainEnterFrom = next.enterFrom;
  state.score += 35;
  scoreEl.textContent = String(state.score);

  const last = state.grid.length - 1;
  if (state.trainPos.r === last && state.trainPos.c === last) {
    state.isWon = true;
    clearInterval(state.trainHandle);
    const timeBonus = state.countdown * 5;
    state.score += 200 + timeBonus;
    scoreEl.textContent = String(state.score);
    saveScore();
    achievementMessage.textContent = `Stage ${stages[state.stageIndex].id} complete! Score ${state.score}. Ready for the next route?`;
    dialog.showModal();
  }
}

function saveScore() {
  const board = JSON.parse(localStorage.getItem("trainManiaBoard") || "[]");
  board.push({
    name: `Conductor ${Math.floor(Math.random() * 90 + 10)}`,
    score: state.score,
    stage: stages[state.stageIndex].id,
    date: new Date().toISOString(),
  });
  board.sort((a, b) => b.score - a.score);
  localStorage.setItem("trainManiaBoard", JSON.stringify(board.slice(0, 8)));
  renderLeaderboard();
}

function renderTile(container, tile) {
  container.innerHTML = "";
  if (!tile) return;
  const shape = document.createElement("div");
  shape.className = `track-shape ${tile.className}`;
  container.appendChild(shape);
}

function renderGrid() {
  const size = state.grid.length;
  gridEl.innerHTML = "";
  gridEl.style.gridTemplateColumns = `repeat(${size}, 74px)`;

  for (let r = 0; r < size; r += 1) {
    for (let c = 0; c < size; c += 1) {
      const cell = document.createElement("button");
      cell.className = "cell";
      cell.addEventListener("click", () => placeTile(r, c));

      const isStart = r === 0 && c === 0;
      const isEnd = r === size - 1 && c === size - 1;
      if (isStart) {
        cell.classList.add("station-start");
        const img = document.createElement("img");
        img.src = "assets/station-start.svg";
        img.className = "sprite";
        img.alt = "departure station";
        cell.appendChild(img);
      } else if (isEnd) {
        cell.classList.add("station-end");
        const img = document.createElement("img");
        img.src = "assets/station-end.svg";
        img.className = "sprite";
        img.alt = "destination station";
        cell.appendChild(img);
      } else {
        renderTile(cell, state.grid[r][c].type);
      }

      if (state.trainStarted && state.trainPos.r === r && state.trainPos.c === c) {
        cell.classList.add("train-here");
        const train = document.createElement("img");
        train.src = "assets/train.svg";
        train.className = "sprite";
        train.alt = "train";
        cell.appendChild(train);
      }

      gridEl.appendChild(cell);
    }
  }
}

function renderTimer() {
  const mm = String(Math.floor(state.countdown / 60)).padStart(2, "0");
  const ss = String(state.countdown % 60).padStart(2, "0");
  timerEl.textContent = `${mm}:${ss}`;
}

function renderLeaderboard() {
  leaderboardEl.innerHTML = "";
  const board = JSON.parse(localStorage.getItem("trainManiaBoard") || "[]");
  if (!board.length) {
    leaderboardEl.innerHTML = "<li>No scores yet. Be the first engineer!</li>";
    return;
  }
  board.forEach((entry) => {
    const li = document.createElement("li");
    li.textContent = `${entry.name} — ${entry.score} pts (Stage ${entry.stage})`;
    leaderboardEl.appendChild(li);
  });
}

function render() {
  renderGrid();
  renderTile(nextTileEl, state.nextTile);
  renderTimer();
  scoreEl.textContent = String(state.score);
  renderLeaderboard();
}

initStage(0);
