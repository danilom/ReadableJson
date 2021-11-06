export interface IOptions {
  spaceLen: number;
  newline: string;
  maxKeyAlignLen: number;
  maxInlineDepth: number;
  maxInlineLen: number;
}
function fillOptionsCore(newOpt: Partial<IOptions>) : IOptions {
  return {
    spaceLen:       newOpt.spaceLen || 2,
    newline:        newOpt.newline || "\n",
    maxKeyAlignLen: newOpt.maxKeyAlignLen || 16,
    maxInlineDepth: newOpt.maxInlineDepth || 2,
    maxInlineLen:   newOpt.maxInlineLen || 100,
  };
}

export function fillOptions(spaceOrOpt?: Partial<IOptions> | number | null ) : IOptions {
  var newOpt: Partial<IOptions> = {};
  if (typeof (spaceOrOpt) === 'number') {
    newOpt.spaceLen = spaceOrOpt;
  }
  else if (spaceOrOpt !== null && spaceOrOpt !== undefined) {
    newOpt = spaceOrOpt;
  }
  return fillOptionsCore(newOpt);
}

// Compatibility with JSON.stringify
function isReplacerType(obj: any): boolean {
  return typeof(obj) === 'function' || 
         typeof(obj) === 'string' || 
         typeof(obj) === 'number';
}

type ReplacerT = ((this: any, key: string, value: any) => any) | (number | string)[] | null;

// Overloads compatible with JSON.stringify
/**
* Converts a JavaScript value to a JavaScript Object Notation (JSON) string.
* @param value A JavaScript value, usually an object or array, to be converted.
* @param replacer A function that transforms the results.
* @param space Amount of indentation to add to returned JSON.
*/
export function stringify(value: any, replacer?: (this: any, key: string, value: any) => any, space?: number): string 
/**
 * Converts a JavaScript value to a JavaScript Object Notation (JSON) string.
 * @param value A JavaScript value, usually an object or array, to be converted.
 * @param replacer An array of strings and numbers that acts as an approved list for selecting the object properties that will be stringified.
 * @param space Amount of indentation to add to returned JSON.
 */
export function stringify(value: any, replacer?: (number | string)[] | null, space?: number): string 

// Variants with options instead of space
/**
* Converts a JavaScript value to a JavaScript Object Notation (JSON) string.
* @param value A JavaScript value, usually an object or array, to be converted.
* @param replacer A function that transforms the results.
* @param space Amount of indentation to add to resulting JSON
*/
export function stringify(value: any, replacer?: (this: any, key: string, value: any) => any, options?: Partial<IOptions>): string 
/**
 * Converts a JavaScript value to a JavaScript Object Notation (JSON) string.
 * @param value A JavaScript value, usually an object or array, to be converted.
 * @param replacer An array of strings and numbers that acts as an approved list for selecting the object properties that will be stringified.
 * @param options Options to customize JSON output. 
 */
export function stringify(value: any, replacer?: (number | string)[] | null, options?: Partial<IOptions>): string 

/**
 * Converts a JavaScript value to a JavaScript Object Notation (JSON) string.
 * @param value A JavaScript value, usually an object or array, to be converted.
 * @param options Options to customize JSON output. 
 */
export function stringify(value: any, options?: Partial<IOptions>): string 

// Full version
export function stringify(value: any, 
  replacerOrOptions?: ReplacerT | Partial<IOptions>, 
  spaceOrOptions?: Partial<IOptions> | number): string 
{
  let replacer = null;
  if (isReplacerType(replacerOrOptions)) {
    replacer = <any>replacerOrOptions;
  }
  else {
    spaceOrOptions = <any>replacerOrOptions; 
  }

  let opt = fillOptions(spaceOrOptions);

  // With no spaces, built-in stringifier is faster
  if (opt.spaceLen == 0) {
    return JSON.stringify(value, replacer, 0);
  }

  // TODO: replacer support
  //return stringifyV1(value, 0, opt);
  return stringifyCore(value, 0, opt);
}

// test
export var test_canInlineByLeafDepth = canInlineByLeafDepth;

interface KVItem {
  key: any;
  keyJson: string;
  v: any;
  //vJson?: string;
}

function stringifyCore(data: any, indentLen: number, opt: IOptions): string {
  if (data === null || typeof(data) !== "object") {
    // Primitive
    return JSON.stringify(data);
  }

  // Object or array
  
  // Try to stringify inline
  let inlineJson: string | null = null;
  if (canInlineByLeafDepth(data, opt.maxInlineDepth)) {
    inlineJson = tryStringifyInline(data, opt.maxInlineLen - indentLen);
  }
  if (inlineJson != null) {
    return inlineJson;
  }
  
  // Couldn't inline, use the full-length method
  return stringifyFull(data, indentLen, opt)
}

function stringifyFull(data: any, indentLen: number, opt: IOptions): string {
  if (data === null || typeof(data) !== "object") {
    // Primitive, always inline
    return JSON.stringify(data);
  }
  if (Array.isArray(data)) {
    // Array, similar to objects
    return stringifyFullArray(data, indentLen, opt);
  }

  // Object: {"a": 1, b: "2"}

  // Key alignment
  const keyIndentLen = indentLen + opt.spaceLen;
  const keyIndent = " ".repeat(keyIndentLen);
  const kvInfo = getSortedKVs(data, opt);

  let str = "{";
  let first = true;
  for(var kvi of kvInfo.sortedKVs) {
    if (first) { first = false; }
    else { str += ","; }

    str += "\n" + keyIndent;
    
    // Insert spaces for key alignment
    let keyJson = kvi.keyJson;
    if (keyJson.length < kvInfo.keyAlignLen) {
      const pad = " ".repeat(kvInfo.keyAlignLen - keyJson.length);
      if (typeof(kvi.key) === 'number') { keyJson = pad + keyJson; } // right-align numbers
      else { keyJson += pad; }
    }
    str += keyJson + ': ';
    str += stringifyCore(kvi.v, (keyIndentLen + keyJson.length + 2), opt);
  }
  str += "\n" + " ".repeat(indentLen) + "}";

  return str;
}
function stringifyFullArray(data: any, indentLen: number, opt: IOptions): string {
  const vIndentLen = indentLen + opt.spaceLen;
  const vIndent = " ".repeat(vIndentLen);

  let str = "[";
  let first = true;
  for(var v of data) {
    if (first) { first = false; }
    else { str += ","; }

    str += opt.newline + vIndent;
    str += stringifyCore(v, vIndentLen, opt);
  }
  str += opt.newline + " ".repeat(indentLen) + "]";

  return str;
}

function tryStringifyInline(data: any, maxInlineLen: number): string | null {
  if (data === null || typeof(data) !== "object") {
    // Primitive, always inline
    return JSON.stringify(data);
  }
  if (Array.isArray(data)) {
    // Array, similar to objects
    return tryStringifyInlineArray(data, maxInlineLen);
  }

  // Object
  // {"a":1, "b":2}
  let str = '{'; 
  let first = true;
  for(const key of Object.keys(data)) {
    const v = data[key];
    if (v === undefined) { continue; }

    if (first) { first = false; }
    else { str += ", "; } // Extra space for compactness. TODO: make configurable

    if (str.length > maxInlineLen) { return null; }

    const keyJson = tryStringifyInline(key, maxInlineLen - str.length);
    if (keyJson === null) { return null; }
    str += keyJson + ":"; // Single space for compactness

    if (str.length > maxInlineLen) { return null; }

    const vJson = tryStringifyInline(v, maxInlineLen - str.length);
    if (vJson === null) { return null; }
    str += vJson;
  }
  str += "}";
  if (str.length > maxInlineLen) { return null; }
  return str;
}
function tryStringifyInlineArray(data: any, maxInlineLen: number): string | null {
  // [1, 2, 3]
  let str = '['; 
  let first = true;
  for(const v of data) {
    if (first) { first = false; }
    else { str += ", "; } // Extra space for compactness. TODO: make configurable

    if (str.length > maxInlineLen) { return null; }

    if (v === undefined) { str += 'null'; }
    else {
      const vJson = tryStringifyInline(v, maxInlineLen - str.length);
      if (vJson === null) { return null; }
      str += vJson;
    }
  }
  str += "]";
  if (str.length > maxInlineLen) { return null; }
  return str;
}

function canInlineByLeafDepth(data: any, maxDepth: number): boolean {
  if (maxDepth < 0) { return false; }

  if (data !== null && typeof(data) === "object") {
    // Arrays/objects: compute depth for each child, add 1
    if (Array.isArray(data)) 
    {
      for(let item of data) {
        if (!canInlineByLeafDepth(item, maxDepth - 1)) { return false; }
      }
    }
    else 
    {
      for (let key of Object.keys(data)) {
        if (!canInlineByLeafDepth(data[key], maxDepth - 1)) { return false; }
      }
    }
    // Can inline all items, OK
    return true;
  }
  // Primitives: can always inline
  return true;
}


function getSortedKVs(data: any, opt: IOptions) {
  const rv = {
    // Common width to align keys.
    // Maximum of key JSON representations, excluding those over opt.maxKeyAlignLen
    keyAlignLen: 0,
    sortedKVs: <KVItem[]>[]
  };

  // TODO: have customizable sorting
  const sortedKeys = Object.keys(data).sort();

  for(const key of sortedKeys) {
    const v = data[key];
    if (v === undefined) { continue; } // skip undefined items
    
    var keyJson = JSON.stringify(key);
    var kvItem: KVItem = { key: key, keyJson: keyJson, v: v };
    if (keyJson.length <= opt.maxKeyAlignLen
        && keyJson.length > rv.keyAlignLen) 
    {
      rv.keyAlignLen = keyJson.length;
    }
    rv.sortedKVs.push(kvItem);
  }

  return rv;
}
