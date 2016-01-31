module.exports = (function () {
  'use strict';

  // This is a function that can find the line in an input JSON string that corresponds to the
  // given JSON pointer.
  // More information about JSON pointers at: http://tools.ietf.org/html/draft-ietf-appsawg-json-pointer-08

  var _ = require('lodash-node');
  var pointer = require('json-pointer');
  var at,        // The index of the current character
  ch,            // The current character
  line,          // The current line number
  target,        // The JSON pointer to search for (as an array)
  current,       // The JSON pointer of the current location
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

  addSegment = function (segment) {
    current.push(segment);
    if (_.isEqual(current, target)) {
      result = line;
    }
  },

  error = function (m) {

    // Call error when something is wrong.

    throw {
      name: 'SyntaxError',
      message: m,
      at: at,
      text: text
    };
  },

  next = function (c) {

    // If a c parameter is provided, verify that it matches the current character.

    if (c && c !== ch) {
      error("Expected '" + c + "' instead of '" + ch + "'");
    }

    // Get the next character. When there are no more characters,
    // return the empty string.

    ch = text.charAt(at);
    at ++;
    return ch;
  },

  number = function () {

    // Parse a number value.

    var number,
    string = '';

    if (ch === '-') {
      string = '-';
      next('-');
    }
    while (ch >= '0' && ch <= '9') {
      string += ch;
      next();
    }
    if (ch === '.') {
      string += '.';
      while (next() && ch >= '0' && ch <= '9') {
        string += ch;
      }
    }
    if (ch === 'e' || ch === 'E') {
      string += ch;
      next();
      if (ch === '-' || ch === '+') {
        string += ch;
        next();
      }
      while (ch >= '0' && ch <= '9') {
        string += ch;
        next();
      }
    }
    number = +string;
    if (!isFinite(number)) {
      error('Bad number');
    } else {
      return;
    }
  },

  string = function () {

    // Parse a string value.

    var hex,
    i,
    string = '',
    uffff;

    // When parsing for string values, we must look for " and \ characters.

    if (ch === '"') {
      while (next()) {
        if (ch === '"') {
          next();
          return string;
        }
        if (ch === '\\') {
          next();
          if (ch === 'u') {
            uffff = 0;
            for (i = 0; i < 4; i += 1) {
              hex = parseInt(next(), 16);
              if (!isFinite(hex)) {
                break;
              }
              uffff = uffff * 16 + hex;
            }
            string += String.fromCharCode(uffff);
          } else if (typeof escapee[ch] === 'string') {
            string += escapee[ch];
          } else {
            break;
          }
        } else {
          string += ch;
        }
      }
    }
    error('Bad string');
  },

  white = function () {

    // Skip whitespace.

    while (ch && ch <= ' ') {
      if (ch === '\n') {
        line++;
      }
      next();
    }
  },

  word = function () {

    // true, false, or null.

    switch (ch) {
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
    error("Unexpected '" + ch + "'");
  },

  value,  // Place holder for the value function.

  array = function () {

    // Parse an array value.

    var array = [],
      arrayIndex = -1;

    if (ch === '[') {
      next('[');
      white();
      if (ch === ']') {
        next(']');
        current.pop();
        return;
      }

      while (ch) {
        arrayIndex++;
        addSegment('' + arrayIndex);
        value();
        white();
        current.pop();
        if (ch === ']') {
          next(']');
          return;
        }
        next(',');
        white();
      }
    }
    error('Bad array');
  },

  object = function () {

    // Parse an object value.

    var key,
    object = {};

    if (ch === '{') {
      next('{');
      white();
      if (ch === '}') {
        next('}');
        return;
      }
      while (ch) {
        key = string();
        addSegment(key);
        white();
        next(':');
        if (Object.hasOwnProperty.call(object, key)) {
          error('Duplicate key "' + key + '"');
        }
        object[key] = value();
        current.pop();
        white();
        if (ch === '}') {
          next('}');
          return;
        }
        next(',');
        white();
      }
    }
    error('Bad object');
  };

  value = function () {

    // Parse a JSON value. It could be an object, an array, a string, a number,
    // or a word.
    white();
    switch (ch) {
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
        if (ch >= '0' && ch <= '9') {
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
      if (_.isEmpty(target)) {
        return 1;
      }

      text = source;
      at = 0;
      ch = ' ';
      line = 1;
      current = [];
      result = 1;
      value();
      white();
      if (ch) {
        error('Syntax error');
      }

      return result;
    }
  };
}());
