// TODO: improve, autocomplete would be nice
const RJSON = (<any>window).RJSON; 

function add(a: number, b: number) {
  return a + b;
}

QUnit.module('add', () => {
  QUnit.test('two numbers', (assert) => {
    assert.equal(add(1, 2), 3);
  });
  QUnit.test('parse', (assert) => {
    assert.equal(RJSON.stringify(["hello"]), '["hello"]');
  });


});
