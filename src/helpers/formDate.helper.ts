
  export const formatDate = (dateString: string | Date): string => {
    let date: Date;
    let useUtc = false;

    if (typeof dateString === "string") {
      const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateString);
      if (dateOnlyMatch) {
        const [, y, m, d] = dateOnlyMatch;
        date = new Date(Number(y), Number(m) - 1, Number(d));
      } else {
        date = new Date(dateString);
        useUtc = /([zZ]|[+-]\d{2}:\d{2})$/.test(dateString);
      }
    } else {
      date = dateString;
    }

    return date.toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      timeZone: useUtc ? "UTC" : undefined,
    });
  }
