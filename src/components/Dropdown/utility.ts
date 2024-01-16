import type { RefCallback, MutableRefObject } from "react";

type Refs<T> = RefCallback<T | null> | MutableRefObject<T | null> | null;

const objCache: Record<string, DpNameProp> = {};

type DpNameProp = {
  /**
   * Component name identifier
   */
  "data-dp-name": string;

  /**
   * Optional arbitrary identifier. E.g. if an element is about
   * some specific db row id, we might put the id in here so tests
   * can target it.
   */
  "data-dp-ident"?: string;
};

export function notEmpty<TValue>(
  value: TValue | null | undefined
): value is TValue {
  return value !== null && value !== undefined;
}

/** Takes multiple ref like objects and merges them together for use as if a
 * single ref. Exists because popperjs uses `useState` instead of a `RefObject`
 * and both PopperJs and I need access to the refs, but I don't want to rely on
 * state update renders or having to use refs within my effect deps */
export function mergeRefs<T>(...refObjects: Array<Refs<T>>) {
  return (ref: T | null) => {
    for (const refObject of refObjects) {
      if (typeof refObject === "function") {
        refObject(ref);
      } else if (refObject !== null) {
        refObject.current = ref;
      }
    }
  };
}

export const dpNameProp = (
  name: string,
  ident?: [string, string]
): DpNameProp => {
  const identStr = ident ? `${ident[0]}=${ident[1]}` : "";
  const cacheKey = name + (identStr ? identStr : "");

  if (typeof objCache[cacheKey] !== "undefined") {
    return objCache[cacheKey];
  }

  const props: DpNameProp = { "data-dp-name": name };
  if (ident) {
    props["data-dp-ident"] = identStr;
  }
  return (objCache[cacheKey] = props);
};
