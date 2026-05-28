import Decimal from 'decimal.js';

function areDecimalsEqual(decimal1: string, decimal2: string): boolean {
  if (isNaN(parseFloat(decimal1))) {
    throw new Error('Invalid decimal1 number input:' + decimal1);
  }

  if (isNaN(parseFloat(decimal2))) {
    throw new Error('Invalid decimal2 number input: ' + decimal2);
  }

  const dec1 = new Decimal(decimal1);
  const dec2 = new Decimal(decimal2);

  return dec1.equals(dec2);
}

function convertToPrecisionDecimals(
  valueToConvert: string,
  precision: number = 2,
): string {
  return new Decimal(valueToConvert).toFixed(precision);
}

function addPrecisionDecimals(
  currentValue: string,
  amountToAdd: string,
  precision: number = 2,
): string {
  if (isNaN(parseFloat(currentValue))) {
    throw new Error('Invalid currentValue number input:' + currentValue);
  }

  if (isNaN(parseFloat(amountToAdd))) {
    throw new Error('Invalid amountToAdd number input: ' + amountToAdd);
  }

  const convertedCurrentValue = new Decimal(currentValue);
  const convertedAmountToAdd = new Decimal(amountToAdd);

  const addedValueWithDecimalPrecision = new Decimal(
    convertedCurrentValue.plus(convertedAmountToAdd).toFixed(precision),
  );

  return addedValueWithDecimalPrecision.toString();
}

function dividePrecisionDecimals(
  currentValue: string,
  amountToDivide: string,
  precision: number = 2,
): string {
  if (isNaN(parseFloat(currentValue))) {
    throw new Error('Invalid currentValue number input:' + currentValue);
  }

  if (isNaN(parseFloat(amountToDivide))) {
    throw new Error('Invalid amountToDivide number input: ' + amountToDivide);
  }

  const convertedCurrentValue = new Decimal(currentValue);
  const convertedAmountToDivide = new Decimal(amountToDivide);

  const addedValueWithDecimalPrecision = new Decimal(
    convertedCurrentValue.div(convertedAmountToDivide).toFixed(precision),
  );

  return addedValueWithDecimalPrecision.toString();
}

function subtractPrecisionDecimals(
  currentValue: string,
  amountToSubtract: string,
  precision: number = 2,
): string {
  if (isNaN(parseFloat(currentValue))) {
    throw new Error('Invalid currentValue number input:' + currentValue);
  }

  if (isNaN(parseFloat(amountToSubtract))) {
    throw new Error(
      'Invalid amountToSubtract number input: ' + amountToSubtract,
    );
  }

  const convertedCurrentValue = new Decimal(currentValue);
  const convertedAmountToSubtract = new Decimal(amountToSubtract);

  const addedValueWithDecimalPrecision = new Decimal(
    convertedCurrentValue.sub(convertedAmountToSubtract).toFixed(precision),
  );

  return addedValueWithDecimalPrecision.toString();
}

function multiplyPrecisionDecimals(
  currentValue: string,
  amountToMultiply: string,
  precision: number = 2,
): string {
  if (isNaN(parseFloat(currentValue))) {
    throw new Error('Invalid currentValue number input:' + currentValue);
  }

  if (isNaN(parseFloat(amountToMultiply))) {
    throw new Error(
      'Invalid amountToMultiply number input: ' + amountToMultiply,
    );
  }
  const convertedCurrentValue = new Decimal(currentValue);
  const convertedAmountToMultiply = new Decimal(amountToMultiply);

  const addedValueWithDecimalPrecision = new Decimal(
    convertedCurrentValue.times(convertedAmountToMultiply).toFixed(precision),
  );

  return addedValueWithDecimalPrecision.toString();
}

function maxDecimalString(input1: string, input2: string): string {
  if (isNaN(parseFloat(input1))) {
    throw new Error('Invalid input1 number input:' + input1);
  }

  if (isNaN(parseFloat(input2))) {
    throw new Error('Invalid input2 number input: ' + input2);
  }

  const decimal1 = new Decimal(input1);
  const decimal2 = new Decimal(input2);

  const result = Decimal.max(decimal1, decimal2);

  return result.toString();
}

function minDecimalString(input1: string, input2: string): string {
  if (isNaN(parseFloat(input1))) {
    throw new Error('Invalid input1 number input:' + input1);
  }

  if (isNaN(parseFloat(input2))) {
    throw new Error('Invalid input2 number input: ' + input2);
  }

  const decimal1 = new Decimal(input1);
  const decimal2 = new Decimal(input2);

  const result = Decimal.min(decimal1, decimal2);

  return result.toString();
}

function ceilDecimalString(decimal: string): string {
  if (isNaN(parseFloat(decimal))) {
    throw new Error('Invalid decimal number input:' + decimal);
  }

  const result = Decimal.ceil(decimal);

  return result.toString();
}

function floorDecimalString(decimal: string): string {
  if (isNaN(parseFloat(decimal))) {
    throw new Error('Invalid decimal number input:' + decimal);
  }

  const result = Decimal.floor(decimal);

  return result.toString();
}

function validateNonNegativeDecimalString(decimalString: string): Decimal {
  if (!decimalString.trim()) {
    throw new Error('Decimal string cannot be empty.');
  }

  const decimalValue = new Decimal(decimalString);

  if (decimalValue.isNegative()) {
    throw new Error('Decimal cannot be negative.');
  }

  return decimalValue;
}

function isDecimalStringLessThanDecimalString(
  input1: string,
  input2: string,
): boolean {
  if (isNaN(parseFloat(input1))) {
    throw new Error('Invalid input1 number input:' + input1);
  }

  if (isNaN(parseFloat(input2))) {
    throw new Error('Invalid input2 number input: ' + input2);
  }

  const decimalA = new Decimal(input1);
  const decimalB = new Decimal(input2);
  return decimalA.lessThan(decimalB);
}

function isDecimalStringLessOrEqualToDecimalString(
  input1: string,
  input2: string,
): boolean {
  if (isNaN(parseFloat(input1))) {
    throw new Error('Invalid input1 number input:' + input1);
  }

  if (isNaN(parseFloat(input2))) {
    throw new Error('Invalid input2 number input: ' + input2);
  }

  const decimalA = new Decimal(input1);
  const decimalB = new Decimal(input2);
  return decimalA.lessThanOrEqualTo(decimalB);
}

function isDecimalGreaterThan(a: string | number, b: string | number): boolean {
  const decimalA = new Decimal(a);
  const decimalB = new Decimal(b);

  if (decimalA.isNaN() || decimalB.isNaN()) {
    throw new Error('Invalid Decimal values.');
  }

  return decimalA.gt(decimalB);
}

function isDecimalGreaterThanOrEqualTo(
  a: string | number,
  b: string | number,
): boolean {
  const decimalA = new Decimal(a);
  const decimalB = new Decimal(b);

  if (decimalA.isNaN() || decimalB.isNaN()) {
    throw new Error('Invalid Decimal values.');
  }

  return decimalA.gte(decimalB);
}

function maxDecimal(a: string | number, b: string | number): Decimal {
  const decimalA = new Decimal(a);
  const decimalB = new Decimal(b);

  return decimalA.greaterThan(decimalB) ? decimalA : decimalB;
}

function addThousandSeparators(value: string): string {
  if (isNaN(parseFloat(value))) {
    throw new Error('Invalid value number input:' + value);
  }

  // Convert the input string to a Decimal object
  const decimalNumber = new Decimal(value);

  // Ensure it has exactly 2 decimal places
  const formattedNumber = decimalNumber.toFixed(2);

  // Add thousand separators
  return formattedNumber.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function roundToPrecision(decimal: string, precision: number): string {
  if (isNaN(parseFloat(decimal))) {
    throw new Error('Invalid decimal number input:' + decimal);
  }

  const decimalValue = new Decimal(decimal);
  const roundedNumber = decimalValue.toNearest(precision);

  return roundedNumber.toString();
}

function roundDownDecimalString(decimal: string): string {
  if (isNaN(parseFloat(decimal))) {
    throw new Error('Invalid decimal number input:' + decimal);
  }

  const parsedDecimal = parseFloat(decimal);
  const roundedDownDecimal = Math.floor(parsedDecimal);

  return roundedDownDecimal.toString();
}

function roundUpDecimalString(decimal: string, factor: number) {
  if (isNaN(parseFloat(decimal))) {
    throw new Error('Invalid decimal number input:' + decimal);
  }

  if (isNaN(factor)) {
    throw new Error('Invalid factor input:' + factor);
  }

  const result = Math.ceil(parseFloat(decimal) / factor) * factor;

  return result.toString();
}

export function roundDownToDecimalPlaces(
  numberString: string,
  decimalPlaces: number,
): string {
  if (isNaN(parseFloat(numberString))) {
    throw new Error('Invalid decimal number input:' + numberString);
  }

  // Convert the string to a Decimal instance
  const decimalNumber = new Decimal(numberString);

  // Round down to the desired number of decimal places
  const roundedNumber = decimalNumber.toDecimalPlaces(
    decimalPlaces,
    Decimal.ROUND_DOWN,
  );

  // Return the rounded number as a string
  return roundedNumber.toString();
}

function set0ForNegativeNumbers(numberString: string): string {
  if (isDecimalGreaterThan(numberString, '0')) {
    return numberString;
  }

  return '0';
}

export {
  convertToPrecisionDecimals,
  addPrecisionDecimals,
  validateNonNegativeDecimalString,
  dividePrecisionDecimals,
  subtractPrecisionDecimals,
  multiplyPrecisionDecimals,
  areDecimalsEqual,
  maxDecimalString,
  minDecimalString,
  ceilDecimalString,
  floorDecimalString,
  isDecimalStringLessThanDecimalString,
  isDecimalStringLessOrEqualToDecimalString,
  isDecimalGreaterThan,
  isDecimalGreaterThanOrEqualTo,
  maxDecimal,
  addThousandSeparators,
  roundDownDecimalString,
  roundUpDecimalString,
  set0ForNegativeNumbers,
  roundToPrecision,
};
