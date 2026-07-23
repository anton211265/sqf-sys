/**
 * Minimal Handlebars-style renderer for the injection previewer — supports
 * the two constructs the spec's template example uses ({{key}} and
 * {{multiply key factor}}) without pulling in a template engine dependency.
 * Unknown keys render as an explicit [missing: key] marker rather than
 * silently disappearing, so a bad template is visible in the preview.
 */
export function renderTemplate(
  template: string,
  context: Record<string, unknown>,
): string {
  const resolve = (key: string): unknown =>
    key in context ? context[key] : undefined;

  return template
    .replace(
      /\{\{\s*multiply\s+([\w.]+)\s+([\w.]+)\s*\}\}/g,
      (_match, keyOrNumber: string, factorOrKey: string) => {
        const left = Number(resolve(keyOrNumber) ?? keyOrNumber);
        const right = Number(resolve(factorOrKey) ?? factorOrKey);
        if (Number.isNaN(left) || Number.isNaN(right)) {
          return `[missing: multiply ${keyOrNumber} ${factorOrKey}]`;
        }
        return String(Math.round(left * right * 10000) / 10000);
      },
    )
    .replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_match, key: string) => {
      const value = resolve(key);
      return value === undefined || value === null
        ? `[missing: ${key}]`
        : String(value);
    });
}
