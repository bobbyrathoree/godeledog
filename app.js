const svgNS = "http://www.w3.org/2000/svg";

const steps = [
  {
    state: "seal",
    index: "01 / BUILD A WORLD",
    title: "Give arithmetic a border.",
    body:
      "Call the system T. A machine could list its axioms and check its proofs, and it knows enough arithmetic to talk about its own formulas. Assume it never contradicts itself.",
    formula: "axioms + rules → every T-proof",
    note: "Consistent means T never proves both φ and ¬φ.",
    status: "BOUNDARY OPEN",
    system: "SYSTEM T₀",
    core: "T",
    caption: "UNSEALED",
    next: "SEAL THE SYSTEM",
  },
  {
    state: "number",
    index: "02 / NUMBER EVERYTHING",
    title: "Turn language into arithmetic.",
    body:
      "Symbols become numbers. Finite strings become numbers. Entire proofs become numbers. Arithmetic can now make claims about its own machinery.",
    formula: "Prov_T(n) := ∃p Proof_T(p, n)",
    note: "Prov_T(n) means: the sentence numbered n has a proof in T.",
    status: "LANGUAGE ENCODED",
    system: "SYSTEM T₀ / CODED",
    core: "⌜φ⌝",
    caption: "GÖDEL NUMBER",
    next: "TURN THE MIRROR",
  },
  {
    state: "mirror",
    index: "03 / TURN THE MIRROR",
    title: "Make a sentence point at itself.",
    body:
      "The diagonal lemma constructs a fixed-point sentence G. It does not say ‘I am false.’ It says no number encodes a T-proof of this very sentence.",
    formula: "T ⊢ G_T ↔ ¬Prov_T(⌜G_T⌝)",
    note: "A fixed point—not the liar paradox.",
    status: "SELF-REFERENCE ACHIEVED",
    system: "SYSTEM T₀ / REFLEXIVE",
    core: "G",
    caption: "NO PROOF OF ME",
    next: "ATTEMPT A PROOF",
  },
  {
    state: "prove",
    index: "04 / TRY TO PROVE G",
    title: "A proof collides with its own code.",
    body:
      "If T proved G, that proof would have a number T could verify. T would then certify Prov_T(⌜G⌝), while G yields its negation.",
    formula: "T ⊢ G  ⇒  T ⊢ Prov_T(⌜G⌝) ∧ ¬Prov_T(⌜G⌝)",
    note: "If T is consistent, T cannot prove G.",
    status: "PROOF CHANNEL ARMED",
    system: "SYSTEM T₀ / CONSISTENT",
    core: "G",
    caption: "ATTEMPT PROOF",
    next: "TRY THE OTHER DOOR",
  },
  {
    state: "rosser",
    index: "05 / TRY THE OTHER DOOR",
    title: "Rosser sharpens the mirror.",
    body:
      "Ruling out a proof of not-G originally needed an extra assumption. Rosser reshapes the sentence so plain consistency is enough — now neither side can be proved.",
    formula: "T ⊢ R_T ↔ ∀p(Proof_T(p,⌜R⌝) → ∃q<p Proof_T(q,⌜¬R⌝))",
    note: "For consistent T, neither R nor ¬R is provable in T.",
    status: "SECOND CHANNEL ARMED",
    system: "SYSTEM T₀ / ROSSER",
    core: "R",
    caption: "FIRST PROOF?",
    next: "PATCH THE HOLE",
  },
  {
    state: "patch",
    index: "06 / PATCH THE HOLE",
    title: "Repair this gap. Create the next.",
    body:
      "Add R as an axiom. The enlarged system proves R immediately. But if it remains consistent, effective, and arithmetically strong, a new undecidable sentence appears.",
    formula: "T₀ ⊂ T₁ ⊂ T₂ ⊂ ⋯",
    note: "You can patch this hole. You cannot seal the pattern.",
    status: "BOUNDARY READY TO EXPAND",
    system: "SYSTEM T₀ + R₀",
    core: "R₀",
    caption: "ADD AS AXIOM",
    next: "PULL OUTSIDE",
  },
  {
    state: "outside",
    index: "07 / PULL OUTSIDE",
    title: "From here, the limit is a theorem.",
    body:
      "Outside T, we prove what T cannot prove inside itself. The metatheory is not magical: formalize it as another suitable system, and it grows a horizon of its own.",
    formula: "META ⊢ Con(T) → (T ⊬ R ∧ T ⊬ ¬R)",
    note: "Gödel’s theorem is proven. Completeness is what fails.",
    status: "NO FINAL INSIDE",
    system: "VIEWPOINT / META",
    core: "G∞",
    caption: "HORIZON",
    next: "RETURN TO ORIGIN",
  },
];

const refs = {
  body: document.body,
  shell: document.querySelector(".machine-shell"),
  stage: document.getElementById("machine-stage"),
  status: document.getElementById("stage-status"),
  system: document.getElementById("system-readout"),
  derivation: document.getElementById("derivation-readout"),
  core: document.getElementById("core-symbol"),
  caption: document.getElementById("core-caption"),
  action: document.getElementById("stage-action"),
  index: document.getElementById("console-index"),
  title: document.getElementById("console-title"),
  bodyCopy: document.getElementById("console-body"),
  panel: document.getElementById("console-panel"),
  formula: document.getElementById("console-formula"),
  note: document.getElementById("console-note"),
  fraction: document.getElementById("step-fraction"),
  prev: document.getElementById("prev-step"),
  next: document.getElementById("next-step"),
  tabs: [...document.querySelectorAll(".step-tab")],
  map: document.getElementById("proof-map"),
  web: document.getElementById("proof-web"),
  labels: document.getElementById("axiom-labels"),
  bars: document.getElementById("number-bars"),
  recursive: document.getElementById("recursive-rings"),
  branchLeft: document.getElementById("branch-left-label"),
  branchRight: document.getElementById("branch-right-label"),
  motion: document.getElementById("motion-toggle"),
  dialog: document.getElementById("precision-dialog"),
  clock: document.getElementById("clock-readout"),
  canvas: document.getElementById("symbol-field"),
};

let currentStep = 0;
let patchLevel = 0;
let motionOff = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const motionSubscribers = new Set();
const mirrorProvabilityResult = `<strong>PROVABILITY SURVIVES THE MIRROR.</strong> T ⊢ G ↔ ¬Prov<sub>T</sub>(⌜G⌝). If T is consistent, T cannot prove G. Gödel’s original argument needs a stronger assumption for the other side; Rosser removes it in step 05. Same diagonal machine: here it yields a sentence T cannot prove.`;
let nodes = [];
let edges = [];

function createSvg(tag, attributes = {}) {
  const element = document.createElementNS(svgNS, tag);
  Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value));
  return element;
}

function seededRandom(seed) {
  const value = Math.sin(seed * 931.177) * 43758.5453;
  return value - Math.floor(value);
}

function polar(radius, angle, wobble = 0) {
  return {
    x: 450 + Math.cos(angle) * (radius + wobble),
    y: 450 + Math.sin(angle) * (radius + wobble),
  };
}

function buildProofWeb() {
  const rings = [
    { count: 22, radius: 335, offset: -Math.PI / 2, source: true },
    { count: 16, radius: 268, offset: -Math.PI / 2 + 0.09 },
    { count: 11, radius: 196, offset: -Math.PI / 2 - 0.13 },
    { count: 7, radius: 132, offset: -Math.PI / 2 + 0.22 },
  ];

  nodes = [];
  edges = [];
  refs.web.replaceChildren();
  refs.labels.replaceChildren();

  rings.forEach((ring, ringIndex) => {
    for (let i = 0; i < ring.count; i += 1) {
      const angle = ring.offset + (i / ring.count) * Math.PI * 2;
      const wobble = (seededRandom(i + ringIndex * 37) - 0.5) * 22;
      const point = polar(ring.radius, angle, wobble);
      point.ring = ringIndex;
      point.index = i;
      point.source = Boolean(ring.source);
      point.id = nodes.length;
      nodes.push(point);
    }
  });

  rings.slice(0, -1).forEach((ring, ringIndex) => {
    const outer = nodes.filter((node) => node.ring === ringIndex);
    const inner = nodes.filter((node) => node.ring === ringIndex + 1);

    outer.forEach((source, i) => {
      const targetIndex = Math.floor((i / outer.length) * inner.length) % inner.length;
      const targets = [inner[targetIndex]];
      if (i % 3 === 0) targets.push(inner[(targetIndex + 1) % inner.length]);
      if (i % 7 === 0) targets.push(inner[(targetIndex + inner.length - 1) % inner.length]);

      targets.forEach((target, targetOffset) => {
        const bend = ((seededRandom(i * 19 + targetOffset * 7 + ringIndex) - 0.5) * 38);
        const midX = (source.x + target.x) / 2 + bend;
        const midY = (source.y + target.y) / 2 - bend;
        const path = createSvg("path", {
          d: `M${source.x.toFixed(1)} ${source.y.toFixed(1)} Q${midX.toFixed(1)} ${midY.toFixed(1)} ${target.x.toFixed(1)} ${target.y.toFixed(1)}`,
          class: `proof-edge${i % 5 === 0 ? " is-major" : ""}`,
          "data-from": source.id,
          "data-to": target.id,
        });
        refs.web.appendChild(path);
        edges.push({ source, target, element: path });
      });
    });
  });

  nodes.forEach((node) => {
    const radius = node.source ? 2.6 : 2.1;
    const circle = createSvg("circle", {
      cx: node.x.toFixed(1),
      cy: node.y.toFixed(1),
      r: radius,
      class: `proof-node${node.source ? " is-source" : ""}`,
      "data-node": node.id,
    });
    node.element = circle;
    refs.web.appendChild(circle);
  });

  const axiomNames = ["0≠S0", "x+0=x", "x·0=0", "Sx≠0", "IND", "=", "+", "×", "¬", "∀", "∃"];
  nodes
    .filter((node) => node.source && node.index % 2 === 0)
    .forEach((node, i) => {
      const angle = Math.atan2(node.y - 450, node.x - 450);
      const labelPoint = polar(371, angle);
      const text = createSvg("text", {
        x: labelPoint.x.toFixed(1),
        y: labelPoint.y.toFixed(1),
        class: "axiom-label",
      });
      text.textContent = axiomNames[i % axiomNames.length];
      refs.labels.appendChild(text);
    });
}

function buildNumberBars() {
  refs.bars.replaceChildren();
  for (let i = 0; i < 72; i += 1) {
    const angle = (i / 72) * Math.PI * 2;
    const point = polar(250, angle);
    const height = 3 + Math.floor(seededRandom(i + 200) * 22);
    const rect = createSvg("rect", {
      x: (point.x - 1).toFixed(1),
      y: (point.y - height / 2).toFixed(1),
      width: i % 5 === 0 ? 2.2 : 1,
      height,
      class: "number-bar",
      transform: `rotate(${(angle * 180) / Math.PI + 90} ${point.x.toFixed(1)} ${point.y.toFixed(1)})`,
      style: `animation-delay:${(i % 12) * -0.17}s`,
    });
    refs.bars.appendChild(rect);
  }
}

function buildHeroTicks() {
  const group = document.querySelector(".orbit-ticks");
  if (!group) return;
  for (let i = 0; i < 60; i += 1) {
    const angle = (i / 60) * Math.PI * 2;
    const outer = {
      x: 320 + Math.cos(angle) * 282,
      y: 320 + Math.sin(angle) * 282,
    };
    const innerRadius = i % 5 === 0 ? 270 : 276;
    const inner = {
      x: 320 + Math.cos(angle) * innerRadius,
      y: 320 + Math.sin(angle) * innerRadius,
    };
    group.appendChild(
      createSvg("line", {
        x1: inner.x.toFixed(1),
        y1: inner.y.toFixed(1),
        x2: outer.x.toFixed(1),
        y2: outer.y.toFixed(1),
        stroke: i % 5 === 0 ? "rgba(119,230,239,.6)" : "rgba(238,233,220,.25)",
        "stroke-width": i % 5 === 0 ? 1 : 0.5,
      }),
    );
  }
}

function addRecursiveRing(level, animate = true) {
  const radius = 112 + level * 58;
  if (radius > 392) return;
  const ring = createSvg("circle", {
    cx: 450,
    cy: 450,
    r: radius,
    class: "recursive-ring",
    style: `animation-duration:${29 + level * 7}s;${animate ? "" : "animation:none;"}`,
  });
  const angle = -0.5 + level * 1.37;
  const gap = polar(radius, angle);
  const dot = createSvg("circle", {
    cx: gap.x.toFixed(1),
    cy: gap.y.toFixed(1),
    r: 4.5,
    class: "recursive-gap",
  });
  const label = createSvg("text", {
    x: (gap.x + 9).toFixed(1),
    y: (gap.y - 9).toFixed(1),
    class: "recursive-label",
  });
  label.textContent = `G${level}`;
  refs.recursive.append(ring, dot, label);
}

function rebuildRecursiveRings(minimum = 2) {
  refs.recursive.replaceChildren();
  const total = Math.max(minimum, patchLevel + 1);
  for (let i = 0; i < Math.min(total, 5); i += 1) addRecursiveRing(i, !motionOff);
}

function highlightNearPointer(event) {
  const bounds = refs.stage.getBoundingClientRect();
  const xPct = ((event.clientX - bounds.left) / bounds.width) * 100;
  const yPct = ((event.clientY - bounds.top) / bounds.height) * 100;
  refs.stage.style.setProperty("--lantern-x", `${xPct}%`);
  refs.stage.style.setProperty("--lantern-y", `${yPct}%`);

  const svgPoint = refs.map.createSVGPoint();
  svgPoint.x = event.clientX;
  svgPoint.y = event.clientY;
  const screenMatrix = refs.map.getScreenCTM();
  if (!screenMatrix) return;
  const local = svgPoint.matrixTransform(screenMatrix.inverse());

  let nearest = null;
  let nearestDistance = Infinity;
  nodes.forEach((node) => {
    const distance = Math.hypot(node.x - local.x, node.y - local.y);
    const near = distance < 58;
    node.element?.classList.toggle("is-near", near);
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearest = node;
    }
  });

  edges.forEach((edge) => {
    const near = edge.source.element?.classList.contains("is-near") || edge.target.element?.classList.contains("is-near");
    edge.element.classList.toggle("is-near", near);
  });

  if (nearest) {
    const code = String((nearest.id + 1) * 1931 + currentStep * 7919).padStart(6, "0");
    refs.derivation.textContent = `DERIVATION ${code}`;
  }
}

function clearLantern() {
  refs.stage.style.setProperty("--lantern-x", "50%");
  refs.stage.style.setProperty("--lantern-y", "50%");
  nodes.forEach((node) => node.element?.classList.remove("is-near"));
  edges.forEach((edge) => edge.element.classList.remove("is-near"));
}

function pulseFracture() {
  refs.shell.classList.remove("is-fracturing");
  void refs.shell.offsetWidth;
  refs.shell.classList.add("is-fracturing");
  window.setTimeout(() => refs.shell.classList.remove("is-fracturing"), motionOff ? 20 : 1250);
}

function renderStageAction(stepIndex) {
  refs.action.replaceChildren();

  if (stepIndex === 2) {
    const mirrorControls = document.createElement("div");
    mirrorControls.className = "mirror-controls";
    mirrorControls.setAttribute("role", "group");
    mirrorControls.setAttribute("aria-label", "Choose what the diagonal mirror receives");

    const provButton = actionButton("FEED Prov(x)", () => renderMirrorChoice("prov", provButton, truthButton, result));
    const truthButton = actionButton("FEED Tr(x)", () => renderMirrorChoice("truth", provButton, truthButton, result));
    provButton.classList.add("is-accepted");
    provButton.setAttribute("aria-pressed", "true");
    truthButton.setAttribute("aria-pressed", "false");

    const result = document.createElement("div");
    result.className = "mirror-result";
    result.innerHTML = mirrorProvabilityResult;
    mirrorControls.append(provButton, truthButton, result);
    refs.action.appendChild(mirrorControls);
  }

  if (stepIndex === 0) {
    const button = actionButton("SEAL SYSTEM T", () => {
      refs.status.textContent = "BOUNDARY SEALED";
      refs.caption.textContent = "CONSISTENT / ASSUMED";
      button.textContent = "SYSTEM SEALED ✓";
      button.classList.add("is-accepted");
      button.disabled = true;
    });
    refs.action.appendChild(button);
  }

  if (stepIndex === 3) {
    const button = actionButton("ATTEMPT T ⊢ G", () => {
      pulseFracture();
      button.textContent = "CONTRADICTION / REJECTED";
      button.classList.add("is-rejected");
      button.disabled = true;
      refs.status.textContent = "CONSISTENCY BLOCKS PROOF";
      refs.action.appendChild(
        actionResult("A proof of G gives T both Prov_T(⌜G⌝) and its negation. Consistent T cannot contain that proof."),
      );
    });
    refs.action.appendChild(button);
  }

  if (stepIndex === 4) {
    const left = actionButton("ATTEMPT T ⊢ R", () => rejectRosser(left, "R"));
    const right = actionButton("ATTEMPT T ⊢ ¬R", () => rejectRosser(right, "¬R"));
    refs.action.append(left, right);
  }

  if (stepIndex === 5) {
    const button = actionButton("", () => {
      patchLevel = Math.min(patchLevel + 1, 5);
      rebuildRecursiveRings();
      syncPatchState(button);
    });
    syncPatchState(button);
    refs.action.appendChild(button);
  }
}

function renderMirrorChoice(choice, provButton, truthButton, result) {
  const isTruth = choice === "truth";
  refs.shell.classList.toggle("is-truth-mirror", isTruth);
  provButton.classList.toggle("is-accepted", !isTruth);
  truthButton.classList.toggle("is-rejected", isTruth);
  provButton.setAttribute("aria-pressed", String(!isTruth));
  truthButton.setAttribute("aria-pressed", String(isTruth));

  if (isTruth) {
    pulseFracture();
    refs.core.textContent = "Tr?";
    refs.caption.textContent = "TRUTH SEAL / BROKEN";
    refs.status.textContent = "GLOBAL TRUTH CLAIM REJECTED";
    result.innerHTML = `<strong>THE SEAL BREAKS; THE FORMULA REMAINS.</strong> T ⊢ L ↔ ¬Tr(⌜L⌝). No arithmetical candidate can correctly define truth for every arithmetical sentence. The diagonal breaks the claim, not the system. Same machine: fed “truth,” it shows no such predicate existed to feed. That is why G is not the liar.`;
    return;
  }

  refs.core.textContent = "G";
  refs.caption.textContent = "NO PROOF OF ME";
  refs.status.textContent = "PROVABILITY / DEFINABLE";
  result.innerHTML = mirrorProvabilityResult;
}

function syncPatchState(button) {
  if (patchLevel === 0) {
    refs.system.textContent = "SYSTEM T₀ + R₀";
    refs.core.textContent = "R₀";
    refs.caption.textContent = "ADD AS AXIOM";
    refs.status.textContent = "BOUNDARY READY TO EXPAND";
    button.textContent = "ADD R₀ AS AXIOM";
    return;
  }

  refs.system.textContent = `SYSTEM T${patchLevel}`;
  refs.core.textContent = `R${patchLevel}`;
  refs.caption.textContent = "NEW HORIZON";
  refs.status.textContent = patchLevel < 5 ? "PATCHED / NEW GAP FOUND" : "FINITE PATCHES CONTINUE → Tω";
  button.textContent = patchLevel < 5 ? `ADD R${patchLevel} AS AXIOM` : "AND AGAIN · AND AGAIN · AND AGAIN";
  if (patchLevel >= 5) {
    button.disabled = true;
    button.classList.add("is-rejected");
  }
}

function actionButton(label, handler) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "proof-action";
  button.textContent = label;
  button.addEventListener("click", handler);
  return button;
}

function actionResult(message) {
  const result = document.createElement("div");
  result.className = "action-result";
  result.innerHTML = `<strong>COLLISION.</strong> ${message}`;
  return result;
}

function rejectRosser(button, side) {
  pulseFracture();
  button.textContent = `${side} / NO PROOF IN T`;
  button.classList.add("is-rejected");
  button.disabled = true;
  refs.status.textContent = "FIRST-PROOF TRAP TRIGGERED";
  const buttons = refs.action.querySelectorAll("button");
  if ([...buttons].every((item) => item.disabled)) {
    refs.action.appendChild(
      actionResult("If R were proved first, R would force an earlier proof of ¬R. If ¬R were proved, its finite code lets T verify R—so T would prove both."),
    );
  }
}

function updateStep(index, options = {}) {
  currentStep = Math.max(0, Math.min(steps.length - 1, index));
  const step = steps[currentStep];

  refs.shell.dataset.state = step.state;
  refs.shell.classList.remove("is-truth-mirror");
  refs.index.textContent = step.index;
  refs.title.textContent = step.title;
  refs.bodyCopy.textContent = step.body;
  refs.formula.textContent = step.formula;
  refs.note.textContent = step.note;
  refs.status.textContent = step.status;
  refs.system.textContent = step.system;
  refs.core.textContent = step.core;
  refs.caption.textContent = step.caption;
  refs.branchLeft.textContent = currentStep === 4 ? "T ⊢ R" : "T ⊢ G";
  refs.branchRight.textContent = "T ⊢ ¬R";
  refs.fraction.textContent = `${String(currentStep + 1).padStart(2, "0")} / 07`;

  refs.prev.disabled = currentStep === 0;
  refs.next.innerHTML = `${step.next} <span aria-hidden="true">${currentStep === steps.length - 1 ? "↺" : "→"}</span>`;

  refs.tabs.forEach((tab, tabIndex) => {
    const active = tabIndex === currentStep;
    tab.classList.toggle("is-active", active);
    tab.setAttribute("aria-selected", String(active));
    tab.setAttribute("tabindex", active ? "0" : "-1");
  });
  refs.panel.setAttribute("aria-labelledby", `step-tab-${currentStep}`);

  renderStageAction(currentStep);
  if (currentStep >= 5) rebuildRecursiveRings(currentStep === 6 ? 5 : 2);

  if (options.focusTitle) refs.title.focus?.({ preventScroll: true });
}

function nextStep() {
  if (currentStep === steps.length - 1) {
    document.getElementById("top").focus({ preventScroll: true });
    window.history.replaceState(null, "", "#top");
    window.scrollTo({ top: 0, behavior: motionOff ? "auto" : "smooth" });
    return;
  }
  updateStep(currentStep + 1);
}

function previousStep() {
  updateStep(currentStep - 1);
}

function setupDialog() {
  document.querySelectorAll("[data-open-precision]").forEach((button) => {
    button.addEventListener("click", () => refs.dialog.showModal());
  });
  document.querySelector(".dialog-close").addEventListener("click", () => refs.dialog.close());
  refs.dialog.addEventListener("click", (event) => {
    const bounds = refs.dialog.getBoundingClientRect();
    const outside =
      event.clientX < bounds.left ||
      event.clientX > bounds.right ||
      event.clientY < bounds.top ||
      event.clientY > bounds.bottom;
    if (outside) refs.dialog.close();
  });
}

function setupMotionToggle() {
  const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  let systemReduced = reducedMotionQuery.matches;
  const label = refs.motion.querySelector("span");
  function sync() {
    document.documentElement.classList.toggle("motion-off", motionOff);
    refs.motion.setAttribute("aria-pressed", String(!motionOff));
    label.textContent = motionOff ? "OFF" : "ON";
    refs.motion.disabled = systemReduced;
    refs.motion.setAttribute(
      "aria-label",
      systemReduced ? "Motion disabled by system preference" : "Motion",
    );
    if (motionOff) clearLantern();
    motionSubscribers.forEach((subscriber) => subscriber(motionOff));
  }
  refs.motion.addEventListener("click", () => {
    if (systemReduced) return;
    motionOff = !motionOff;
    sync();
    if (!motionOff) startCanvas();
  });
  reducedMotionQuery.addEventListener("change", (event) => {
    systemReduced = event.matches;
    motionOff = event.matches;
    sync();
    if (!motionOff) startCanvas();
  });
  sync();
}

window.HoleMap = {
  createSvg,
  seededRandom,
  isMotionOff: () => motionOff,
  onMotionChange(callback) {
    motionSubscribers.add(callback);
    callback(motionOff);
    return () => motionSubscribers.delete(callback);
  },
  pulseFracture,
};

function updateClock() {
  const now = new Date();
  refs.clock.textContent = [now.getHours(), now.getMinutes(), now.getSeconds()]
    .map((value) => String(value).padStart(2, "0"))
    .join(":");
}

function setupPointer() {
  window.addEventListener(
    "pointermove",
    (event) => {
      if (motionOff) return;
      document.documentElement.style.setProperty("--pointer-x", `${event.clientX}px`);
      document.documentElement.style.setProperty("--pointer-y", `${event.clientY}px`);
    },
    { passive: true },
  );
  refs.stage.addEventListener("pointermove", (event) => {
    if (!motionOff) highlightNearPointer(event);
  }, { passive: true });
  refs.stage.addEventListener("pointerleave", clearLantern);
}

let canvasInitialized = false;
let resumeCanvas = () => {};
function startCanvas() {
  if (motionOff) return;
  if (canvasInitialized) {
    resumeCanvas();
    return;
  }
  canvasInitialized = true;
  const canvas = refs.canvas;
  const context = canvas.getContext("2d", { alpha: true });
  const symbols = ["0", "1", "∀", "∃", "¬", "⊢", "=", "+", "×", "S", "(", ")", "G"];
  const monoFont = getComputedStyle(document.documentElement).getPropertyValue("--mono").trim() || "monospace";
  let width = 0;
  let height = 0;
  let dpr = 1;
  let motes = [];
  let running = false;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = Math.min(130, Math.floor((width * height) / 9000));
    motes = Array.from({ length: count }, (_, i) => ({
      angle: seededRandom(i + 800) * Math.PI * 2,
      radius: 40 + seededRandom(i + 900) * Math.max(width, height) * 0.72,
      speed: (0.00008 + seededRandom(i + 1000) * 0.00023) * (i % 2 ? 1 : -1),
      depth: 0.25 + seededRandom(i + 1100) * 0.75,
      glyph: symbols[Math.floor(seededRandom(i + 1200) * symbols.length)],
      phase: seededRandom(i + 1300) * Math.PI * 2,
    }));
  }

  function frame(time) {
    if (motionOff) {
      running = false;
      context.clearRect(0, 0, width, height);
      return;
    }
    context.clearRect(0, 0, width, height);
    const cx = width * 0.68;
    const cy = height * 0.48;
    context.textAlign = "center";
    context.textBaseline = "middle";

    motes.forEach((mote, i) => {
      const angle = mote.angle + time * mote.speed;
      const squeeze = 0.42 + mote.depth * 0.24;
      const pulse = Math.sin(time * 0.00045 + mote.phase) * 9;
      const x = cx + Math.cos(angle) * (mote.radius + pulse);
      const y = cy + Math.sin(angle) * (mote.radius + pulse) * squeeze;
      const alpha = 0.06 + mote.depth * 0.12;
      context.fillStyle = i % 17 === 0 ? `rgba(255,63,84,${alpha * 1.3})` : `rgba(119,230,239,${alpha})`;
      context.font = `${8 + mote.depth * 5}px ${monoFont}`;
      context.fillText(mote.glyph, x, y);
    });

    requestAnimationFrame(frame);
  }

  resize();
  window.addEventListener("resize", resize, { passive: true });
  resumeCanvas = () => {
    if (running || motionOff) return;
    running = true;
    requestAnimationFrame(frame);
  };
  resumeCanvas();
}

refs.prev.addEventListener("click", previousStep);
refs.next.addEventListener("click", nextStep);
refs.tabs.forEach((tab) => tab.addEventListener("click", () => updateStep(Number(tab.dataset.step))));
document.querySelector(".skip-link").addEventListener("click", () => {
  window.setTimeout(() => document.getElementById("machine").focus({ preventScroll: true }), 0);
});
document.querySelector(".step-track").addEventListener("keydown", (event) => {
  const keys = ["ArrowLeft", "ArrowRight", "Home", "End"];
  if (!keys.includes(event.key)) return;
  event.preventDefault();
  let target = currentStep;
  if (event.key === "ArrowLeft") target = (currentStep + steps.length - 1) % steps.length;
  if (event.key === "ArrowRight") target = (currentStep + 1) % steps.length;
  if (event.key === "Home") target = 0;
  if (event.key === "End") target = steps.length - 1;
  updateStep(target);
  refs.tabs[target].focus();
});

buildHeroTicks();
buildProofWeb();
buildNumberBars();
rebuildRecursiveRings();
setupDialog();
setupMotionToggle();
setupPointer();
updateStep(0);
updateClock();
window.setInterval(updateClock, 1000);
startCanvas();
