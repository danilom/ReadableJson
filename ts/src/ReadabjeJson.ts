
type ReplacerT = (this: any, key: string, value: any) => any | (number | string)[] | null;

export default class readabjeJson {
  static stringify(value: any, replacer?: ReplacerT, space?: string | number): string {
    space = spaceStr(space);
    const opt: IOptions = {
      space: space,
      newline: space.length == 0 ? "" : "\n"
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
  if (data === undefined) {
    return <any>undefined;
  }
  if (data === null) {
    return 'null';
  }
  if (Array.isArray(data)) {
    return stringifyArray(data, level, opt);
  }
  if (typeof(data) === "object") {
    return stringifyObject(data, level, opt);
  }
  return JSON.stringify(data);
}

function stringifyArray(data: any, level: number, opt: IOptions) : string {
  const indent = opt.space.repeat(level);
  return '[' + opt.newline 
    + indent + opt.space
    + data.reduce((acc: any, v: any) => {
        if (v === undefined)
          return [...acc, 'null']
        else
          return [...acc, stringify(v, level + 1, opt)]
      }, [])
    .join(',' + opt.newline + indent + opt.space) + opt.newline
    + indent + ']';
}

function stringifyObject(data: any, level: number, opt: IOptions) {
  const indent = opt.space.repeat(level);
  return '{' + opt.newline 
    + indent + opt.space
    + Object.keys(data).reduce((acc: any, k: any) => {
        if (data[k] === undefined)
          return acc;
        else
          return [...acc, stringify(k, level + 1, opt) + ': '
                        + stringify(data[k], level + 1, opt)];
      }, [])
    .join(',' + opt.newline + indent + opt.space) + opt.newline 
    + indent + '}';
}