import RJSON from '../src/ReadabjeJson';

describe('stringify', function() {
  it('null', () => sameAsBuiltIn(null));
  it('number', () => sameAsBuiltIn(123));
  it('string', () => sameAsBuiltIn("abc '123' and \"456\""));
  it('object-empty', () => sameAsBuiltIn({}));
  it('array-empty', () => sameAsBuiltIn([]));
});

function sameAsBuiltIn(value: any) {
  const readableJson = RJSON.stringify(value);
  const newValue = JSON.parse(readableJson);

  expect(newValue).toEqual(value);
}