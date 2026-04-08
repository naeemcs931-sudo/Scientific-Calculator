const assert = require("node:assert/strict");
const calculator = require("./calculator-core");

function expectValue(expression, expected, options = {}) {
  const result = calculator.evaluateExpression(expression, options);
  assert.equal(result, expected, `${expression} should equal ${expected}`);
}

function expectRoundedValue(expression, expected, options = {}) {
  expectValue(expression, calculator.roundResult(expected), options);
}

function expectError(expression, message, options = {}) {
  assert.throws(
    () => calculator.evaluateExpression(expression, options),
    (error) => error.message === message,
    `${expression} should throw "${message}"`,
  );
}

function expectGraphValue(expression, variableValue, expected, options = {}) {
  const result = calculator.evaluateGraphExpression(expression, variableValue, options);
  assert.equal(result, expected, `${expression} at x=${variableValue} should equal ${expected}`);
}

function expectGraphError(expression, variableValue, message, options = {}) {
  assert.throws(
    () => calculator.evaluateGraphExpression(expression, variableValue, options),
    (error) => error.message === message,
    `${expression} at x=${variableValue} should throw "${message}"`,
  );
}

function createSeededRandom(seed) {
  let state = seed >>> 0;
  return function next() {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function pick(random, items) {
  return items[Math.floor(random() * items.length)];
}

function generateLeaf(random) {
  const value = Math.floor(random() * 19) + 1;
  return random() < 0.25 ? `(-${value})` : String(value);
}

function generateArithmeticExpression(random, depth = 0) {
  if (depth >= 3 || random() < 0.35) {
    return generateLeaf(random);
  }

  const operator = pick(random, ["+", "-", "*", "/"]);
  const left = generateArithmeticExpression(random, depth + 1);
  const right = operator === "/"
    ? String(Math.floor(random() * 19) + 1)
    : generateArithmeticExpression(random, depth + 1);

  return `(${left}${operator}${right})`;
}

function evaluateReferenceArithmetic(expression) {
  return Function(`"use strict"; return (${expression});`)();
}

function runDeterministicCoverage() {
  expectValue("2+2", 4);
  expectValue("2*(3+4)", 14);
  expectValue("2^3^2", 512);
  expectValue("1000000*1000000", 1000000000000);
  expectValue("1e+3+2", 1002);
  expectValue("1/(2+3)", 0.2);
  expectValue("(-2)^3", -8);
  expectValue("(-2)^4", 16);
  expectValue("2^-3", 0.125);
  expectValue("50%", 0.5);
  expectValue("200+10%", 220);
  expectValue("200-10%", 180);
  expectValue("200*10%", 20);
  expectValue("200/10%", 2000);
  expectValue("5!", 120);
  expectRoundedValue("123456789*987654321", 123456789 * 987654321);
  expectRoundedValue("0.000000000001+0.000000000002", 0.000000000003);
  expectRoundedValue("sqrt(2)^2", Math.pow(Math.sqrt(2), 2));
  expectValue("sqrt(81)+log(1000)+ln(e)", 13);
  expectValue("sin(0)", 0);
  expectValue("sin(90)", 1);
  expectValue("cos(180)", -1);
  expectValue("tan(45)", 1);
  expectRoundedValue("sin(30)^2+cos(30)^2", 1);
  expectValue("sin(pi/2)", 1, { angleMode: "rad" });
  expectValue("cos(pi)", -1, { angleMode: "rad" });
  expectValue("tan(pi/4)", 1, { angleMode: "rad" });
  expectValue("sqrt(16)", 4);

  expectGraphValue("y = sin(x)", 90, 1);
  expectGraphValue("y = x^2 + 2x + 1", 3, 16);
  expectGraphValue("y = 2(x+1)", 3, 8);
  expectGraphValue("y = cos(x)", 180, -1);
  expectGraphValue("y = tan(x)", 45, 1);
  expectGraphValue("y = sqrt(x^2)", -4, 4);
  assert.equal(calculator.prepareGraphExpression("y = 3x + sin(x)"), "3*x+sin(x)");
  assert.equal(calculator.prepareGraphExpression("y = 2pi(x+1)"), "2*pi*(x+1)");
}

function runErrorCoverage() {
  expectError("10/0", "Divide by zero");
  expectError("1..2+3", "Invalid number");
  expectError("1e+", "Invalid number");
  expectError("2++2", "Syntax error");
  expectError("2+","Syntax error");
  expectError("(2+3", "Mismatched parentheses");
  expectError("2**3", "Syntax error");
  expectError("5//2", "Syntax error");
  expectError("tan(90)", "Math error");
  expectError("tan(pi/2)", "Math error", { angleMode: "rad" });
  expectError("sqrt(-1)", "Math error");
  expectError("log(0)", "Math error");
  expectError("ln(0)", "Math error");
  expectError("171!", "Factorial result is too large");
  expectError("(-3)!", "Factorial only works for non-negative integers");
  expectError("3.5!", "Factorial only works for non-negative integers");
  expectError("foo(2)", "Unknown function: foo");

  expectGraphError("y = foo(x)", 2, "Unknown symbol: foo");
  expectGraphError("y = sin(x)", Number.POSITIVE_INFINITY, "Invalid x value");
}

function runRandomArithmeticCoverage() {
  const random = createSeededRandom(20260405);
  const iterations = 80;

  for (let index = 0; index < iterations; index += 1) {
    const expression = generateArithmeticExpression(random);
    const expected = calculator.roundResult(evaluateReferenceArithmetic(expression));
    const actual = calculator.evaluateExpression(expression);

    assert.equal(actual, expected, `Random arithmetic case ${index + 1} failed for ${expression}`);
  }
}

runDeterministicCoverage();
runErrorCoverage();
runRandomArithmeticCoverage();

console.log("All calculator tests passed.");
