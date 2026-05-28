export class NumericTransformer {
  // When writing to the DB
  to(data: number): number {
    return data; // No change, write as number
  }

  // When reading from the DB
  from(data: string): number {
    return parseFloat(data); // Convert from string to number
  }
}
