
type ReplacerT = (this: any, key: string, value: any) => any | (number | string)[] | null;

export default class readabjeJson {
  static stringify(value: any, replacer?: ReplacerT, space?: string | number): string {
    space = spaceStr(space);
    const opt: IOptions = {
      space: space,
      newline: space.length == 0 ? "" : "\n",
    }
    return stringify(value, 0, opt);
  }
}

function spaceStr(space?: string | number) : string {
  if (typeof(space) == "number") {
    space = " ".repeat(space);
  }
  else if (typeof(space) == "string") {
    space = space;
  }
  else {
    // Default is 2 spaces, unlike 0 in JSON.stringify
    space = "  ";
  }
  if (space.length > 10) { space.substr(0, 10); }
  return space;
}

interface IOptions {
  space: string;
  newline: string;
}

// TODO: circular references

// Based on:
// https://stackoverflow.com/a/43652073/838
function stringify(data: any, level: number, opt: IOptions): string {
  if (data !== null && typeof(data) === "object") {
    return stringifyObject(data, level, opt);
  }
  // Primitives
  return JSON.stringify(data);
}


function stringifyObject(data: any, level: number, opt: IOptions) {
  const indent = opt.space.repeat(level);
  const items: string[] = [];
  let [open, close] = ['{', '}']

  if (Array.isArray(data)) {
    [open, close] = ['[', ']'];
    for(const v of data) {
      if (v === undefined) { items.push('null'); }
      else { items.push(stringify(v, level + 1, opt)); }
    }
  }
  else {
    for(const key of Object.keys(data)) {
      const value = data[key]; 
      if (value !== undefined) { 
        items.push(stringify(key, level + 1, opt) + ': ' + stringify(value, level + 1, opt));
      }
    }
  }

  return open + opt.newline
              + indent + opt.space
              + items.join(',' + opt.newline + indent + opt.space) + opt.newline
              + indent + close;
}
