/**
 * This is a function that can find the line in an input JSON string that corresponds to the
 * given JSON pointer.
 * More information about JSON pointers at: http://tools.ietf.org/html/draft-ietf-appsawg-json-pointer-08
 */

// TODO: refactor further and re-add eslint rules
/* eslint-disable no-param-reassign, no-use-before-define */

const _ = require('lodash');
const pointer = require('json-pointer');

const escapee = {
  '"': '"',
  '\\': '\\',
  '/': '/',
  b: '\b',
  f: '\f',
  n: '\n',
  r: '\r',
  t: '\t'
};

const addSegment = (segment, state) => {
  state.currentJsonPointer.push(segment);
  if (_.isEqual(state.currentJsonPointer, state.targetJsonPointer)) {
    state.result = { line: state.currentLine, column: state.currentColumn };
  }
};

const newError = (message, state) => {
  const error = Error(message);
  error.name = 'SyntaxError';
  error.at = state.currentIndex;
  error.text = state.text;
  return error;
};

const next = (state, expected) => {
  if (expected && expected !== state.currentChar) {
    throw newError('Expected "' + expected + '" instead of "' + state.currentChar + '"', state);
  }

  state.currentChar = state.text.charAt(state.currentIndex);
  state.currentIndex++;
  state.currentColumn++;
  return state.currentChar;
};

const number = (state) => {
  let currentString = '';

  if (state.currentChar === '-') {
    currentString = '-';
    next(state, '-');
  }
  while (state.currentChar >= '0' && state.currentChar <= '9') {
    currentString += state.currentChar;
    next(state);
  }
  if (state.currentChar === '.') {
    currentString += '.';
    while (next(state) && state.currentChar >= '0' && state.currentChar <= '9') {
      currentString += state.currentChar;
    }
  }
  if (state.currentChar === 'e' || state.currentChar === 'E') {
    currentString += state.currentChar;
    next(state);
    if (state.currentChar === '-' || state.currentChar === '+') {
      currentString += state.currentChar;
      next(state);
    }
    while (state.currentChar >= '0' && state.currentChar <= '9') {
      currentString += state.currentChar;
      next(state);
    }
  }
  const castNumber = +currentString;
  if (!Number.isFinite(castNumber)) {
    throw newError('Bad number', state);
  }
};

const string = (state) => {
  let hex;
  let i;
  let currentString = '';
  let uffff;

  if (state.currentChar === '"') {
    while (next(state)) {
      if (state.currentChar === '"') {
        next(state);
        return currentString;
      }
      if (state.currentChar === '\\') {
        next(state);
        if (state.currentChar === 'u') {
          uffff = 0;
          for (i = 0; i < 4; i += 1) {
            hex = parseInt(next(state), 16);
            if (!Number.isFinite(hex)) {
              break;
            }
            uffff = (uffff * 16) + hex;
          }
          currentString += String.fromCharCode(uffff);
        } else if (typeof escapee[ state.currentChar ] === 'string') {
          currentString += escapee[ state.currentChar ];
        } else {
          break;
        }
      } else {
        currentString += state.currentChar;
      }
    }
  }
  throw newError('Bad string', state);
};

const blank = (state) => {
  while (state.currentChar && state.currentChar <= ' ') {
    if (state.currentChar === '\n') {
      state.currentLine++;
      state.currentColumn = 1;
    }
    next(state);
  }
};

const word = (state) => {
  switch (state.currentChar) {
    case 't':
      next(state, 't');
      next(state, 'r');
      next(state, 'u');
      next(state, 'e');
      return;
    case 'f':
      next(state, 'f');
      next(state, 'a');
      next(state, 'l');
      next(state, 's');
      next(state, 'e');
      return;
    case 'n':
      next(state, 'n');
      next(state, 'u');
      next(state, 'l');
      next(state, 'l');
      return;
    default:
      throw newError(`Unexpected "${state.currentChar}"`, state);
  }
};

const object = (state) => {
  if (state.result) {
    return;
  }

  let key;
  let currentObject = {};

  if (state.currentChar === '{') {
    next(state, '{');
    blank(state);
    if (state.currentChar === '}') {
      next(state, '}');
      return;
    }
    while (state.currentChar) {
      key = string(state);
      addSegment(key, state);

      if (state.result) {
        return;
      }

      blank(state);
      next(state, ':');
      if (Object.hasOwnProperty.call(currentObject, key)) {
        throw newError('Duplicate key "' + key + '"', state);
      }
      currentObject[ key ] = value(state);

      if (state.result) {
        return;
      }

      state.currentJsonPointer.pop();
      blank(state);
      if (state.currentChar === '}') {
        next(state, '}');
        return;
      }
      next(state, ',');
      blank(state);
    }
  }
  throw newError('Bad object', state);
};

const array = (state) => {
  if (state.result) {
    return;
  }

  let arrayIndex = -1;

  if (state.currentChar === '[') {
    next(state, '[');
    blank(state);
    if (state.currentChar === ']') {
      next(state, ']');
      state.currentJsonPointer.pop();
      return;
    }

    while (state.currentChar) {
      arrayIndex++;
      addSegment('' + arrayIndex, state);

      if (state.result) {
        return;
      }

      value(state);

      if (state.result) {
        return;
      }

      blank(state);
      state.currentJsonPointer.pop();
      if (state.currentChar === ']') {
        next(state, ']');
        return;
      }
      next(state, ',');
      blank(state);
    }
  }
  throw newError('Bad array', state);
};

const value = (state) => {
  if (state.result) {
    return;
  }

  blank(state);
  switch (state.currentChar) {
    case '{':
      object(state);
      return;
    case '[':
      array(state);
      return;
    case '"':
      string(state);
      return;
    case '-':
      number(state);
      return;
    default:
      if (state.currentChar >= '0'
        && state.currentChar <= '9') {
        number(state);
      } else {
        word(state);
      }
  }
};

const parse = (state) => value(state);

module.exports = {
  getLineNumber (source, jsonPointer) {
    const state = {
      currentIndex: 0,
      currentChar: ' ',
      currentLine: 1,
      currentColumn: 1,
      targetJsonPointer: pointer.parse(jsonPointer),
      currentJsonPointer: [],
      result: null,
      text: source
    };

    if (_.isEmpty(state.targetJsonPointer) || jsonPointer === '/') {
      return { line: 1, column: 1 };
    }

    parse(state);
    return state.result;
  }
};
