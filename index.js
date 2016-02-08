module.exports = (function () {
  'use strict';

  // This is a function that can find the line in an input JSON string that corresponds to the
  // given JSON pointer.
  // More information about JSON pointers at: http://tools.ietf.org/html/draft-ietf-appsawg-json-pointer-08

  var _ = require('lodash-node');
  var pointer = require('json-pointer');

  var escapee = {
      '"': '"',
      '\\': '\\',
      '/': '/',
      b: '\b',
      f: '\f',
      n: '\n',
      r: '\r',
      t: '\t'
    },

    addSegment,
    error,
    parse,
    value,
    object,
    array,
    number,
    word,
    string,
    blank,
    next;

  parse = function (state) {
    value(state);
  };

  addSegment = function (segment, state) {
    state.currentJsonPointer.push(segment);
    if (_.isEqual(state.currentJsonPointer, state.targetJsonPointer)) {
      state.result = { line: state.currentLine, column: state.currentColumn };
    }
  };

  error = function (message) {
    throw {
      name: 'SyntaxError',
      message: message,
      at: currentIndex,
      text: text
    };
  };

  next = function (state, expected) {
    if (expected && expected !== state.currentChar) {
      error("Expected '" + expected + "' instead of '" + state.currentChar + "'");
    }

    state.currentChar = state.text.charAt(state.currentIndex);
    state.currentIndex++;
    state.currentColumn++;
    return state.currentChar;
  };

  number = function (state) {
    var number,
      string = '';

    if (state.currentChar === '-') {
      string = '-';
      next(state, '-');
    }
    while (state.currentChar >= '0' && state.currentChar <= '9') {
      string += state.currentChar;
      next(state);
    }
    if (state.currentChar === '.') {
      string += '.';
      while (next(state) && state.currentChar >= '0' && state.currentChar <= '9') {
        string += state.currentChar;
      }
    }
    if (state.currentChar === 'e' || state.currentChar === 'E') {
      string += state.currentChar;
      next(state);
      if (state.currentChar === '-' || state.currentChar === '+') {
        string += state.currentChar;
        next(state);
      }
      while (state.currentChar >= '0' && state.currentChar <= '9') {
        string += state.currentChar;
        next(state);
      }
    }
    number = +string;
    if (!isFinite(number)) {
      error('Bad number');
    }
  };

  string = function (state) {

    // Parse a string value.

    var hex,
      i,
      string = '',
      uffff;

    // When parsing for string values, we must look for " and \ characters.

    if (state.currentChar === '"') {
      while (next(state)) {
        if (state.currentChar === '"') {
          next(state);
          return string;
        }
        if (state.currentChar === '\\') {
          next(state);
          if (state.currentChar === 'u') {
            uffff = 0;
            for (i = 0; i < 4; i += 1) {
              hex = parseInt(next(state), 16);
              if (!isFinite(hex)) {
                break;
              }
              uffff = uffff * 16 + hex;
            }
            string += String.fromCharCode(uffff);
          } else if (typeof escapee[ state.currentChar ] === 'string') {
            string += escapee[ state.currentChar ];
          } else {
            break;
          }
        } else {
          string += state.currentChar;
        }
      }
    }
    error('Bad string');
  };

  blank = function (state) {
    while (state.currentChar && state.currentChar <= ' ') {
      if (state.currentChar === '\n') {
        state.currentLine++;
        state.currentColumn = 1;
      }
      next(state);
    }
  };

  word = function (state) {

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
    }
    error("Unexpected '" + state.currentChar + "'");
  };

  object = function (state) {
    if (state.result) {
      return;
    }

    var key,
      object = {};

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
        if (Object.hasOwnProperty.call(object, key)) {
          error('Duplicate key "' + key + '"');
        }
        object[ key ] = value(state);

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
    error('Bad object');
  };

  array = function (state) {
    if (state.result) {
      return;
    }

    var array = [],
      arrayIndex = -1;

    if (state.currentChar === '[') {
      next(state, '[');
      blank(state);
      if (state.currentChar === ']') {
        next(state, ']');
        current.pop();
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
    error('Bad array');
  };

  value = function (state) {
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
        return;
    }
  };

  return {
    getLineNumber: function (source, jsonPointer) {
      var state = {
        currentIndex: 0,
        currentChar: ' ',
        currentLine: 1,
        currentColumn: 1,
        targetJsonPointer: pointer.parse(jsonPointer),
        currentJsonPointer: [],
        result: null,
        text: source,
      };

      if (_.isEmpty(state.targetJsonPointer) || '/' === jsonPointer) {
        return { line: 1, column: 1 };
      }

      parse(state);
      return state.result;
    }
  };
}());
