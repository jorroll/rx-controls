import { Component, forwardRef } from '@angular/core';
import { FormControl, FormGroup } from 'rx-controls';
import {
  RX_CONTROL_ACCESSOR,
  // rx_CONTROL_CONTAINER_ACCESSOR,
} from '../accessors/interface';

import { TestMultiChild } from './test-utils';
import { FormGroupDirective } from './form-group.directive';
import { FormControlDirective } from './form-control.directive';
import { FormControlNameDirective } from './form-control-name.directive';
import { DefaultFormGroupDirectiveAccessor } from './default-form-group.directive.accessor';

@Component({
  selector: 'my-accessor',
  template: `
    <ng-container [rxFormGroup]="control">
      <input rxFormControlName="firstName" />
      <input rxFormControlName="lastName" />
    </ng-container>
  `,
  providers: [
    {
      provide: RX_CONTROL_ACCESSOR,
      useExisting: forwardRef(() => SimpleGroupAccessorComponent),
      multi: true,
    },
  ],
})
export class SimpleGroupAccessorComponent {
  readonly control = new FormGroup({
    firstName: new FormControl(''),
    lastName: new FormControl(''),
  });
}

@Component({
  selector: 'my-test-component',
  template: ` <my-accessor [rxFormGroup]="control"></my-accessor> `,
  providers: [
    {
      provide: RX_CONTROL_ACCESSOR,
      useExisting: forwardRef(() => SimpleGroupComponent),
      multi: true,
    },
  ],
})
export class SimpleGroupComponent {
  readonly control = new FormGroup({
    firstName: new FormControl('John'),
    lastName: new FormControl('Carroll'),
  });
}

const beforeEachFn = TestMultiChild.buildBeforeEachFn({
  declarations: [
    FormGroupDirective,
    // FormGroupNameDirective,
    FormControlDirective,
    FormControlNameDirective,
    SimpleGroupAccessorComponent,
    DefaultFormGroupDirectiveAccessor,
  ],
});

describe('SimpleGroupAccessorComponent', () => {
  const o: TestMultiChild.TestArgs<SimpleGroupAccessorComponent> = {} as any;

  beforeEach(beforeEachFn(SimpleGroupAccessorComponent, o));

  it('initializes', () => {
    expect(o.component.control.rawValue).toEqual({
      firstName: '',
      lastName: '',
    });

    const firstName = o.container.querySelector(
      '[rxFormControlName="firstName"]'
    ) as HTMLInputElement;

    expect(firstName).toHaveProperty('value', '');

    const lastName = o.container.querySelector(
      '[rxFormControlName="lastName"]'
    ) as HTMLInputElement;

    expect(lastName).toHaveProperty('value', '');
  });

  it('disables', () => {
    o.component.control.markDisabled(true);

    const firstName = o.container.querySelector(
      '[rxFormControlName="firstName"]'
    ) as HTMLInputElement;

    const lastName = o.container.querySelector(
      '[rxFormControlName="lastName"]'
    ) as HTMLInputElement;

    expect(firstName.disabled).toBe(true);
    expect(lastName.disabled).toBe(true);
  });
});

describe('SimpleGroupComponent', () => {
  const o: TestMultiChild.TestArgs<SimpleGroupComponent> = {} as any;

  beforeEach(beforeEachFn(SimpleGroupComponent, o));

  it('initializes', () => {
    expect(o.component.control.rawValue).toEqual({
      firstName: 'John',
      lastName: 'Carroll',
    });

    const firstName = o.container.querySelector(
      '[rxFormControlName="firstName"]'
    ) as HTMLInputElement;

    expect(firstName).toHaveProperty('value', 'John');

    const lastName = o.container.querySelector(
      '[rxFormControlName="lastName"]'
    ) as HTMLInputElement;

    expect(lastName).toHaveProperty('value', 'Carroll');
  });
});
