import type { Validator } from './types';

/**
 * Minimum length validator for strings
 */
export const minLength = (min: number, message?: string): Validator<string> => {
  return (value: string) => {
    if (value && value.length < min) {
      return message || `Must be at least ${min} characters long`;
    }
    return null;
  };
};

/**
 * Maximum length validator for strings
 */
export const maxLength = (max: number, message?: string): Validator<string> => {
  return (value: string) => {
    if (value && value.length > max) {
      return message || `Must be no more than ${max} characters long`;
    }
    return null;
  };
};

/**
 * Email validation
 */
export const email = (
  message = 'Please enter a valid email address'
): Validator<string> => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return (value: string) => {
    if (value && !emailRegex.test(value)) {
      return message;
    }
    return null;
  };
};

/**
 * Pattern/regex validator
 */
export const pattern = (regex: RegExp, message: string): Validator<string> => {
  return (value: string) => {
    if (value && !regex.test(value)) {
      return message;
    }
    return null;
  };
};

/**
 * Minimum value validator for numbers
 */
export const min = (minValue: number, message?: string): Validator<number> => {
  return (value: number) => {
    if (value !== undefined && value !== null && value < minValue) {
      return message || `Must be at least ${minValue}`;
    }
    return null;
  };
};

/**
 * Maximum value validator for numbers
 */
export const max = (maxValue: number, message?: string): Validator<number> => {
  return (value: number) => {
    if (value !== undefined && value !== null && value > maxValue) {
      return message || `Must be no more than ${maxValue}`;
    }
    return null;
  };
};

/**
 * Numeric validator
 */
export const numeric = (
  message = 'Must be a valid number'
): Validator<string | number> => {
  return (value: string | number) => {
    if (value !== undefined && value !== null) {
      if (typeof value === 'string') {
        if (value.trim() === '') return null;
        const num = Number(value);
        if (Number.isNaN(num)) {
          return message;
        }
        return null;
      }
      if (Number.isNaN(value)) {
        return message;
      }
    }
    return null;
  };
};

/**
 * Phone number validator (basic US format)
 */
export const phoneNumber = (
  message = 'Please enter a valid phone number'
): Validator<string> => {
  const phoneRegex = /^\+?[\d\s\-()]+$/;
  return (value: string) => {
    if (value && !phoneRegex.test(value)) {
      return message;
    }
    return null;
  };
};

/**
 * URL validator
 */
export const url = (message = 'Please enter a valid URL'): Validator<string> => {
  return (value: string) => {
    if (value) {
      try {
        new URL(value);
      } catch {
        return message;
      }
    }
    return null;
  };
};

/**
 * Confirm field validator (for password confirmation, etc.)
 */
export const confirmField = <T>(
  fieldName: string,
  message = 'Fields do not match'
): Validator<T> => {
  return (value: T, allFields) => {
    const otherField = allFields[fieldName];
    if (otherField && value !== otherField.getValue()) {
      return message;
    }
    return null;
  };
};

/**
 * Date validator
 */
export const dateFormat = (message = 'Please enter a valid date'): Validator<string> => {
  return (value: string) => {
    if (value) {
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        return message;
      }
    }
    return null;
  };
};

/**
 * Age validation (minimum age)
 */
export const minAge = (minimumAge: number, message?: string): Validator<string> => {
  return (value: string) => {
    if (value) {
      const birthDate = new Date(value);
      if (isNaN(birthDate.getTime())) {
        return message || `Must be at least ${minimumAge} years old`;
      }
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();

      const actualAge =
        monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())
          ? age - 1
          : age;

      if (actualAge < minimumAge) {
        return message || `Must be at least ${minimumAge} years old`;
      }
    }
    return null;
  };
};

/**
 * Credit card validator (basic Luhn algorithm)
 */
export const creditCard = (
  message = 'Please enter a valid credit card number'
): Validator<string> => {
  const luhnCheck = (cardNumber: string): boolean => {
    let sum = 0;
    let isEven = false;

    for (let i = cardNumber.length - 1; i >= 0; i--) {
      let digit = parseInt(cardNumber.charAt(i), 10);

      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }

      sum += digit;
      isEven = !isEven;
    }

    return sum % 10 === 0;
  };

  return (value: string) => {
    if (value) {
      const cleaned = value.replace(/\s+/g, '');
      if (cleaned.length < 13 || cleaned.length > 19) {
        return message;
      }
      if (!/^\d+$/.test(cleaned) || !luhnCheck(cleaned)) {
        return message;
      }
    }
    return null;
  };
};

/**
 * Wrap an async validator function so thrown errors become error strings
 * instead of rejected promises.
 *
 * Note: this helper does NOT debounce. Use the field-level `validationDelay`
 * option for debouncing — keeping the timer on the validator closure leaks
 * across fields that share the same validator reference and produces a
 * race between concurrent runs. One timer per field is what you want.
 */
export const asyncValidator = <T>(
  validatorFn: (value: T) => Promise<string | null>
): Validator<T> => {
  return async (value: T) => {
    try {
      return await validatorFn(value);
    } catch (error) {
      return error instanceof Error ? error.message : 'Validation error';
    }
  };
};

/**
 * Compose multiple validators
 */
export const compose = <T>(...validators: Validator<T>[]): Validator<T> => {
  return async (value: T, allFields) => {
    for (const validator of validators) {
      const result = await validator(value, allFields);
      if (result) {
        return result; // Return first error found
      }
    }
    return null;
  };
};
