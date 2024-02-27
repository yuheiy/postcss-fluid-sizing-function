import assert from 'node:assert';
import plugin from 'postcss-fluid-sizing-function';
plugin();

assert.ok(plugin.postcss, 'should have "postcss flag"');
assert.equal(typeof plugin, 'function', 'should return a function');
