const IST_TIME_ZONE = "Asia/Kolkata";

const getFormatter = (options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("en-IN", {
    timeZone: IST_TIME_ZONE,
    ...options,
  });

export const parseIstDate = (dateKey: string) => new Date(`${dateKey}T12:00:00+05:30`);

export const formatIstDate = (value: string | number | Date, options: Intl.DateTimeFormatOptions) =>
  getFormatter(options).format(new Date(value));

export const formatIstDateTime = (value: string | number | Date) =>
  formatIstDate(value, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export const formatIstDayLabel = (dateKey: string, options: Intl.DateTimeFormatOptions = {}) =>
  getFormatter(options).format(parseIstDate(dateKey));