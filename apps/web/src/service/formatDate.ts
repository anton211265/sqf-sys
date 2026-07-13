export const formatDateDDMMYYYY = (dateString: string): string => {
  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  };
  return date.toLocaleDateString('en-GB', options);
};

export const formatDateMMMYY = (
  dateString: string,
  yearLength = '2'
): string => {
  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = {
    month: 'short',
    year:
      yearLength === '2'
        ? '2-digit'
        : yearLength === '4'
          ? 'numeric'
          : undefined,
  };
  return date.toLocaleDateString('en-GB', options);
};

export const formatDateDDMMYYYYwithTime = (dateString: string): string => {
  const utcDate = new Date(dateString);

  const localDate = new Date(
    utcDate.getUTCFullYear(),
    utcDate.getUTCMonth(),
    utcDate.getUTCDate(),
    utcDate.getHours(),
    utcDate.getMinutes(),
    utcDate.getSeconds()
  );

  const options: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true, // 👉 now it shows AM/PM
  };

  return localDate.toLocaleString('en-GB', options);
};
