import { Component, forwardRef } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormGroup } from '../models';
import { ReactiveFormsModuleTwo } from './form.module';
import {
  SW_CONTROL_ACCESSOR,
  // SW_CONTROL_CONTAINER_ACCESSOR,
} from '../accessors/interface';

import { render, screen, fireEvent } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { IControlValueMapper } from './interface';
import { wait } from '../models/test-util';
import { TestMultiChild } from './test-utils';
import { FormGroupDirective } from './form-group.directive';
import { FormControlDirective } from './form-control.directive';
import { FormControlNameDirective } from './form-control-name.directive';
import { FormGroupNameDirective } from './form-group-name.directive';
import { DefaultFormGroupDirectiveAccessor } from './default-form-group.directive.accessor';

@Component({
  selector: 'my-accessor',
  template: `
    <input swFormControlName="firstName" />
    <input swFormControlName="lastName" />
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

describe('SimpleGroupComponent', () => {
  const o: TestMultiChild.TestArgs<SimpleGroupComponent> = {} as any;

  beforeEach(beforeEachFn(SimpleGroupComponent, o));

  it('initializes', () => {
    expect(o.component.control.value).toEqual({
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
