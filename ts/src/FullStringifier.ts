namespace RJSON {
    const NEWLINE = "\n";

    export class FullStringifier {
        private _inline: InlineStringifier;
        //private _aligned: AlignedStringifier;

        constructor(private opt: IFullOptions) {
            this._inline = new InlineStringifier(opt);
        }

        stringify(obj: JsonObj, inlinePrefixLen: number, fullIndentLen: number): void {
            if (obj.vJson !== undefined) {
                return;
            }
            
            if (obj.v === null || typeof (obj.v) !== "object") {
                // Primitive
                obj.vJson = JSON.stringify(obj.v);
                return;
            }

            // Object or array
            if (this._inline.tryStringify(obj, inlinePrefixLen)) {
                return;
            }

            // Couldn't inline, use the full-length method
            return this.stringifyFull(obj, fullIndentLen)
        }

        private stringifyFull(obj: JsonObj, indentLen: number): void {
            if (obj.v === null || typeof (obj.v) !== "object") {
                // Primitive, always inline
                obj.vJson = JSON.stringify(obj.v);
                return;
            }
            if (Array.isArray(obj.v)) {
                // Array, similar to objects
                this.stringifyFullArray(obj, indentLen);
                return;
            }

            // Object: {"a": 1, b: "2"}
            fillSortedKeysAndItems(obj, this.opt);

            // Key alignment
            const keyIndentLen = indentLen + this.opt.spaceLen;
            const keyIndent = " ".repeat(keyIndentLen);

            let str = "{";
            for(var i=0; i < (<JsonObj[]>obj.items).length; i++) 
            {
                if (i != 0) { str += ","; } // followed by \n, no extra space needed

                str += NEWLINE + keyIndent;

                // Insert spaces for key alignment
                let keyJson = (<string[]>obj.keyJsons)[i];
                if (keyJson.length < <number>(obj.keyAlignLen)) {
                    keyJson += " ".repeat(<number>(obj.keyAlignLen) - keyJson.length);
                }
                str += keyJson + ': '; // extra space for readability

                const item = (<JsonObj[]>obj.items)[i]; 
                this.stringify(item,
                    (keyIndentLen + keyJson.length + 2),
                    keyIndentLen);
                str += item.vJson;
            }
            str += NEWLINE + " ".repeat(indentLen) + "}";

            obj.vJson = str;
        }
        private stringifyFullArray(obj: JsonObj, indentLen: number): void {
            fillArrayItems(obj);

            const vIndentLen = indentLen + this.opt.spaceLen;
            const vIndent = " ".repeat(vIndentLen);

            let str = "[";
            for(var i=0; i < (<JsonObj[]>obj.items).length; i++) {
                if (i !== 0) { str += ","; } // followed by \n, no extra space needed

                str += NEWLINE + vIndent;
                const item = (<JsonObj[]>obj.items)[i]; 
                this.stringify(item, vIndentLen, vIndentLen);
                str += item.vJson;
            }
            str += NEWLINE + " ".repeat(indentLen) + "]";

            obj.vJson = str;
        }
    }

    export function fillArrayItems(obj: JsonObj): void {
        // Skip if already filled
        if (obj.items !== undefined) { return; }

        // Fill array values
        obj.items = [];
        for (const cv of obj.v) {
            obj.items.push(new JsonObj(cv));
        }
    }

    export function fillSortedKeysAndItems(obj: JsonObj, opt: IFullOptions): void {
        // Skip if already filled
        if (obj.items !== undefined) { return; }

        // Fill sorted keys
        const sortedKeys = Object.keys(obj.v);
        
        // TODO: have customizable sorting based on options
        // JS objects have a stable order of keys (according to complex rules)
        // so sorting should be seen as optional.
        // sortedKeys.sort();

        obj.keyJsons = [];
        obj.keyAlignLen = 0;
        obj.items = [];

        for (const key of sortedKeys) {
            const v = obj.v[key];
            if (v === undefined) { continue; } // skip undefined items

            var keyJson = JSON.stringify("" + key); // keys are always strings
            var vObj = new JsonObj(v);
            if (keyJson.length <= opt.maxKeyAlignLen
                && keyJson.length > obj.keyAlignLen) 
            {
                obj.keyAlignLen = keyJson.length;
            }
            obj.keyJsons.push(keyJson);
            obj.items.push(vObj);
        }
    }

}