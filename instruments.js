(() => {
  "use strict";

  const map = window.HoleMap;
  const svg = map.createSvg;
  const alphabet = new Map([
    ["0", 1], ["S", 2], ["+", 3], ["·", 4], ["=", 5], ["¬", 6], ["∧", 7], ["∨", 8],
    ["→", 9], ["∀", 10], ["∃", 11], ["(", 12], [")", 13], ["x", 14], ["y", 15], ["z", 16],
  ]);
  const codeToSymbol = new Map([...alphabet].map(([symbol, code]) => [code, symbol]));
  const primeCache = [];

  function normalizeInput(value) {
    return value
      .replace(/A\./g, "∀")
      .replace(/E\./g, "∃")
      .replace(/->/g, "→")
      .replace(/~/g, "¬")
      .replace(/&/g, "∧")
      .replace(/\*/g, "·")
      .replace(/\s/g, "");
  }

  function isPrime(candidate) {
    if (candidate < 2) return false;
    for (let divisor = 2; divisor * divisor <= candidate; divisor += 1) {
      if (candidate % divisor === 0) return false;
    }
    return true;
  }

  function primes(count) {
    let candidate = primeCache.length ? primeCache[primeCache.length - 1] + 1 : 2;
    while (primeCache.length < count) {
      if (isPrime(candidate)) primeCache.push(candidate);
      candidate += 1;
    }
    return primeCache.slice(0, count);
  }

  function encodeSymbols(symbols) {
    const sequencePrimes = primes(symbols.length);
    return symbols.reduce(
      (number, symbol, index) => number * BigInt(sequencePrimes[index]) ** BigInt(alphabet.get(symbol)),
      1n,
    );
  }

  function groupDigits(value) {
    return value.replace(/(.{5})/g, "$1 ").trim();
  }

  function setupNumbering() {
    const input = document.getElementById("godel-input");
    if (!input) return;

    const error = document.getElementById("godel-input-error");
    const codeRow = document.getElementById("symbol-code-row");
    const expression = document.getElementById("prime-expression");
    const headline = document.getElementById("digit-headline");
    const wall = document.getElementById("digit-wall");
    const expander = document.getElementById("digit-expander");
    const factorButton = document.getElementById("factor-back");
    const factorResult = document.getElementById("factor-result");
    const factorAnnouncer = document.getElementById("factor-announcer");
    let current = null;
    let expanded = false;
    let factorRun = 0;

    function invalidateFactor() {
      factorRun += 1;
      factorButton.disabled = !current;
      factorResult.textContent = current ? "NUMBER READY. PRIME FACTORS WAITING." : "WAITING FOR A VALID NUMBER.";
    }

    function render() {
      const canonical = normalizeInput(input.value);
      const symbols = [...canonical];
      const invalid = symbols.find((symbol) => !alphabet.has(symbol));
      current = null;
      codeRow.replaceChildren();
      expression.textContent = "";
      headline.textContent = "";
      wall.textContent = "";
      wall.classList.remove("is-expanded");
      expander.hidden = true;

      if (!symbols.length) {
        error.textContent = "ENTER AT LEAST ONE SYMBOL.";
        invalidateFactor();
        return;
      }
      if (symbols.length > 120) {
        error.textContent = `TOO LONG / ${symbols.length} SYMBOLS. THE INSTRUMENT STOPS AT 120.`;
        invalidateFactor();
        return;
      }
      if (invalid) {
        error.textContent = `UNKNOWN MARK “${invalid}”. USE THE DEMONSTRATION ALPHABET ABOVE.`;
        invalidateFactor();
        return;
      }

      error.textContent = "";
      const sequencePrimes = primes(symbols.length);
      const value = encodeSymbols(symbols);
      const digits = value.toString();
      const fragment = document.createDocumentFragment();
      symbols.forEach((symbol) => {
        const cell = document.createElement("span");
        cell.className = "symbol-code";
        cell.innerHTML = `<b>${symbol}</b><small>${alphabet.get(symbol)}</small>`;
        fragment.appendChild(cell);
      });
      codeRow.appendChild(fragment);
      expression.textContent = symbols
        .map((symbol, index) => `${sequencePrimes[index]}^${alphabet.get(symbol)}`)
        .join(" × ");
      headline.textContent = `${digits.length.toLocaleString()} DECIMAL DIGITS`;
      wall.textContent = groupDigits(expanded || digits.length <= 180 ? digits : `${digits.slice(0, 180)}…`);
      wall.classList.toggle("is-expanded", expanded);
      expander.hidden = digits.length <= 180;
      expander.textContent = expanded ? "COLLAPSE DIGITS ↑" : "SHOW ALL DIGITS ↓";
      current = { symbols, value, sequencePrimes };
      invalidateFactor();
    }

    let renderTimer = 0;
    input.addEventListener("input", () => {
      expanded = false;
      factorRun += 1;
      window.clearTimeout(renderTimer);
      renderTimer = window.setTimeout(render, 110);
    });
    document.getElementById("symbol-palette").addEventListener("click", (event) => {
      const button = event.target.closest("button[data-symbol]");
      if (!button) return;
      const start = input.selectionStart ?? input.value.length;
      const end = input.selectionEnd ?? start;
      input.value = `${input.value.slice(0, start)}${button.dataset.symbol}${input.value.slice(end)}`;
      input.focus();
      input.setSelectionRange(start + 1, start + 1);
      expanded = false;
      render();
    });
    expander.addEventListener("click", () => {
      expanded = !expanded;
      render();
    });

    factorButton.addEventListener("click", () => {
      if (!current) return;
      const run = ++factorRun;
      const { symbols, value, sequencePrimes } = current;
      let working = value;
      let index = 0;
      const recovered = [];
      factorButton.disabled = true;
      factorResult.textContent = "DIVIDING BY SUCCESSIVE PRIMES…";
      factorAnnouncer.textContent = "Factorization started.";

      function recoverOne() {
        if (run !== factorRun) return false;
        const prime = BigInt(sequencePrimes[index]);
        let exponent = 0;
        while (working % prime === 0n) {
          working /= prime;
          exponent += 1;
        }
        recovered.push(codeToSymbol.get(exponent) || `?${exponent}`);
        index += 1;
        factorResult.textContent = `RECOVERED / ${recovered.join(" ")} ${index < symbols.length ? "…" : ""}`;
        return index < symbols.length;
      }

      function frame() {
        const start = performance.now();
        let more = true;
        while (more && (map.isMotionOff() || performance.now() - start < 6)) more = recoverOne();
        if (run !== factorRun) return;
        if (more) requestAnimationFrame(frame);
        else {
          const passed = working === 1n && recovered.join("") === symbols.join("");
          factorResult.textContent = passed
            ? `ROUND TRIP / ${recovered.join(" ")} / EXACT`
            : "ROUND TRIP FAILED / ENCODING MISMATCH";
          factorAnnouncer.textContent = passed
            ? `Factorization complete. Recovered ${recovered.join(" ")} exactly.`
            : "Factorization failed because the recovered symbols did not match.";
          factorButton.disabled = false;
        }
      }
      requestAnimationFrame(frame);
    });

    render();
    ["0", "S0", "x+0=x", "S0+0=S0", "∀x(x+0=x)", "¬∃y(y=S0)"].forEach((test) => {
      const testSymbols = [...test];
      let testWorking = encodeSymbols(testSymbols);
      const roundTrip = [];
      primes(testSymbols.length).forEach((prime) => {
        let exponent = 0;
        while (testWorking % BigInt(prime) === 0n) {
          testWorking /= BigInt(prime);
          exponent += 1;
        }
        roundTrip.push(codeToSymbol.get(exponent));
      });
      if (roundTrip.join("") !== test || testWorking !== 1n) {
        console.warn(`Gödel-number round-trip self-test failed for ${test}.`);
      }
    });
  }

  function setupSyntaxTree() {
    const treeSvg = document.getElementById("syntax-tree");
    const edges = document.getElementById("syntax-tree-edges");
    const nodesLayer = document.getElementById("syntax-tree-nodes");
    const number = document.getElementById("syntax-number");
    const button = document.getElementById("syntax-step");
    if (!button) return;

    const nodes = [
      ["=", 280, 54], ["+", 165, 150], ["S", 395, 150], ["S", 90, 254], ["0", 220, 254],
      ["0", 395, 254], ["0", 90, 354],
    ];
    const tokenLayer = svg("g", { class: "syntax-token-layer", "aria-hidden": "true" });
    [..."S0+0=S0"].forEach((label, index) => {
      const token = svg("g", {
        class: "syntax-token",
        transform: `translate(${70 + index * 70} 330)`,
      });
      token.append(svg("circle", { r: 22 }), svg("text", { x: 0, y: 6, "text-anchor": "middle" }));
      token.lastChild.textContent = label;
      tokenLayer.appendChild(token);
    });
    treeSvg.insertBefore(tokenLayer, edges);
    const links = [[0, 1], [0, 2], [1, 3], [1, 4], [2, 5], [3, 6]];
    links.forEach(([from, to]) => {
      const start = nodes[from];
      const end = nodes[to];
      edges.appendChild(svg("path", { class: "syntax-edge", d: `M${start[1]} ${start[2] + 22}C${start[1]} ${start[2] + 55} ${end[1]} ${end[2] - 44} ${end[1]} ${end[2] - 22}` }));
    });
    nodes.forEach(([label, x, y], index) => {
      const group = svg("g", { class: "syntax-svg-node", transform: `translate(${x} ${y})`, "data-order": index });
      group.append(svg("circle", { r: 25 }), svg("text", { x: 0, y: 7, "text-anchor": "middle" }));
      group.lastChild.textContent = label;
      nodesLayer.appendChild(group);
    });

    let state = 0;
    const encoded = encodeSymbols([..."S0+0=S0"]).toString();
    function sync() {
      const beat = document.getElementById("syntax-beat");
      beat.dataset.syntaxState = ["tokens", "tree", "number"][state];
      if (state === 0) {
        button.innerHTML = "ASSEMBLE <span aria-hidden=\"true\">▸</span>";
        number.textContent = "TOKENS WAITING / S · 0 · + · 0 · = · S · 0";
      } else if (state === 1) {
        button.innerHTML = "NUMBER THE TREE <span aria-hidden=\"true\">▸</span>";
        number.textContent = "STRUCTURE APPEARS / ROOT = EQUALITY";
      } else {
        button.innerHTML = "RESET <span aria-hidden=\"true\">↺</span>";
        number.textContent = `THE TOKEN STRING RECEIVES ${encoded.length} DIGITS / ${groupDigits(encoded)}`;
      }
    }
    button.addEventListener("click", () => {
      state = (state + 1) % 3;
      sync();
    });
    sync();
  }

  function setupLifeThread() {
    const host = document.getElementById("life-thread");
    const drawing = document.getElementById("life-thread-svg");
    const lifeNodes = [...document.querySelectorAll("[data-life]")];
    if (!host || !lifeNodes.length) return;
    let branchEntries = [];
    let layoutFrame = 0;
    let scrollFrame = 0;
    let documentHeight = 0;
    let trunkElement = null;
    let trunkLength = 0;
    const openedLifeNodes = new Set();

    function layout() {
      cancelAnimationFrame(layoutFrame);
      layoutFrame = requestAnimationFrame(() => {
        documentHeight = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight);
        drawing.replaceChildren();
        drawing.setAttribute("viewBox", `0 0 80 ${documentHeight}`);
        drawing.setAttribute("height", String(documentHeight));
        host.style.height = `${documentHeight}px`;

        const rootEnd = Math.min(460, documentHeight * 0.08);
        drawing.appendChild(svg("path", { class: "life-root", d: `M22 ${rootEnd}C5 ${rootEnd - 75} 8 ${rootEnd - 160} 20 0M22 ${rootEnd}C41 ${rootEnd - 86} 48 ${rootEnd - 160} 55 0` }));
        trunkElement = svg("path", { class: "life-trunk", d: `M22 ${rootEnd}C28 ${documentHeight * 0.22} 14 ${documentHeight * 0.45} 24 ${documentHeight * 0.68}C32 ${documentHeight * 0.82} 19 ${documentHeight * 0.94} 29 ${documentHeight}` });
        drawing.appendChild(trunkElement);
        trunkLength = trunkElement.getTotalLength();
        trunkElement.style.strokeDasharray = String(trunkLength);

        branchEntries = lifeNodes.map((node, index) => {
          const bounds = node.getBoundingClientRect();
          const y = bounds.top + window.scrollY + bounds.height / 2;
          const endX = window.innerWidth <= 760 ? 19 : 72;
          const bend = index % 2 ? 16 : 31;
          const branch = svg("path", {
            class: `life-branch${node.classList.contains("life-node--ember") ? " is-ember" : ""}`,
            d: `M22 ${y}C${bend} ${y - 20} ${endX - 16} ${y + 18} ${endX} ${y}`,
          });
          const leaf = svg("circle", {
            class: `life-leaf${node.classList.contains("life-node--ember") ? " is-ember" : ""}`,
            cx: endX, cy: y, r: node.classList.contains("life-node--ember") ? 4.2 : 3.2,
          });
          drawing.append(branch, leaf);
          return { node, branch, leaf, y };
        });
        openedLifeNodes.forEach((node) => setBranchState(node));
        updateScroll();
      });
    }

    function setBranchState(node) {
      openedLifeNodes.add(node);
      const entry = branchEntries.find((candidate) => candidate.node === node);
      if (!entry) return;
      entry.branch.classList.add("is-open");
      entry.leaf.classList.add("is-open");
    }

    function updateScroll() {
      const progress = Math.min(1, Math.max(0, (window.scrollY + window.innerHeight * 0.58) / documentHeight));
      if (trunkElement) {
        trunkElement.style.strokeDashoffset = map.isMotionOff() ? "0" : String(trunkLength * (1 - progress));
      }
      branchEntries.forEach(({ node, y }) => {
        if (map.isMotionOff() || y - window.scrollY < window.innerHeight * 0.82) {
          setBranchState(node);
        }
      });
    }

    function scheduleScroll() {
      if (scrollFrame) return;
      scrollFrame = requestAnimationFrame(() => {
        scrollFrame = 0;
        updateScroll();
      });
    }

    const observer = new ResizeObserver(layout);
    observer.observe(document.querySelector("main"));
    const chapterObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting || map.isMotionOff()) setBranchState(entry.target);
      });
    }, { rootMargin: "0px 0px -18% 0px" });
    lifeNodes.forEach((node) => chapterObserver.observe(node));
    window.addEventListener("resize", layout, { passive: true });
    window.addEventListener("scroll", scheduleScroll, { passive: true });
    window.addEventListener("holemap:layout", layout);
    document.getElementById("grove-details")?.addEventListener("toggle", layout);
    document.fonts?.ready.then(layout);
    map.onMotionChange(() => scheduleScroll());
    layout();
  }

  function deriveMIU(value, rule) {
    const results = new Set();
    if (rule === "I" && value.endsWith("I")) results.add(`${value}U`);
    if (rule === "II" && value.startsWith("M")) results.add(`M${value.slice(1)}${value.slice(1)}`);
    if (rule === "III") {
      for (let index = value.indexOf("III"); index >= 0; index = value.indexOf("III", index + 1)) {
        results.add(`${value.slice(0, index)}U${value.slice(index + 3)}`);
      }
    }
    if (rule === "IV") {
      for (let index = value.indexOf("UU"); index >= 0; index = value.indexOf("UU", index + 1)) {
        results.add(`${value.slice(0, index)}${value.slice(index + 2)}`);
      }
    }
    return [...results];
  }

  function allMIUDerivations(value) {
    return ["I", "II", "III", "IV"].flatMap((rule) => deriveMIU(value, rule));
  }

  function stableUnit(value) {
    let hash = 2166136261;
    for (const symbol of value) {
      hash ^= symbol.codePointAt(0);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0) / 4294967295;
  }

  function setupProofGrove() {
    const details = document.getElementById("grove-details");
    if (!details) return;
    const nodeLayer = document.getElementById("miu-tree-nodes");
    const edgeLayer = document.getElementById("miu-tree-edges");
    const selectedReadout = document.getElementById("miu-selected-readout");
    const canvas = document.getElementById("miu-canopy");
    const context = canvas.getContext("2d");
    const counter = document.getElementById("miu-search-count");
    const searchAnnouncer = document.getElementById("miu-search-announcer");
    const searchButton = document.getElementById("miu-search");
    const outsideButton = document.getElementById("miu-outside");
    const invariant = document.getElementById("miu-invariant");
    const tree = [{ id: 0, value: "MI", parent: null, depth: 0, rule: "START" }];
    let selectedId = 0;
    let searchRun = 0;
    let inView = true;
    let pageVisible = !document.hidden;
    let resumeSearch = null;
    let latestPoints = [];
    let latestVisited = 0;
    let latestCanopyFinal = false;
    let announcedMilestone = 0;
    let canvasMetrics = { width: 1, height: 1, bone: "#999", cyan: "#77e6ef" };
    const searchMilestones = [100, 1000, 10000, 25000, 50000];

    function renderManualTree() {
      nodeLayer.replaceChildren();
      edgeLayer.replaceChildren();
      const width = nodeLayer.clientWidth || 560;
      const byDepth = new Map();
      tree.forEach((node) => {
        if (!byDepth.has(node.depth)) byDepth.set(node.depth, []);
        byDepth.get(node.depth).push(node);
      });
      const positions = new Map();
      byDepth.forEach((level, depth) => {
        level.forEach((node, index) => positions.set(node.id, {
          x: ((index + 1) / (level.length + 1)) * width,
          y: 34 + depth * 78,
        }));
      });
      const height = Math.max(320, 100 + Math.max(...tree.map((node) => node.depth)) * 78);
      nodeLayer.style.height = `${height}px`;
      edgeLayer.style.height = `${height}px`;
      edgeLayer.setAttribute("viewBox", `0 0 ${width} ${height}`);
      tree.forEach((node) => {
        const position = positions.get(node.id);
        if (node.parent !== null) {
          const parent = positions.get(node.parent);
          edgeLayer.appendChild(svg("path", { class: "miu-tree-edge", d: `M${parent.x} ${parent.y + 15}C${parent.x} ${parent.y + 40} ${position.x} ${position.y - 38} ${position.x} ${position.y - 15}` }));
        }
        const button = document.createElement("button");
        button.type = "button";
        button.className = "miu-node";
        button.style.left = `${position.x}px`;
        button.style.top = `${position.y}px`;
        const modulo = [...node.value].filter((symbol) => symbol === "I").length % 3;
        button.innerHTML = `<span>${node.value}</span><small>I≡${modulo}</small>`;
        button.dataset.id = String(node.id);
        button.classList.toggle("is-selected", node.id === selectedId);
        button.setAttribute("aria-pressed", String(node.id === selectedId));
        button.setAttribute("aria-label", `${node.value}, made by rule ${node.rule}`);
        nodeLayer.appendChild(button);
      });
      selectedReadout.textContent = `SELECTED / ${tree.find((node) => node.id === selectedId).value}`;
      const selected = tree.find((node) => node.id === selectedId);
      document.querySelectorAll("#miu-rules button[data-rule]").forEach((button) => {
        button.disabled = deriveMIU(selected.value, button.dataset.rule).length === 0;
      });
    }

    function revealSelectedNode() {
      requestAnimationFrame(() => {
        nodeLayer.querySelector('[aria-pressed="true"]')?.scrollIntoView({
          block: "nearest",
          inline: "nearest",
        });
      });
    }

    nodeLayer.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-id]");
      if (!button) return;
      selectedId = Number(button.dataset.id);
      renderManualTree();
    });
    document.getElementById("miu-rules").addEventListener("click", (event) => {
      const button = event.target.closest("button[data-rule]");
      if (!button) return;
      const selected = tree.find((node) => node.id === selectedId);
      const existing = new Set(tree.map((node) => node.value));
      const results = deriveMIU(selected.value, button.dataset.rule).filter((value) => !existing.has(value));
      results.forEach((value) => tree.push({
        id: tree.length, value, parent: selected.id, depth: selected.depth + 1, rule: button.dataset.rule,
      }));
      if (results.length) selectedId = tree.length - results.length;
      renderManualTree();
      selectedReadout.textContent = results.length ? `GREW / ${results.join(" · ")}` : "RULE DOES NOT APPLY HERE";
      revealSelectedNode();
    });

    function refreshCanvasMetrics() {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.max(1, Math.round(rect.width * dpr));
      canvas.height = Math.max(1, Math.round(rect.height * dpr));
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      const styles = getComputedStyle(document.documentElement);
      canvasMetrics = {
        width: rect.width,
        height: rect.height,
        bone: styles.getPropertyValue("--bone-dim").trim() || "#999",
        cyan: styles.getPropertyValue("--cyan").trim() || "#77e6ef",
      };
      return canvasMetrics;
    }

    function sampleCanopy(points, limit = 600, stratified = false) {
      if (points.length <= limit) return points;
      if (!stratified) {
        const sample = [];
        for (let index = 0; index < limit; index += 1) {
          sample.push(points[Math.floor((index * (points.length - 1)) / (limit - 1))]);
        }
        return sample;
      }
      const levels = new Map();
      points.forEach((point) => {
        if (!levels.has(point.depth)) levels.set(point.depth, []);
        levels.get(point.depth).push(point);
      });
      const sample = [];
      const selected = new Set();
      const perLevel = Math.max(1, Math.floor(limit / levels.size));
      levels.forEach((level) => {
        const count = Math.min(perLevel, level.length);
        for (let index = 0; index < count; index += 1) {
          const point = level[Math.floor((index * (level.length - 1)) / Math.max(1, count - 1))];
          sample.push(point);
          selected.add(point);
        }
      });
      const remaining = limit - sample.length;
      if (remaining > 0) {
        const candidates = points.filter((point) => !selected.has(point));
        for (let index = 0; index < Math.min(remaining, candidates.length); index += 1) {
          sample.push(candidates[Math.floor((index * (candidates.length - 1)) / Math.max(1, remaining - 1))]);
        }
      }
      return sample;
    }

    function canopyPoint(point, maxDepth) {
      const horizontalPad = 8;
      const verticalPad = 14;
      return {
        x: horizontalPad + point.u * (canvasMetrics.width - horizontalPad * 2),
        y: canvasMetrics.height - verticalPad
          - (point.depth / maxDepth) * Math.max(1, canvasMetrics.height - 88),
      };
    }

    function announceSearchMilestone(visited) {
      const reached = searchMilestones.filter((milestone) => visited >= milestone).at(-1) || 0;
      if (reached > announcedMilestone) {
        announcedMilestone = reached;
        searchAnnouncer.textContent = `Bounded search reached ${reached.toLocaleString()} strings.`;
      }
    }

    function drawCanopy(points, visited, final = false) {
      latestPoints = points;
      latestVisited = visited;
      latestCanopyFinal = final;
      context.clearRect(0, 0, canvasMetrics.width, canvasMetrics.height);
      context.globalAlpha = 0.22;
      context.strokeStyle = canvasMetrics.bone;
      context.lineWidth = 0.7;
      context.beginPath();
      const rendered = sampleCanopy(points, 600, final);
      const maxDepth = Math.max(1, points.at(-1)?.depth || 1);
      rendered.forEach((point) => {
        if (!point.parent) return;
        const parent = canopyPoint(point.parent, maxDepth);
        const child = canopyPoint(point, maxDepth);
        context.moveTo(parent.x, parent.y);
        context.lineTo(child.x, child.y);
      });
      context.stroke();
      context.globalAlpha = 0.82;
      context.fillStyle = canvasMetrics.cyan;
      rendered.forEach((point) => {
        const projected = canopyPoint(point, maxDepth);
        context.fillRect(projected.x - 0.8, projected.y - 0.8, 1.6, 1.6);
      });
      context.globalAlpha = 1;
      counter.textContent = `STRINGS VISITED / ${String(visited).padStart(5, "0")}`;
      announceSearchMilestone(visited);
    }

    function stopSearch(label) {
      searchRun += 1;
      resumeSearch = null;
      searchButton.disabled = false;
      searchButton.textContent = label || "BEGIN BOUNDED SEARCH";
    }

    function scheduleSearchFrame(callback) {
      if (map.isMotionOff()) window.setTimeout(callback, 0);
      else requestAnimationFrame(callback);
    }

    function beginSearch() {
      stopSearch();
      const run = ++searchRun;
      refreshCanvasMetrics();
      const queue = [{ value: "MI", depth: 0, u: 0.5, parent: null }];
      const seen = new Set(["MI"]);
      const points = [queue[0]];
      let cursor = 0;
      announcedMilestone = 0;
      searchAnnouncer.textContent = "Bounded search started.";
      counter.textContent = "STRINGS VISITED / 00001";
      searchButton.disabled = true;
      searchButton.textContent = "SEARCHING THE CANOPY…";
      invariant.hidden = true;

      function frame() {
        if (run !== searchRun || !details.open) return;
        if (!inView || !pageVisible) return;
        const frameStart = performance.now();
        while (cursor < queue.length && seen.size < 50000 && performance.now() - frameStart < 7) {
          const parent = queue[cursor++];
          allMIUDerivations(parent.value).forEach((value, childIndex, children) => {
            if (seen.size >= 50000 || value.length > 100 || seen.has(value)) return;
            seen.add(value);
            const depth = parent.depth + 1;
            const spread = 0.32 / Math.sqrt(depth);
            const direction = children.length > 1
              ? (childIndex / (children.length - 1)) * 2 - 1
              : stableUnit(value) * 2 - 1;
            const offset = direction * spread;
            const u = Math.max(0.025, Math.min(0.975, parent.u + offset));
            const child = { value, depth, u, parent };
            queue.push(child);
            points.push(child);
          });
        }
        if (!map.isMotionOff()) drawCanopy(points, seen.size);
        if (cursor < queue.length && seen.size < 50000) scheduleSearchFrame(frame);
        else {
          resumeSearch = null;
          drawCanopy(points, seen.size, true);
          searchButton.disabled = false;
          searchButton.textContent = seen.size >= 50000 ? "SEARCH CAPPED AT 50,000" : "FINITE CANOPY EXHAUSTED";
          searchAnnouncer.textContent = `Bounded search complete at ${seen.size.toLocaleString()} strings. MU was not found. Absence in search is not the proof.`;
          if (map.isMotionOff()) invariant.hidden = false;
        }
      }
      resumeSearch = frame;
      scheduleSearchFrame(frame);
    }

    searchButton.addEventListener("click", beginSearch);
    outsideButton.addEventListener("click", () => {
      stopSearch("SEARCH HALTED / OUTSIDE VIEW");
      invariant.hidden = false;
      searchAnnouncer.textContent = "Search halted. Outside invariant revealed: the count of I symbols is never zero modulo three.";
      invariant.scrollIntoView({ behavior: map.isMotionOff() ? "auto" : "smooth", block: "nearest" });
    });
    details.addEventListener("toggle", () => {
      stopSearch();
      if (details.open) {
        renderManualTree();
        refreshCanvasMetrics();
        drawCanopy([], 0);
      }
    });
    new ResizeObserver(() => {
      if (details.open) {
        renderManualTree();
        refreshCanvasMetrics();
        drawCanopy(latestPoints, latestVisited, latestCanopyFinal);
      }
    }).observe(document.querySelector(".grove-body"));
    new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      if (inView && pageVisible && resumeSearch) scheduleSearchFrame(resumeSearch);
    }, { rootMargin: "200px" }).observe(details);
    document.addEventListener("visibilitychange", () => {
      pageVisible = !document.hidden;
      if (pageVisible && inView && resumeSearch) scheduleSearchFrame(resumeSearch);
    });
    renderManualTree();
  }

  function setupRoom() {
    const scroller = document.querySelector(".room-scroll");
    const frame = document.getElementById("room-frame");
    if (!scroller || !frame) return;
    const lines = [...frame.querySelectorAll("[data-room-line]")];
    let ticking = false;
    let sequential = false;

    function update() {
      ticking = false;
      if (sequential || map.isMotionOff()) {
        lines.forEach((line) => line.classList.add("is-visible"));
        frame.style.setProperty("--wall-inset", sequential ? "1rem" : "8%");
        frame.style.setProperty("--wall-alpha", "0.52");
        frame.style.setProperty("--wall-shadow", "3rem");
        frame.style.setProperty("--room-vignette", "0.32");
        return;
      }
      const rect = scroller.getBoundingClientRect();
      const travel = Math.max(1, rect.height - window.innerHeight);
      const progress = Math.max(0, Math.min(1, -rect.top / travel));
      const active = Math.min(lines.length - 1, Math.floor(progress * lines.length));
      lines.forEach((line, index) => line.classList.toggle("is-visible", index === active));
      frame.style.setProperty("--wall-inset", `${(progress * 17).toFixed(2)}%`);
      frame.style.setProperty("--wall-alpha", (0.18 + progress * 0.55).toFixed(3));
      frame.style.setProperty("--wall-shadow", `${(progress * 8).toFixed(2)}rem`);
      frame.style.setProperty("--room-vignette", (progress * 0.92).toFixed(3));
    }

    function schedule() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    }
    function syncMode() {
      sequential = getComputedStyle(frame).getPropertyValue("--room-sequential").trim() === "1";
      schedule();
    }
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", syncMode, { passive: true });
    map.onMotionChange(schedule);
    syncMode();
    update();
  }

  setupNumbering();
  setupSyntaxTree();
  setupLifeThread();
  setupProofGrove();
  setupRoom();
})();
