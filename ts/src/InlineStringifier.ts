namespace RJSON {
    export class InlineStringifier {
        constructor(private opt: IFullOptions) {
        }

        tryStringify(obj: JsonObj, inlinePrefixLen: number): boolean {
            // Try to stringify inline
            if (!this.isLeafDepthLEQ(obj.v, this.opt.maxInlineDepth)) {
                return false;
            }
            const maxInlineLen = this.opt.maxInlineLen - inlinePrefixLen;
            return this.tryStringifyInline(obj, maxInlineLen);
        }

        /**
         * Check whether leaf depth is less than or equal to a maxDepth value
         * @param data 
         * @param maxDepth 
         * @returns 
         */
        isLeafDepthLEQ(data: any, maxDepth: number): boolean {
            if (maxDepth < 0) { return false; }

            if (data !== null && typeof (data) === "object") {
                // Arrays/objects: compute depth for each child, add 1
                if (Array.isArray(data)) {
                    for (let item of data) {
                        if (!this.isLeafDepthLEQ(item, maxDepth - 1)) { return false; }
                    }
                }
                else {
                    for (let key of Object.keys(data)) {
                        if (!this.isLeafDepthLEQ(data[key], maxDepth - 1)) { return false; }
                    }
                }
                // Can inline all items, OK
                return true;
            }
            // Primitives: can always inline
            return true;
        }

        private tryStringifyInline(obj: JsonObj, maxInlineLen: number): boolean {
            if (obj.v === null || typeof(obj.v) !== "object") {
                // Primitive, always inline
                obj.vJson = JSON.stringify(obj.v); 
                return true;
            }

            if (Array.isArray(obj.v)) {
                // Array, similar to objects
                return this.tryStringifyInlineArray(obj, maxInlineLen);
            }

            // Object
            // {"a":1, "b":2}
            fillSortedKeysAndItems(obj, this.opt);

            let str = '{';
            for(var i=0; i < (<JsonObj[]>obj.items).length; i++) 
            {
                // Add comma
                if (i !== 0) { str += this.opt.inlineObject_spaceAfterComma ? ", " : ","; }

                if (str.length > maxInlineLen) {
                    return false; 
                }

                const keyJson = (<string[]>obj.keyJsons)[i];

                str += keyJson + ":"; // TODO: support adding extra space (configurable)
                if (str.length > maxInlineLen) { return false; }

                const item = (<JsonObj[]>obj.items)[i];
                if (this.tryStringifyInline(item, maxInlineLen - str.length)) { 
                    str += item.vJson;
                }
                else { 
                    return false; 
                }
            }
            str += "}";
            if (str.length > maxInlineLen) { return false; }

            obj.vJson = str;
            return true;
        }
        private tryStringifyInlineArray(obj: JsonObj, maxInlineLen: number): boolean {
            fillArrayItems(obj);

            // [1, 2, 3]
            let str = '[';
            for(var i=0; i < (<JsonObj[]>obj.items).length; i++) 
            {
                if (i !== 0) { str += this.opt.inlineArray_spaceAfterComma ? ", " : ","; }
                if (str.length > maxInlineLen) { return false; }

                const item = (<JsonObj[]>obj.items)[i];
                if (item.v === undefined) { // special case
                    str += 'null';
                }
                else {
                    if (this.tryStringifyInline(item, maxInlineLen - str.length)) {
                        str += item.vJson;
                    }
                    else {
                        return false;
                    }
                }
            }
            str += "]";
            if (str.length > maxInlineLen) { return false; }

            obj.vJson = str;
            return true;
        }
    }
}