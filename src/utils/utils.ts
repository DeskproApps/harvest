// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getValueByPath = (obj: any, path: string) => {
  if (!obj || !path) return undefined;

  const keys = path.split(".");
  let result = obj;
  for (const key of keys) {
    if (
      result &&
      typeof result === "object" &&
      key.replace(",", ".") in result
    ) {
      result = result[key.replace(",", ".")];
    } else {
      return "";
    }
  }

  return result;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const ticketAccessor = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ticket: any,
  settings: Record<string, string>
) => {
  return Object.keys(settings).reduce((acc: Record<string, string>, curr) => {
    acc[curr] = getValueByPath(ticket, settings[curr]);

    return acc;
  }, {});
};
