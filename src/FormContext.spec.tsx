// @vitest-environment jsdom

import { render } from '@testing-library/react';
import { act } from 'react';
import { describe, expect, test, vi } from 'vitest';

import type { Form } from './Form';
import { FormContextProvider, useFormContext } from './FormContext';

type Values = {
  name: string;
};

function CaptureForm({ onCapture }: { onCapture: (form: Form<Values>) => void }) {
  const form = useFormContext<Values>();
  onCapture(form);
  return null;
}

describe('FormContextProvider', () => {
  test('uses the latest onSubmit callback after provider rerender', async () => {
    let formRef: Form<Values> | undefined;
    const firstSubmit = vi.fn();
    const secondSubmit = vi.fn();

    const { rerender } = render(
      <FormContextProvider<Values> initialValues={{ name: '' }} onSubmit={firstSubmit}>
        <CaptureForm onCapture={(form) => (formRef = form)} />
      </FormContextProvider>
    );

    await act(async () => {
      await formRef?.submit();
    });

    rerender(
      <FormContextProvider<Values> initialValues={{ name: '' }} onSubmit={secondSubmit}>
        <CaptureForm onCapture={(form) => (formRef = form)} />
      </FormContextProvider>
    );

    await act(async () => {
      await formRef?.submit();
    });

    expect(firstSubmit).toHaveBeenCalledTimes(1);
    expect(secondSubmit).toHaveBeenCalledTimes(1);
  });

  test('uses the latest onSubmitError callback after provider rerender', async () => {
    let formRef: Form<Values> | undefined;
    const firstSubmitError = vi.fn();
    const secondSubmitError = vi.fn();

    const failingSubmit = vi.fn(async () => {
      throw new Error('boom');
    });

    const { rerender } = render(
      <FormContextProvider<Values>
        initialValues={{ name: '' }}
        onSubmit={failingSubmit}
        onSubmitError={firstSubmitError}
      >
        <CaptureForm onCapture={(form) => (formRef = form)} />
      </FormContextProvider>
    );

    expect(formRef).toBeDefined();
    await act(async () => {
      await expect(formRef!.submit()).rejects.toThrow('boom');
    });

    rerender(
      <FormContextProvider<Values>
        initialValues={{ name: '' }}
        onSubmit={failingSubmit}
        onSubmitError={secondSubmitError}
      >
        <CaptureForm onCapture={(form) => (formRef = form)} />
      </FormContextProvider>
    );

    await act(async () => {
      await expect(formRef!.submit()).rejects.toThrow('boom');
    });

    expect(firstSubmitError).toHaveBeenCalledTimes(1);
    expect(secondSubmitError).toHaveBeenCalledTimes(1);
  });
});
