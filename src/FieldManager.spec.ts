import { describe, expect, test } from 'vitest';

import { FieldManager } from './FieldManager';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe('FieldManager', () => {
  test('supports lifecycle operations: setValue, validate, reset, destroy', async () => {
    const field = new FieldManager<string>('name', {
      defaultValue: '',
      validators: [(value) => (value.length < 3 ? 'too short' : null)],
    });

    field.setValue('ab');
    await expect(field.validate()).resolves.toBe('too short');
    expect(field.state.error).toBe('too short');
    expect(field.state.isChanged).toBe(true);
    expect(field.state.isTouched).toBe(true);

    field.setValue('abcd');
    await expect(field.validate()).resolves.toBeNull();
    expect(field.state.error).toBeNull();
    expect(field.state.isValid).toBe(true);

    field.reset();
    expect(field.getValue()).toBe('');
    expect(field.state.error).toBeNull();
    expect(field.state.isChanged).toBe(false);
    expect(field.state.isTouched).toBe(false);

    field.destroy();
    await field.validate();
  });

  test('discards stale async validator result from slower run', async () => {
    const field = new FieldManager<string>('code', {
      defaultValue: '',
      validators: [
        async (value) => {
          if (value === 'slow') {
            await sleep(30);
            return 'slow error';
          }
          await sleep(1);
          return null;
        },
      ],
    });

    field.setValue('slow');
    field.setValue('fast');

    await sleep(60);

    expect(field.getValue()).toBe('fast');
    expect(field.state.error).toBeNull();
    expect(field.state.isValid).toBe(true);
  });
});
