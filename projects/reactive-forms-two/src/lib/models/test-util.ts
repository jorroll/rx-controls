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

  if (!skipTests.includes('invalid')) {
    expect(c.invalid).toEqual(false);
  }

  if (!skipTests.includes('status')) {
    expect(c.status).toEqual('VALID');
  }

  if (!skipTests.includes('enabled')) {
    expect(c.enabled).toEqual(true);
  }

  if (!skipTests.includes('disabled')) {
    expect(c.disabled).toEqual(false);
  }

  if (!skipTests.includes('dirty')) {
    expect(c.dirty).toEqual(false);
  }

  if (!skipTests.includes('readonly')) {
    expect(c.readonly).toEqual(false);
  }

  if (!skipTests.includes('submitted')) {
    expect(c.submitted).toEqual(false);
  }

  if (!skipTests.includes('errors')) {
    expect(c.errors).toEqual(null);
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

  if (!skipTests.includes('containerEnabled')) {
    expect(c.containerEnabled).toEqual(true);
  }

  if (!skipTests.includes('containerDirty')) {
    expect(c.containerDirty).toEqual(false);
  }

  if (!skipTests.includes('containerDisabled')) {
    expect(c.containerDisabled).toEqual(false);
  }

  if (!skipTests.includes('containerErrors')) {
    expect(c.containerErrors).toEqual(null);
  }

  if (!skipTests.includes('containerInvalid')) {
    expect(c.containerInvalid).toEqual(false);
  }

  if (!skipTests.includes('containerPending')) {
    expect(c.containerPending).toEqual(false);
  }

  if (!skipTests.includes('containerReadonly')) {
    expect(c.containerReadonly).toEqual(false);
  }

  if (!skipTests.includes('containerSubmitted')) {
    expect(c.containerSubmitted).toEqual(false);
  }

  if (!skipTests.includes('containerTouched')) {
    expect(c.containerTouched).toEqual(false);
  }

  if (!skipTests.includes('containerValid')) {
    expect(c.containerValid).toEqual(true);
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

export function toControlMatcherEntries(controls: {
  [key: string]: AbstractControl;
}) {
  return Object.entries(controls).map(
    ([k, v]) => [k, expect.toEqualControl(v)] as const
  );
}

export function setExistingErrors(
  control: AbstractControlBase,
  errors: ValidationErrors | null,
  errorsStore: ReadonlyMap<ControlId, ValidationErrors>
) {
  const c = control as any;

  c._errorsStore = errorsStore;
  c._errors = errors;
  c._status = errors ? 'INVALID' : 'VALID';

  if (AbstractControlContainer.isControlContainer(control)) {
    c._combinedErrors = errors;
  }
}
