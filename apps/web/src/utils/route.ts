export const toRouteStr = (
  path: string,
  params: { [key: string]: string }
): string => {
  for (const key in params) {
    path = path.replace(`:${key}`, params[key]);
  }

  return path;
};
