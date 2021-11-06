import * as RJSON from '../src/ReadabjeJson';

describe('align arrays', () => {

});


// https://stackoverflow.com/a/43652073/838
describe('primitives and basics', () => {
  test('null', null)
  //test('string', 'he said "hello"') // test fn uses string as a shape
  test('number', 5)
  test('object-empty', {})
  test('array-empty', [])
  test('undefined as value', {a:undefined, b:2})
  test('undefined as key', {undefined: 1})
  test('null as key', {null: 1})

  // edge case, round-tripping doesn't work
  it('undefined (null) in array', () => {
    let rvalue = RJSON.stringify([1, undefined]);
    expect(rvalue).toBe("[1, null]");
  });

  // Multiple levels
  test('arr complex', [[["test", "mike", 4,["jake"]],3,4]]);
  test('arr levels', [0, [1, [2, [3]]]]);
  test('arr/obj levels', [0, {a: 0, b: [1, {a: 1, b:[2, null]}]}]);
});

var gOptions: RJSON.IOptions;

describe('simple shapes', () => {
  gOptions = RJSON.fillOptions({
    maxInlineLen: 40, // make testing easier
  });

  test('arr inline',  `[1, 2, true, false]`)
  test('obj inline',    `{"a":1, "b":2}`)
  test('obj in array',  `[{"a":1}, {"b":2}, {"c":3}]`)
  test('obj with arr inline',  `{"a":[1, 2, 3], "b":[4, 5, 6]}`)
  test('obj too long to inline',  `
{
  "a":[1, 2, 3], 
  "b":[4, 5, 6], 
  "c":[7, 8, 9]
}`)

  test('align keys', `
{
  "x"      : 1,
  "thisOneIsWayTooLong": 2
  "longKey": 3,
        123: "numeric key right aligned",
}
  `)
});

describe('method overloads', () => {
  // TODO
});

// describe('canInlineByLeafDepth', () => {
//   const ci = RJSON.test_canInlineByLeafDepth;
//   const maxDepth = 2;

//   it('primitive', () => expect(ci("foo", maxDepth)).toBeTruthy());
//   it('array', () => expect(ci([0,1,2], maxDepth)).toBeTruthy());

//   it('array 1 deep', () => expect(ci([0,[1,2]], maxDepth)).toBeTruthy());
//   it('array 2 deep', () => expect(ci([0,[1,[2,3]]], maxDepth)).toBeFalsy());
//   it('array 3 deep', () => expect(ci([0,[1,[2,[3,4]]]], maxDepth)).toBeFalsy());

//   it('obj 1 deep', () => expect(ci({a: 1, b: 2}, maxDepth)).toBeTruthy());
//   it('obj 2 deep', () => expect(ci({a: 1, b: { c: 3, d: 4}}, maxDepth)).toBeTruthy());
//   it('obj 3 deep', () => expect(ci({a: 1, b: { c: 3, d: { e: 1, f: 2}}}, maxDepth)).toBeFalsy());

//   it('mixed 2 deep', () => expect(ci({arr: [1, 2], obj: { a: 1, b:2 }}, maxDepth)).toBeTruthy());
//   it('mixed 3 deep', () => expect(ci({arr: [1, { a: 1 }], obj: { a: 1, b:2 }}, maxDepth)).toBeFalsy());
// });

describe('perf', () => {
  return; // disable

  const arr: any[] = [];
  const n = 100000;
  for(let i=0; i < n; i++) {
    arr.push({ a: 1, b: [1,2,3] });
  }
  it(`JSON`, () => expect(JSON.stringify(arr)).not.toEqual(""));
  it(`RJSON`, () => expect(RJSON.stringify(arr)).not.toEqual(""));

  console.log(RJSON.stringify(arr).substr(0, 1000) + "\n...");
});

function test(testName: string, valueOrShape: any) {
  it(testName, () => {
    var shape: string;
    var value: any;
    if (typeof(value) == 'string') {
      shape = value.trim();
      try {
        value = JSON.parse(shape);
      }
      catch (e) {
        fail(`test error, invalid shape:\n${e}\n${shape}`);
      }
    }
    else {
      shape = "";
      value = valueOrShape;
    }

    // Test if we produce the same object
    const readableJson = RJSON.stringify(value, gOptions);
    let newValue = "";
    try 
    {
      newValue = JSON.parse(readableJson);
    } 
    catch (e) {
      // debug here
      RJSON.stringify(value, gOptions);
      fail(`invalid json:\n${e}\n${shape}`);
    }

    // Test if object is same as expected
    expect(newValue).toEqual(value);

    // Test if shape is the same as expected
    if (shape) {
      expect(readableJson).toEqual(shape); 
    }
  });
}

