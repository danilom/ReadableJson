
type ReplacerT = (this: any, key: string, value: any) => any | (number | string)[] | null;

export default class readabjeJson {

  static stringify(value: any, replacer?: ReplacerT, space?: string | number): string {
    return JSON.stringify(value, replacer, space);
  }

}
