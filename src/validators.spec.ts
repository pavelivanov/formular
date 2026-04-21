import { describe, expect, test } from 'vitest';

import { creditCard, minAge, minLength, numeric } from './validators';

describe('validators', () => {
  test('minLength allows empty strings for non-required fields', () => {
    const validator = minLength(3);

    expect(validator('', {})).toBeNull();
    expect(validator('ab', {})).toBe('Must be at least 3 characters long');
    expect(validator('abc', {})).toBeNull();
  });

  test('minAge rejects invalid dates', () => {
    const validator = minAge(18);

    expect(validator('not-a-date', {})).toBe('Must be at least 18 years old');
  });

  test('numeric rejects partially numeric strings', () => {
    const validator = numeric();

    expect(validator('3abc', {})).toBe('Must be a valid number');
    expect(validator('3.14', {})).toBeNull();
    expect(validator('', {})).toBeNull();
  });

  test('creditCard requires realistic card number lengths', () => {
    const validator = creditCard();

    expect(validator('18', {})).toBe('Please enter a valid credit card number');
  });
});
