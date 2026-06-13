const test = require('node:test');
const assert = require('node:assert/strict');
const { greet } = require('../src/index.js');

test('greet returns a friendly message', () => {
  assert.equal(greet('world'), 'Hello, world!');
});
