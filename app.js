const expressionEl = document.getElementById("expressionLine");
const previewEl = document.getElementById("previewLine");
const statusEl = document.getElementById("status");
const themeColorMeta = document.querySelector('meta[name="theme-color"]');
const historyEl = document.getElementById("history");
const historyPanel = document.getElementById("historyPanel");
const historyToggle = document.getElementById("historyToggle");
const themePanel = document.getElementById("themePanel");
const graphPanel = document.getElementById("graphPanel");
const graphToggle = document.getElementById("graphToggle");
const graphExpressionInput = document.getElementById("graphExpression");
const graphPlotButton = document.getElementById("graphPlotButton");
const graphPresets = document.getElementById("graphPresets");
const graphCanvas = document.getElementById("graphCanvas");
const graphMeta = document.getElementById("graphMeta");
const calculatorShell = document.querySelector(".calculator-shell");
const calculatorModeLabel = document.getElementById("calculatorModeLabel");
const headerActionsEl = document.querySelector(".header-actions");
const formulaPanel = document.getElementById("formulaPanel");
const formulaToggle = document.getElementById("formulaToggle");
const formulaList = document.getElementById("formulaList");
const themeGrid = document.getElementById("themeGrid");
const menuToggle = document.getElementById("menuToggle");
const mobileMenu = document.getElementById("mobileMenu");
const installAppButton = document.getElementById("installAppButton");
const installAppHelp = document.getElementById("installAppHelp");
const installAppHelpTitle = document.getElementById("installAppHelpTitle");
const installAppHelpText = document.getElementById("installAppHelpText");
const overlayBackdrop = document.getElementById("overlayBackdrop");
const clearHistoryButton = document.getElementById("clearHistory");
const exportHistoryTxtButton = document.getElementById("exportHistoryTxt");
const exportHistoryJsonButton = document.getElementById("exportHistoryJson");
const themeToggle = document.getElementById("themeToggle");
const angleToggle = document.getElementById("angleToggle");
const angleModeLabel = document.getElementById("angleModeLabel");
const copyResultButton = document.getElementById("copyResult");
const memoryBadge = document.getElementById("memoryBadge");
const buttonGrids = document.querySelectorAll(".button-grid");
const modeSwitchButtons = document.querySelectorAll(".mode-switch-btn");
const modeSwitchBar = document.querySelector(".mode-switch");
const panelCloseButtons = document.querySelectorAll("[data-close-panel]");
const compactViewportQuery = window.matchMedia("((max-width: 1024px) and (hover: none)), (max-width: 820px)");

const STORAGE_KEYS = {
  history: "scientific-calculator-history-v2",
  theme: "scientific-calculator-theme-v2",
  angle: "scientific-calculator-angle-v2",
};

const HISTORY_LIMIT = 20;
const FUNCTION_VALUES = new Set(["sin(", "cos(", "tan(", "log(", "ln(", "sqrt("]);
const BINARY_OPERATORS = new Set(["+", "-", "*", "/", "^"]);
const POSTFIX_OPERATORS = new Set(["!", "%"]);
const TOKEN_VALUES = ["sqrt(", "sin(", "cos(", "tan(", "log(", "ln(", "pi"];
const GRAPH_RANGE = Object.freeze({ min: -10, max: 10, samples: 241 });
const THEMES = Object.freeze({
  dark: { label: "Dark" },
  ocean: { label: "Ocean" },
  neon: { label: "Neon" },
  minimal: { label: "Minimal" },
});
const FORMULA_GROUPS = [
  {
    title: "Calculator Ready",
    items: [
      { label: "Square root", formula: "\u221ax", note: "Use quick input", insert: "sqrt(" },
      { label: "Power", formula: "x^y", note: "Raise any number", insert: "^" },
      { label: "Factorial", formula: "n!", note: "Non-negative integers", insert: "!" },
      { label: "Percent", formula: "a \u00b1 b%", note: "Real calculator percent", insert: "%" },
      { label: "Trig", formula: "sin(x), cos(x), tan(x)", note: "Works in DEG or RAD", insert: "sin(" },
      { label: "Logs", formula: "log(x), ln(x)", note: "Base 10 and natural log", insert: "log(" },
      { label: "Constants", formula: "\u03c0, e", note: "Insert constants quickly", insert: "pi" },
    ],
  },
  {
    title: "Algebra",
    items: [
      { label: "Square identity", formula: "(a + b)^2 = a^2 + 2ab + b^2", note: "Expansion formula" },
      { label: "Difference identity", formula: "(a - b)^2 = a^2 - 2ab + b^2", note: "Expansion formula" },
      { label: "Difference of squares", formula: "a^2 - b^2 = (a - b)(a + b)", note: "Classic factorization" },
      { label: "Quadratic roots", formula: "x = (-b \u00b1 \u221a(b^2 - 4ac)) / 2a", note: "For ax^2 + bx + c = 0" },
    ],
  },
  {
    title: "Geometry",
    items: [
      { label: "Circle area", formula: "A = \u03c0r^2", note: "Area of a circle" },
      { label: "Circumference", formula: "C = 2\u03c0r", note: "Circle boundary" },
      { label: "Triangle area", formula: "A = 1/2 \u00d7 b \u00d7 h", note: "Base-height triangle area" },
      { label: "Pythagoras", formula: "c^2 = a^2 + b^2", note: "Right triangle rule" },
    ],
  },
  {
    title: "Trigonometry",
    items: [
      { label: "Trig identity", formula: "sin^2x + cos^2x = 1", note: "Fundamental identity" },
      { label: "Tangent", formula: "tan(x) = sin(x) / cos(x)", note: "Definition of tangent" },
      { label: "Secant", formula: "sec(x) = 1 / cos(x)", note: "Reciprocal identity" },
      { label: "Cosecant", formula: "csc(x) = 1 / sin(x)", note: "Reciprocal identity" },
    ],
  },
];

const state = {
  expression: "",
  cursorIndex: 0,
  previewText: "0",
  previewState: "idle",
  expressionIssue: null,
  autoStatusActive: false,
  graphExpression: "y = sin(x)",
  lastAnswer: null,
  lastEvaluatedExpression: "",
  history: [],
  memory: 0,
  theme: "dark",
  angleMode: "deg",
  calculatorMode: "simple",
  isResult: false,
};

let graphRenderFrame = 0;
let deferredInstallPrompt = null;
let previewRenderFrame = 0;
let lastDisplaySignature = "";
let lastPreviewSignature = "";
let lastGraphRenderSignature = "";

function readStorage(key, fallback) {
  try {
    const rawValue = localStorage.getItem(key);
    return rawValue ? JSON.parse(rawValue) : fallback;
  } catch (error) {
    return fallback;
  }
}

function writeStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    // Ignore storage quota and private browsing failures.
  }
}

function updateThemeColor() {
  if (!themeColorMeta) {
    return;
  }

  const themeColor = getComputedStyle(document.documentElement).getPropertyValue("--theme-color").trim();
  themeColorMeta.setAttribute("content", themeColor || "#0f1320");
}

function isCompactViewport() {
  return compactViewportQuery.matches;
}

function triggerHaptic(pattern = 12) {
  if (typeof navigator.vibrate === "function") {
    navigator.vibrate(pattern);
  }
}

function isStandaloneMode() {
  return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
}

function isAppleMobileDevice() {
  const userAgent = navigator.userAgent || "";
  return /iphone|ipad|ipod/i.test(userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

function isSafariBrowser() {
  const userAgent = navigator.userAgent || "";
  return /safari/i.test(userAgent) && !/crios|fxios|edgios|opr\/|opios|android/i.test(userAgent);
}

function getInstallState() {
  if (isStandaloneMode()) {
    return "installed";
  }

  if (deferredInstallPrompt) {
    return "prompt";
  }

  if (isAppleMobileDevice() && isSafariBrowser()) {
    return "ios";
  }

  return "manual";
}

function setInstallHelp(title, description) {
  installAppHelp.hidden = false;
  installAppHelpTitle.textContent = title;
  installAppHelpText.textContent = description;
}

function formatExpressionForDisplay(value) {
  const source = value || "0";

  return source
    .replace(/sqrt\(/g, "\u221a(")
    .replace(/pi/g, "\u03c0")
    .replace(/\*/g, "\u00d7")
    .replace(/\//g, "\u00f7")
    .replace(/-/g, "\u2212");
}

function setStatus(message, tone = "muted", options = {}) {
  statusEl.textContent = message;
  statusEl.dataset.state = tone;
  state.autoStatusActive = options.auto === true;
}

function renderMemory() {
  memoryBadge.textContent = `Memory: ${window.CalculatorCore.formatResult(state.memory)}`;
}

function normalizeCalculatorMode(mode) {
  return mode === "scientific" ? "scientific" : "simple";
}

function renderCalculatorModeSelection() {
  const isScientific = state.calculatorMode === "scientific";

  calculatorShell.dataset.calculatorMode = state.calculatorMode;
  calculatorShell.setAttribute("aria-label", isScientific ? "Scientific Calculator" : "Simple Calculator");

  if (calculatorModeLabel) {
    calculatorModeLabel.textContent = isScientific ? "Scientific Calculator" : "Simple Calculator";
  }

  modeSwitchButtons.forEach((button) => {
    const isActive = button.dataset.calculatorMode === state.calculatorMode;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });

  buttonGrids.forEach((grid) => {
    const isActive = grid.dataset.calculatorMode === state.calculatorMode;
    grid.hidden = !isActive;
    grid.style.display = isActive ? "" : "none";
  });
}

function applyCalculatorMode(mode) {
  state.calculatorMode = normalizeCalculatorMode(mode);

  if (state.calculatorMode === "simple") {
    setPanelVisibility(formulaPanel, formulaToggle, false);
    setPanelVisibility(graphPanel, graphToggle, false);
  }

  renderCalculatorModeSelection();
  syncOverlayBackdrop();
}

function setCalculatorMode(mode) {
  const nextMode = normalizeCalculatorMode(mode);
  if (nextMode === state.calculatorMode) {
    setStatus(`${nextMode === "simple" ? "Simple" : "Scientific"} calculator is already active.`, "muted");
    return;
  }

  applyCalculatorMode(nextMode);
  setStatus(`${nextMode === "simple" ? "Simple" : "Scientific"} calculator ready.`, "success");
  triggerHaptic(10);
}

function formatEditableCharacter(character) {
  if (character === "*") {
    return "\u00d7";
  }

  if (character === "/") {
    return "\u00f7";
  }

  if (character === "-") {
    return "\u2212";
  }

  return character;
}

function createCursorMarker(isError = false) {
  const cursor = document.createElement("span");
  cursor.className = "cursor-marker";
  if (isError) {
    cursor.classList.add("error");
  }
  cursor.setAttribute("aria-hidden", "true");
  return cursor;
}

function renderEditableExpression(source, cursorIndex) {
  const fragment = document.createDocumentFragment();
  const issueStart = state.expressionIssue?.index ?? -1;
  const issueEnd = issueStart + (state.expressionIssue?.length ?? 0);

  if (!source) {
    fragment.append(createCursorMarker(issueStart === 0));

    const placeholder = document.createElement("span");
    placeholder.className = "expression-placeholder";
    placeholder.textContent = "0";
    fragment.appendChild(placeholder);

    expressionEl.replaceChildren(fragment);
    return;
  }

  for (let index = 0; index <= source.length; index += 1) {
    if (index === cursorIndex) {
      const isCursorError = issueStart === index && (state.expressionIssue?.length ?? 0) === 0;
      fragment.appendChild(createCursorMarker(isCursorError));
    }

    if (index === source.length) {
      continue;
    }

    const character = document.createElement("span");
    character.className = "expression-char";
    if (index >= issueStart && index < issueEnd) {
      character.classList.add("expression-char-error");
    }
    character.textContent = formatEditableCharacter(source[index]);
    fragment.appendChild(character);
  }

  expressionEl.replaceChildren(fragment);
}

function renderDisplay() {
  // Skip DOM work when the visible calculator display has not changed.
  const displaySignature = [
    state.expression,
    state.cursorIndex,
    state.previewText,
    state.previewState,
    state.isResult,
    state.lastEvaluatedExpression,
  ].join("::");

  if (displaySignature === lastDisplaySignature) {
    return;
  }

  if (state.isResult && state.lastEvaluatedExpression) {
    expressionEl.textContent = `${formatExpressionForDisplay(state.lastEvaluatedExpression)} =`;
  } else {
    renderEditableExpression(state.expression, state.cursorIndex);
  }

  previewEl.textContent = state.previewText;
  previewEl.dataset.state = state.previewState;
  lastDisplaySignature = displaySignature;
}

function normalizeHistoryEntry(entry) {
  if (typeof entry === "string") {
    const parts = entry.split(" = ");
    return {
      expression: parts[0] || entry,
      result: parts[1] || "",
      angleMode: "deg",
    };
  }

  if (!entry || typeof entry !== "object") {
    return null;
  }

  if (typeof entry.expression !== "string" || typeof entry.result !== "string") {
    return null;
  }

  return {
    expression: entry.expression,
    result: entry.result,
    angleMode: entry.angleMode === "rad" ? "rad" : "deg",
  };
}

function renderHistory() {
  historyEl.textContent = "";

  if (state.history.length === 0) {
    const emptyItem = document.createElement("li");
    emptyItem.className = "history-empty";
    emptyItem.textContent = "No calculations stored yet.";
    historyEl.appendChild(emptyItem);
    return;
  }

  const fragment = document.createDocumentFragment();

  state.history.forEach((entry, index) => {
    const item = document.createElement("li");
    const restoreButton = document.createElement("button");
    const deleteButton = document.createElement("button");
    const expressionLine = document.createElement("span");
    const metaLine = document.createElement("span");
    const resultLine = document.createElement("strong");

    item.className = "history-entry";

    restoreButton.type = "button";
    restoreButton.className = "history-item";
    restoreButton.dataset.historyIndex = index;
    restoreButton.dataset.historyAction = "restore";

    deleteButton.type = "button";
    deleteButton.className = "history-delete";
    deleteButton.dataset.historyIndex = index;
    deleteButton.dataset.historyAction = "delete";
    deleteButton.setAttribute("aria-label", `Delete calculation ${entry.expression}`);
    deleteButton.textContent = "-";

    expressionLine.className = "history-expression";
    expressionLine.textContent = formatExpressionForDisplay(entry.expression);

    metaLine.className = "history-meta";
    metaLine.textContent = entry.angleMode.toUpperCase();

    resultLine.textContent = entry.result;

    restoreButton.append(expressionLine, metaLine, resultLine);
    item.append(restoreButton, deleteButton);
    fragment.appendChild(item);
  });

  historyEl.appendChild(fragment);
}

function renderFormulas() {
  formulaList.textContent = "";

  const fragment = document.createDocumentFragment();

  FORMULA_GROUPS.forEach((group) => {
    const section = document.createElement("section");
    const title = document.createElement("h3");
    const list = document.createElement("div");

    section.className = "formula-group";
    title.className = "formula-group-title";
    title.textContent = group.title;
    list.className = "formula-group-list";

    group.items.forEach((item) => {
      const card = document.createElement("article");
      const label = document.createElement("span");
      const formula = document.createElement("strong");
      const note = document.createElement("span");

      card.className = "formula-card";
      label.className = "formula-label";
      formula.className = "formula-expression";
      note.className = "formula-note";

      label.textContent = item.label;
      formula.textContent = item.formula;
      note.textContent = item.note;

      card.append(label, formula, note);

      if (item.insert) {
        const useButton = document.createElement("button");
        useButton.type = "button";
        useButton.className = "formula-use";
        useButton.dataset.formulaInsert = item.insert;
        useButton.textContent = "Use";
        card.appendChild(useButton);
      }

      list.appendChild(card);
    });

    section.append(title, list);
    fragment.appendChild(section);
  });

  formulaList.appendChild(fragment);
}

function invalidateDisplayCache() {
  lastDisplaySignature = "";
}

function setPreviewState(text, previewState) {
  const changed = state.previewText !== text || state.previewState !== previewState;
  state.previewText = text;
  state.previewState = previewState;

  if (changed) {
    invalidateDisplayCache();
  }
}

function setExpressionIssue(issue) {
  const currentIssue = state.expressionIssue;
  const nextIssue = issue
    ? {
        index: issue.index,
        length: issue.length ?? 1,
        message: issue.message || "",
        suggestion: issue.suggestion || "",
      }
    : null;

  const changed = JSON.stringify(currentIssue) !== JSON.stringify(nextIssue);
  state.expressionIssue = nextIssue;

  if (changed) {
    invalidateDisplayCache();
  }
}

function tokenizeExpressionForFeedback(expression) {
  const source = String(expression || "");
  const tokens = [];
  let index = 0;

  while (index < source.length) {
    const character = source[index];

    if (/[0-9.]/.test(character)) {
      let cursor = index;
      let decimalCount = 0;

      while (cursor < source.length && /[0-9.]/.test(source[cursor])) {
        if (source[cursor] === ".") {
          decimalCount += 1;
          if (decimalCount > 1) {
            return {
              error: {
                index: cursor,
                length: 1,
                message: "Invalid number",
                suggestion: "Remove the extra decimal point.",
              },
            };
          }
        }
        cursor += 1;
      }

      if (/[eE]/.test(source[cursor] || "")) {
        let exponentCursor = cursor + 1;

        if (/[+\-]/.test(source[exponentCursor] || "")) {
          exponentCursor += 1;
        }

        const exponentStart = exponentCursor;
        while (/[0-9]/.test(source[exponentCursor] || "")) {
          exponentCursor += 1;
        }

        if (exponentCursor === exponentStart) {
          return {
            error: {
              index: cursor,
              length: 1,
              message: "Invalid number",
              suggestion: "Complete the exponent value.",
            },
          };
        }

        cursor = exponentCursor;
      }

      tokens.push({ type: "number", value: source.slice(index, cursor), start: index, end: cursor });
      index = cursor;
      continue;
    }

    if (/[a-z]/i.test(character)) {
      let cursor = index + 1;

      while (cursor < source.length && /[a-z]/i.test(source[cursor])) {
        cursor += 1;
      }

      const name = source.slice(index, cursor);
      const lowered = name.toLowerCase();

      if (["sin", "cos", "tan", "log", "ln", "sqrt"].includes(lowered)) {
        tokens.push({ type: "function", value: lowered, start: index, end: cursor });
      } else if (lowered === "pi" || lowered === "e") {
        tokens.push({ type: "constant", value: lowered, start: index, end: cursor });
      } else {
        return {
          error: {
            index,
            length: name.length,
            message: `Unknown token "${name}"`,
            suggestion: "Use supported functions like sin, cos, tan, log, ln, sqrt, pi, or e.",
          },
        };
      }

      index = cursor;
      continue;
    }

    if (BINARY_OPERATORS.has(character) || POSTFIX_OPERATORS.has(character) || ["(", ")"].includes(character)) {
      tokens.push({ type: "operator", value: character, start: index, end: index + 1 });
      index += 1;
      continue;
    }

    return {
      error: {
        index,
        length: 1,
        message: `Unexpected character "${character}"`,
        suggestion: "Remove unsupported characters from the expression.",
      },
    };
  }

  return { tokens };
}

function findExpressionIssue(expression) {
  if (!expression.trim()) {
    return null;
  }

  const { tokens, error } = tokenizeExpressionForFeedback(expression);
  if (error) {
    return error;
  }

  const parenStack = [];
  let expectValue = true;

  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    const previousToken = index > 0 ? tokens[index - 1] : null;
    const nextToken = index < tokens.length - 1 ? tokens[index + 1] : null;

    if (token.type === "function") {
      if (!expectValue) {
        return {
          index: token.start,
          length: token.end - token.start,
          message: "Missing operator",
          suggestion: "Insert * before the function.",
        };
      }

      if (!nextToken || nextToken.type !== "operator" || nextToken.value !== "(") {
        return {
          index: token.end,
          length: 0,
          message: "Function needs parentheses",
          suggestion: `Add () after ${token.value}.`,
        };
      }

      expectValue = true;
      continue;
    }

    if (token.type === "number" || token.type === "constant") {
      if (!expectValue) {
        return {
          index: token.start,
          length: token.end - token.start,
          message: "Missing operator",
          suggestion: "Insert an operator before this value.",
        };
      }

      expectValue = false;
      continue;
    }

    if (token.value === "(") {
      if (!expectValue) {
        return {
          index: token.start,
          length: 1,
          message: "Missing operator",
          suggestion: "Insert * before (.",
        };
      }

      parenStack.push(token);
      expectValue = true;
      continue;
    }

    if (token.value === ")") {
      if (parenStack.length === 0) {
        return {
          index: token.start,
          length: 1,
          message: "Unexpected )",
          suggestion: "Remove the extra closing bracket.",
        };
      }

      if (expectValue) {
        return {
          index: token.start,
          length: 1,
          message: "Missing value",
          suggestion: previousToken?.value === "("
            ? "Add a value inside the brackets."
            : "Complete the expression before ).",
        };
      }

      parenStack.pop();
      expectValue = false;
      continue;
    }

    if (POSTFIX_OPERATORS.has(token.value)) {
      if (expectValue) {
        return {
          index: token.start,
          length: 1,
          message: `Unexpected ${token.value}`,
          suggestion: `Add a value before ${token.value}.`,
        };
      }

      expectValue = false;
      continue;
    }

    if (expectValue) {
      if (token.value === "-") {
        continue;
      }

      return {
        index: token.start,
        length: 1,
        message: "Operator needs a value",
        suggestion: "Add a number or expression after the operator.",
      };
    }

    expectValue = true;
  }

  if (parenStack.length > 0) {
    const unmatched = parenStack[parenStack.length - 1];
    return {
      index: unmatched.start,
      length: 1,
      message: "Missing )",
      suggestion: "Add a closing bracket to complete this group.",
    };
  }

  if (tokens.length > 0 && expectValue) {
    const lastToken = tokens[tokens.length - 1];
    return {
      index: lastToken.start,
      length: Math.max(1, lastToken.end - lastToken.start),
      message: "Expression is incomplete",
      suggestion: lastToken.value === "("
        ? "Add a value inside the brackets."
        : "Complete the expression after this operator.",
    };
  }

  return null;
}

function findRuntimeIssue(expression, runtimeMessage) {
  const { tokens } = tokenizeExpressionForFeedback(expression);
  if (!tokens) {
    return {
      index: Math.max(0, expression.length - 1),
      length: 1,
      message: runtimeMessage,
      suggestion: runtimeMessage,
    };
  }

  if (runtimeMessage === "Divide by zero") {
    const divider = [...tokens].reverse().find((token) => token.type === "operator" && token.value === "/");
    if (divider) {
      return {
        index: divider.start,
        length: 1,
        message: runtimeMessage,
        suggestion: "The value after / cannot be zero.",
      };
    }
  }

  const functionToken = [...tokens].reverse().find((token) => token.type === "function");
  if (functionToken) {
    return {
      index: functionToken.start,
      length: functionToken.end - functionToken.start,
      message: runtimeMessage,
      suggestion: "Check the function input or angle mode.",
    };
  }

  return {
    index: Math.max(0, expression.length - 1),
    length: expression ? 1 : 0,
    message: runtimeMessage,
    suggestion: runtimeMessage,
  };
}

function isTextEntryTarget(target) {
  return target instanceof HTMLElement
    && (target.matches("input, textarea, select") || target.isContentEditable);
}

function getThemeColor(variableName, fallback) {
  const value = getComputedStyle(document.documentElement).getPropertyValue(variableName).trim();
  return value || fallback;
}

function setGraphMeta(message, tone = "muted") {
  graphMeta.textContent = message;
  graphMeta.dataset.state = tone;
}

function prepareGraphSurface() {
  const pixelRatio = window.devicePixelRatio || 1;
  const displayWidth = graphCanvas.clientWidth || 360;
  const displayHeight = graphCanvas.clientHeight || 240;
  const backingWidth = Math.max(1, Math.round(displayWidth * pixelRatio));
  const backingHeight = Math.max(1, Math.round(displayHeight * pixelRatio));

  if (graphCanvas.width !== backingWidth || graphCanvas.height !== backingHeight) {
    graphCanvas.width = backingWidth;
    graphCanvas.height = backingHeight;
  }

  const context = graphCanvas.getContext("2d");
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

  return {
    context,
    width: displayWidth,
    height: displayHeight,
  };
}

function getGraphYWindow(values) {
  const sortedValues = [...values].sort((left, right) => left - right);
  const fullMin = sortedValues[0];
  const fullMax = sortedValues[sortedValues.length - 1];

  let yMin = fullMin;
  let yMax = fullMax;

  if (sortedValues.length > 12) {
    const lowIndex = Math.floor((sortedValues.length - 1) * 0.08);
    const highIndex = Math.ceil((sortedValues.length - 1) * 0.92);
    const trimmedMin = sortedValues[lowIndex];
    const trimmedMax = sortedValues[highIndex];
    const fullSpan = Math.max(fullMax - fullMin, 1e-9);
    const trimmedSpan = Math.max(trimmedMax - trimmedMin, 1e-9);

    if (fullSpan > trimmedSpan * 10) {
      yMin = trimmedMin;
      yMax = trimmedMax;
    }
  }

  if (Math.abs(yMax - yMin) < 1e-9) {
    const padding = Math.max(Math.abs(yMin) * 0.2, 1);
    return { yMin: yMin - padding, yMax: yMax + padding };
  }

  const padding = (yMax - yMin) * 0.12;
  return { yMin: yMin - padding, yMax: yMax + padding };
}

function sampleGraph(expression) {
  const points = [];
  const visibleValues = [];
  const xSpan = GRAPH_RANGE.max - GRAPH_RANGE.min;

  for (let sampleIndex = 0; sampleIndex < GRAPH_RANGE.samples; sampleIndex += 1) {
    const ratio = sampleIndex / (GRAPH_RANGE.samples - 1);
    const xValue = GRAPH_RANGE.min + (xSpan * ratio);

    try {
      const yValue = window.CalculatorCore.evaluateGraphExpression(expression, xValue, {
        angleMode: state.angleMode,
      });

      if (!Number.isFinite(yValue) || Math.abs(yValue) > 1e6) {
        points.push(null);
        continue;
      }

      points.push({ x: xValue, y: yValue });
      visibleValues.push(yValue);
    } catch (error) {
      points.push(null);
    }
  }

  if (visibleValues.length < 2) {
    throw new Error("Unable to plot this function in the current range");
  }

  const { yMin, yMax } = getGraphYWindow(visibleValues);
  return { points, yMin, yMax };
}

function drawGraphPlaceholder(message) {
  const { context, width, height } = prepareGraphSurface();
  const border = getThemeColor("--shell-border", "rgba(255, 255, 255, 0.08)");
  const textColor = getThemeColor("--text-muted", "#98a3b8");

  context.clearRect(0, 0, width, height);
  context.fillStyle = getThemeColor("--button", "#161b27");
  context.fillRect(0, 0, width, height);
  context.strokeStyle = border;
  context.lineWidth = 1;
  context.strokeRect(0.5, 0.5, width - 1, height - 1);
  context.fillStyle = textColor;
  context.font = '600 16px "Avenir Next", "Segoe UI", sans-serif';
  context.textAlign = "center";
  context.fillText(message, width / 2, height / 2 - 6);
  context.font = '500 12px "Avenir Next", "Segoe UI", sans-serif';
  context.fillText("Try y = sin(x) or y = x^2", width / 2, height / 2 + 18);
}

function drawGraph(expression) {
  const preparedExpression = window.CalculatorCore.prepareGraphExpression(expression);
  const sampledGraph = sampleGraph(expression);
  const { context, width, height } = prepareGraphSurface();
  const background = context.createLinearGradient(0, 0, 0, height);
  const gridColor = getThemeColor("--shell-border", "rgba(255, 255, 255, 0.08)");
  const axisColor = getThemeColor("--text-muted", "#98a3b8");
  const lineColor = getThemeColor("--accent-strong", "#ffb340");
  const labelColor = getThemeColor("--text-muted", "#98a3b8");
  const xSpan = GRAPH_RANGE.max - GRAPH_RANGE.min;
  const ySpan = sampledGraph.yMax - sampledGraph.yMin;
  const mapX = (value) => ((value - GRAPH_RANGE.min) / xSpan) * width;
  const mapY = (value) => height - (((value - sampledGraph.yMin) / ySpan) * height);

  background.addColorStop(0, getThemeColor("--graph-bg-start", "rgba(25, 31, 46, 0.98)"));
  background.addColorStop(1, getThemeColor("--graph-bg-end", "rgba(14, 18, 28, 0.96)"));

  context.clearRect(0, 0, width, height);
  context.fillStyle = background;
  context.fillRect(0, 0, width, height);

  context.strokeStyle = gridColor;
  context.lineWidth = 1;

  for (let gridIndex = 1; gridIndex < 6; gridIndex += 1) {
    const x = (width / 6) * gridIndex;
    const y = (height / 4) * gridIndex;

    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, height);
    context.stroke();

    if (gridIndex < 4) {
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(width, y);
      context.stroke();
    }
  }

  if (GRAPH_RANGE.min < 0 && GRAPH_RANGE.max > 0) {
    const axisX = mapX(0);
    context.strokeStyle = axisColor;
    context.beginPath();
    context.moveTo(axisX, 0);
    context.lineTo(axisX, height);
    context.stroke();
  }

  if (sampledGraph.yMin < 0 && sampledGraph.yMax > 0) {
    const axisY = mapY(0);
    context.strokeStyle = axisColor;
    context.beginPath();
    context.moveTo(0, axisY);
    context.lineTo(width, axisY);
    context.stroke();
  }

  context.strokeStyle = lineColor;
  context.lineWidth = 2.25;
  context.lineJoin = "round";
  context.lineCap = "round";
  context.beginPath();

  let isDrawing = false;
  let previousScreenY = null;

  sampledGraph.points.forEach((point) => {
    if (!point || point.y < sampledGraph.yMin || point.y > sampledGraph.yMax) {
      isDrawing = false;
      previousScreenY = null;
      return;
    }

    const screenX = mapX(point.x);
    const screenY = mapY(point.y);
    const shouldBreak = previousScreenY !== null && Math.abs(screenY - previousScreenY) > height * 0.45;

    if (!isDrawing || shouldBreak) {
      context.moveTo(screenX, screenY);
      isDrawing = true;
    } else {
      context.lineTo(screenX, screenY);
    }

    previousScreenY = screenY;
  });

  context.stroke();

  context.fillStyle = labelColor;
  context.font = '600 12px "Avenir Next", "Segoe UI", sans-serif';
  context.textAlign = "left";
  context.fillText(`y ${window.CalculatorCore.formatResult(sampledGraph.yMax, 6)}`, 10, 16);
  context.fillText(`x ${GRAPH_RANGE.min}`, 10, height - 10);
  context.textAlign = "right";
  context.fillText(`y ${window.CalculatorCore.formatResult(sampledGraph.yMin, 6)}`, width - 10, height - 10);
  context.fillText(`x ${GRAPH_RANGE.max}`, width - 10, 16);

  setGraphMeta(
    `Showing y = ${formatExpressionForDisplay(preparedExpression)} on x from ${GRAPH_RANGE.min} to ${GRAPH_RANGE.max} (${state.angleMode.toUpperCase()}).`,
    "success",
  );
}

function renderGraph() {
  const nextExpression = graphExpressionInput.value.trim() || state.graphExpression;
  const graphSignature = [
    nextExpression,
    state.angleMode,
    state.theme,
    graphCanvas.clientWidth,
    graphCanvas.clientHeight,
  ].join("::");

  if (graphSignature === lastGraphRenderSignature) {
    return;
  }

  state.graphExpression = nextExpression;

  if (!graphExpressionInput.value.trim()) {
    drawGraphPlaceholder("Plot a function to begin");
    setGraphMeta("Type y = sin(x) or y = x^2 to plot a graph.", "muted");
    lastGraphRenderSignature = graphSignature;
    return;
  }

  try {
    drawGraph(graphExpressionInput.value);
  } catch (error) {
    drawGraphPlaceholder("Unable to render this graph");
    setGraphMeta(error.message || "Unable to plot this function.", "error");
  }

  lastGraphRenderSignature = graphSignature;
}

function scheduleGraphRender(options = {}) {
  const { force = false } = options;

  if (!graphPanel.classList.contains("show")) {
    return;
  }

  if (force) {
    lastGraphRenderSignature = "";
  }

  if (graphRenderFrame) {
    cancelAnimationFrame(graphRenderFrame);
  }

  graphRenderFrame = requestAnimationFrame(() => {
    graphRenderFrame = 0;
    renderGraph();
  });
}

function saveHistory() {
  writeStorage(STORAGE_KEYS.history, state.history.slice(0, HISTORY_LIMIT));
}

function loadHistory() {
  const storedHistory = readStorage(STORAGE_KEYS.history, []);

  if (!Array.isArray(storedHistory)) {
    state.history = [];
    return;
  }

  state.history = storedHistory
    .map(normalizeHistoryEntry)
    .filter(Boolean)
    .slice(0, HISTORY_LIMIT);

  if (state.history.length > 0) {
    const numericResult = Number(state.history[0].result);
    if (Number.isFinite(numericResult)) {
      state.lastAnswer = numericResult;
    }
  }
}

function calculateExpression(expr) {
  const tokens = window.CalculatorCore.tokenize(expr);
  const rpn = window.CalculatorCore.toRPN(tokens);
  return window.CalculatorCore.evaluateRPN(rpn, { angleMode: state.angleMode });
}

function computePreview() {
  const previewSignature = `${state.expression}::${state.angleMode}`;

  if (previewSignature === lastPreviewSignature) {
    return;
  }

  if (!state.expression.trim()) {
    setExpressionIssue(null);
    setPreviewState("0", "idle");
    lastPreviewSignature = previewSignature;
    if (state.autoStatusActive) {
      setStatus("Ready", "muted");
    }
    renderDisplay();
    return;
  }

  const expressionIssue = findExpressionIssue(state.expression);
  if (expressionIssue) {
    setExpressionIssue(expressionIssue);
    setPreviewState("\u2014", "invalid");
    lastPreviewSignature = previewSignature;
    setStatus(expressionIssue.suggestion || expressionIssue.message, "muted", { auto: true });
    renderDisplay();
    return;
  }

  try {
    setExpressionIssue(null);
    const result = calculateExpression(state.expression);
    setPreviewState(window.CalculatorCore.formatResult(result), "valid");
  } catch (error) {
    setExpressionIssue(findRuntimeIssue(state.expression, error.message || "Unable to calculate."));
    setPreviewState("\u2014", "invalid");
    setStatus(error.message || "Unable to calculate.", "muted", { auto: true });
    lastPreviewSignature = previewSignature;
    renderDisplay();
    return;
  }

  lastPreviewSignature = previewSignature;
  if (state.autoStatusActive) {
    setStatus("Ready", "muted");
  }
  renderDisplay();
}

function updatePreview(options = {}) {
  const { renderNow = false, force = false } = options;

  if (force) {
    lastPreviewSignature = "";
  }

  if (renderNow) {
    renderDisplay();
  }

  if (previewRenderFrame) {
    cancelAnimationFrame(previewRenderFrame);
  }

  // Coalesce rapid edits into a single preview calculation per animation frame.
  previewRenderFrame = requestAnimationFrame(() => {
    previewRenderFrame = 0;
    computePreview();
  });
}

function applyExpression(nextExpression, nextCursorIndex = nextExpression.length) {
  state.expression = nextExpression;
  state.cursorIndex = clampCursorIndex(nextCursorIndex, nextExpression);
  invalidateDisplayCache();

  if (statusEl.dataset.state === "error") {
    setStatus("Live preview updates automatically.", "muted");
  }

  updatePreview({ renderNow: true });
}

function getTailType(source = state.expression) {
  if (!source) {
    return "empty";
  }

  if (source.endsWith("pi") || source.endsWith("e")) {
    return "constant";
  }

  const lastCharacter = source.slice(-1);

  if (/[0-9]/.test(lastCharacter)) {
    return "number";
  }

  if (lastCharacter === ".") {
    return "decimal";
  }

  if (lastCharacter === "(") {
    return "open-paren";
  }

  if (lastCharacter === ")") {
    return "close-paren";
  }

  if (POSTFIX_OPERATORS.has(lastCharacter)) {
    return "postfix";
  }

  if (BINARY_OPERATORS.has(lastCharacter)) {
    return "operator";
  }

  return "other";
}

function getCurrentNumberSegment(source = state.expression) {
  let segment = "";

  for (let index = source.length - 1; index >= 0; index -= 1) {
    const character = source[index];
    if (/[0-9.]/.test(character)) {
      segment = character + segment;
      continue;
    }
    break;
  }

  return segment;
}

function getParenBalance(source = state.expression) {
  let balance = 0;

  for (const character of source) {
    if (character === "(") {
      balance += 1;
    } else if (character === ")") {
      balance -= 1;
    }
  }

  return balance;
}

function clampCursorIndex(index, source = state.expression) {
  return Math.min(Math.max(index, 0), source.length);
}

function isCursorAtEnd() {
  return state.cursorIndex === state.expression.length;
}

function getBeforeCursor() {
  return state.expression.slice(0, state.cursorIndex);
}

function getAfterCursor() {
  return state.expression.slice(state.cursorIndex);
}

function moveCursor(delta) {
  clearResultPresentation();
  state.cursorIndex = clampCursorIndex(state.cursorIndex + delta);
  invalidateDisplayCache();
  renderDisplay();
}

function shouldImplicitMultiply(source = state.expression) {
  return ["number", "constant", "close-paren", "postfix"].includes(getTailType(source));
}

function shouldImplicitMultiplyBeforeNumericInput(source = state.expression) {
  return ["constant", "close-paren", "postfix"].includes(getTailType(source));
}

function shouldStartFresh(value) {
  if (!state.isResult) {
    return false;
  }

  return /^[0-9]$/.test(value)
    || value === "."
    || value === "("
    || value === "pi"
    || value === "e"
    || FUNCTION_VALUES.has(value);
}

function resetResultStateIfNeeded(value) {
  if (!shouldStartFresh(value)) {
    state.isResult = false;
    return;
  }

  state.expression = "";
  state.cursorIndex = 0;
  state.lastEvaluatedExpression = "";
  state.isResult = false;
}

function clearResultPresentation() {
  if (!state.lastEvaluatedExpression && !state.isResult) {
    return;
  }

  state.lastEvaluatedExpression = "";
  state.isResult = false;
  invalidateDisplayCache();
}

function insertRawAtCursor(value) {
  const beforeCursor = getBeforeCursor();
  const afterCursor = getAfterCursor();
  applyExpression(`${beforeCursor}${value}${afterCursor}`, beforeCursor.length + value.length);
}

function deleteForward() {
  if (state.isResult) {
    clearResultPresentation();
  }

  if (state.cursorIndex >= state.expression.length) {
    return;
  }

  const beforeCursor = getBeforeCursor();
  const afterCursor = getAfterCursor();
  applyExpression(`${beforeCursor}${afterCursor.slice(1)}`, beforeCursor.length);
}

function insertDigit(digit) {
  resetResultStateIfNeeded(digit);
  if (!isCursorAtEnd()) {
    insertRawAtCursor(digit);
    return;
  }

  const nextExpression = shouldImplicitMultiplyBeforeNumericInput(getBeforeCursor())
    ? `${state.expression}*${digit}`
    : `${state.expression}${digit}`;
  applyExpression(nextExpression);
}

function insertDecimal() {
  resetResultStateIfNeeded(".");
  if (!isCursorAtEnd()) {
    insertRawAtCursor(".");
    return;
  }

  let nextExpression = state.expression;
  const tailType = getTailType(nextExpression);
  const numberSegment = getCurrentNumberSegment(nextExpression);

  if (numberSegment.includes(".")) {
    return;
  }

  if (tailType === "empty" || tailType === "operator" || tailType === "open-paren") {
    nextExpression += "0.";
  } else if (shouldImplicitMultiplyBeforeNumericInput(nextExpression)) {
    nextExpression += "*0.";
  } else if (tailType === "number") {
    nextExpression += ".";
  } else {
    return;
  }

  applyExpression(nextExpression);
}

function insertOperator(operator) {
  resetResultStateIfNeeded(operator);
  if (!isCursorAtEnd()) {
    insertRawAtCursor(operator);
    return;
  }

  const tailType = getTailType();

  if (!state.expression) {
    if (operator === "-") {
      applyExpression("-");
    }
    return;
  }

  if (tailType === "operator") {
    const lastCharacter = state.expression.slice(-1);

    if (operator === "-" && lastCharacter !== "-") {
      applyExpression(`${state.expression}-`);
      return;
    }

    if (state.expression === "-") {
      return;
    }

    applyExpression(`${state.expression.slice(0, -1)}${operator}`);
    return;
  }

  if (tailType === "open-paren") {
    if (operator === "-") {
      applyExpression(`${state.expression}-`);
    }
    return;
  }

  if (["number", "decimal", "constant", "close-paren", "postfix"].includes(tailType)) {
    applyExpression(`${state.expression}${operator}`);
  }
}

function insertOpenParen() {
  if (state.isResult && state.expression) {
    clearResultPresentation();
    const nextExpression = `${state.expression}*()`;
    applyExpression(nextExpression, nextExpression.length - 1);
    return;
  }

  resetResultStateIfNeeded("(");
  const beforeCursor = getBeforeCursor();
  const afterCursor = getAfterCursor();
  const prefix = shouldImplicitMultiply(beforeCursor) ? "*" : "";
  const insertion = `${prefix}()`;

  if (!isCursorAtEnd()) {
    applyExpression(`${beforeCursor}${insertion}${afterCursor}`, beforeCursor.length + insertion.length - 1);
    return;
  }

  applyExpression(`${state.expression}${insertion}`, state.expression.length + insertion.length - 1);
}

function insertCloseParen() {
  resetResultStateIfNeeded(")");
  if (!isCursorAtEnd() && getAfterCursor().startsWith(")")) {
    clearResultPresentation();
    state.cursorIndex += 1;
    invalidateDisplayCache();
    renderDisplay();
    return;
  }

  if (!isCursorAtEnd()) {
    insertRawAtCursor(")");
    return;
  }

  const tailType = getTailType();

  if (getParenBalance() <= 0) {
    return;
  }

  if (["number", "constant", "close-paren", "postfix"].includes(tailType)) {
    applyExpression(`${state.expression})`);
  }
}

function insertFunction(value) {
  if (state.isResult && state.expression) {
    const currentResult = state.expression;
    clearResultPresentation();
    applyExpression(`${value}${currentResult})`);
    return;
  }

  resetResultStateIfNeeded(value);
  const beforeCursor = getBeforeCursor();
  const afterCursor = getAfterCursor();
  const prefix = shouldImplicitMultiply(beforeCursor) ? "*" : "";
  const insertion = `${prefix}${value})`;

  if (!isCursorAtEnd()) {
    applyExpression(`${beforeCursor}${insertion}${afterCursor}`, beforeCursor.length + insertion.length - 1);
    return;
  }

  applyExpression(`${state.expression}${insertion}`, state.expression.length + insertion.length - 1);
}

function insertConstant(value) {
  if (state.isResult && state.expression && (value === "pi" || value === "e")) {
    const currentResult = state.expression;
    clearResultPresentation();
    applyExpression(`${currentResult}*${value}`);
    return;
  }

  resetResultStateIfNeeded(value);
  if (!isCursorAtEnd()) {
    insertRawAtCursor(value);
    return;
  }

  const prefix = shouldImplicitMultiply() ? "*" : "";
  applyExpression(`${state.expression}${prefix}${value}`);
}

function insertPostfix(value) {
  resetResultStateIfNeeded(value);
  if (!isCursorAtEnd()) {
    insertRawAtCursor(value);
    return;
  }

  const tailType = getTailType();

  if (["number", "constant", "close-paren", "postfix"].includes(tailType)) {
    applyExpression(`${state.expression}${value}`);
  }
}

function insertValue(value) {
  if (/^[0-9]$/.test(value)) {
    insertDigit(value);
    return;
  }

  if (FUNCTION_VALUES.has(value)) {
    insertFunction(value);
    return;
  }

  if (value === "pi" || value === "e") {
    insertConstant(value);
    return;
  }

  if (value === ".") {
    insertDecimal();
    return;
  }

  if (value === "(") {
    insertOpenParen();
    return;
  }

  if (value === ")") {
    insertCloseParen();
    return;
  }

  if (BINARY_OPERATORS.has(value)) {
    insertOperator(value);
    return;
  }

  if (POSTFIX_OPERATORS.has(value)) {
    insertPostfix(value);
  }
}

function clearAll() {
  state.expression = "";
  state.cursorIndex = 0;
  state.lastEvaluatedExpression = "";
  state.isResult = false;
  setExpressionIssue(null);
  lastPreviewSignature = "";
  invalidateDisplayCache();
  setStatus("Ready", "muted");
  updatePreview({ renderNow: true, force: true });
}

function removeLastToken(source) {
  for (const value of TOKEN_VALUES) {
    if (source.endsWith(value)) {
      return source.slice(0, -value.length);
    }
  }

  return source.slice(0, -1);
}

function backspace() {
  if (!state.expression) {
    return;
  }

  if (state.isResult && state.lastEvaluatedExpression) {
    const restoredExpression = removeLastToken(state.lastEvaluatedExpression);
    clearResultPresentation();
    applyExpression(restoredExpression, restoredExpression.length);
    return;
  }

  if (state.cursorIndex === 0) {
    return;
  }

  const beforeCursor = getBeforeCursor();
  const afterCursor = getAfterCursor();
  clearResultPresentation();
  applyExpression(`${beforeCursor.slice(0, -1)}${afterCursor}`, beforeCursor.length - 1);
}

function addHistoryEntry(expression, resultText) {
  state.history.unshift({
    expression,
    result: resultText,
    angleMode: state.angleMode,
  });

  state.history = state.history.slice(0, HISTORY_LIMIT);
  saveHistory();
  renderHistory();
}

function evaluateCurrentExpression() {
  if (!state.expression.trim()) {
    setExpressionIssue(null);
    setStatus("Enter an expression first.", "error");
    setPreviewState("\u2014", "error");
    lastPreviewSignature = "";
    renderDisplay();
    return;
  }

  try {
    const sourceExpression = state.expression;
    const result = calculateExpression(sourceExpression);
    const formattedResult = window.CalculatorCore.formatResult(result);

    state.lastAnswer = Number(formattedResult);
    state.lastEvaluatedExpression = sourceExpression;
    state.expression = formattedResult;
    state.cursorIndex = formattedResult.length;
    setExpressionIssue(null);
    setPreviewState(formattedResult, "valid");
    state.isResult = true;
    lastPreviewSignature = `${state.expression}::${state.angleMode}`;

    addHistoryEntry(sourceExpression, formattedResult);
    setStatus("Calculation saved to history.", "success");
    renderDisplay();
  } catch (error) {
    setExpressionIssue(findExpressionIssue(state.expression) || findRuntimeIssue(state.expression, error.message || "Unable to calculate."));
    setPreviewState("Error", "error");
    lastPreviewSignature = "";
    setStatus(error.message || "Unable to calculate.", "error");
    renderDisplay();
  }
}

function getCopyableResult() {
  if (state.previewState === "valid" && state.previewText !== "\u2014") {
    return state.previewText;
  }

  if (state.lastAnswer !== null) {
    return window.CalculatorCore.formatResult(state.lastAnswer);
  }

  return null;
}

async function copyResult() {
  const value = getCopyableResult();

  if (!value) {
    setStatus("Nothing to copy yet.", "error");
    return;
  }

  try {
    await navigator.clipboard.writeText(value);
    setStatus("Result copied to clipboard.", "success");
    triggerHaptic(10);
  } catch (error) {
    const fallback = document.createElement("textarea");
    fallback.value = value;
    document.body.appendChild(fallback);
    fallback.select();
    document.execCommand("copy");
    fallback.remove();
    setStatus("Result copied to clipboard.", "success");
    triggerHaptic(10);
  }
}

function getMemorySourceValue() {
  const value = getCopyableResult();
  if (!value) {
    return null;
  }

  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : null;
}

function handleMemoryAction(action) {
  const activeValue = getMemorySourceValue();

  if ((action === "M+" || action === "M-") && activeValue === null) {
    setStatus("Calculate something first to use memory.", "error");
    return;
  }

  if (action === "M+") {
    state.memory += activeValue;
    renderMemory();
    setStatus("Added current result to memory.", "success");
    return;
  }

  if (action === "M-") {
    state.memory -= activeValue;
    renderMemory();
    setStatus("Subtracted current result from memory.", "success");
    return;
  }

  if (action === "MR") {
    insertConstant(window.CalculatorCore.formatResult(state.memory));
    setStatus("Memory recalled into the expression.", "success");
  }
}

function normalizeTheme(theme) {
  if (theme === "light") {
    return "ocean";
  }

  return Object.prototype.hasOwnProperty.call(THEMES, theme) ? theme : "dark";
}

function renderThemeSelection() {
  const buttons = themeGrid?.querySelectorAll("[data-theme-value]") || [];

  buttons.forEach((button) => {
    const isActive = button.dataset.themeValue === state.theme;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
}

function applyTheme(theme, persist = true) {
  state.theme = normalizeTheme(theme);
  document.documentElement.setAttribute("data-theme", state.theme);
  themeToggle.textContent = "Theme";
  themeToggle.setAttribute("aria-label", `Open theme selector. Current theme: ${THEMES[state.theme].label}`);
  renderThemeSelection();
  updateThemeColor();

  if (persist) {
    writeStorage(STORAGE_KEYS.theme, state.theme);
  }
}

function setTheme(theme) {
  const nextTheme = normalizeTheme(theme);
  if (nextTheme === state.theme) {
    if (themePanel.classList.contains("show")) {
      setStatus(`${THEMES[nextTheme].label} theme is already active.`, "muted");
    }
    return;
  }

  applyTheme(nextTheme);
  setStatus(`Switched to ${THEMES[nextTheme].label} theme.`, "success");
  triggerHaptic(10);
  scheduleGraphRender({ force: true });
}

function toggleThemePanel(forceState) {
  const willShow = typeof forceState === "boolean"
    ? forceState
    : !themePanel.classList.contains("show");

  if (willShow) {
    setMenuVisibility(false);
    setPanelVisibility(historyPanel, historyToggle, false);
    setPanelVisibility(formulaPanel, formulaToggle, false);
    setPanelVisibility(graphPanel, graphToggle, false);
  }

  setPanelVisibility(themePanel, themeToggle, willShow);
  syncOverlayBackdrop();
  triggerHaptic(10);
}

function applyAngleMode(mode, persist = true) {
  state.angleMode = mode === "rad" ? "rad" : "deg";
  angleModeLabel.textContent = state.angleMode.toUpperCase();
  angleToggle.textContent = state.angleMode === "deg" ? "Switch to RAD" : "Switch to DEG";

  if (persist) {
    writeStorage(STORAGE_KEYS.angle, state.angleMode);
  }

  updatePreview();
  scheduleGraphRender();
}

function toggleAngleMode() {
  applyAngleMode(state.angleMode === "deg" ? "rad" : "deg");
  setStatus(`Angle mode: ${state.angleMode.toUpperCase()}.`, "success");
  triggerHaptic(10);
}

function setPanelVisibility(panel, toggle, isVisible) {
  panel.classList.toggle("show", isVisible);

  if (toggle) {
    toggle.setAttribute("aria-expanded", String(isVisible));
  }
}

function setMenuVisibility(isVisible) {
  mobileMenu.classList.toggle("show", isVisible);
  menuToggle.setAttribute("aria-expanded", String(isVisible));
}

function syncOverlayBackdrop() {
  const graphIsOpen = graphPanel.classList.contains("show");
  const compactOverlayOpen = isCompactViewport() && (
    mobileMenu.classList.contains("show") ||
    historyPanel.classList.contains("show") ||
    formulaPanel.classList.contains("show")
  );
  const shouldShow = graphIsOpen || compactOverlayOpen;

  calculatorShell.classList.toggle("overlay-focus", shouldShow);
  calculatorShell.classList.toggle("graph-focus", graphIsOpen);
  overlayBackdrop.hidden = !shouldShow;
  overlayBackdrop.classList.toggle("show", shouldShow);
  overlayBackdrop.classList.toggle("graph-active", graphIsOpen);
}

function closeOpenPanels(options = {}) {
  const { keep = "" } = options;
  const hadOpen = mobileMenu.classList.contains("show") ||
    graphPanel.classList.contains("show") ||
    historyPanel.classList.contains("show") ||
    formulaPanel.classList.contains("show") ||
    themePanel.classList.contains("show");

  if (keep !== "menu") {
    setMenuVisibility(false);
  }

  if (keep !== "history") {
    setPanelVisibility(historyPanel, historyToggle, false);
  }

  if (keep !== "formula") {
    setPanelVisibility(formulaPanel, formulaToggle, false);
  }

  if (keep !== "theme") {
    setPanelVisibility(themePanel, themeToggle, false);
  }

  if (keep !== "graph") {
    setPanelVisibility(graphPanel, graphToggle, false);
  }

  syncOverlayBackdrop();
  return hadOpen;
}

function toggleMobileMenu(forceState) {
  if (!isCompactViewport()) {
    return;
  }

  const willShow = typeof forceState === "boolean"
    ? forceState
    : !mobileMenu.classList.contains("show");

  if (willShow) {
    setPanelVisibility(graphPanel, graphToggle, false);
    setPanelVisibility(historyPanel, historyToggle, false);
    setPanelVisibility(formulaPanel, formulaToggle, false);
    setPanelVisibility(themePanel, themeToggle, false);
  }

  setMenuVisibility(willShow);
  syncOverlayBackdrop();
  triggerHaptic(10);
}

function toggleHistoryPanel(forceState) {
  const willShow = typeof forceState === "boolean"
    ? forceState
    : !historyPanel.classList.contains("show");

  if (willShow) {
    setPanelVisibility(graphPanel, graphToggle, false);
    setPanelVisibility(formulaPanel, formulaToggle, false);
    setPanelVisibility(themePanel, themeToggle, false);

    if (isCompactViewport()) {
      setMenuVisibility(false);
    }
  }

  setPanelVisibility(historyPanel, historyToggle, willShow);
  syncOverlayBackdrop();
  triggerHaptic(10);
}

function toggleFormulaPanel(forceState) {
  const willShow = typeof forceState === "boolean"
    ? forceState
    : !formulaPanel.classList.contains("show");

  if (willShow) {
    setPanelVisibility(graphPanel, graphToggle, false);
    setPanelVisibility(historyPanel, historyToggle, false);
    setPanelVisibility(themePanel, themeToggle, false);

    if (isCompactViewport()) {
      setMenuVisibility(false);
    }
  }

  setPanelVisibility(formulaPanel, formulaToggle, willShow);
  syncOverlayBackdrop();
  triggerHaptic(10);
}

function toggleGraphPanel(forceState) {
  const willShow = typeof forceState === "boolean"
    ? forceState
    : !graphPanel.classList.contains("show");

  if (willShow) {
    setMenuVisibility(false);
    setPanelVisibility(historyPanel, historyToggle, false);
    setPanelVisibility(formulaPanel, formulaToggle, false);
    setPanelVisibility(themePanel, themeToggle, false);
  }

  setPanelVisibility(graphPanel, graphToggle, willShow);

  if (willShow) {
    scheduleGraphRender({ force: true });
  }
  syncOverlayBackdrop();

  if (willShow) {
    graphExpressionInput.value = state.graphExpression || graphExpressionInput.value;
    requestAnimationFrame(() => {
      scheduleGraphRender({ force: true });
      graphExpressionInput.focus({ preventScroll: true });
      graphExpressionInput.setSelectionRange(
        graphExpressionInput.value.length,
        graphExpressionInput.value.length,
      );
    });
  }

  triggerHaptic(10);
}

function handleMenuAction(event) {
  const button = event.target.closest("[data-menu-action]");
  if (!button) {
    return;
  }

  switch (button.dataset.menuAction) {
    case "graph":
      toggleGraphPanel(true);
      setStatus("Graph view opened.", "success");
      break;
    case "history":
      toggleHistoryPanel(true);
      setStatus("History opened.", "success");
      break;
    case "formulas":
      toggleFormulaPanel(true);
      setStatus("Formula reference opened.", "success");
      break;
    case "theme":
      toggleThemePanel(true);
      setStatus("Theme selector opened.", "success");
      break;
    case "angle":
      closeOpenPanels();
      toggleAngleMode();
      break;
    case "copy":
      closeOpenPanels();
      copyResult();
      break;
    default:
      break;
  }
}

function handleHeaderToolClick(event) {
  const button = event.target.closest("button");
  if (!button) {
    return;
  }

  if (button.classList.contains("mode-switch-btn")) {
    setCalculatorMode(button.dataset.calculatorMode);
    return;
  }

  switch (button.id) {
    case "graphToggle":
      toggleGraphPanel();
      break;
    case "historyToggle":
      toggleHistoryPanel();
      break;
    case "formulaToggle":
      toggleFormulaPanel();
      break;
    case "themeToggle":
      toggleThemePanel();
      break;
    case "menuToggle":
      toggleMobileMenu();
      break;
    default:
      break;
  }
}

function handlePanelClose(event) {
  const targetPanel = event.currentTarget.dataset.closePanel;

  if (targetPanel === "history") {
    setPanelVisibility(historyPanel, historyToggle, false);
  }

  if (targetPanel === "formula") {
    setPanelVisibility(formulaPanel, formulaToggle, false);
  }

  if (targetPanel === "graph") {
    setPanelVisibility(graphPanel, graphToggle, false);
  }

  if (targetPanel === "theme") {
    setPanelVisibility(themePanel, themeToggle, false);
  }

  syncOverlayBackdrop();
  setStatus("Panel closed.", "muted");
  triggerHaptic(8);
}

function syncResponsiveOverlays() {
  if (!isCompactViewport()) {
    setMenuVisibility(false);
  }

  syncOverlayBackdrop();
}

function handleGraphExpressionInput() {
  state.graphExpression = graphExpressionInput.value;
  scheduleGraphRender();
}

function handleThemeSelection(event) {
  const button = event.target.closest("[data-theme-value]");
  if (!button) {
    return;
  }

  setTheme(button.dataset.themeValue);
  setPanelVisibility(themePanel, themeToggle, false);
  syncOverlayBackdrop();
}

function handleDocumentClick(event) {
  const target = event.target;

  if (!(target instanceof HTMLElement)) {
    return;
  }

  if (!themePanel.classList.contains("show")) {
    return;
  }

  if (target.closest("#themePanel, #themeToggle, #mobileMenu")) {
    return;
  }

  setPanelVisibility(themePanel, themeToggle, false);
}

function handleGraphPresetClick(event) {
  const button = event.target.closest("[data-graph-preset]");
  if (!button) {
    return;
  }

  graphExpressionInput.value = button.dataset.graphPreset;
  state.graphExpression = graphExpressionInput.value;
  scheduleGraphRender();
  graphExpressionInput.focus({ preventScroll: true });
  triggerHaptic(8);
}

function handleGraphInputKeydown(event) {
  if (event.key === "Enter") {
    event.preventDefault();
    state.graphExpression = graphExpressionInput.value;
    scheduleGraphRender();
    setStatus("Graph updated.", "success");
    return;
  }

  if (event.key === "Escape" && closeOpenPanels()) {
    event.preventDefault();
    setStatus("Panels closed.", "muted");
  }
}

function updateInstallButtonVisibility() {
  const installState = getInstallState();
  installAppButton.hidden = false;
  installAppButton.disabled = installState === "installed";
  installAppButton.dataset.installState = installState;

  if (installState === "prompt") {
    installAppButton.textContent = "Install App";
    setInstallHelp("One-tap install", "Add this calculator to your home screen and use it like a normal app.");
    return;
  }

  if (installState === "ios") {
    installAppButton.textContent = "Install Guide";
    setInstallHelp("iPhone / iPad", "Open Safari Share and choose Add to Home Screen.");
    return;
  }

  if (installState === "installed") {
    installAppButton.textContent = "Installed";
    setInstallHelp("Already installed", "This calculator is already available from your home screen.");
    return;
  }

  installAppButton.textContent = "Install Help";
  setInstallHelp("Browser help", "Use your browser menu and choose Install App or Add to Home Screen when available.");
}

async function handleInstallApp() {
  const installState = getInstallState();

  if (installState === "installed") {
    setStatus("This calculator is already installed on this device.", "muted");
    return;
  }

  if (installState === "ios") {
    setStatus("On iPhone or iPad, tap Share and choose Add to Home Screen.", "muted");
    triggerHaptic(8);
    return;
  }

  if (installState === "manual") {
    setStatus("Use your browser menu and choose Install App or Add to Home Screen.", "muted");
    triggerHaptic(8);
    return;
  }

  deferredInstallPrompt.prompt();
  const { outcome } = await deferredInstallPrompt.userChoice;
  deferredInstallPrompt = null;
  updateInstallButtonVisibility();

  if (outcome === "accepted") {
    setStatus("Install prompt accepted.", "success");
    triggerHaptic(10);
  } else {
    setStatus("Install prompt dismissed.", "muted");
  }
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    return;
  }

  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js?v=20260405-installhelp", {
      updateViaCache: "none",
    }).catch(() => {
      setStatus("Offline mode is unavailable in this browser.", "muted");
    });
  });
}

function restoreHistoryItem(index) {
  const entry = state.history[index];
  if (!entry) {
    return;
  }

  state.expression = entry.expression;
  state.cursorIndex = entry.expression.length;
  state.lastEvaluatedExpression = "";
  state.isResult = false;
  setExpressionIssue(null);
  invalidateDisplayCache();
  setStatus("History item restored to the editor.", "success");
  triggerHaptic(10);

  if (isCompactViewport()) {
    setPanelVisibility(historyPanel, historyToggle, false);
    syncOverlayBackdrop();
  }

  updatePreview({ renderNow: true });
}

function clearHistoryList() {
  state.history = [];
  saveHistory();
  renderHistory();
  setStatus("Stored history cleared.", "success");
  triggerHaptic([10, 20, 10]);
}

function deleteHistoryEntry(index) {
  const entry = state.history[index];

  if (!entry) {
    return;
  }

  state.history.splice(index, 1);
  saveHistory();
  renderHistory();
  setStatus("Selected history item deleted.", "success");
  triggerHaptic([12, 24, 18]);
}

function getHistoryExportBaseName() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");

  return `scientific-calculator-history-${year}-${month}-${day}-${hours}${minutes}`;
}

function downloadTextFile(filename, content, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);
}

function exportHistory(format) {
  if (state.history.length === 0) {
    setStatus("No history available to export.", "error");
    return;
  }

  const baseName = getHistoryExportBaseName();

  if (format === "txt") {
    const lines = [
      "Scientific Calculator History",
      `Exported: ${new Date().toLocaleString()}`,
      "",
      ...state.history.map((entry, index) => [
        `${index + 1}. ${entry.expression} = ${entry.result}`,
        `   Mode: ${entry.angleMode.toUpperCase()}`,
      ].join("\n")),
    ];

    downloadTextFile(`${baseName}.txt`, lines.join("\n"), "text/plain;charset=utf-8");
    setStatus("History exported as TXT.", "success");
    triggerHaptic(10);
    return;
  }

  if (format === "json") {
    const payload = {
      exportedAt: new Date().toISOString(),
      angleMode: state.angleMode,
      items: state.history,
    };

    downloadTextFile(
      `${baseName}.json`,
      JSON.stringify(payload, null, 2),
      "application/json;charset=utf-8",
    );
    setStatus("History exported as JSON.", "success");
    triggerHaptic(10);
  }
}

function handleButtonClick(event) {
  const button = event.target.closest("button");
  if (!button) {
    return;
  }

  triggerHaptic(8);

  const value = button.dataset.value;
  const action = button.dataset.action;

  if (value) {
    insertValue(value);
    return;
  }

  switch (action) {
    case "clear":
      clearAll();
      break;
    case "backspace":
      backspace();
      break;
    case "equals":
      evaluateCurrentExpression();
      break;
    case "ans":
      if (state.lastAnswer !== null) {
        insertConstant(window.CalculatorCore.formatResult(state.lastAnswer));
      }
      break;
    case "M+":
    case "M-":
    case "MR":
      handleMemoryAction(action);
      break;
    default:
      break;
  }
}

function handleKeyboard(event) {
  const key = event.key;
  const isScientificMode = state.calculatorMode === "scientific";

  if (isTextEntryTarget(event.target)) {
    if (key === "Escape" && closeOpenPanels()) {
      event.preventDefault();
      setStatus("Panels closed.", "muted");
    }
    return;
  }

  if (event.ctrlKey || event.metaKey) {
    if (key.toLowerCase() === "c") {
      event.preventDefault();
      copyResult();
    }
    return;
  }

  if (/^[0-9]$/.test(key)) {
    insertValue(key);
    return;
  }

  const supportedEntryKeys = isScientificMode
    ? ["+", "-", "*", "/", "^", "%", "!", "(", ")", "."]
    : ["+", "-", "*", "/", "%", "(", ")", "."];

  if (supportedEntryKeys.includes(key)) {
    insertValue(key);
    return;
  }

  if (key === "Enter" || key === "=") {
    event.preventDefault();
    evaluateCurrentExpression();
    return;
  }

  if (key === "Backspace") {
    event.preventDefault();
    backspace();
    return;
  }

  if (key === "Delete") {
    event.preventDefault();
    deleteForward();
    return;
  }

  if (key === "ArrowLeft") {
    event.preventDefault();
    moveCursor(-1);
    return;
  }

  if (key === "ArrowRight") {
    event.preventDefault();
    moveCursor(1);
    return;
  }

  if (key === "Home") {
    event.preventDefault();
    clearResultPresentation();
    state.cursorIndex = 0;
    invalidateDisplayCache();
    renderDisplay();
    return;
  }

  if (key === "End") {
    event.preventDefault();
    clearResultPresentation();
    state.cursorIndex = state.expression.length;
    invalidateDisplayCache();
    renderDisplay();
    return;
  }

  if (key === "Escape") {
    if (closeOpenPanels()) {
      setStatus("Panels closed.", "muted");
      return;
    }

    clearAll();
    return;
  }

  if (isScientificMode && key.toLowerCase() === "s") {
    insertValue("sin(");
    return;
  }

  if (isScientificMode && key.toLowerCase() === "c") {
    insertValue("cos(");
    return;
  }

  if (isScientificMode && key.toLowerCase() === "t") {
    insertValue("tan(");
    return;
  }

  if (isScientificMode && key.toLowerCase() === "g") {
    insertValue("log(");
    return;
  }

  if (isScientificMode && key.toLowerCase() === "l") {
    insertValue("ln(");
    return;
  }

  if (isScientificMode && key.toLowerCase() === "q") {
    insertValue("sqrt(");
    return;
  }

  if (isScientificMode && key.toLowerCase() === "p") {
    insertValue("pi");
    return;
  }

  if (isScientificMode && key.toLowerCase() === "e") {
    insertValue("e");
    return;
  }

  if (isScientificMode && key.toLowerCase() === "r") {
    toggleAngleMode();
  }
}

function handleHistoryClick(event) {
  const button = event.target.closest("[data-history-index]");
  if (!button) {
    return;
  }

  const index = Number(button.dataset.historyIndex);
  const action = button.dataset.historyAction;

  if (action === "delete") {
    deleteHistoryEntry(index);
    return;
  }

  restoreHistoryItem(index);
}

function handleFormulaClick(event) {
  const button = event.target.closest("[data-formula-insert]");
  if (!button) {
    return;
  }

  insertValue(button.dataset.formulaInsert);
  setStatus("Formula template inserted.", "success");
  triggerHaptic(8);

  if (isCompactViewport()) {
    setPanelVisibility(formulaPanel, formulaToggle, false);
    syncOverlayBackdrop();
  }
}

function initialize() {
  applyTheme(readStorage(STORAGE_KEYS.theme, "dark"), false);
  applyAngleMode(readStorage(STORAGE_KEYS.angle, "deg"), false);
  applyCalculatorMode("simple");
  loadHistory();
  renderHistory();
  renderFormulas();
  renderMemory();
  graphExpressionInput.value = state.graphExpression;
  drawGraphPlaceholder("Plot a function to begin");
  setGraphMeta("Type y = sin(x) or y = x^2 to plot a graph.", "muted");
  updatePreview({ renderNow: true, force: true });
  updateInstallButtonVisibility();
  syncResponsiveOverlays();
  registerServiceWorker();
}

buttonGrids.forEach((grid) => {
  grid.addEventListener("click", handleButtonClick);
});

// Mode switch buttons sit outside header actions; wire them directly.
modeSwitchButtons.forEach((button) => {
  button.addEventListener("click", () => setCalculatorMode(button.dataset.calculatorMode));
});

// Safety: delegate clicks in case markup changes or buttons are re-rendered.
document.addEventListener("click", (event) => {
  const modeButton = event.target.closest(".mode-switch-btn");
  if (!modeButton) {
    return;
  }
  event.preventDefault();
  setCalculatorMode(modeButton.dataset.calculatorMode);
});
document.addEventListener("keydown", handleKeyboard);
document.addEventListener("click", handleDocumentClick);
historyEl.addEventListener("click", handleHistoryClick);
formulaList.addEventListener("click", handleFormulaClick);
themeGrid.addEventListener("click", handleThemeSelection);
headerActionsEl?.addEventListener("click", handleHeaderToolClick);
modeSwitchButtons.forEach((button) => {
  button.addEventListener("click", () => setCalculatorMode(button.dataset.calculatorMode));
});
mobileMenu.addEventListener("click", handleMenuAction);
installAppButton.addEventListener("click", handleInstallApp);
overlayBackdrop.addEventListener("click", () => {
  closeOpenPanels();
  setStatus("Panels closed.", "muted");
});
clearHistoryButton.addEventListener("click", clearHistoryList);
exportHistoryTxtButton.addEventListener("click", () => exportHistory("txt"));
exportHistoryJsonButton.addEventListener("click", () => exportHistory("json"));
angleToggle.addEventListener("click", toggleAngleMode);
copyResultButton?.addEventListener("click", copyResult);
graphPlotButton.addEventListener("click", () => {
  state.graphExpression = graphExpressionInput.value;
  scheduleGraphRender();
  setStatus("Graph updated.", "success");
});
graphExpressionInput.addEventListener("input", handleGraphExpressionInput);
graphExpressionInput.addEventListener("keydown", handleGraphInputKeydown);
graphPresets.addEventListener("click", handleGraphPresetClick);
panelCloseButtons.forEach((button) => {
  button.addEventListener("click", handlePanelClose);
});

if (typeof compactViewportQuery.addEventListener === "function") {
  compactViewportQuery.addEventListener("change", syncResponsiveOverlays);
} else if (typeof compactViewportQuery.addListener === "function") {
  compactViewportQuery.addListener(syncResponsiveOverlays);
}

window.addEventListener("resize", () => {
  if (graphPanel.classList.contains("show")) {
    scheduleGraphRender();
  }
});

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;
  updateInstallButtonVisibility();
});

window.addEventListener("appinstalled", () => {
  deferredInstallPrompt = null;
  updateInstallButtonVisibility();
  setStatus("Calculator installed successfully.", "success");
});

initialize();
