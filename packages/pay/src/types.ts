export type TranslateFn = (
  key: string,
  values?: Record<string, string | number | undefined>,
) => string;

export type PayMode = "session" | "cart";
