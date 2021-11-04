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
  test(null)                               // null
  test('he said "hello"')                  // 'he said "hello"'
  test(5)                                  // 5  
  test([1,2,true,false])                   // [ 1, 2, true, false ]  
  test({a:1, b:2})                         // { a: 1, b: 2 }
  test([{a:1},{b:2},{c:3}])                // [ { a: 1 }, { b: 2 }, { c: 3 } ]
  test({a:[1,2,3], c:[4,5,6]})             // { a: [ 1, 2, 3 ], c: [ 4, 5, 6 ] }
  test({a:undefined, b:2})                 // { b: 2 }
  test({[<any>undefined]: 1})                   // { undefined: 1 }
  test([[["test","mike",4,["jake"]],3,4]]) // [ [ [ 'test', 'mike', 4, [ 'jake' ]

  // Multiple levels
  test([0, [1, [2, [3]]]]);
  test([0, {a: 0, b: [1, {a: 1, b:[2, null] }]}]);  
});

function test(value: any, shape?: string) {
  const testName = JSON.stringify(value).substr(0, 20);
  const readableJson = RJSON.stringify(value);
  const newValue = JSON.parse(readableJson);

  it(`equal ${testName}`, () => expect(newValue).toEqual(value));

  // TODO: remove
  // If shape isn't specified, use the default
  shape = shape || JSON.stringify(value, null, 2);

  it(`shape ${testName}`, () => expect(readableJson).toEqual(shape) );
}
