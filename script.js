// Random Game Hub - vanilla JS, no dependencies
(function () {
  "use strict";

  const area = document.getElementById("game-area");
  const nav = document.getElementById("game-nav");
  const nowPlaying = document.getElementById("now-playing");
  const surpriseBtn = document.getElementById("surprise");

  const rand = (n) => Math.floor(Math.random() * n);

  const games = [
    { id: "rps", name: "Rock Paper Scissors", emoji: "\u270a", init: initRPS },
    { id: "guess", name: "Guess the Number", emoji: "\ud83d\udd22", init: initGuess },
    { id: "reaction", name: "Reaction Test", emoji: "\u26a1", init: initReaction },
    { id: "ttt", name: "Tic-Tac-Toe", emoji: "\u2b55", init: initTTT },
  ];

  let currentId = null;

  function clearArea() {
    area.innerHTML = "";
  }

  function el(tag, opts = {}, children = []) {
    const node = document.createElement(tag);
    if (opts.class) node.className = opts.class;
    if (opts.id) node.id = opts.id;
    if (opts.text != null) node.textContent = opts.text;
    if (opts.html != null) node.innerHTML = opts.html;
    if (opts.type) node.type = opts.type;
    if (opts.attrs) for (const k in opts.attrs) node.setAttribute(k, opts.attrs[k]);
    if (opts.on) for (const ev in opts.on) node.addEventListener(ev, opts.on[ev]);
    children.forEach((c) => node.appendChild(c));
    return node;
  }

  function header(title, desc) {
    clearArea();
    area.appendChild(el("h2", { class: "game-title", text: title }));
    area.appendChild(el("p", { class: "game-desc", text: desc }));
  }

  function loadGame(id) {
    const game = games.find((g) => g.id === id) || games[0];
    currentId = game.id;
    nowPlaying.textContent = "Now playing";
    [...nav.children].forEach((c) =>
      c.classList.toggle("active", c.dataset.id === game.id)
    );
    game.init();
  }

  function loadRandom() {
    let pick = rand(games.length);
    if (games.length > 1) {
      while (games[pick].id === currentId) pick = rand(games.length);
    }
    loadGame(games[pick].id);
  }

  function initRPS() {
    header("\u270a Rock Paper Scissors", "Beat the computer. First to feel good wins.");
    let wins = 0, losses = 0, ties = 0;
    const moves = [
      { key: "rock", emoji: "\u270a" },
      { key: "paper", emoji: "\u270b" },
      { key: "scissors", emoji: "\u270c\ufe0f" },
    ];

    const board = el("div", { class: "rps-board" });
    const you = el("div", { class: "rps-side", html: "<div id='you-emoji'>\u2753</div><small>You</small>" });
    const cpu = el("div", { class: "rps-side", html: "<div id='cpu-emoji'>\u2753</div><small>Computer</small>" });
    board.appendChild(you);
    board.appendChild(cpu);

    const status = el("div", { class: "status", text: "Make your move!" });
    const score = el("div", { class: "scoreline", text: "Wins 0 \u00b7 Losses 0 \u00b7 Ties 0" });

    const choices = el("div", { class: "rps-choices" });
    moves.forEach((m) => {
      choices.appendChild(
        el("button", { text: m.emoji, attrs: { "aria-label": m.key }, on: { click: () => play(m) } })
      );
    });

    function play(playerMove) {
      const cpuMove = moves[rand(3)];
      document.getElementById("you-emoji").textContent = playerMove.emoji;
      document.getElementById("cpu-emoji").textContent = cpuMove.emoji;
      if (playerMove.key === cpuMove.key) {
        ties++;
        status.textContent = "It's a tie!";
        status.className = "status";
      } else if (
        (playerMove.key === "rock" && cpuMove.key === "scissors") ||
        (playerMove.key === "paper" && cpuMove.key === "rock") ||
        (playerMove.key === "scissors" && cpuMove.key === "paper")
      ) {
        wins++;
        status.textContent = "You win this round! \ud83c\udf89";
        status.className = "status good";
      } else {
        losses++;
        status.textContent = "Computer wins this round.";
        status.className = "status bad";
      }
      score.textContent = `Wins ${wins} \u00b7 Losses ${losses} \u00b7 Ties ${ties}`;
    }

    area.appendChild(board);
    area.appendChild(status);
    area.appendChild(choices);
    area.appendChild(score);
  }

  function initGuess() {
    header("\ud83d\udd22 Guess the Number", "I'm thinking of a number from 1 to 100.");
    let target = 1 + rand(100);
    let tries = 0;

    const status = el("div", { class: "status", text: "Take a guess!" });
    const input = el("input", { attrs: { type: "number", min: "1", max: "100", placeholder: "1-100" } });
    const guessBtn = el("button", { class: "btn btn-primary", text: "Guess", on: { click: submit } });
    const tally = el("div", { class: "guesses", text: "Guesses: 0" });

    input.addEventListener("keydown", (e) => { if (e.key === "Enter") submit(); });

    function submit() {
      const val = parseInt(input.value, 10);
      if (isNaN(val) || val < 1 || val > 100) {
        status.textContent = "Enter a number from 1 to 100.";
        status.className = "status bad";
        return;
      }
      tries++;
      tally.textContent = `Guesses: ${tries}`;
      if (val === target) {
        status.textContent = `\ud83c\udf89 Correct! ${target} in ${tries} tr${tries === 1 ? "y" : "ies"}.`;
        status.className = "status good";
        input.disabled = true; guessBtn.disabled = true;
      } else if (val < target) {
        status.textContent = "Too low \u2b06\ufe0f";
        status.className = "status";
      } else {
        status.textContent = "Too high \u2b07\ufe0f";
        status.className = "status";
      }
      input.value = "";
      input.focus();
    }

    const wrap = el("div", { class: "guess-wrap" }, [
      status,
      el("div", {}, [input]),
      el("div", { class: "row-actions" }, [guessBtn]),
      tally,
    ]);
    area.appendChild(wrap);
    setTimeout(() => input.focus(), 50);
  }

  function initReaction() {
    header("\u26a1 Reaction Test", "Click as soon as the box turns green.");
    let state = "idle";
    let startTime = 0;
    let timer = null;
    let best = null;

    const status = el("div", { class: "status", text: "Click the box to start." });
    const pad = el("div", { class: "reaction-pad", text: "Click to start" });

    pad.addEventListener("click", () => {
      if (state === "idle") {
        state = "waiting";
        pad.className = "reaction-pad wait";
        pad.textContent = "Wait for green...";
        status.textContent = "";
        status.className = "status";
        timer = setTimeout(() => {
          state = "go";
          pad.className = "reaction-pad go";
          pad.textContent = "CLICK!";
          startTime = performance.now();
        }, 1200 + rand(2300));
      } else if (state === "waiting") {
        clearTimeout(timer);
        state = "idle";
        pad.className = "reaction-pad early";
        pad.textContent = "Too early! Click to retry";
        status.textContent = "You jumped the gun \ud83d\ude05";
        status.className = "status bad";
      } else if (state === "go") {
        const ms = Math.round(performance.now() - startTime);
        if (best === null || ms < best) best = ms;
        state = "idle";
        pad.className = "reaction-pad";
        pad.textContent = "Click to play again";
        status.textContent = `\u26a1 ${ms} ms  (best: ${best} ms)`;
        status.className = "status good";
      }
    });

    area.appendChild(status);
    area.appendChild(pad);
  }

  function initTTT() {
    header("\u2b55 Tic-Tac-Toe", "You are X. Beat the computer (O).");
    let cells = Array(9).fill("");
    let over = false;

    const status = el("div", { class: "status", text: "Your turn (X)" });
    const grid = el("div", { class: "ttt-grid" });
    const buttons = [];

    for (let i = 0; i < 9; i++) {
      const b = el("button", { class: "ttt-cell", on: { click: () => playerMove(i) } });
      buttons.push(b);
      grid.appendChild(b);
    }

    const lines = [
      [0,1,2],[3,4,5],[6,7,8],
      [0,3,6],[1,4,7],[2,5,8],
      [0,4,8],[2,4,6],
    ];

    function winner(bd) {
      for (const [a,b,c] of lines) {
        if (bd[a] && bd[a] === bd[b] && bd[a] === bd[c]) return bd[a];
      }
      return bd.every((x) => x) ? "tie" : null;
    }

    function render() {
      buttons.forEach((b, i) => {
        b.textContent = cells[i];
        b.style.color = cells[i] === "X" ? "#00d2ff" : "#ff5c7c";
        b.disabled = over || cells[i] !== "";
      });
    }

    function finish(w) {
      over = true;
      if (w === "X") { status.textContent = "You win! \ud83c\udf89"; status.className = "status good"; }
      else if (w === "O") { status.textContent = "Computer wins."; status.className = "status bad"; }
      else { status.textContent = "It's a tie!"; status.className = "status"; }
      render();
    }

    function playerMove(i) {
      if (over || cells[i]) return;
      cells[i] = "X";
      let w = winner(cells);
      if (w) return finish(w);
      const move = bestMove();
      if (move != null) cells[move] = "O";
      w = winner(cells);
      if (w) return finish(w);
      status.textContent = "Your turn (X)";
      status.className = "status";
      render();
    }

    function findCritical(mark) {
      for (const [a,b,c] of lines) {
        const trio = [cells[a], cells[b], cells[c]];
        const idx = [a,b,c];
        const marks = trio.filter((x) => x === mark).length;
        const empties = trio.filter((x) => x === "").length;
        if (marks === 2 && empties === 1) {
          return idx[trio.indexOf("")];
        }
      }
      return null;
    }

    function bestMove() {
      const empty = cells.map((v, i) => (v === "" ? i : null)).filter((v) => v !== null);
      if (!empty.length) return null;
      const win = findCritical("O");
      if (win != null) return win;
      const block = findCritical("X");
      if (block != null) return block;
      if (cells[4] === "") return 4;
      return empty[rand(empty.length)];
    }

    const reset = el("button", { class: "btn", text: "New game", on: { click: () => {
      cells = Array(9).fill(""); over = false;
      status.textContent = "Your turn (X)"; status.className = "status";
      render();
    }}});

    area.appendChild(status);
    area.appendChild(grid);
    area.appendChild(el("div", { class: "row-actions" }, [reset]));
    render();
  }

  games.forEach((g) => {
    nav.appendChild(
      el("button", {
        class: "chip",
        text: `${g.emoji} ${g.name}`,
        attrs: { "data-id": g.id },
        on: { click: () => loadGame(g.id) },
      })
    );
  });

  surpriseBtn.addEventListener("click", loadRandom);

  loadRandom();
})();
