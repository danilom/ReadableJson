import * as RJSON from '../src/ReadabjeJson';

// workaround
function fail(error?: string): never {
  throw new Error(error);
}

describe('align arrays', () => {

});


// https://stackoverflow.com/a/43652073/838
describe('primitives and basics', () => {
  const opt: RJSON.IOptions = {};

  test('null', opt, null)
  //test('string', 'he said "hello"') // test fn uses string as a shape
  test('number', opt, 5)
  test('object-empty', opt, {})
  test('array-empty', opt, [])
  test('undefined as value', opt, {a:undefined, b:2}, `{"b":2}`)
  test('undefined key', opt, {undefined: 1}, `{"undefined":1}`)
  test('null key', opt, {null: 1}, `{"null":1}`)
  test('numeric key', opt, {123: 1}, `{"123":1}`)

  // edge case, round-tripping doesn't work
  it('undefined is null in array', () => {
    let rvalue = RJSON.stringify([1, undefined]);
    expect(rvalue).toBe("[1, null]");
  });
  
  // Multiple levels
  test('arr complex', opt, [[["test", "mike", 4,["jake"]],3,4]]);
  test('arr levels', opt, [0, [1, [2, [3]]]]);
  test('arr/obj levels', opt, [0, {a: 0, b: [1, {a: 1, b:[2, null]}]}]);
});

describe('simple shapes', () => {
  const opt: RJSON.IOptions = { maxInlineLen: 40 };

  test('arr inline', opt, `[1, 2, true, false]`)
  test('obj inline', opt,   `{"a":1, "b":2}`)
  test('obj in array', opt, `[{"a":1}, {"b":2}, {"c":3}]`)
  test('obj with arr inline', opt, `{"a":[1, 2, 3], "b":[4, 5, 6]}`)
  test('obj too long to inline', opt, `
{
  "a": [1, 2, 3],
  "b": [4, 5, 6],
  "c": [7, 8, 9]
}`)

  test('align keys', opt, `
{
  "123": [1, 2, 3],
  "a"  : 1,
  "thisOneIsWayTooLong": 2
}
`)

  test('max-inline-len', { maxInlineLen: 10 }, `
{
  "a": [1],
  "b": [
         1,
         2
       ]
}`)

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

function test(testName: string, opt: RJSON.IOptions, value: any, shape?: string): void
function test(testName: string, opt: RJSON.IOptions, shape: string): void
function test(testName: string, opt: RJSON.IOptions, valueOrShape: any, shape?: string): void {
  it(testName, () => {
    var value: any;
    if (typeof(valueOrShape) == 'string' && !shape) {
      shape = valueOrShape;
      try {
        value = JSON.parse(shape);
      }
      catch (e: any) {
        fail(`test error, invalid shape:\n${"" + e}\n${shape}`);
      }
    }
    else {
      shape = shape || "";
      value = valueOrShape;
    }
    // For convenience
    shape = shape.trim();

    // Test if we produce the same object
    const readableJson = RJSON.stringify(value, opt);
    let newValue = "";
    try 
    {
      newValue = JSON.parse(readableJson);
    } 
    catch (e: any) {
      // debug here
      RJSON.stringify(value, opt);
      fail(`invalid json:\n${"" + e}\n${shape}`);
    }

    // Test if object is same as expected
    expect(newValue).toEqual(value);

    //console.log(`${testName}: shape:*${shape}*`);

    // Test if shape is the same as expected
    if (shape) {

      expect(readableJson).toEqual(shape); 
    }
  });
}

