import { Component, forwardRef } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormGroup } from '../models';
import { ReactiveFormsModule2 } from './form.module';
import {
  NG_CONTROL_ACCESSOR,
  NG_CONTROL_CONTAINER_ACCESSOR,
} from '../accessors/interface';

import { render, screen, fireEvent } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { IControlValueMapper } from './interface';
import { wait } from '../models/test-util';

@Component({
  selector: 'my-test-component',
  template: `
    <input [ngFormControl]="control" [ngFormControlValueMapper]="valueMapper" />
  `,
})
export class SimpleValueMapperTestComponent {
  readonly control = new FormControl<Date | null>(new Date(2020, 0, 1));

  readonly valueMapper: IControlValueMapper<Date | null, string> = {
    to: (value) => value?.toISOString() ?? '',
    from: (value) => (value ? new Date(Date.parse(value)) : null),
  };
}

describe('SimpleValueMapperTestComponent', () => {
  let container: HTMLElement;
  let fixture: ComponentFixture<SimpleValueMapperTestComponent>;
  let component: SimpleValueMapperTestComponent;

  beforeEach(async () => {
    ({ container, fixture } = await render(SimpleValueMapperTestComponent, {
      imports: [ReactiveFormsModule2],
    }));

    component = fixture.componentInstance;
  });

  it('initializes', () => {
    const input = container.querySelector('input')!;

    expect(input.value).toEqual(component.control.value!.toISOString());
  });

  it('updates', () => {
    const input = container.querySelector('input')!;

    const newDate = new Date(2021, 1, 1);

    userEvent.clear(input);
    userEvent.paste(input, newDate.toISOString());

    expect(component.control.value).toEqual(newDate);
    expect(input.value).toEqual(newDate.toISOString());
  });
});

@Component({
  selector: 'my-test-component',
  template: `
    <div ngFormGroupName="name">
      <input ngFormControlName="firstName" />
      <input ngFormControlName="lastName" />
    </div>

    <input
      ngFormControlName="birthdate"
      [ngFormControlValueMapper]="valueMapper"
    />

    <div ngFormGroupName="relative">
      <div ngFormGroupName="name">
        <input [ngFormControl]="alternateRelativeFirstNameControl" />
        <input ngFormControlName="lastName" />
      </div>
    </div>
  `,
  providers: [
    {
      provide: NG_CONTROL_ACCESSOR,
      useExisting: forwardRef(() => ComplexValueMapperTestComponent),
      multi: true,
    },
    {
      provide: NG_CONTROL_CONTAINER_ACCESSOR,
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
    to: (value) => value?.toISOString() ?? '',
    from: (value) => (value ? new Date(Date.parse(value)) : null),
  };

  alternateRelativeFirstNameControl = new FormControl('Bobby');

  updateBirthdate(date: Date | null) {
    this.control.patchValue({
      birthdate: date,
    });
  }

  updateFirstName(text: string) {
    this.alternateRelativeFirstNameControl.setValue(text);
  }
}

describe('ComplexValueMapperTestComponent', () => {
  let container: HTMLElement;
  let fixture: ComponentFixture<ComplexValueMapperTestComponent>;
  let component: ComplexValueMapperTestComponent;

  beforeEach(async () => {
    ({ container, fixture } = await render(ComplexValueMapperTestComponent, {
      imports: [ReactiveFormsModule2],
    }));

    component = fixture.componentInstance;
  });

  it('initializes', () => {
    expect(component.control.value).toEqual({
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

    expect(component.alternateRelativeFirstNameControl.value).toEqual('Bobby');

    const name = container.querySelector(
      '[ngFormGroupName="name"]'
    ) as HTMLDivElement;

    const name_firstName = name.querySelector(
      '[ngFormControlName="firstName"]'
    ) as HTMLInputElement;

    expect(name_firstName).toHaveProperty('value', 'John');

    const name_lastName = name.querySelector(
      '[ngFormControlName="lastName"]'
    ) as HTMLInputElement;

    expect(name_lastName).toHaveProperty('value', 'Carroll');

    const birthdate = container.querySelector(
      '[ngFormControlName="birthdate"]'
    ) as HTMLInputElement;

    expect(birthdate.value).toEqual(new Date(2020, 0, 1).toISOString());

    const relative = container.querySelector(
      '[ngFormGroupName="relative"]'
    ) as HTMLDivElement;

    const relative_firstName = relative.querySelector('input');

    expect(relative_firstName).toHaveProperty('value', 'Bobby');

    const relative_lastName = relative.querySelector(
      '[ngFormControlName="lastName"]'
    ) as HTMLInputElement;

    expect(relative_lastName).toHaveProperty('value', 'Paul');
  });

  it('updateBirthdate', () => {
    const newDate = new Date(1919, 0, 1);

    component.updateBirthdate(newDate);

    expect(component.control.value).toEqual({
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

    const birthdate = container.querySelector(
      '[ngFormControlName="birthdate"]'
    ) as HTMLInputElement;

    expect(birthdate.value).toEqual(newDate.toISOString());
  });

  it('updateFirstName', async () => {
    component.updateFirstName('Jack');

    expect(component.alternateRelativeFirstNameControl.value).toEqual('Jack');

    expect(component.control.value).toEqual({
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

    const relative = container.querySelector(
      '[ngFormGroupName="relative"]'
    ) as HTMLDivElement;

    const relative_firstName = relative.querySelector('input');

    expect(relative_firstName).toHaveProperty('value', 'Jack');

    component.control.patchValue({
      relative: {
        name: {
          firstName: 'Bill',
        },
      },
    });

    await wait(0); // without this, errors inside the event loop will be silently suppressed

    expect(component.alternateRelativeFirstNameControl.value).toEqual('Jack');
    expect(relative_firstName).toHaveProperty('value', 'Jack');
  });

  it('error if trying to add child control to a new FormGroup', () => {
    const firstName = component.control.get('name').get('firstName');

    const form = new FormGroup();

    expect(() => form.addControl('test', firstName)).toThrowError();
  });
});
