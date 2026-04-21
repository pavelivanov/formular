// @vitest-environment jsdom

import { render, waitFor } from '@testing-library/react';
import { StrictMode } from 'react';
import { describe, expect, test } from 'vitest';

import type { Form } from './Form';
import { FormContextProvider, useFormContext } from './FormContext';
import { useFieldRegister } from './hooks';

type Values = {
  name: string;
};

function CaptureForm({ onCapture }: { onCapture: (form: Form<Values>) => void }) {
  const form = useFormContext<Values>();
  onCapture(form);
  return null;
}

function Registrar() {
  useFieldRegister<Values>('name', { defaultValue: '' });
  return null;
}

function ReadRegistryInRender({ reads }: { reads: boolean[] }) {
  const form = useFormContext<Values>();
  reads.push(Boolean(form.getField('name')));
  return null;
}

describe('hooks/useFieldRegister', () => {
  test('does not mutate form field registry during render', async () => {
    let formRef: Form<Values> | undefined;
    const reads: boolean[] = [];

    render(
      <FormContextProvider<Values> initialValues={{ name: '' }}>
        <CaptureForm onCapture={(form) => (formRef = form)} />
        <Registrar />
        <ReadRegistryInRender reads={reads} />
      </FormContextProvider>
    );

    expect(reads[0]).toBe(false);

    await waitFor(() => {
      expect(formRef?.getField('name')).toBeDefined();
    });
  });

  test('keeps a shared field registered until the last owner unmounts', async () => {
    let formRef: Form<Values> | undefined;

    function App({ showA, showB }: { showA: boolean; showB: boolean }) {
      return (
        <FormContextProvider<Values> initialValues={{ name: '' }}>
          <CaptureForm onCapture={(form) => (formRef = form)} />
          {showA && <Registrar />}
          {showB && <Registrar />}
        </FormContextProvider>
      );
    }

    const { rerender } = render(<App showA showB />);

    await waitFor(() => {
      expect(formRef?.getField('name')).toBeDefined();
    });

    rerender(<App showA={false} showB />);

    await waitFor(() => {
      expect(formRef?.getField('name')).toBeDefined();
    });

    rerender(<App showA={false} showB={false} />);

    await waitFor(() => {
      expect(formRef?.getField('name')).toBeUndefined();
    });
  });

  test('remains consistent under StrictMode mount/unmount replay', async () => {
    let formRef: Form<Values> | undefined;

    function App({ show }: { show: boolean }) {
      return (
        <StrictMode>
          <FormContextProvider<Values> initialValues={{ name: '' }}>
            <CaptureForm onCapture={(form) => (formRef = form)} />
            {show && <Registrar />}
          </FormContextProvider>
        </StrictMode>
      );
    }

    const { rerender } = render(<App show />);

    await waitFor(() => {
      expect(formRef?.getField('name')).toBeDefined();
    });

    rerender(<App show={false} />);

    await waitFor(() => {
      expect(formRef?.getField('name')).toBeUndefined();
    });
  });

  test('preserves defaultValue when registering a pre-created field', async () => {
    let formRef: Form<Values> | undefined;

    function App() {
      return (
        <FormContextProvider<Values>>
          <CaptureForm onCapture={(form) => (formRef = form)} />
          <Registrar />
        </FormContextProvider>
      );
    }

    render(<App />);

    await waitFor(() => {
      expect(formRef?.getField('name')).toBeDefined();
    });

    expect(formRef?.getField('name')?.state.value).toBe('');
  });
});
