import { describe, expect, test, vi } from 'vitest';

import { eventNames, Form } from './Form';
import { confirmField } from './validators';

describe('Form', () => {
  test('buffers values set before registration and applies them on register', () => {
    type Values = {
      name: string;
    };

    const form = new Form<Values>();
    form.setValues({ name: 'Alice' });

    const field = form.registerField('name', { defaultValue: '' });

    expect(field.getValue()).toBe('Alice');
    expect(form.getValues()).toEqual({ name: 'Alice' });
  });

  test('passes all fields into cross-field validators', async () => {
    type Values = {
      password: string;
      confirmPassword: string;
    };

    const form = new Form<Values>();
    const password = form.registerField('password', { defaultValue: '' });
    const confirmPassword = form.registerField('confirmPassword', {
      defaultValue: '',
      validators: [confirmField<string>('password')],
    });

    password.setValue('secret');
    confirmPassword.setValue('different');

    await expect(confirmPassword.validate()).resolves.toBe('Fields do not match');

    confirmPassword.setValue('secret');

    await expect(confirmPassword.validate()).resolves.toBeNull();
  });

  test('does not call onChange while reseeding initial values', () => {
    type Values = {
      name: string;
    };

    const onChange = vi.fn();
    const form = new Form<Values>({
      initialValues: { name: 'first' },
      onChange,
    });

    const field = form.registerField('name');
    expect(field.getValue()).toBe('first');

    onChange.mockClear();

    form.setInitialValues({ name: 'second' });

    expect(field.getValue()).toBe('second');
    expect(onChange).not.toHaveBeenCalled();
  });

  test('buffers errors set before registration and applies them on register', () => {
    type Values = {
      name: string;
    };

    const form = new Form<Values>();
    form.setErrors({ name: 'Required' });

    const field = form.registerField('name', { defaultValue: '' });

    expect(field.state.error).toBe('Required');
    expect(form.getErrors()).toEqual({ name: 'Required' });
  });

  test('reset emits one state change and does not call onChange', () => {
    type Values = {
      name: string;
    };

    const onChange = vi.fn();
    const onStateChange = vi.fn();
    const form = new Form<Values>({
      initialValues: { name: 'Alice' },
      onChange,
    });

    const field = form.registerField('name', { defaultValue: '' });
    form.on(eventNames.stateChange, onStateChange);

    field.setValue('Bob');
    onChange.mockClear();
    onStateChange.mockClear();

    form.reset();

    expect(field.getValue()).toBe('Alice');
    expect(onChange).not.toHaveBeenCalled();
    expect(onStateChange).toHaveBeenCalledTimes(1);
  });

  test('emits submit event even when submit handler throws', async () => {
    type Values = {
      name: string;
    };

    const onSubmit = vi.fn(async () => {
      throw new Error('boom');
    });
    const onSubmitEvent = vi.fn();
    const onSubmitErrorEvent = vi.fn();
    const onSubmitError = vi.fn();

    const form = new Form<Values>({
      initialValues: { name: 'Alice' },
      onSubmit,
      onSubmitError,
    });

    form.registerField('name', { required: true });
    form.on(eventNames.submit, onSubmitEvent);
    form.on(eventNames.submitError, onSubmitErrorEvent);

    await expect(form.submit()).rejects.toThrow('boom');

    expect(onSubmitEvent).toHaveBeenCalledTimes(1);
    expect(onSubmitError).toHaveBeenCalledTimes(1);
    expect(onSubmitErrorEvent).toHaveBeenCalledTimes(1);
    expect(form.state.isSubmitting).toBe(false);
  });

  test('handleSubmit swallows submit rejection and reports submitError', async () => {
    type Values = {
      name: string;
    };

    const onSubmit = vi.fn(async () => {
      throw new Error('fail in submit');
    });
    const onSubmitError = vi.fn();
    const onSubmitErrorEvent = vi.fn();
    const onSuccess = vi.fn();

    const form = new Form<Values>({
      initialValues: { name: 'Alice' },
      onSubmit,
      onSubmitError,
    });

    form.registerField('name', { required: true });
    form.on(eventNames.submitError, onSubmitErrorEvent);

    await expect(form.handleSubmit(onSuccess)()).resolves.toBeUndefined();

    expect(onSuccess).not.toHaveBeenCalled();
    expect(onSubmitError).toHaveBeenCalledTimes(1);
    expect(onSubmitErrorEvent).toHaveBeenCalledTimes(1);
  });

  test('handleSubmit reports onSuccess callback failures via submitError', async () => {
    type Values = {
      name: string;
    };

    const onSubmitError = vi.fn();
    const onSubmitErrorEvent = vi.fn();
    const onSuccess = vi.fn(async () => {
      throw new Error('fail in onSuccess');
    });

    const form = new Form<Values>({
      initialValues: { name: 'Alice' },
      onSubmitError,
    });

    form.registerField('name', { required: true });
    form.on(eventNames.submitError, onSubmitErrorEvent);

    await expect(form.handleSubmit(onSuccess)()).resolves.toBeUndefined();

    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(onSubmitError).toHaveBeenCalledTimes(1);
    expect(onSubmitErrorEvent).toHaveBeenCalledTimes(1);
    expect(onSubmitError.mock.calls[0]?.[1]?.phase).toBe('onSuccess');
  });

  test('requires all duplicate field registrations to unregister before destroying field', () => {
    type Values = {
      name: string;
    };

    const form = new Form<Values>();
    const first = form.registerField('name', { defaultValue: 'Alice' });
    const second = form.registerField('name');

    expect(first).toBe(second);

    form.unregisterField('name');
    expect(form.getField('name')).toBeDefined();

    form.unregisterField('name');
    expect(form.getField('name')).toBeUndefined();
  });

  test('on returns an unsubscribe function and once fires only once', () => {
    type Values = {
      name: string;
    };

    const form = new Form<Values>();
    form.registerField('name', { defaultValue: '' });

    const onChange = vi.fn();
    const unsubscribe = form.on(eventNames.change, onChange);

    form.setValues({ name: 'Alice' });
    expect(onChange).toHaveBeenCalledTimes(1);

    unsubscribe();
    form.setValues({ name: 'Bob' });
    expect(onChange).toHaveBeenCalledTimes(1);

    const onceListener = vi.fn();
    form.once(eventNames.change, onceListener);
    form.setValues({ name: 'Charlie' });
    form.setValues({ name: 'Delta' });

    expect(onceListener).toHaveBeenCalledTimes(1);
  });
});
