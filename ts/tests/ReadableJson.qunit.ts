////<reference path="../src/ReadableJson.ts" />
////import * as RJSON from './../src/ReadableJson'

const OPT: RJSON.IOptions = { maxInlineLen: 40 };

// https://stackoverflow.com/a/43652073/838
QUnit.module('basics', () => {
  jtest('null', OPT, null)
  //test('string', 'he said "hello"') // test fn uses string as a shape
  jtest('number', OPT, 5)
  jtest('object-empty', OPT, {})
  jtest('array-empty', OPT, [])
  jtest('undefined as value', OPT, {a:undefined, b:2}, `{"b":2}`)
  jtest('undefined key', OPT, {undefined: 1}, `{"undefined":1}`)
  jtest('null key', OPT, {null: 1}, `{"null":1}`)
  jtest('numeric key', OPT, {123: 1}, `{"123":1}`)

  // edge case, round-tripping doesn't work
  QUnit.test('undefined is null in array', (assert) => {
    let rvalue = RJSON.stringify([1, undefined]);
    assert.equal(rvalue, "[1, null]");
  });
  
  // Multiple levels
  jtest('arr complex', OPT, `
    [
      [
        ["test", "mike", 4, ["jake"]],
        3,
        4
      ]
    ]`);
  
  jtest('arr levels', OPT, [0, [1, [2, [3]]]]);
  jtest('arr/obj levels', OPT, [0, {a: 0, b: [1, {a: 1, b:[2, null]}]}]);
});

QUnit.module('inlining', () => {
  jtest('arr inline', OPT, `[1, 2, true, false]`)
  jtest('obj inline', OPT,   `{"a":1, "b":2}`)
  jtest('obj in array', OPT, `[{"a":1}, {"b":2}, {"c":3}]`)
  jtest('obj with arr inline', OPT, `{"a":[1, 2, 3], "b":[4, 5, 6]}`)
  jtest('obj too long to inline', OPT, `
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

  jtest('align bug in obj', OPT, `
    {
      "longKeyName": [
        "Schwab:PnwEl3b9+rGt0FTm5OozTg",
        "Schwab:5Qb5YCsHKcZPRMgfnCkP0w"
      ],
      "key"       : 2,
      "another"   : 3
    }`);

  jtest('align bug in arr', OPT, `
    [
      [
        "Schwab:PnwEl3b9+rGt0FTm5OozTg",
        "Schwab:5Qb5YCsHKcZPRMgfnCkP0w"
      ],
    ]
  `);

});

QUnit.module("aligment", () => {
  jtest('keys', OPT, `
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
    arr.push({ 
      a: "a".repeat(i % 5), 
      bb: [10 - (i * 3) % 10, i % 1000] 
    });
  }
  QUnit.test(`JSON`, (assert) => { 
    assert.expect(0); 
    JSON.stringify(arr); 
  });
  QUnit.test(`RJSON`, (assert) => { 
    assert.expect(0);
    RJSON.stringify(arr); 
  });
  QUnit.test(`print RJSON`, (assert) => { 
    assert.expect(0);
    logToConsole("perf", RJSON.stringify(arr));
  });

});

function logToConsole(testName: string, json: string) {
    // Print to console
    console.log(`=== ${testName}`);
    console.log(json.length < 1000 ?
      json : json.substr(0, 1000) + "\n...");
}

// Remove shape indent, e.g. 
//     [
//       [1,2,3]
//     ]
function trimShapeIndent(shape: string): string {
  // Remove initial newline
  if (shape.startsWith("\n")) {
    shape = shape.substr(1);
  }

  // Count the number of spaces on the first line
  let numSpaces = 0;
  while(numSpaces < shape.length && shape[numSpaces] === " ") { 
    numSpaces++; 
  }
  if (numSpaces == 0) { return shape.trim(); }

  //console.log("numSpaces", numSpaces)

  // Remove the spaces
  const lines = shape.split("\n");
  const re = new RegExp("^" + " ".repeat(numSpaces))
  const newShape = lines.map((line) => line.replace(re, "")).join("\n");

  return newShape.trim();
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
    shape = trimShapeIndent(shape);

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

