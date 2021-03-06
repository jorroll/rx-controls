import { Subject } from 'rxjs';
import { takeUntil, toArray } from 'rxjs/operators';
import {
  AbstractControl,
  ControlId,
  ValidationErrors,
} from './abstract-control/abstract-control';
import { AbstractControlBase } from './abstract-control/abstract-control-base';
import { AbstractControlContainer } from './abstract-control-container/abstract-control-container';

export function wait(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

export function testAllAbstractControlDefaultsExcept<C extends AbstractControl>(
  c: C,
  ...skipTests: Array<Omit<keyof C, 'value'>>
): void {
  if (!skipTests.includes('id')) {
    expect(typeof c.id).toEqual('symbol');
  }

  if (!skipTests.includes('data')) {
    expect(c.data).toEqual(undefined);
  }

  if (!skipTests.includes('valid')) {
    expect(c.valid).toEqual(true);
  }

  if (!skipTests.includes('selfValid')) {
    expect(c.selfValid).toEqual(true);
  }

  if (!skipTests.includes('invalid')) {
    expect(c.invalid).toEqual(false);
  }

  if (!skipTests.includes('selfInvalid')) {
    expect(c.selfInvalid).toEqual(false);
  }

  if (!skipTests.includes('status')) {
    expect(c.status).toEqual('VALID');
  }

  if (!skipTests.includes('enabled')) {
    expect(c.enabled).toEqual(true);
  }

  if (!skipTests.includes('selfEnabled')) {
    expect(c.selfEnabled).toEqual(true);
  }

  if (!skipTests.includes('disabled')) {
    expect(c.disabled).toEqual(false);
  }

  if (!skipTests.includes('selfDisabled')) {
    expect(c.selfDisabled).toEqual(false);
  }

  if (!skipTests.includes('touched')) {
    expect(c.touched).toEqual(false);
  }

  if (!skipTests.includes('selfTouched')) {
    expect(c.selfTouched).toEqual(false);
  }

  if (!skipTests.includes('dirty')) {
    expect(c.dirty).toEqual(false);
  }

  if (!skipTests.includes('selfDirty')) {
    expect(c.selfDirty).toEqual(false);
  }

  if (!skipTests.includes('readonly')) {
    expect(c.readonly).toEqual(false);
  }

  if (!skipTests.includes('selfReadonly')) {
    expect(c.selfReadonly).toEqual(false);
  }

  if (!skipTests.includes('submitted')) {
    expect(c.submitted).toEqual(false);
  }

  if (!skipTests.includes('selfSubmitted')) {
    expect(c.selfSubmitted).toEqual(false);
  }

  if (!skipTests.includes('errors')) {
    expect(c.errors).toEqual(null);
  }

  if (!skipTests.includes('selfErrors')) {
    expect(c.selfErrors).toEqual(null);
  }

  if (!skipTests.includes('errorsStore')) {
    expect(c.errorsStore).toEqual(new Map());
  }

  if (!skipTests.includes('validator')) {
    expect(c.validator).toEqual(null);
  }

  if (!skipTests.includes('validatorStore')) {
    expect(c.validatorStore).toEqual(new Map());
  }

  if (!skipTests.includes('pending')) {
    expect(c.pending).toEqual(false);
  }

  if (!skipTests.includes('selfPending')) {
    expect(c.selfPending).toEqual(false);
  }

  if (!skipTests.includes('pendingStore')) {
    expect(c.pendingStore).toEqual(new Set());
  }

  if (!skipTests.includes('parent')) {
    expect(c.parent).toEqual(null);
  }
}

export function testAllAbstractControlContainerDefaultsExcept<
  C extends AbstractControlContainer
>(
  c: C,
  ...skipTests: Array<
    Omit<keyof C, 'value' | 'enabledValue' | 'controls' | 'controlsStore'>
  >
): void {
  if (!skipTests.includes('childEnabled')) {
    expect(c.childEnabled).toEqual(true);
  }

  if (!skipTests.includes('childDirty')) {
    expect(c.childDirty).toEqual(false);
  }

  if (!skipTests.includes('childDisabled')) {
    expect(c.childDisabled).toEqual(false);
  }

  if (!skipTests.includes('childInvalid')) {
    expect(c.childInvalid).toEqual(false);
  }

  if (!skipTests.includes('childPending')) {
    expect(c.childPending).toEqual(false);
  }

  if (!skipTests.includes('childReadonly')) {
    expect(c.childReadonly).toEqual(false);
  }

  if (!skipTests.includes('childSubmitted')) {
    expect(c.childSubmitted).toEqual(false);
  }

  if (!skipTests.includes('childTouched')) {
    expect(c.childTouched).toEqual(false);
  }

  if (!skipTests.includes('childValid')) {
    expect(c.childValid).toEqual(true);
  }

  if (!skipTests.includes('childrenEnabled')) {
    expect(c.childrenEnabled).toEqual(true);
  }

  if (!skipTests.includes('childrenDirty')) {
    expect(c.childrenDirty).toEqual(false);
  }

  if (!skipTests.includes('childrenDisabled')) {
    expect(c.childrenDisabled).toEqual(false);
  }

  if (!skipTests.includes('childrenErrors')) {
    expect(c.childrenErrors).toEqual(null);
  }

  if (!skipTests.includes('childrenInvalid')) {
    expect(c.childrenInvalid).toEqual(false);
  }

  if (!skipTests.includes('childrenPending')) {
    expect(c.childrenPending).toEqual(false);
  }

  if (!skipTests.includes('childrenReadonly')) {
    expect(c.childrenReadonly).toEqual(false);
  }

  if (!skipTests.includes('childrenSubmitted')) {
    expect(c.childrenSubmitted).toEqual(false);
  }

  if (!skipTests.includes('childrenTouched')) {
    expect(c.childrenTouched).toEqual(false);
  }

  if (!skipTests.includes('childrenValid')) {
    expect(c.childrenValid).toEqual(true);
  }

  // jest bugs out of this test happens to fail
  // it seems like this is because jest attempts to fully iterate
  // and print (to console) the `controlsStore` object which is,
  // apparently, very large when you try to print it.
  // if (!skipTests.includes('controlsStore')) {
  //   expect(c.controlsStore).toEqual(new Map());
  // }
}

export function getControlEventsUntilEnd(
  control: AbstractControl,
  end?: Subject<any>
) {
  if (!end) {
    end = new Subject();
  }

  return [
    control.events.pipe(takeUntil(end), toArray()).toPromise(),
    end,
  ] as const;
}

export function subscribeToControlEventsUntilEnd(
  original: AbstractControl,
  subscriber: AbstractControl,
  end?: Subject<any>
) {
  if (!end) {
    end = new Subject();
  }

  original.events
    .pipe(takeUntil(end))
    .subscribe((e) => subscriber.processEvent(e));

  return [end] as const;
}

export function toControlMatcherEntries(
  controls: {
    [key: string]: AbstractControl;
  },
  options?: {
    skip?: string[];
  }
) {
  return Object.entries(controls).map(
    ([k, v]) => [k, expect.toEqualControl(v, options)] as const
  );
}

export function setExistingErrors(
  control: AbstractControl<any, any, any>,
  errors: ValidationErrors | null,
  errorsStore: ReadonlyMap<ControlId, ValidationErrors>
) {
  const c = control as any;

  c._errorsStore = errorsStore;
  c._selfErrors = errors;
  c._status = errors ? 'INVALID' : 'VALID';

  if (AbstractControlContainer.isControlContainer(control)) {
    c._errors = errors;
  }
}

export function mapControlsToId(
  obj: { [key: string]: AbstractControl } | AbstractControl[]
): any {
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => {
      if (AbstractControlContainer.isControlContainer(v)) {
        return [`${k} "${v.id.toString()}"`, mapControlsToId(v.controls)];
      }

      return [`${k}`, v.id.toString()];
    })
  );
}

export namespace TestSingletons {
  export let log = false;
}
