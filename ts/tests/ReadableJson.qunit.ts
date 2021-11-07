////<reference path="../src/ReadableJson.ts" />
////import * as RJSON from './../src/ReadableJson'

const opt: RJSON.IOptions = { maxInlineLen: 40 };

// https://stackoverflow.com/a/43652073/838
QUnit.module('basics', () => {
  jtest('null', opt, null)
  //test('string', 'he said "hello"') // test fn uses string as a shape
  jtest('number', opt, 5)
  jtest('object-empty', opt, {})
  jtest('array-empty', opt, [])
  jtest('undefined as value', opt, {a:undefined, b:2}, `{"b":2}`)
  jtest('undefined key', opt, {undefined: 1}, `{"undefined":1}`)
  jtest('null key', opt, {null: 1}, `{"null":1}`)
  jtest('numeric key', opt, {123: 1}, `{"123":1}`)

  // edge case, round-tripping doesn't work
  QUnit.test('undefined is null in array', (assert) => {
    let rvalue = RJSON.stringify([1, undefined]);
    assert.equal(rvalue, "[1, null]");
  });
  
  // Multiple levels
  jtest('arr complex', opt, [[["test", "mike", 4,["jake"]],3,4]]);
  jtest('arr levels', opt, [0, [1, [2, [3]]]]);
  jtest('arr/obj levels', opt, [0, {a: 0, b: [1, {a: 1, b:[2, null]}]}]);
});

QUnit.module('inlining', () => {
  jtest('arr inline', opt, `[1, 2, true, false]`)
  jtest('obj inline', opt,   `{"a":1, "b":2}`)
  jtest('obj in array', opt, `[{"a":1}, {"b":2}, {"c":3}]`)
  jtest('obj with arr inline', opt, `{"a":[1, 2, 3], "b":[4, 5, 6]}`)
  jtest('obj too long to inline', opt, `
{
  "a": [1, 2, 3],
  "b": [4, 5, 6],
  "c": [7, 8, 9]
}`)

  jtest('max-inline-len', { maxInlineLen: 10 }, `
{
  "a": [1],
  "b": [
         1,
         2
       ]
}`)

});

QUnit.module("aligment", () => {
  jtest('keys', opt, `
{
  "123": [1, 2, 3],
  "a"  : 1,
  "thisOneIsWayTooLong": 2
}`)
})

QUnit.module('perf', () => {
  //return; // disable

  const arr: any[] = [];
  const n = 100000;
  for(let i=0; i < n; i++) {
    arr.push({ a: 1, b: [1,2,3] });
  }
  QUnit.test(`JSON`, (assert) => { 
    assert.expect(0); 
    JSON.stringify(arr); 
  });
  QUnit.test(`RJSON`, (assert) => { 
    assert.expect(0);
    RJSON.stringify(arr); 
  });

  logToConsole("perf", RJSON.stringify(arr));
});

function logToConsole(testName: string, json: string) {
    // Print to console
    console.log(`=== ${testName}`);
    console.log(json.length < 1000 ?
      json : json.substr(0, 1000) + "\n...");
}

function jtest(testName: string, opt: RJSON.IOptions, value: any, shape?: string): void
function jtest(testName: string, opt: RJSON.IOptions, shape: string): void
function jtest(testName: string, opt: RJSON.IOptions, valueOrShape: any, shape?: string): void {
  QUnit.test(testName, (assert) => {
    var value: any;
    if (typeof(valueOrShape) == 'string' && !shape) {
      shape = valueOrShape;
      try {
        value = JSON.parse(shape);
      }
      catch (e: any) {
        console.error(shape);
        assert.false(true, `test error, invalid shape arg: ${"" + e}`);
      }
    }
    else {
      shape = shape || "";
      value = valueOrShape;
    }
    // For convenience
    shape = shape.trim();

    const readableJson: string = RJSON.stringify(value, opt);

    logToConsole(testName, readableJson);

    // Test if we produce the same object
    let newValue = "";
    try 
    {
      newValue = JSON.parse(readableJson);
    } 
    catch (e: any) {
      //RJSON.stringify(value, opt);
      debugger; // debug here, see why RJSON.stringify fails
      assert.false(true, `invalid json produced: ${"" + e}`);
    }

    // Test if object is same as expected
    assert.equal(JSON.stringify(newValue), JSON.stringify(value));

    //console.log(`${testName}: shape:*${shape}*`);

    // Test if shape is the same as expected
    if (shape) {
      assert.equal(readableJson, shape); 
    }
  });
}

