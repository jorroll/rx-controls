import { Component, forwardRef } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormGroup } from 'rx-controls';
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

const beforeEachFn = TestMultiChild.buildBeforeEachFn({
  declarations: [
    // FormGroupDirective,
    FormGroupNameDirective,
    FormControlDirective,
    FormControlNameDirective,
    DefaultFormGroupDirectiveAccessor,
  ],
});

@Component({
  selector: 'my-test-component',
  template: `
    <div swFormGroupName="name">
      <input swFormControlName="firstName" />
      <input swFormControlName="lastName" />
    </div>

    <input
      swFormControlName="birthdate"
      [swFormControlValueMapper]="valueMapper"
    />

    <div swFormGroupName="relative">
      <div swFormGroupName="name">
        <input [swFormControl]="alternateRelativeFirstNameControl" />
        <input swFormControlName="lastName" />
      </div>
    </div>
  `,
  providers: [
    {
      provide: SW_CONTROL_ACCESSOR,
      useExisting: forwardRef(() => ComplexValueMapperTestComponent),
      multi: true,
    },
  ],
})
export class ComplexValueMapperTestComponent {
  readonly control = new FormGroup({
    name: new FormGroup({
      firstName: new FormControl('John'),
      lastName: new FormControl('Carroll'),
    }),
    birthdate: new FormControl<Date | null>(new Date(2020, 0, 1)),
    relative: new FormGroup({
      name: new FormGroup({
        firstName: new FormControl('Alison'),
        lastName: new FormControl('Paul'),
      }),
    }),
  });

  readonly valueMapper: IControlValueMapper<Date | null, string> = {
    toAccessor: (value) => value?.toISOString() ?? '',
    fromAccessor: (value) => (value ? new Date(Date.parse(value)) : null),
  };

  alternateRelativeFirstNameControl = new FormControl('Bobby');

  updateBirthdate(date: Date | null) {
    this.control.patchValue({
      birthdate: date,
    });
  }

  updateFirstName(text: string) {
    this.control.get('name').get('firstName').setValue(text);
  }

  updateRelativeFirstName(text: string) {
    this.alternateRelativeFirstNameControl.setValue(text);
  }
}

describe('ComplexValueMapperTestComponent', () => {
  const o: TestMultiChild.TestArgs<ComplexValueMapperTestComponent> = {} as any;

  beforeEach(beforeEachFn(ComplexValueMapperTestComponent, o));

  it('initializes', () => {
    expect(o.component.control.rawValue).toEqual({
      name: {
        firstName: 'John',
        lastName: 'Carroll',
      },
      birthdate: new Date(2020, 0, 1),
      relative: {
        name: {
          firstName: 'Alison',
          lastName: 'Paul',
        },
      },
    });

    expect(o.component.alternateRelativeFirstNameControl.rawValue).toEqual(
      'Bobby'
    );

    const name = o.container.querySelector(
      '[swFormGroupName="name"]'
    ) as HTMLDivElement;

    const name_firstName = name.querySelector(
      '[swFormControlName="firstName"]'
    ) as HTMLInputElement;

    expect(name_firstName).toHaveProperty('value', 'John');

    const name_lastName = name.querySelector(
      '[swFormControlName="lastName"]'
    ) as HTMLInputElement;

    expect(name_lastName).toHaveProperty('value', 'Carroll');

    const birthdate = o.container.querySelector(
      '[swFormControlName="birthdate"]'
    ) as HTMLInputElement;

    expect(birthdate.value).toEqual(new Date(2020, 0, 1).toISOString());

    const relative = o.container.querySelector(
      '[swFormGroupName="relative"]'
    ) as HTMLDivElement;

    const relative_firstName = relative.querySelector('input');

    expect(relative_firstName).toHaveProperty('value', 'Bobby');

    const relative_lastName = relative.querySelector(
      '[swFormControlName="lastName"]'
    ) as HTMLInputElement;

    expect(relative_lastName).toHaveProperty('value', 'Paul');
  });

  it('updateBirthdate', () => {
    const newDate = new Date(1919, 0, 1);

    o.component.updateBirthdate(newDate);

    expect(o.component.control.rawValue).toEqual({
      name: {
        firstName: 'John',
        lastName: 'Carroll',
      },
      birthdate: newDate,
      relative: {
        name: {
          firstName: 'Alison',
          lastName: 'Paul',
        },
      },
    });

    const birthdate = o.container.querySelector(
      '[swFormControlName="birthdate"]'
    ) as HTMLInputElement;

    expect(birthdate.value).toEqual(newDate.toISOString());
  });

  it('updateFirstName', async () => {
    o.component.updateFirstName('Cassidy');

    expect(o.component.control.get('name').get('firstName').value).toEqual(
      'Cassidy'
    );

    expect(o.component.control.rawValue).toEqual({
      name: {
        firstName: 'Cassidy',
        lastName: 'Carroll',
      },
      birthdate: new Date(2020, 0, 1),
      relative: {
        name: {
          firstName: 'Alison',
          lastName: 'Paul',
        },
      },
    });

    const name = o.container.querySelector(
      '[swFormGroupName="name"]'
    ) as HTMLDivElement;

    const name_firstName = name.querySelector('input');

    expect(name_firstName).toHaveProperty('value', 'Cassidy');

    o.component.control.patchValue({
      name: {
        firstName: 'Bill',
      },
    });

    await wait(0); // without this, errors inside the event loop are silently suppressed

    expect(o.component.control.get('name').get('firstName').value).toEqual(
      'Bill'
    );

    expect(name_firstName).toHaveProperty('value', 'Bill');
  });

  it('updateRelativeFirstName', async () => {
    o.component.updateRelativeFirstName('Jack');

    expect(o.component.alternateRelativeFirstNameControl.rawValue).toEqual(
      'Jack'
    );

    expect(o.component.control.rawValue).toEqual({
      name: {
        firstName: 'John',
        lastName: 'Carroll',
      },
      birthdate: new Date(2020, 0, 1),
      relative: {
        name: {
          firstName: 'Alison',
          lastName: 'Paul',
        },
      },
    });

    const relative = o.container.querySelector(
      '[swFormGroupName="relative"]'
    ) as HTMLDivElement;

    const relative_firstName = relative.querySelector('input');

    expect(relative_firstName).toHaveProperty('value', 'Jack');

    o.component.control.patchValue({
      relative: {
        name: {
          firstName: 'Bill',
        },
      },
    });

    await wait(0); // without this, errors inside the event loop are silently suppressed

    expect(o.component.alternateRelativeFirstNameControl.rawValue).toEqual(
      'Jack'
    );
    expect(relative_firstName).toHaveProperty('value', 'Jack');
  });

  it('error if trying to add child control to a new FormGroup', () => {
    const firstName = o.component.control.get('name').get('firstName');

    const form = new FormGroup();

    expect(() => form.addControl('test', firstName)).toThrowError();
  });
});
