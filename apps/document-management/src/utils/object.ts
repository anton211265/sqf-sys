export function concatenateObjectValues(object: Record<string, any>): string {
  const parts: string[] = [];

  function traverse(val: any, parentKey?: string): void {
    if (val === null || val === undefined) return;

    if (Array.isArray(val)) {
      if (parentKey) parts.push(parentKey);
      val.forEach((item) => traverse(item));
    } else if (typeof val === 'object') {
      for (const [key, nested] of Object.entries(val)) {
        parts.push(key);
        traverse(nested);
      }
    } else {
      parts.push(String(val));
    }
  }

  traverse(object);
  return parts.join(':');
}
