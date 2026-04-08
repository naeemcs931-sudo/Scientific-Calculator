(function (root, factory) {
  const api = factory();

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  root.CalculatorCore = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const OPERATORS = {
    "+": { precedence: 2, associativity: "left", arity: 2, func: (a, b) => a + b },
    "-": { precedence: 2, associativity: "left", arity: 2, func: (a, b) => a - b },
    "*": { precedence: 3, associativity: "left", arity: 2, func: (a, b) => a * b },
    "/": { precedence: 3, associativity: "left", arity: 2, func: (a, b) => a / b },
    "^": { precedence: 4, associativity: "right", arity: 2, func: (a, b) => Math.pow(a, b) },
    "u-": { precedence: 5, associativity: "right", arity: 1, func: (a) => -a },
    "!": { precedence: 6, associativity: "left", arity: 1, func: factorial },
    "%": { precedence: 6, associativity: "left", arity: 1, func: (a) => a / 100 },
  };
  const SUPPORTED_FUNCTIONS = ["sin", "cos", "tan", "log", "ln", "sqrt"];
  const SUPPORTED_FUNCTION_SET = new Set(SUPPORTED_FUNCTIONS);

  function normalizeExpression(expr) {
    return String(expr || "")
      .replace(/\s+/g, "")
      .replace(/\u00d7/g, "*")
      .replace(/\u00f7/g, "/")
      .replace(/\u2212/g, "-");
  }

  function readNumberLiteral(source, startIndex) {
    let index = startIndex;
    let number = source[index];
    index += 1;

    while (index < source.length && /[0-9.]/.test(source[index])) {
      number += source[index];
      index += 1;
    }

    if (/[eE]/.test(source[index] || "")) {
      let exponent = source[index];
      let exponentIndex = index + 1;

      if (/[+\-]/.test(source[exponentIndex] || "")) {
        exponent += source[exponentIndex];
        exponentIndex += 1;
      }

      let exponentDigits = "";
      while (exponentIndex < source.length && /[0-9]/.test(source[exponentIndex])) {
        exponentDigits += source[exponentIndex];
        exponentIndex += 1;
      }

      if (!exponentDigits) {
        throw new Error("Invalid number");
      }

      number += exponent + exponentDigits;
      index = exponentIndex;
    }

    if ((number.match(/\./g) || []).length > 1 || !Number.isFinite(Number(number))) {
      throw new Error("Invalid number");
    }

    return { number, nextIndex: index };
  }

  function isNearZero(value) {
    return Math.abs(value) < 1e-12;
  }

  function factorial(value) {
    if (!Number.isInteger(value) || value < 0) {
      throw new Error("Factorial only works for non-negative integers");
    }

    if (value > 170) {
      throw new Error("Factorial result is too large");
    }

    let result = 1;
    for (let current = 2; current <= value; current += 1) {
      result *= current;
    }
    return result;
  }

  function buildFunctions(angleMode = "deg") {
    const toRadians = angleMode === "rad"
      ? (value) => value
      : (value) => (value * Math.PI) / 180;

    return {
      sin: (value) => Math.sin(toRadians(value)),
      cos: (value) => Math.cos(toRadians(value)),
      tan: (value) => {
        const radians = toRadians(value);
        if (isNearZero(Math.cos(radians))) {
          throw new Error("Math error");
        }
        return Math.tan(radians);
      },
      log: (value) => {
        if (value <= 0) {
          throw new Error("Math error");
        }
        return Math.log10(value);
      },
      ln: (value) => {
        if (value <= 0) {
          throw new Error("Math error");
        }
        return Math.log(value);
      },
      sqrt: (value) => {
        if (value < 0) {
          throw new Error("Math error");
        }
        return Math.sqrt(value);
      },
    };
  }

  function tokenize(expr) {
    const normalized = normalizeExpression(expr);
    const tokens = [];
    let index = 0;

    while (index < normalized.length) {
      const character = normalized[index];

      if (/[0-9.]/.test(character)) {
        const { number, nextIndex } = readNumberLiteral(normalized, index);
        tokens.push({ type: "number", value: parseFloat(number) });
        index = nextIndex;
        continue;
      }

      if (/[+\-*/^()%!]/.test(character)) {
        tokens.push({ type: "operator", value: character });
        index += 1;
        continue;
      }

      if (/[a-z]/i.test(character)) {
        let name = character;
        index += 1;

        while (index < normalized.length && /[a-z]/i.test(normalized[index])) {
          name += normalized[index];
          index += 1;
        }

        const lowered = name.toLowerCase();

        if (lowered === "pi") {
          tokens.push({ type: "number", value: Math.PI });
        } else if (lowered === "e") {
          tokens.push({ type: "number", value: Math.E });
        } else if (SUPPORTED_FUNCTION_SET.has(lowered)) {
          tokens.push({ type: "function", value: lowered });
        } else {
          throw new Error(`Unknown function: ${name}`);
        }
        continue;
      }

      throw new Error(`Unexpected character: ${character}`);
    }

    return tokens;
  }

  function normalizeGraphInput(input) {
    return normalizeExpression(input)
      .toLowerCase()
      .replace(/^f\(x\)=/, "")
      .replace(/^y=/, "");
  }

  function isGraphValueToken(token) {
    if (!token) {
      return false;
    }

    if (["number", "variable", "constant"].includes(token.type)) {
      return true;
    }

    return token.type === "operator" && [")", "!", "%"].includes(token.value);
  }

  function startsGraphValue(token) {
    if (!token) {
      return false;
    }

    if (["number", "variable", "constant", "function"].includes(token.type)) {
      return true;
    }

    return token.type === "operator" && token.value === "(";
  }

  function prepareGraphExpression(input) {
    const source = normalizeGraphInput(input);
    const graphTokens = [];
    let index = 0;

    if (!source) {
      throw new Error("Enter y = ... to plot");
    }

    while (index < source.length) {
      const character = source[index];

      if (/[0-9.]/.test(character)) {
        const { number, nextIndex } = readNumberLiteral(source, index);
        graphTokens.push({ type: "number", value: number });
        index = nextIndex;
        continue;
      }

      if (/[+\-*/^()%!]/.test(character)) {
        graphTokens.push({ type: "operator", value: character });
        index += 1;
        continue;
      }

      if (/[a-z]/i.test(character)) {
        let name = character;
        index += 1;

        while (index < source.length && /[a-z]/i.test(source[index])) {
          name += source[index];
          index += 1;
        }

        if (name === "x") {
          graphTokens.push({ type: "variable", value: "x" });
          continue;
        }

        if (name === "pi" || name === "e") {
          graphTokens.push({ type: "constant", value: name });
          continue;
        }

        if (SUPPORTED_FUNCTION_SET.has(name)) {
          graphTokens.push({ type: "function", value: name });
          continue;
        }

        throw new Error(`Unknown symbol: ${name}`);
      }

      throw new Error(`Unexpected character: ${character}`);
    }

    return graphTokens
      .map((token, tokenIndex) => {
        const previousToken = tokenIndex === 0 ? null : graphTokens[tokenIndex - 1];
        const prefix = isGraphValueToken(previousToken) && startsGraphValue(token) ? "*" : "";
        return `${prefix}${token.value}`;
      })
      .join("");
  }

  function isPostfixOperatorToken(token) {
    return token?.type === "operator" && (token.value === "!" || token.value === "%");
  }

  function isUnaryMinusToken(tokens, index) {
    const token = tokens[index];
    if (!token || token.type !== "operator" || token.value !== "-") {
      return false;
    }

    const previousToken = index === 0 ? null : tokens[index - 1];
    return !previousToken
      || (previousToken.type === "operator"
        && previousToken.value !== ")"
        && previousToken.value !== "!"
        && previousToken.value !== "%");
  }

  function includeUnaryPrefix(tokens, startIndex) {
    if (startIndex > 0 && isUnaryMinusToken(tokens, startIndex - 1)) {
      return startIndex - 1;
    }

    return startIndex;
  }

  function findMatchingGroupStart(tokens, endIndex) {
    let depth = 1;

    for (let index = endIndex - 1; index >= 0; index -= 1) {
      const token = tokens[index];
      if (token.type !== "operator") {
        continue;
      }

      if (token.value === ")") {
        depth += 1;
      } else if (token.value === "(") {
        depth -= 1;
      }

      if (depth === 0) {
        return token.type === "operator" && index > 0 && tokens[index - 1].type === "function"
          ? includeUnaryPrefix(tokens, index - 1)
          : includeUnaryPrefix(tokens, index);
      }
    }

    throw new Error("Mismatched parentheses");
  }

  function findOperandStart(tokens, endIndex) {
    if (endIndex < 0) {
      throw new Error("Syntax error");
    }

    let cursor = endIndex;

    while (cursor >= 0 && isPostfixOperatorToken(tokens[cursor])) {
      cursor = findOperandStart(tokens, cursor - 1);
      return cursor;
    }

    const token = tokens[cursor];

    if (!token) {
      throw new Error("Syntax error");
    }

    if (token.type === "number") {
      return includeUnaryPrefix(tokens, cursor);
    }

    if (token.type === "operator" && token.value === ")") {
      return findMatchingGroupStart(tokens, cursor);
    }

    throw new Error("Syntax error");
  }

  function findPreviousBinaryOperator(tokens, beforeIndex) {
    let depth = 0;

    for (let index = beforeIndex; index >= 0; index -= 1) {
      const token = tokens[index];
      if (!token || token.type !== "operator") {
        continue;
      }

      if (token.value === ")") {
        depth += 1;
        continue;
      }

      if (token.value === "(") {
        depth -= 1;
        continue;
      }

      if (depth > 0 || !["+", "-", "*", "/", "^"].includes(token.value)) {
        continue;
      }

      if (!isUnaryMinusToken(tokens, index)) {
        return index;
      }
    }

    return -1;
  }

  function createNumberToken(value) {
    return { type: "number", value };
  }

  function createOperatorToken(value) {
    return { type: "operator", value };
  }

  // Convert postfix percentages into the equivalent infix form that common calculators expect.
  function expandPercentTokens(tokens) {
    const expandedTokens = tokens.map((token) => ({ ...token }));

    for (let index = 0; index < expandedTokens.length; index += 1) {
      const token = expandedTokens[index];

      if (token.type !== "operator" || token.value !== "%") {
        continue;
      }

      const operandStart = findOperandStart(expandedTokens, index - 1);
      const operandTokens = expandedTokens.slice(operandStart, index);
      const previousOperatorIndex = findPreviousBinaryOperator(expandedTokens, operandStart - 1);

      let replacementTokens = [
        createOperatorToken("("),
        ...operandTokens,
        createOperatorToken("/"),
        createNumberToken(100),
        createOperatorToken(")"),
      ];

      if (previousOperatorIndex !== -1) {
        const previousOperator = expandedTokens[previousOperatorIndex].value;

        if (previousOperator === "+" || previousOperator === "-") {
          const baseStart = findOperandStart(expandedTokens, previousOperatorIndex - 1);
          const baseTokens = expandedTokens.slice(baseStart, previousOperatorIndex);

          replacementTokens = [
            createOperatorToken("("),
            ...baseTokens,
            createOperatorToken("*"),
            ...operandTokens,
            createOperatorToken("/"),
            createNumberToken(100),
            createOperatorToken(")"),
          ];
        }
      }

      expandedTokens.splice(operandStart, index - operandStart + 1, ...replacementTokens);
      index = operandStart + replacementTokens.length - 1;
    }

    return expandedTokens;
  }

  function toRPN(tokens) {
    const sourceTokens = expandPercentTokens(tokens);
    const outputQueue = [];
    const operatorStack = [];

    for (let index = 0; index < sourceTokens.length; index += 1) {
      const token = sourceTokens[index];

      if (token.type === "number") {
        outputQueue.push(token);
        continue;
      }

      if (token.type === "function") {
        operatorStack.push(token);
        continue;
      }

      if (token.type !== "operator") {
        throw new Error("Unsupported token");
      }

      if (token.value === "(") {
        operatorStack.push(token);
        continue;
      }

      if (token.value === ")") {
        while (operatorStack.length && operatorStack[operatorStack.length - 1].value !== "(") {
          outputQueue.push(operatorStack.pop());
        }

        if (!operatorStack.length) {
          throw new Error("Mismatched parentheses");
        }

        operatorStack.pop();

        if (operatorStack.length && operatorStack[operatorStack.length - 1].type === "function") {
          outputQueue.push(operatorStack.pop());
        }
        continue;
      }

      let operatorValue = token.value;
      const previousToken = index === 0 ? null : sourceTokens[index - 1];
      const allowUnary = !previousToken
        || (previousToken.type === "operator"
          && previousToken.value !== ")"
          && previousToken.value !== "!"
          && previousToken.value !== "%");

      if (operatorValue === "-" && allowUnary) {
        operatorValue = "u-";
      }

      const currentOperator = OPERATORS[operatorValue];
      if (!currentOperator) {
        throw new Error("Invalid operator");
      }

      while (operatorStack.length) {
        const topToken = operatorStack[operatorStack.length - 1];

        if (topToken.type === "function") {
          outputQueue.push(operatorStack.pop());
          continue;
        }

        if (topToken.type !== "operator" || topToken.value === "(") {
          break;
        }

        const topOperator = OPERATORS[topToken.value];
        if (!topOperator) {
          break;
        }

        const shouldPop = currentOperator.associativity === "left"
          ? currentOperator.precedence <= topOperator.precedence
          : currentOperator.precedence < topOperator.precedence;

        if (!shouldPop) {
          break;
        }

        outputQueue.push(operatorStack.pop());
      }

      operatorStack.push({ type: "operator", value: operatorValue });
    }

    while (operatorStack.length) {
      const topToken = operatorStack.pop();

      if (topToken.value === "(" || topToken.value === ")") {
        throw new Error("Mismatched parentheses");
      }

      outputQueue.push(topToken);
    }

    return outputQueue;
  }

  function evaluateRPN(rpn, options = {}) {
    const stack = [];
    const functions = buildFunctions(options.angleMode);

    for (const token of rpn) {
      if (token.type === "number") {
        stack.push(token.value);
        continue;
      }

      if (token.type === "function") {
        if (stack.length < 1) {
          throw new Error("Syntax error");
        }

        const argument = stack.pop();
        const fn = functions[token.value];
        const result = fn(argument);

        if (!Number.isFinite(result)) {
          throw new Error("Math error");
        }

        stack.push(result);
        continue;
      }

      if (token.type !== "operator") {
        throw new Error("Unsupported token");
      }

      const operator = OPERATORS[token.value];
      if (!operator) {
        throw new Error("Invalid operator");
      }

      if (operator.arity === 1) {
        if (stack.length < 1) {
          throw new Error("Syntax error");
        }

        const value = stack.pop();
        const result = operator.func(value);

        if (!Number.isFinite(result)) {
          throw new Error("Math error");
        }

        stack.push(result);
        continue;
      }

      if (stack.length < 2) {
        throw new Error("Syntax error");
      }

      const right = stack.pop();
      const left = stack.pop();

      if (token.value === "/" && isNearZero(right)) {
        throw new Error("Divide by zero");
      }

      const result = operator.func(left, right);

      if (!Number.isFinite(result)) {
        throw new Error("Math error");
      }

      stack.push(result);
    }

    if (stack.length !== 1) {
      throw new Error("Malformed expression");
    }

    return stack[0];
  }

  function roundResult(value, precision = 12) {
    const rounded = Number.parseFloat(Number(value).toPrecision(precision));
    return Object.is(rounded, -0) ? 0 : rounded;
  }

  function formatResult(value, precision = 12) {
    return String(roundResult(value, precision));
  }

  function evaluateExpression(expr, options = {}) {
    const tokens = tokenize(expr);
    const rpn = toRPN(tokens);
    const result = evaluateRPN(rpn, options);
    return roundResult(result);
  }

  function evaluateGraphExpression(input, variableValue, options = {}) {
    if (!Number.isFinite(variableValue)) {
      throw new Error("Invalid x value");
    }

    const preparedExpression = prepareGraphExpression(input);
    const sample = `(${formatResult(variableValue, 15)})`;
    const substitutedExpression = preparedExpression.replace(/x/g, sample);
    return evaluateExpression(substitutedExpression, options);
  }

  return {
    tokenize,
    toRPN,
    evaluateRPN,
    evaluateExpression,
    prepareGraphExpression,
    evaluateGraphExpression,
    formatResult,
    normalizeExpression,
    roundResult,
  };
});
