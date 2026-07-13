export const convertDate = (originalDateValue: string) => {
  const format = 'YYYY-MM-DD';
  const originalDate = new Date(originalDateValue);
  const yearFull = originalDate.getFullYear().toString();
  const yearShort = yearFull.substr(-2);
  const month = (originalDate.getMonth() + 1).toString().padStart(2, '0');
  const day = originalDate.getDate().toString().padStart(2, '0');

  const replacements: { [key: string]: string } = {
    YYYY: yearFull,
    YY: yearShort,
    MM: month,
    DD: day,
  };

  return format.replace(/YYYY|YY|MM|DD/g, (match) => replacements[match]);
};
