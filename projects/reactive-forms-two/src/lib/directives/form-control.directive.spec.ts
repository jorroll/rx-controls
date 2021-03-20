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
import { TestSingleChild } from './test-utils';
import { FormControlDirective } from './form-control.directive';

const beforeEachFn = TestSingleChild.buildBeforeEachFn({
  declarations: [FormControlDirective],
});

@Component({
  selector: 'my-test-component',
  template: ` <input swFormControl type="text" /> `,
})
export class NoProvidedControlComponent {}

describe('NoProvidedControlComponent', () => {
  const o: TestSingleChild.TestArgs<
    NoProvidedControlComponent,
    HTMLInputElement,
    'input'
  > = {} as any;

  beforeEach(beforeEachFn(NoProvidedControlComponent, 'input', o));

  it('initializes', () => {
    expect(o.input.value).toEqual('');
    expect(o.input.className).toContain('sw-untouched');
    expect(o.input.className).toContain('sw-not-submitted');
    expect(o.input.className).toContain('sw-pristine');
  });

  it('applies css on touch', () => {
    o.input.focus();
    expect(o.input.className).toContain('sw-untouched');
    o.input.blur();
    expect(o.input.className).toContain('sw-touched');
    expect(o.input.className).toContain('sw-not-submitted');
    expect(o.input.className).toContain('sw-pristine');
  });

  it('applies css on input', () => {
    userEvent.type(o.input, 'hi');

    expect(o.input.value).toContain('hi');
    expect(o.input.className).toContain('sw-untouched');
    expect(o.input.className).toContain('sw-not-submitted');
    expect(o.input.className).toContain('sw-dirty');
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
  const o: TestSingleChild.TestArgs<
    SimpleValueMapperComponent,
    HTMLInputElement,
    'input'
  > = {} as any;

  beforeEach(beforeEachFn(SimpleValueMapperComponent, 'input', o));

  it('initializes', () => {
    expect(o.input.value).toEqual(o.component.control.rawValue!.toISOString());
  });

  it('updates', () => {
    const newDate = new Date(2021, 1, 1);

    userEvent.clear(o.input);
    userEvent.paste(o.input, newDate.toISOString());

    expect(o.component.control.rawValue).toEqual(newDate);
    expect(o.input.value).toEqual(newDate.toISOString());
  });
});

@Component({
  selector: 'my-test-component',
  template: ` <input [swFormControl]="control" /> `,
})
export class ReplayStateTestComponent {
  readonly control = new FormControl('');

  replay = this.control.replayState();

  toggle() {
    this.replay.subscribe(this.control.source);
  }
}

describe('ReplayStateTestComponent', () => {
  const o: TestSingleChild.TestArgs<
    ReplayStateTestComponent,
    HTMLInputElement,
    'input'
  > = {} as any;

  beforeEach(beforeEachFn(ReplayStateTestComponent, 'input', o));

  it('initializes', () => {
    expect(o.input.value).toEqual(o.component.control.rawValue);
  });

  it.only('toggle', () => {
    const { control } = o.component;
    const newValue = 'hi';

    userEvent.clear(o.input);
    userEvent.type(o.input, newValue);

    expect(control.rawValue).toEqual(newValue);
    expect(o.input.value).toEqual(newValue);
    expect(control.dirty).toEqual(true);

    o.component.toggle();

    expect(control.dirty).toEqual(false);
    expect(control.value).toEqual('');
  });
});
