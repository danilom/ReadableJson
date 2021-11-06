import RJSON from '../src/ReadabjeJson';

// describe('stringify', () => {
//   it('null', () => sameAsBuiltIn(null));
//   it('number', () => sameAsBuiltIn(123));
//   it('string', () => sameAsBuiltIn("abc '123' and \"456\""));
//   it('object-empty', () => sameAsBuiltIn({}));
//   it('array-empty', () => sameAsBuiltIn([]));
// });

// https://stackoverflow.com/a/43652073/838
describe('stack-overflow cases', () => {
  test('null', null)
  test('string', 'he said "hello"')
  test('number', 5)

  test('array',
    [1,2,true,false],
    `[1, 2, true, false]`) // Inline
  test('object', 
    {a:1, b:2},
    `{"a":1, "b":2}`) // Inline
  test('obj in array', 
    [{a:1},{b:2},{c:3}],
    `[{"a":1}, {"b":2}, {"c":3}]`) // Inline

  test('array in obj', 
    {a:[1,2,3], c:[4,5,6]},
    `{"a":[1, 2, 3], "c":[4, 5, 6]}`) // Inline
    
  test('undefined as value', 
    {a:undefined, b:2},
    `{"b":2}`); // Inline, eliminated extra key

  test('undefined as key', 
    {undefined: 1},
    '{"undefined":1}')
  test('null as key', 
    {null: 1},
    `{"null":1}`)
  test('mixed', 
    [[["test","mike",4,["jake"]],3,4]],
`[
  [
    ["test", "mike", 4, ["jake"]],
    3,
    4
  ]
]`)
    

  // edge case, round-tripping doesn't work
  test('undefined (null) in arr', [1, undefined], "", false)    // [ 1, null]; converts to "null"

  // // Multiple levels
  test('arr levels', [0, [1, [2, [3]]]]);
  test('obj levels', [0, {a: 0, b: [1, {a: 1, b:[2, null] }]}]);  
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

// describe('perf', () => {
//   const arr: number[] = [];
//   const n = 100000;
//   for(let i=0; i < n; i++) {
//     arr.push(i);
//   }
//   it(`JSON`, () => expect(JSON.stringify(arr)).not.toEqual(""));
//   //it(`reduce`, () => expect(RJSON.stringify(arr, undefined, undefined, false)).not.toEqual(""));
//   it(`loop`, () => expect(RJSON.stringify(arr, undefined, undefined)).not.toEqual(""));
// });

function test(testName: string, value: any, 
  shape?: string, doEqual = true) 
{
  const readableJson = RJSON.stringify(value);
  let newValue = "";
  try 
  {
    newValue = JSON.parse(readableJson);
  } 
  catch (SyntaxError) {
    // debug here
    RJSON.stringify(value);
    fail(readableJson);
    return;
  }

  if (doEqual) {
    it(`${testName}`, () => expect(newValue).toEqual(value));
  }

  //console.log(readableJson);

  // TODO: remove
  // If shape isn't specified, use the default
  if (shape) {
    it(`shape ${testName}`, () => expect(readableJson).toEqual(shape) );  
  }
}
