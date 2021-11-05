import RJSON from '../src/ReadabjeJson';

/*
describe('stringify', () => {
  it('null', () => sameAsBuiltIn(null));
  it('number', () => sameAsBuiltIn(123));
  it('string', () => sameAsBuiltIn("abc '123' and \"456\""));
  it('object-empty', () => sameAsBuiltIn({}));
  it('array-empty', () => sameAsBuiltIn([]));
});
*/

// https://stackoverflow.com/a/43652073/838
describe('stack-overflow', () => {
  test('null', null)                               // null
  test('string', 'he said "hello"')                  // 'he said "hello"'
  test('number', 5)                                  // 5  
  test('array', [1,2,true,false])                   // [ 1, 2, true, false ]  
  test('object', {a:1, b:2})                         // { a: 1, b: 2 }
  test('obj in array', [{a:1},{b:2},{c:3}])                // [ { a: 1 }, { b: 2 }, { c: 3 } ]
  test('array in obj', {a:[1,2,3], c:[4,5,6]})             // { a: [ 1, 2, 3 ], c: [ 4, 5, 6 ] }
  test('undefined in obj', {a:undefined, b:2})                 // { b: 2 }
  test('undefined in arr', {[<any>undefined]: 1})                   // { undefined: 1 }
  test('mixed', [[["test","mike",4,["jake"]],3,4]]) // [ [ [ 'test', 'mike', 4, [ 'jake' ]

  // Multiple levels
  test('arr levels', [0, [1, [2, [3]]]]);
  test('obj levels', [0, {a: 0, b: [1, {a: 1, b:[2, null] }]}]);  
});

describe('perf', () => {
  const arr: number[] = [];
  const n = 100000;
  for(let i=0; i < n; i++) {
    arr.push(i);
  }
  it(`JSON`, () => expect(JSON.stringify(arr)).not.toEqual(""));
  //it(`reduce`, () => expect(RJSON.stringify(arr, undefined, undefined, false)).not.toEqual(""));
  it(`loop`, () => expect(RJSON.stringify(arr, undefined, undefined)).not.toEqual(""));
});

function test(testName: string, value: any, shape?: string) {
  const readableJson = RJSON.stringify(value);
  const newValue = JSON.parse(readableJson);

  it(`${testName}`, () => expect(newValue).toEqual(value));

  // TODO: remove
  // If shape isn't specified, use the default
  shape = shape || JSON.stringify(value, null, 2);

  it(`shape ${testName}`, () => expect(readableJson).toEqual(shape) );
}
