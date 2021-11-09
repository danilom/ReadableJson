namespace RJSON {
    export class InlineStringifier {
        constructor(private opt: IFullOptions) {
        }

        tryStringify(data: any, inlinePrefixLen: number): string | null {
            // Try to stringify inline
            let inlineJson: string | null = null;
            if (!this.isLeafDepthLEQ(data, this.opt.maxInlineDepth)) {
                return null;
            }
            const maxInlineLen = this.opt.maxInlineLen - inlinePrefixLen;
            return this.tryStringifyInline(data, maxInlineLen);
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

        private tryStringifyInline(data: any, maxInlineLen: number): string | null {
            if (data === null || typeof (data) !== "object") {
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
            for (const key of Object.keys(data)) {
                const v = data[key];
                // Special case, skip inline
                if (v === undefined) { continue; }

                // Add comma
                if (first) { first = false; }
                else { str += this.opt.inlineObject_spaceAfterComma ? ", " : ","; }

                if (str.length > maxInlineLen) { return null; }

                const keyJson = JSON.stringify("" + key); // keys are always strings
                str += keyJson + ":"; // TODO: support adding extra space (configurable)

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
            for (const v of data) {
                if (first) { first = false; }
                else { str += this.opt.inlineArray_spaceAfterComma ? ", " : ","; }

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
    }
}