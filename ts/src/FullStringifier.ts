namespace RJSON {
    const NEWLINE = "\n";

    export class FullStringifier {
        private _inline: InlineStringifier;

        constructor(private opt: IFullOptions) {
            this._inline = new InlineStringifier(opt);
        }

        stringify(data: any, inlinePrefixLen: number, fullIndentLen: number, aligner?: IAligner): string {
            if (data === null || typeof (data) !== "object") {
                // Primitive
                return JSON.stringify(data);
            }

            // Object or array

            var inlineJson = this._inline.tryStringify(data, inlinePrefixLen);
            if (inlineJson != null) {
                return inlineJson;
            }

            // Couldn't inline, use the full-length method
            return this.stringifyFull(data, fullIndentLen)
        }

        private stringifyFull(data: any, indentLen: number): string {
            if (data === null || typeof (data) !== "object") {
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
            for (var kvi of kvInfo.sortedKVs) {
                if (first) { first = false; }
                else { str += ","; } // followed by \n, no extra space needed

                str += NEWLINE + keyIndent;

                // Insert spaces for key alignment
                let keyJson = kvi.keyJson;
                if (keyJson.length < kvInfo.keyAlignLen) {
                    keyJson += " ".repeat(kvInfo.keyAlignLen - keyJson.length);
                }
                str += keyJson + ': '; // extra space for readability
                str += this.stringify(kvi.v,
                    (keyIndentLen + keyJson.length + 2),
                    keyIndentLen,
                    data);
            }
            str += NEWLINE + " ".repeat(indentLen) + "}";

            return str;
        }
        private stringifyFullArray(data: any, indentLen: number): string {
            const vIndentLen = indentLen + this.opt.spaceLen;
            const vIndent = " ".repeat(vIndentLen);

            let str = "[";
            let first = true;
            for (var v of data) {
                if (first) { first = false; }
                else { str += ","; } // followed by \n, no extra space needed

                str += NEWLINE + vIndent;
                str += this.stringify(v, vIndentLen, vIndentLen);
            }
            str += NEWLINE + " ".repeat(indentLen) + "]";

            return str;
        }

        private getSortedKVs(data: any) {
            const rv = {
                // Common width to align keys.
                // Maximum of key JSON representations, excluding those over opt.maxKeyAlignLen
                keyAlignLen: 0,
                sortedKVs: <KVItem[]>[]
            };

            const sortedKeys = Object.keys(data);
            // TODO: have customizable sorting based on options
            // JS objects have a stable order of keys (according to complex rules)
            // so sorting should be seen as optional.
            // sortedKeys.sort();

            for (const key of sortedKeys) {
                const v = data[key];
                if (v === undefined) { continue; } // skip undefined items

                var keyJson = JSON.stringify("" + key); // keys are always strings
                var kvItem: KVItem = { key: key, keyJson: keyJson, v: v };
                if (keyJson.length <= this.opt.maxKeyAlignLen
                    && keyJson.length > rv.keyAlignLen) {
                    rv.keyAlignLen = keyJson.length;
                }
                rv.sortedKVs.push(kvItem);
            }

            return rv;
        }

    }
}