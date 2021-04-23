import { Component, forwardRef } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormGroup } from 'reactive-form-controls';
import { ReactiveFormsModuleTwo } from './form.module';
import {
  SW_CONTROL_ACCESSOR,
  // SW_CONTROL_CONTAINER_ACCESSOR,
} from '../accessors/interface';

import { render, screen, fireEvent } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { IControlValueMapper } from './interface';
import { wait } from '../test-util';
import { TestMultiChild } from './test-utils';
import { FormGroupDirective } from './form-group.directive';
import { FormControlDirective } from './form-control.directive';
import { FormControlNameDirective } from './form-control-name.directive';
import { FormGroupNameDirective } from './form-group-name.directive';
import { DefaultFormGroupDirectiveAccessor } from './default-form-group.directive.accessor';

@Component({
  selector: 'my-accessor',
  template: `
    <ng-container [swFormGroup]="control">
      <input swFormControlName="firstName" />
      <input swFormControlName="lastName" />
    </ng-container>
  `,
  providers: [
    {
      provide: SW_CONTROL_ACCESSOR,
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
  template: ` <my-accessor [swFormGroup]="control"></my-accessor> `,
  providers: [
    {
      provide: SW_CONTROL_ACCESSOR,
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
      '[swFormControlName="firstName"]'
    ) as HTMLInputElement;

    expect(firstName).toHaveProperty('value', '');

    const lastName = o.container.querySelector(
      '[swFormControlName="lastName"]'
    ) as HTMLInputElement;

    expect(lastName).toHaveProperty('value', '');
  });

  it('disables', () => {
    o.component.control.markDisabled(true);

    const firstName = o.container.querySelector(
      '[swFormControlName="firstName"]'
    ) as HTMLInputElement;

    const lastName = o.container.querySelector(
      '[swFormControlName="lastName"]'
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
      '[swFormControlName="firstName"]'
    ) as HTMLInputElement;

    expect(firstName).toHaveProperty('value', 'John');

    const lastName = o.container.querySelector(
      '[swFormControlName="lastName"]'
    ) as HTMLInputElement;

    expect(lastName).toHaveProperty('value', 'Carroll');
  });
});
