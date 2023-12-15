import { ISettings } from "../types/settings";

export const getValueByPath = (
  obj: Record<string, string>,
  paths: { value: string; order: number }[]
) => {
  if (!obj || !paths || !paths.length) return undefined;

  const results = [];

  for (const path of paths.sort((a, b) => a.order - b.order)) {
    const keys = path.value.split(".");
    let result;
    for (const key of keys) {
      if (obj && typeof obj === "object" && key.replace(",", ".") in obj) {
        result = obj[key.replace(",", ".")];
      } else {
        return "";
      }
    }
    results.push(result);
  }

  return results.join(", ");
};

export const ticketAccessor = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ticket: any,
  settings: ISettings
) => {
  return Object.keys(settings).reduce(
    (acc: Record<string, string | undefined>, curr) => {
      acc[curr] = getValueByPath(
        ticket,
        settings[curr as keyof ISettings] as { value: string; order: number }[]
      );

      return acc;
    },
    {}
  );
};
