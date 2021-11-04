
type ReplacerT = (this: any, key: string, value: any) => any | (number | string)[] | null;

export default class readabjeJson {

  static stringify(value: any, replacer?: ReplacerT, space?: string | number): string {
    return JSON.stringify(value, replacer, space);
  }
}

// TODO: circular references

// Based on:
// https://stackoverflow.com/a/43652073/838
function stringifyJSON(data: any): string | undefined {
  if (data === undefined)
    return undefined
  else if (data === null)
    return 'null'
  /*
  else if (data.constructor === String)
    return '"' + data.replace(/"/g, '\\"') + '"'
  else if (data.constructor === Number)
    return String(data)
  else if (data.constructor === Boolean)
    return data ? 'true' : 'false'
  */
  else if (data.constructor === Array)
    return '[ ' + data.reduce((acc, v) => {
      if (v === undefined)
        return [...acc, 'null']
      else
        return [...acc, stringifyJSON(v)]
    }, []).join(', ') + ' ]'
  else if (data.constructor === Object)
    return '{ ' + Object.keys(data).reduce((acc: any, k: any) => {
      if (data[k] === undefined)
        return acc
      else
        return [...acc, stringifyJSON(k) + ':' + stringifyJSON(data[k])]
    }, []).join(', ') + ' }'
  else
    return JSON.stringify(data);
    //return '{}'
}

