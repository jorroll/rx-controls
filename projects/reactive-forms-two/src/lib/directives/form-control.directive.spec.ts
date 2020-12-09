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

@Component({
  selector: 'my-test-component',
  template: ` <input swFormControl type="text" /> `,
})
export class NoProvidedControlComponent {}

describe('NoProvidedControlComponent', () => {
  let container: HTMLElement;
  let fixture: ComponentFixture<NoProvidedControlComponent>;
  let component: NoProvidedControlComponent;

  beforeEach(async () => {
    ({ container, fixture } = await render(NoProvidedControlComponent, {
      imports: [ReactiveFormsModuleTwo],
    }));

    component = fixture.componentInstance;
  });

  it('initializes', () => {
    const input = container.querySelector('input')!;
    expect(input.value).toEqual('');
    expect(input.className).toContain('sw-untouched');
    expect(input.className).toContain('sw-not-submitted');
    expect(input.className).toContain('sw-pristine');
  });

  it('applies css on touch', () => {
    const input = container.querySelector('input')!;
    input.focus();
    input.blur();
    expect(input.className).toContain('sw-touched');
    expect(input.className).toContain('sw-not-submitted');
    expect(input.className).toContain('sw-pristine');
  });

  it('applies css on input', () => {
    const input = container.querySelector('input')!;

    userEvent.type(input, 'hi');

    expect(input.value).toContain('hi');
    expect(input.className).toContain('sw-untouched');
    expect(input.className).toContain('sw-not-submitted');
    expect(input.className).toContain('sw-dirty');
  });
});

@Component({
  selector: 'my-test-component',
  template: `
    <input [swFormControl]="control" [swFormControlValueMapper]="valueMapper" />
  `,
})
export class SimpleValueMapperComponent {
  readonly control = new FormControl<Date | null>(new Date(2020, 0, 1));

  readonly valueMapper: IControlValueMapper<Date | null, string> = {
    to: (value) => value?.toISOString() ?? '',
    from: (value) => (value ? new Date(Date.parse(value)) : null),
  };
}

describe('SimpleValueMapperComponent', () => {
  let container: HTMLElement;
  let fixture: ComponentFixture<SimpleValueMapperComponent>;
  let component: SimpleValueMapperComponent;

  beforeEach(async () => {
    ({ container, fixture } = await render(SimpleValueMapperComponent, {
      imports: [ReactiveFormsModuleTwo],
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
