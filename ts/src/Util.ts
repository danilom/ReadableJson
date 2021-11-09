namespace RJSON {
    export namespace Util {
        /**
         * True if an item is an object (but not an array)
         * @param v 
         * @returns 
         */
         export function isObject(v: any) { 
            // oddly, typeof(null) === 'object', so must exclude it
            return v !== null && typeof(v) === 'object' && !Array.isArray(v); 
        }
        /**
         * True if an item is an object (but not an array)
         * @param v 
         * @returns 
         */
         export function isObjectOrArray(v: any) { 
            return v !== null && typeof(v) === 'object';
        }
    
    }
}
