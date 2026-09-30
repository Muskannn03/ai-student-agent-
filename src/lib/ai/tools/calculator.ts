// ==========================================
// Tool: Calculator (Safe Mathematical Evaluator)
// Strictly NO arbitrary JavaScript execution or eval()
// ==========================================

import { AgentTool } from './types';

export interface CalculatorArgs {
  expression?: string;
  operation?:
    | 'add'
    | 'subtract'
    | 'multiply'
    | 'divide'
    | 'power'
    | 'sqrt'
    | 'percentage'
    | 'average'
    | 'gpa';
  numbers?: number[];
  a?: number;
  b?: number;
  percentage?: number;
  of?: number;
  courses?: Array<{ grade: string | number; credits: number }>;
}

export interface CalculatorResult {
  success: boolean;
  result: number | string;
  expressionEvaluated?: string;
  explanation?: string;
  error?: string;
}

// ------------------------------------------
// Safe Expression Tokenizer & AST Evaluator
// ------------------------------------------

type TokenType = 'NUMBER' | 'OP' | 'LPAREN' | 'RPAREN' | 'COMMA' | 'IDENT';

interface Token {
  type: TokenType;
  value: string;
}

const ALLOWED_IDENTIFIERS = new Set([
  'sqrt',
  'abs',
  'round',
  'floor',
  'ceil',
  'min',
  'max',
  'log',
  'log10',
  'sin',
  'cos',
  'tan',
  'pow',
  'pi',
  'e',
]);

function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < input.length) {
    const char = input[i];

    // Skip whitespace
    if (/\s/.test(char)) {
      i++;
      continue;
    }

    // Number literal (supports decimals)
    if (/[0-9]/.test(char) || (char === '.' && /[0-9]/.test(input[i + 1] || ''))) {
      let numStr = '';
      let hasDot = false;
      while (i < input.length && (/[0-9]/.test(input[i]) || input[i] === '.')) {
        if (input[i] === '.') {
          if (hasDot) throw new Error('Invalid number format: multiple decimal points');
          hasDot = true;
        }
        numStr += input[i];
        i++;
      }
      tokens.push({ type: 'NUMBER', value: numStr });
      continue;
    }

    // Identifiers (functions or constants like pi, sqrt)
    if (/[a-zA-Z]/.test(char)) {
      let ident = '';
      while (i < input.length && /[a-zA-Z0-9_]/.test(input[i])) {
        ident += input[i];
        i++;
      }
      const lower = ident.toLowerCase();
      if (!ALLOWED_IDENTIFIERS.has(lower)) {
        throw new Error(
          `Security Exception: Unrecognized or disallowed function '${ident}'. Only safe mathematical operators are permitted.`
        );
      }
      tokens.push({ type: 'IDENT', value: lower });
      continue;
    }

    // Operators
    if (['+', '-', '*', '/', '%', '^'].includes(char)) {
      tokens.push({ type: 'OP', value: char });
      i++;
      continue;
    }

    // Parentheses
    if (char === '(') {
      tokens.push({ type: 'LPAREN', value: char });
      i++;
      continue;
    }

    if (char === ')') {
      tokens.push({ type: 'RPAREN', value: char });
      i++;
      continue;
    }

    // Comma for multi-arg functions e.g. min(4, 5)
    if (char === ',') {
      tokens.push({ type: 'COMMA', value: char });
      i++;
      continue;
    }

    // Disallowed character
    throw new Error(
      `Security Exception: Disallowed character '${char}' in calculation expression.`
    );
  }

  return tokens;
}

class SafeParser {
  private tokens: Token[];
  private pos = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  private peek(): Token | undefined {
    return this.tokens[this.pos];
  }

  private consume(): Token {
    return this.tokens[this.pos++];
  }

  parse(): number {
    const val = this.parseExpression();
    if (this.pos < this.tokens.length) {
      throw new Error(`Unexpected token '${this.tokens[this.pos].value}' at position ${this.pos}`);
    }
    return val;
  }

  // Expression = Term (('+' | '-') Term)*
  private parseExpression(): number {
    let result = this.parseTerm();

    while (this.peek() && this.peek()?.type === 'OP' && ['+', '-'].includes(this.peek()!.value)) {
      const op = this.consume().value;
      const right = this.parseTerm();
      if (op === '+') result += right;
      else result -= right;
    }

    return result;
  }

  // Term = Power (('*' | '/' | '%') Power)*
  private parseTerm(): number {
    let result = this.parsePower();

    while (
      this.peek() &&
      this.peek()?.type === 'OP' &&
      ['*', '/', '%'].includes(this.peek()!.value)
    ) {
      const op = this.consume().value;
      const right = this.parsePower();
      if (op === '*') {
        result *= right;
      } else if (op === '/') {
        if (right === 0) throw new Error('Mathematical Error: Division by zero');
        result /= right;
      } else if (op === '%') {
        if (right === 0) throw new Error('Mathematical Error: Modulo by zero');
        result %= right;
      }
    }

    return result;
  }

  // Power = Factor ('^' Power)? (right-associative)
  private parsePower(): number {
    const base = this.parseFactor();

    if (this.peek() && this.peek()?.type === 'OP' && this.peek()!.value === '^') {
      this.consume();
      const exponent = this.parsePower();
      return Math.pow(base, exponent);
    }

    return base;
  }

  // Factor = ('+' | '-') Factor | Primary
  private parseFactor(): number {
    if (this.peek() && this.peek()?.type === 'OP') {
      const op = this.consume().value;
      if (op === '+') return this.parseFactor();
      if (op === '-') return -this.parseFactor();
      throw new Error(`Unexpected operator '${op}'`);
    }

    return this.parsePrimary();
  }

  // Primary = NUMBER | IDENT '(' ArgList ')' | IDENT (constant) | '(' Expression ')'
  private parsePrimary(): number {
    const token = this.peek();

    if (!token) {
      throw new Error('Unexpected end of expression');
    }

    if (token.type === 'NUMBER') {
      this.consume();
      return parseFloat(token.value);
    }

    if (token.type === 'IDENT') {
      const name = this.consume().value;

      // Mathematical Constants
      if (name === 'pi') return Math.PI;
      if (name === 'e') return Math.E;

      // Function Call
      if (this.peek()?.type === 'LPAREN') {
        this.consume(); // '('
        const args: number[] = [];

        if (this.peek()?.type !== 'RPAREN') {
          args.push(this.parseExpression());
          while (this.peek()?.type === 'COMMA') {
            this.consume();
            args.push(this.parseExpression());
          }
        }

        if (this.peek()?.type !== 'RPAREN') {
          throw new Error(`Expected ')' after function '${name}' arguments`);
        }
        this.consume(); // ')'

        return this.evalFunction(name, args);
      }

      throw new Error(`Unknown mathematical identifier '${name}'`);
    }

    if (token.type === 'LPAREN') {
      this.consume(); // '('
      const val = this.parseExpression();
      if (this.peek()?.type !== 'RPAREN') {
        throw new Error("Mismatched parentheses: missing ')'");
      }
      this.consume(); // ')'
      return val;
    }

    throw new Error(`Unexpected token '${token.value}'`);
  }

  private evalFunction(name: string, args: number[]): number {
    switch (name) {
      case 'sqrt':
        if (args.length !== 1) throw new Error('sqrt() expects 1 argument');
        if (args[0] < 0) throw new Error('sqrt() cannot accept negative numbers');
        return Math.sqrt(args[0]);
      case 'abs':
        if (args.length !== 1) throw new Error('abs() expects 1 argument');
        return Math.abs(args[0]);
      case 'round':
        if (args.length !== 1) throw new Error('round() expects 1 argument');
        return Math.round(args[0]);
      case 'floor':
        if (args.length !== 1) throw new Error('floor() expects 1 argument');
        return Math.floor(args[0]);
      case 'ceil':
        if (args.length !== 1) throw new Error('ceil() expects 1 argument');
        return Math.ceil(args[0]);
      case 'min':
        if (args.length < 1) throw new Error('min() expects at least 1 argument');
        return Math.min(...args);
      case 'max':
        if (args.length < 1) throw new Error('max() expects at least 1 argument');
        return Math.max(...args);
      case 'log':
        if (args.length !== 1) throw new Error('log() expects 1 argument');
        if (args[0] <= 0) throw new Error('log() argument must be strictly positive');
        return Math.log(args[0]);
      case 'log10':
        if (args.length !== 1) throw new Error('log10() expects 1 argument');
        if (args[0] <= 0) throw new Error('log10() argument must be strictly positive');
        return Math.log10(args[0]);
      case 'pow':
        if (args.length !== 2) throw new Error('pow() expects 2 arguments: pow(base, exponent)');
        return Math.pow(args[0], args[1]);
      case 'sin':
        if (args.length !== 1) throw new Error('sin() expects 1 argument (radians)');
        return Math.sin(args[0]);
      case 'cos':
        if (args.length !== 1) throw new Error('cos() expects 1 argument (radians)');
        return Math.cos(args[0]);
      case 'tan':
        if (args.length !== 1) throw new Error('tan() expects 1 argument (radians)');
        return Math.tan(args[0]);
      default:
        throw new Error(`Unsupported function '${name}'`);
    }
  }
}

function evaluateSafeExpression(expr: string): number {
  if (expr.length > 500) {
    throw new Error('Expression length exceeds maximum limit of 500 characters.');
  }
  const tokens = tokenize(expr);
  if (tokens.length === 0) {
    throw new Error('Expression cannot be empty.');
  }
  const parser = new SafeParser(tokens);
  const result = parser.parse();

  if (!Number.isFinite(result)) {
    throw new Error('Mathematical calculation resulted in non-finite value (Infinity or NaN).');
  }

  return Number(result.toFixed(6));
}

// ------------------------------------------
// Grade Point Scale for GPA Calculations
// ------------------------------------------

const GRADE_POINTS: Record<string, number> = {
  'A+': 4.0,
  A: 4.0,
  'A-': 3.7,
  'B+': 3.3,
  B: 3.0,
  'B-': 2.7,
  'C+': 2.3,
  C: 2.0,
  'C-': 1.7,
  'D+': 1.3,
  D: 1.0,
  F: 0.0,
};

function calculateGPA(courses: Array<{ grade: string | number; credits: number }>) {
  if (!courses || !Array.isArray(courses) || courses.length === 0) {
    throw new Error('GPA calculation requires a list of courses with grade and credits.');
  }

  let totalPoints = 0;
  let totalCredits = 0;

  for (const c of courses) {
    const credits = Number(c.credits);
    if (isNaN(credits) || credits <= 0) {
      throw new Error(`Invalid course credits: ${c.credits}. Must be a positive number.`);
    }

    let points = 0;
    if (typeof c.grade === 'number') {
      points = c.grade;
    } else if (typeof c.grade === 'string') {
      const g = c.grade.trim().toUpperCase();
      if (GRADE_POINTS[g] !== undefined) {
        points = GRADE_POINTS[g];
      } else {
        const parsed = parseFloat(g);
        if (!isNaN(parsed)) points = parsed;
        else throw new Error(`Unrecognized letter grade '${c.grade}'`);
      }
    }

    totalPoints += points * credits;
    totalCredits += credits;
  }

  if (totalCredits === 0) throw new Error('Total credits must be greater than zero.');
  const gpa = totalPoints / totalCredits;
  return {
    gpa: Number(gpa.toFixed(3)),
    totalCredits,
    totalPoints: Number(totalPoints.toFixed(2)),
  };
}

// ------------------------------------------
// Tool Implementation & Export
// ------------------------------------------

export const calculatorTool: AgentTool<CalculatorArgs, CalculatorResult> = {
  name: 'calculator',
  description:
    'Perform safe mathematical calculations, arithmetic expressions, averages, percentages, and GPA calculations without arbitrary script execution. Supports +, -, *, /, %, ^, sqrt, abs, round, min, max, log.',
  parameters: {
    type: 'object',
    properties: {
      expression: {
        type: 'string',
        description:
          'Mathematical expression to evaluate safely (e.g. "(85 + 92 + 78) / 3", "sqrt(144) + 12", "250 * 0.15", "2 ^ 8").',
      },
      operation: {
        type: 'string',
        enum: [
          'add',
          'subtract',
          'multiply',
          'divide',
          'power',
          'sqrt',
          'percentage',
          'average',
          'gpa',
        ],
        description: 'Optional structured operation name if expression is not provided.',
      },
      numbers: {
        type: 'array',
        items: { type: 'number' },
        description: 'Array of numbers for average, add, multiply operations.',
      },
      a: { type: 'number', description: 'First operand for binary operations.' },
      b: { type: 'number', description: 'Second operand for binary operations.' },
      percentage: { type: 'number', description: 'Percentage rate (e.g. 15 for 15%).' },
      of: { type: 'number', description: 'Base number to compute percentage of.' },
      courses: {
        type: 'array',
        description: 'List of courses with letter grade and credits for GPA calculation.',
        items: {
          type: 'object',
          properties: {
            grade: { type: 'string', description: 'Letter grade e.g. A, B+, 3.5' },
            credits: { type: 'number', description: 'Credit hours e.g. 3 or 4' },
          },
          required: ['grade', 'credits'],
        },
      },
    },
  },
  execute: async (args: CalculatorArgs): Promise<CalculatorResult> => {
    try {
      // 1. If mathematical expression is provided
      if (args.expression && typeof args.expression === 'string') {
        const expr = args.expression.trim();
        const value = evaluateSafeExpression(expr);
        return {
          success: true,
          result: value,
          expressionEvaluated: expr,
          explanation: `Calculated ${expr} = ${value}`,
        };
      }

      // 2. Structured operations
      if (args.operation) {
        switch (args.operation) {
          case 'add': {
            const list = args.numbers || [args.a ?? 0, args.b ?? 0];
            const sum = list.reduce((acc, curr) => acc + curr, 0);
            return {
              success: true,
              result: Number(sum.toFixed(6)),
              explanation: `Sum of [${list.join(', ')}] = ${sum}`,
            };
          }
          case 'subtract': {
            const diff = (args.a ?? 0) - (args.b ?? 0);
            return {
              success: true,
              result: Number(diff.toFixed(6)),
              explanation: `${args.a} - ${args.b} = ${diff}`,
            };
          }
          case 'multiply': {
            const list = args.numbers || [args.a ?? 1, args.b ?? 1];
            const prod = list.reduce((acc, curr) => acc * curr, 1);
            return {
              success: true,
              result: Number(prod.toFixed(6)),
              explanation: `Product of [${list.join(', ')}] = ${prod}`,
            };
          }
          case 'divide': {
            if (args.b === 0) throw new Error('Division by zero is undefined.');
            const quot = (args.a ?? 0) / (args.b ?? 1);
            return {
              success: true,
              result: Number(quot.toFixed(6)),
              explanation: `${args.a} / ${args.b} = ${quot}`,
            };
          }
          case 'power': {
            const p = Math.pow(args.a ?? 0, args.b ?? 1);
            return {
              success: true,
              result: Number(p.toFixed(6)),
              explanation: `${args.a} ^ ${args.b} = ${p}`,
            };
          }
          case 'sqrt': {
            const val = args.a ?? 0;
            if (val < 0) throw new Error('Cannot calculate square root of a negative number.');
            const s = Math.sqrt(val);
            return {
              success: true,
              result: Number(s.toFixed(6)),
              explanation: `sqrt(${val}) = ${s}`,
            };
          }
          case 'percentage': {
            const rate = args.percentage ?? 0;
            const base = args.of ?? args.a ?? 0;
            const res = (rate / 100) * base;
            return {
              success: true,
              result: Number(res.toFixed(6)),
              explanation: `${rate}% of ${base} = ${res}`,
            };
          }
          case 'average': {
            const list = args.numbers || [];
            if (list.length === 0) throw new Error('Average requires an array of numbers.');
            const avg = list.reduce((a, b) => a + b, 0) / list.length;
            return {
              success: true,
              result: Number(avg.toFixed(4)),
              explanation: `Average of ${list.length} numbers = ${avg.toFixed(4)}`,
            };
          }
          case 'gpa': {
            if (!args.courses || args.courses.length === 0) {
              throw new Error('GPA calculation requires courses list.');
            }
            const gpaRes = calculateGPA(args.courses);
            return {
              success: true,
              result: gpaRes.gpa,
              explanation: `Calculated GPA: ${gpaRes.gpa} across ${gpaRes.totalCredits} credit hours (${gpaRes.totalPoints} total quality points).`,
            };
          }
        }
      }

      throw new Error(
        'Please provide a mathematical expression string or valid operation parameters.'
      );
    } catch (err) {
      return {
        success: false,
        result: 0,
        error: err instanceof Error ? err.message : 'Calculation error',
      };
    }
  },
};
