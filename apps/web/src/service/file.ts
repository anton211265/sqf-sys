export const downloadFile = (data: Blob, fileName: string) => {
  const blob = new Blob([data], { type: 'application/octet-stream' });

  const url = window.URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `${fileName}`;
  document.body.appendChild(a);
  a.click();

  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
};
