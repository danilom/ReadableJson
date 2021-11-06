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
  var sfier = new Stringifier(opt);
  return sfier.stringifyCore(value, 0);
}

// test
export function test_canInlineByLeafDepth(data: any, maxDepth: number): boolean {
  var sfier = new Stringifier(fillOptions());
  return sfier.canInlineByLeafDepth(data, maxDepth);
};

interface KVItem {
  key: any;
  keyJson: string;
  v: any;
  //vJson?: string;
}

// class StringBuilder {
//   private list: string[] = [];
//   length = 0;

//   append(s: string) {
//     this.list.push(s);
//     this.length += s.length;
//   }
//   toString() {
//     // Save what we have for faster perf later
//     var str = this.list.join("");
//     this.list = [str];
//     this.length = str.length;
//     return str;
//   }
// }

class Stringifier {
  // private sb = new StringBuilder();

  constructor(private opt: IOptions) {
  }

  stringifyCore(data: any, indentLen: number): string {
    if (data === null || typeof(data) !== "object") {
      // Primitive
      return JSON.stringify(data);
    }
  
    // Object or array
    
    // Try to stringify inline
    let inlineJson: string | null = null;
    if (this.canInlineByLeafDepth(data, this.opt.maxInlineDepth)) {
      inlineJson = this.tryStringifyInline(data, this.opt.maxInlineLen - indentLen);
    }
    if (inlineJson != null) {
      return inlineJson;
    }
    
    // Couldn't inline, use the full-length method
    return this.stringifyFull(data, indentLen)
  }
  
  private stringifyFull(data: any, indentLen: number): string {
    if (data === null || typeof(data) !== "object") {
      // Primitive, always inline
      return JSON.stringify(data);
    }
    if (Array.isArray(data)) {
      // Array, similar to objects
      return this.stringifyFullArray(data, indentLen);
    }
  
    // Object: {"a": 1, b: "2"}
  
    // Key alignment
    const keyIndentLen = indentLen + this.opt.spaceLen;
    const keyIndent = " ".repeat(keyIndentLen);
    const kvInfo = this.getSortedKVs(data);
  
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
      str += this.stringifyCore(kvi.v, (keyIndentLen + keyJson.length + 2));
    }
    str += "\n" + " ".repeat(indentLen) + "}";
  
    return str;
  }
  private stringifyFullArray(data: any, indentLen: number): string {
    const vIndentLen = indentLen + this.opt.spaceLen;
    const vIndent = " ".repeat(vIndentLen);
  
    let str = "[";
    let first = true;
    for(var v of data) {
      if (first) { first = false; }
      else { str += ","; }
  
      str += this.opt.newline + vIndent;
      str += this.stringifyCore(v, vIndentLen);
    }
    str += this.opt.newline + " ".repeat(indentLen) + "]";
  
    return str;
  }
  
  private tryStringifyInline(data: any, maxInlineLen: number): string | null {
    if (data === null || typeof(data) !== "object") {
      // Primitive, always inline
      return JSON.stringify(data);
    }
    if (Array.isArray(data)) {
      // Array, similar to objects
      return this.tryStringifyInlineArray(data, maxInlineLen);
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
  
      const keyJson = this.tryStringifyInline(key, maxInlineLen - str.length);
      if (keyJson === null) { return null; }
      str += keyJson + ":"; // Single space for compactness
  
      if (str.length > maxInlineLen) { return null; }
  
      const vJson = this.tryStringifyInline(v, maxInlineLen - str.length);
      if (vJson === null) { return null; }
      str += vJson;
    }
    str += "}";
    if (str.length > maxInlineLen) { return null; }
    return str;
  }
  private tryStringifyInlineArray(data: any, maxInlineLen: number): string | null {
    // [1, 2, 3]
    let str = '['; 
    let first = true;
    for(const v of data) {
      if (first) { first = false; }
      else { str += ", "; } // Extra space for compactness. TODO: make configurable
  
      if (str.length > maxInlineLen) { return null; }
  
      if (v === undefined) { str += 'null'; }
      else {
        const vJson = this.tryStringifyInline(v, maxInlineLen - str.length);
        if (vJson === null) { return null; }
        str += vJson;
      }
    }
    str += "]";
    if (str.length > maxInlineLen) { return null; }
    return str;
  }
  
  canInlineByLeafDepth(data: any, maxDepth: number): boolean {
    if (maxDepth < 0) { return false; }
  
    if (data !== null && typeof(data) === "object") {
      // Arrays/objects: compute depth for each child, add 1
      if (Array.isArray(data)) 
      {
        for(let item of data) {
          if (!this.canInlineByLeafDepth(item, maxDepth - 1)) { return false; }
        }
      }
      else 
      {
        for (let key of Object.keys(data)) {
          if (!this.canInlineByLeafDepth(data[key], maxDepth - 1)) { return false; }
        }
      }
      // Can inline all items, OK
      return true;
    }
    // Primitives: can always inline
    return true;
  }
  
  private getSortedKVs(data: any) {
    const rv = {
      // Common width to align keys.
      // Maximum of key JSON representations, excluding those over opt.maxKeyAlignLen
      keyAlignLen: 0,
      sortedKVs: <KVItem[]>[]
    };
  
    // TODO: have customizable sorting based on options
    const sortedKeys = Object.keys(data).sort();
  
    for(const key of sortedKeys) {
      const v = data[key];
      if (v === undefined) { continue; } // skip undefined items
      
      var keyJson = JSON.stringify(key);
      var kvItem: KVItem = { key: key, keyJson: keyJson, v: v };
      if (keyJson.length <= this.opt.maxKeyAlignLen
          && keyJson.length > rv.keyAlignLen)
      {
        rv.keyAlignLen = keyJson.length;
      }
      rv.sortedKVs.push(kvItem);
    }
  
    return rv;
  }
  
}

