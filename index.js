module.exports = (function () {
  'use strict';

  // This is a function that can find the line in an input JSON string that corresponds to the
  // given JSON pointer.
  // More information about JSON pointers at: http://tools.ietf.org/html/draft-ietf-appsawg-json-pointer-08

  var _ = require('lodash-node');
  var pointer = require('json-pointer');

  var currentIndex,     // The index of the current character
    currentChar,        // The current character
    line,               // The current line number
    column,             // The current line number
    target,             // The JSON pointer to search for (as an array)
    current,            // The JSON pointer of the current location
    result,
    escapee = {
      '"': '"',
      '\\': '\\',
      '/': '/',
      b: '\b',
      f: '\f',
      n: '\n',
      r: '\r',
      t: '\t'
    },
    text,

  // Methods
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

  parse = function () {
    value();
  };

  addSegment = function (segment) {
    current.push(segment);
    if (_.isEqual(current, target)) {
      result = { line: line, column: column };
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

  next = function (expected) {
    if (expected && expected !== currentChar) {
      error("Expected '" + expected + "' instead of '" + currentChar + "'");
    }

    currentChar = text.charAt(currentIndex);
    currentIndex++;
    column++;
    return currentChar;
  };

  number = function () {
    var number,
      string = '';

    if (currentChar === '-') {
      string = '-';
      next('-');
    }
    while (currentChar >= '0' && currentChar <= '9') {
      string += currentChar;
      next();
    }
    if (currentChar === '.') {
      string += '.';
      while (next() && currentChar >= '0' && currentChar <= '9') {
        string += currentChar;
      }
    }
    if (currentChar === 'e' || currentChar === 'E') {
      string += currentChar;
      next();
      if (currentChar === '-' || currentChar === '+') {
        string += currentChar;
        next();
      }
      while (currentChar >= '0' && currentChar <= '9') {
        string += currentChar;
        next();
      }
    }
    number = +string;
    if (!isFinite(number)) {
      error('Bad number');
    }
  };

  string = function () {

    // Parse a string value.

    var hex,
      i,
      string = '',
      uffff;

    // When parsing for string values, we must look for " and \ characters.

    if (currentChar === '"') {
      while (next()) {
        if (currentChar === '"') {
          next();
          return string;
        }
        if (currentChar === '\\') {
          next();
          if (currentChar === 'u') {
            uffff = 0;
            for (i = 0; i < 4; i += 1) {
              hex = parseInt(next(), 16);
              if (!isFinite(hex)) {
                break;
              }
              uffff = uffff * 16 + hex;
            }
            string += String.fromCharCode(uffff);
          } else if (typeof escapee[ currentChar ] === 'string') {
            string += escapee[ currentChar ];
          } else {
            break;
          }
        } else {
          string += currentChar;
        }
      }
    }
    error('Bad string');
  };

  blank = function () {
    while (currentChar && currentChar <= ' ') {
      if (currentChar === '\n') {
        line++;
        column = 1;
      }
      next();
    }
  };

  word = function () {

    switch (currentChar) {
      case 't':
        next('t');
        next('r');
        next('u');
        next('e');
        return;
      case 'f':
        next('f');
        next('a');
        next('l');
        next('s');
        next('e');
        return;
      case 'n':
        next('n');
        next('u');
        next('l');
        next('l');
        return;
    }
    error("Unexpected '" + currentChar + "'");
  };

  object = function () {
    if (result) {
      return;
    }

    var key,
      object = {};

    if (currentChar === '{') {
      next('{');
      blank();
      if (currentChar === '}') {
        next('}');
        return;
      }
      while (currentChar) {
        key = string();
        addSegment(key);

        if (result) {
          return;
        }

        blank();
        next(':');
        if (Object.hasOwnProperty.call(object, key)) {
          error('Duplicate key "' + key + '"');
        }
        object[ key ] = value();

        if (result) {
          return;
        }

        current.pop();
        blank();
        if (currentChar === '}') {
          next('}');
          return;
        }
        next(',');
        blank();
      }
    }
    error('Bad object');
  };

  array = function () {
    if (result) {
      return;
    }

    var array = [],
      arrayIndex = -1;

    if (currentChar === '[') {
      next('[');
      blank();
      if (currentChar === ']') {
        next(']');
        current.pop();
        return;
      }

      while (currentChar) {
        arrayIndex++;
        addSegment('' + arrayIndex);

        if (result) {
          return;
        }

        value();
        
        if (result) {
          return;
        }

        blank();
        current.pop();
        if (currentChar === ']') {
          next(']');
          return;
        }
        next(',');
        blank();
      }
    }
    error('Bad array');
  };

  value = function () {
    if (result) {
      return;
    }

    blank();
    switch (currentChar) {
      case '{':
        object();
        return;
      case '[':
        array();
        return;
      case '"':
        string();
        return;
      case '-':
        number();
        return;
      default:
        if (currentChar >= '0' && currentChar <= '9') {
          number();
        } else {
          word();
        }
        return;
    }
  };

  return {
    getLineNumber: function (source, jsonPointer) {
      target = pointer.parse(jsonPointer);
      line = 1;
      column = 1;
      result = null;
      if (_.isEmpty(target) || '/' === jsonPointer) {
        return { line: line, column: column };
      }

      text = source;
      currentIndex = 0;
      currentChar = ' ';
      current = [];
      parse();
      return result;
    }
  };
}());
