# jp2p (JSON pointer to position)

[![Dependency Status](https://img.shields.io/depfu/dependencies/github/quilicicf/jp2p)](https://depfu.com/repos/github/quilicicf/jp2p)
[![Known Vulnerabilities](https://snyk.io/test/github/quilicicf/jp2p/badge.svg)](https://snyk.io/test/github/quilicicf/jp2p)

A utility method to get the line & column to which a JSON pointer points in a given JSON string.

More information about JSON pointers [in the RFC6901](http://tools.ietf.org/html/draft-ietf-appsawg-json-pointer-09);

## How to use

The module only contains one method, use it like this:

```js
const { getLineNumber } = require('jp2p');
const jsonString = '{\n  "toto": "tata"\n}';

console.log(getLineNumber(jsonString, '/toto'));
```

In this case it will output `{ line: 2, column: 10 }`. The line in the jsonString at which the element at JSON pointer `/toto` is defined.

## Contributing

You think it lacks a feature ? Spot a bug ? Insufficient documentation ?
Any contribution is welcome, below are a few contribution guidelines but first get a look at [these general guidelines](https://github.com/atom/atom/blob/master/CONTRIBUTING.md#styleguides):

1. Git
    1. Fork the plugin repository.
    1. Hack on a separate topic branch created from the latest `master`.
    1. Commit and push the topic branch.
    1. Make a pull request.
1. Tests
    1. You can run tests with `npm test`
    1. All tests should pass on any pull request
    1. Please add a test for non-regression on your dev
1. Other
    1. Code should pass linting by eslint (run `npm run lint` to test this).
    1. Let me know by mail before contributing (don't want to waste your time on something already being done)
    1. You don't know how or don't have the time to contribute ? Don't hesitate to share your ideas in issues


Thank you for helping out!
