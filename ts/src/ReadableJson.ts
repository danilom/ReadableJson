// "export namespace RJSON" was learing to RJSON not being recognized in other .ts files

declare const console: any;

namespace RJSON {
    export type IOptions = Partial<IFullOptions>;

    export interface IFullOptions {
        /**
         * Length of the space used for indent. Default 2.
         */
        spaceLen: number;
        /**
         * Maximum length of an object key for which it's still aligned. Default 16.
         * @example
         * {
         *   "aKey"         : 1,
         *   "bKeyBitLonger": 2,    // both are <16 in length, and aligned
         *   "tooLongNotAligned": 3 // NOT aligned, key is 17 chars
         * }
         */
        maxKeyAlignLen: number;
        /**
         * Maximum depth of objects to inline. Default 2.
         * @example
         * [1, 2]      // inlined, depth 1
         * [1, [2, 3]] // inlined, depth 2
         * [           // NOT inlined, depth 3 > maxInlineDepth
         *   [1, [2, 3]] 
         * ]
         */
        maxInlineDepth: number;
        /**
         * Maximum lenght of the line when inlining objects. Default 100
         * Only applies to arrays and objects, not to primitives like long strings.
         * @example
         * // Assume maxInlineLen = 10
         * {
         *   "a":[1], // inlined, length 10, it fits
         *   "b":[    // NOT inlined, length of '  "b": [1, 2]' would be 13 if inlined
         *     1,
         *     2
         *   ]
         * }
         */
        maxInlineLen: number;

        inlineArray_spaceAfterComma: boolean;
        inlineObject_spaceAfterComma: boolean;

        inlineObject_alignValues: boolean;
    }
    function fillOptionsCore(newOpt: IOptions): IFullOptions {
        return {
            spaceLen: val(newOpt.spaceLen, 2),
            maxKeyAlignLen: val(newOpt.maxKeyAlignLen, 16),
            maxInlineDepth: val(newOpt.maxInlineDepth, 2),
            maxInlineLen: val(newOpt.maxInlineLen, 100),
            inlineArray_spaceAfterComma: val(newOpt.inlineArray_spaceAfterComma, true),
            inlineObject_spaceAfterComma: val(newOpt.inlineObject_spaceAfterComma, true),
            inlineObject_alignValues: val(newOpt.inlineObject_alignValues, true),
        };
    }
    function val<T>(v: T | undefined, defaultV: T): T {
        return (v === null || v === undefined) ? defaultV : v;
    }

    function fillOptions(spaceOrOpt?: IOptions | number | null): IFullOptions {
        var newOpt: IOptions = {};
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
        return typeof (obj) === 'function' ||
            typeof (obj) === 'string' ||
            typeof (obj) === 'number';
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
    export function stringify(value: any, replacer?: (this: any, key: string, value: any) => any, options?: IOptions): string
    /**
     * Converts a JavaScript value to a JavaScript Object Notation (JSON) string.
     * @param value A JavaScript value, usually an object or array, to be converted.
     * @param replacer An array of strings and numbers that acts as an approved list for selecting the object properties that will be stringified.
     * @param options Options to customize JSON output. 
     */
    export function stringify(value: any, replacer?: (number | string)[] | null, options?: IOptions): string

    /**
     * Converts a JavaScript value to a JavaScript Object Notation (JSON) string.
     * @param value A JavaScript value, usually an object or array, to be converted.
     * @param options Options to customize JSON output. 
     */
    export function stringify(value: any, options?: IOptions): string

    // Full version
    export function stringify(value: any,
        replacerOrOptions?: ReplacerT | IOptions,
        spaceOrOptions?: IOptions | number): string 
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
        var sfier = new FullStringifier(opt);
        var root = new JsonObj(value);
        sfier.stringify(root, 0, 0);
        return <string>root.vJson;
    }

    // test
    // TODO: rename
    // export function test_canInlineByLeafDepth(data: any, maxDepth: number): boolean {
    //   return Stringifier.isLeafDepthLEQ(data, maxDepth);
    // };

    export function stringifyAndLog(value: any,
        replacerOrOptions?: ReplacerT | IOptions,
        spaceOrOptions?: IOptions | number): void {
        const str = stringify(value, <any>replacerOrOptions, <any>spaceOrOptions);
        console.log(str);
    }

    export class JsonObj {
        v: any;
        vJson?: string | null; // might not be set

        keyJsons?: string[]; // optional, for dict only
        keyAlignLen?: number; // optional

        items?: JsonObj[];

        constructor(v: any) {
            this.v = v;
        }

    }
}

