import {
  createClassListSignal,
  setupFocusHandler,
  syncProvidedControl,
} from './utils';
import { createRoot, onMount } from 'solid-js';
import {
  AbstractControl,
  AbstractControlContainer,
  FormGroup,
  FormControl,
  IControlFocusEvent,
  IControlStateChangeEvent,
  IControlValidationEvent,
  isFocusEvent,
  isStateChangeEvent,
} from 'rx-controls';
import { filter } from 'rxjs/operators';

describe('createClassListSignal', () => {
  it('works', () => {
    const controlProps = [
      'data',
      'valid',
      'touched',
      'dirty',
      'pending',
      'readonly',
      'disabled',
      'submitted',
    ] as const;

    const control = new FormControl(null, {
      data: { required: true },
    });

    createRoot((disposer) => {
      const signal = createClassListSignal(control, controlProps, (p) => {
        const required = p.data?.required || false;

        return {
          'sw-required': required,
          'sw-valid': p.valid,
          'sw-invalid': !p.valid,
          'sw-touched': p.touched,
          'sw-untouched': !p.touched,
          'sw-dirty': p.dirty,
          'sw-clean': !p.dirty,
          'sw-pending': p.pending,
          'sw-not-pending': !p.pending,
          'sw-readonly': p.readonly,
          'sw-editable': !p.readonly,
          'sw-disabled': p.disabled,
          'sw-enabled': !p.disabled,
          'sw-submitted': p.submitted,
          'sw-not-submitted': !p.submitted,
        };
      });

      expect(typeof signal).toBe('function');

      expect(signal()).toEqual({
        'sw-required': true,
        'sw-valid': true,
        'sw-invalid': false,
        'sw-touched': false,
        'sw-untouched': true,
        'sw-dirty': false,
        'sw-clean': true,
        'sw-pending': false,
        'sw-not-pending': true,
        'sw-readonly': false,
        'sw-editable': true,
        'sw-disabled': false,
        'sw-enabled': true,
        'sw-submitted': false,
        'sw-not-submitted': true,
      });

      control.markTouched(true);

      expect(signal()).toEqual({
        'sw-required': true,
        'sw-valid': true,
        'sw-invalid': false,
        'sw-touched': true,
        'sw-untouched': false,
        'sw-dirty': false,
        'sw-clean': true,
        'sw-pending': false,
        'sw-not-pending': true,
        'sw-readonly': false,
        'sw-editable': true,
        'sw-disabled': false,
        'sw-enabled': true,
        'sw-submitted': false,
        'sw-not-submitted': true,
      });

      disposer();
    });
  });
});

describe('setupFocusHandler', () => {
  let control: FormControl;
  let el: { focus: jest.Mock<any, any>; blur: jest.Mock<any, any> };

  beforeEach(() => {
    control = new FormControl(null);
    el = { focus: jest.fn(), blur: jest.fn() };
  });

  it('focus works', () => {
    createRoot((disposer) => {
      setupFocusHandler(control, () => el);

      onMount(() => {
        control.focus();
        control.focus();
        disposer();
      });
    });

    expect(el.focus.mock.calls.length).toBe(2);
  });

  it('blur works', () => {
    createRoot((disposer) => {
      setupFocusHandler(control, () => el);

      onMount(() => {
        control.focus(false);
        disposer();
      });
    });

    expect(el.blur.mock.calls.length).toBe(1);
  });
});

describe('syncProvidedControl', () => {
  function testSync(
    beforeEachFn: () => {
      staticControl: FormControl<null>;
      dynamicControl: FormControl<string>;
      props: {
        control?: AbstractControl;
        controlContainer?: AbstractControlContainer;
        controlName?: string;
      };
    }
  ) {
    let staticControl: AbstractControl;
    let dynamicControl: AbstractControl;
    let props: {
      control?: AbstractControl;
      controlContainer?: AbstractControlContainer;
      controlName?: string;
    };

    beforeEach(() => {
      ({ staticControl, dynamicControl, props } = beforeEachFn());
    });

    it('initializes', () => {
      createRoot((disposer) => {
        syncProvidedControl(staticControl, props);

        expect(staticControl.value).toEqual('');
        expect(dynamicControl.value).toEqual('');

        dynamicControl.setValue('one');

        expect(staticControl.value).toEqual('one');
        expect(dynamicControl.value).toEqual('one');

        staticControl.setValue('two');

        expect(staticControl.value).toEqual('two');
        expect(dynamicControl.value).toEqual('two');

        disposer();
      });
    });

    it('handles Focus events', () => {
      createRoot((disposer) => {
        syncProvidedControl(staticControl, props);

        const callback = jest.fn();

        let sub = staticControl.events
          .pipe(filter(isFocusEvent))
          .subscribe(callback);

        dynamicControl.focus();
        dynamicControl.focus(false);

        expect(callback.mock.calls[0][0]).toEqual<IControlFocusEvent>({
          type: 'Focus',
          controlId: staticControl.id,
          debugPath: expect.any(String),
          focus: true,
          meta: {},
          source: dynamicControl.id,
        });

        expect(callback.mock.calls[1][0]).toEqual<IControlFocusEvent>({
          type: 'Focus',
          controlId: staticControl.id,
          debugPath: expect.any(String),
          focus: false,
          meta: {},
          source: dynamicControl.id,
        });

        sub.unsubscribe();

        sub = dynamicControl.events
          .pipe(filter(isFocusEvent))
          .subscribe(callback);

        staticControl.focus();

        expect(callback.mock.calls[2]).toEqual(undefined);

        sub.unsubscribe();
        disposer();
      });
    });

    it('handles StateChange events', () => {
      createRoot((disposer) => {
        syncProvidedControl(staticControl, props);

        const callback = jest.fn();

        let sub = staticControl.events.subscribe(callback);

        dynamicControl.setValue('one');

        expect(callback.mock.calls[0][0]).toEqual<
          IControlValidationEvent<string>
        >({
          type: 'ValidationStart',
          controlId: staticControl.id,
          debugPath: expect.any(String),
          meta: {},
          source: dynamicControl.id,
          value: 'one',
          rawValue: 'one',
        });

        expect(callback.mock.calls[1][0]).toEqual<
          IControlValidationEvent<string>
        >({
          type: 'AsyncValidationStart',
          controlId: staticControl.id,
          debugPath: expect.any(String),
          meta: {},
          source: dynamicControl.id,
          value: 'one',
          rawValue: 'one',
        });

        expect(callback.mock.calls[2][0]).toEqual<IControlStateChangeEvent>({
          type: 'StateChange',
          controlId: staticControl.id,
          debugPath: expect.any(String),
          meta: {},
          source: dynamicControl.id,
          changes: {
            value: 'one',
            rawValue: 'one',
          },
        });

        expect(callback.mock.calls[3]).toEqual(undefined);

        sub.unsubscribe();

        sub = dynamicControl.events.subscribe(callback);

        staticControl.setValue('two');

        expect(callback.mock.calls[3][0]).toEqual<
          IControlValidationEvent<string>
        >({
          type: 'ValidationStart',
          controlId: dynamicControl.id,
          debugPath: expect.any(String),
          meta: {},
          source: staticControl.id,
          value: 'two',
          rawValue: 'two',
        });

        expect(callback.mock.calls[4][0]).toEqual<
          IControlValidationEvent<string>
        >({
          type: 'AsyncValidationStart',
          controlId: dynamicControl.id,
          debugPath: expect.any(String),
          meta: {},
          source: staticControl.id,
          value: 'two',
          rawValue: 'two',
        });

        expect(callback.mock.calls[5][0]).toEqual<IControlStateChangeEvent>({
          type: 'StateChange',
          controlId: dynamicControl.id,
          debugPath: expect.any(String),
          meta: {},
          source: staticControl.id,
          changes: {
            value: 'two',
            rawValue: 'two',
          },
        });

        expect(callback.mock.calls[6]).toEqual(undefined);

        sub.unsubscribe();
        disposer();
      });
    });
  }

  describe('props.control', () => {
    testSync(() => {
      const dynamicControl = new FormControl('');

      return {
        staticControl: new FormControl(null),
        dynamicControl,
        props: {
          control: dynamicControl,
        },
      };
    });
  });

  describe('props.controlContainer & props.controlName', () => {
    testSync(() => {
      const dynamicControl = new FormControl('');

      return {
        staticControl: new FormControl(null),
        dynamicControl,
        props: {
          controlContainer: new FormGroup({
            street: dynamicControl,
          }),
          controlName: 'street',
        },
      };
    });
  });
});
