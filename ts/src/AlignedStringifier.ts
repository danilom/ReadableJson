namespace RJSON {

    enum DataType {
        Array,
        Object,
    }

    export class AlignedStringifier {

        constructor(private opt: IFullOptions, private _inline: InlineStringifier) {

        }

        tryStringify(data: any, inlinePrefixLen: number): string | null {
            const aligner = getAligner(data);
            if (aligner == null) { return null; }

            return null;
        }



    }

    function getAligner(parent: any): IAligner | null {
        const children = getChildren(parent);

        // Check if all children are objects
        if (areAllDataTypes(children, DataType.Object)) {
            // Check object eligibility
            const aligner = new AlignerOfObjects(children);
            return aligner.canAlign() ? aligner : null;
        }

        // Check if all children are arrays
        if (areAllDataTypes(children, DataType.Array)) {
            // Check array eligibility
            // TODO
            return null;
        }

        return null;
    }

    function areAllDataTypes(values: any[], type: DataType): boolean {
        for(const v in values) {
            if (Array.isArray(v)) {
                if (type != DataType.Array) { return false; }
            }
            else if (Util.isObject(v)) {
                if (type != DataType.Object) { return false; }
            }
            else {
                return false;
            }
        }
        return true;
    }

    function getChildren(fullObjOrArray: any): any[] {
        if (Array.isArray(fullObjOrArray)) {
            return <[]>fullObjOrArray;
        }
        if (Util.isObject(fullObjOrArray)) {
            return Object.keys(fullObjOrArray).map((k) => fullObjOrArray(k));
        }
        throw new Error("Type has no children:" + fullObjOrArray);
    }

    interface IAligner {

    }
    // 4 cases (we don't know children before inspecting):
    // - parent is full object, children are objects
    // - parent is full object, children are arrays
    // - parent is array, children are objects
    // - parent is array, children are arrays

    // Null if not possible to get

    class AlignerOfArrays implements IAligner {
        constructor(arrays: [][]) {
        }
    }

    interface IAlignData {
        width: number;
    }

    const ALIGN_MAX_OBJ_KEYS = 6;
    class AlignerOfObjects implements IAligner {
        private _commonKeys: Set<string> | null = null;

        constructor(private objects: {}[]) {
            this.extractCommonKeys();
        }

        // tryAlign(data: any, inlinePrefixLen: number): String | null {

        // }

        private extractCommonKeys() {
            // assert(_commonKeys === null);
            for(const obj of this.objects) {
                const objKeys = Object.keys(obj);

                // Quck and dirty heuristic based on the number of keys
                if (objKeys.length > ALIGN_MAX_OBJ_KEYS) {
                    return;
                }

                if (this._commonKeys === null) {
                    // First object
                    this._commonKeys = new Set(objKeys);
                }
                else {
                    // Other objects, trim down the common keys
                    for(const ck of this._commonKeys.keys()) {
                        if (!objKeys.includes(ck)) {
                            this._commonKeys.delete(ck);
                            if (this._commonKeys.size == 0) {
                                // Done, exit quickly
                                return;
                            }
                        }
                    }

                }
            }
        }

        

        canAlign(): boolean {
            if (!this._commonKeys || this._commonKeys.size === 0) {
                return false;
            }

            // Check if items can be inlined by depth... if not, no point doing it
            // TODO: no idea if this improves or hurts performance
            for(const obj of this.objects) {
                // TODO: get leaf from opt.leafDepth 
                // const canInline = Stringifier.isLeafDepthLEQ(obj, 2);
                // if (!canInline) { return false; }
            }

            return true;
        }
    }

}
