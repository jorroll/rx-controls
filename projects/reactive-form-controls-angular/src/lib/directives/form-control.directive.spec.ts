import { Component, forwardRef } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  IControlStateChangeEvent,
} from 'reactive-form-controls';
import { ReactiveFormsModuleTwo } from './form.module';
import {
  SW_CONTROL_ACCESSOR,
  // SW_CONTROL_CONTAINER_ACCESSOR,
} from '../accessors/interface';

import { render, screen, fireEvent } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { IControlValueMapper } from './interface';
import { wait } from '../test-util';
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
    toAccessor: (value) => value?.toISOString() ?? '',
    fromAccessor: (value) => (value ? new Date(Date.parse(value)) : null),
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
    this.replay.subscribe((e) => this.control.processEvent(e));
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

  it('toggle', () => {
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

@Component({
  selector: 'my-test-component',
  template: `
    <input *ngIf="showInput" [swFormControl]="control.get('one')" />
  `,
})
export class NgIfReplayStateWithFormGroupTestComponent {
  readonly control = new FormGroup({
    one: new FormControl('', {
      validators: (o) => (o.value !== '' ? null : { required: true }),
    }),
  });

  showInput = true;
  replay = this.control.replayState();

  async toggle() {
    if (this.showInput) {
      this.replay.subscribe((e) => this.control.processEvent(e));
    }

    this.showInput = !this.showInput;
  }
}

describe('NgIfReplayStateWithFormGroupTestComponent', () => {
  const o: TestSingleChild.TestArgs<
    NgIfReplayStateWithFormGroupTestComponent,
    HTMLInputElement,
    'input'
  > = {} as any;

  beforeEach(
    beforeEachFn(NgIfReplayStateWithFormGroupTestComponent, 'input', o)
  );

  it('initializes', () => {
    expect(o.component.control.errors).toEqual({ required: true });
    expect(o.input.value).toEqual(o.component.control.value.one);
  });

  // This tests a bug that I encountered in how replayState worked.
  // The cause turned out to be that I was mutating the event object
  // saved within replayState and so subsequent subscriptions would
  // return unexpected results.
  it('replayState resets value', async () => {
    const { control } = o.component;
    const newValue = 'hi';
    const getInput = () => o.container.querySelector('input')!;

    expect(getInput()).toBeTruthy();

    expect(control.dirty).toEqual(false);
    expect(control.selfDirty).toEqual(false);
    expect(control.touched).toEqual(false);
    expect(control.selfTouched).toEqual(false);
    expect(control.rawValue).toEqual({ one: '' });
    expect(control.value).toEqual({ one: '' });
    expect(control.invalid).toEqual(true);
    expect(control.selfInvalid).toEqual(false);
    expect(control.errors).toEqual({ required: true });
    expect(control.selfErrors).toEqual(null);
    expect(control.childrenErrors).toEqual({ required: true });

    userEvent.clear(getInput());
    userEvent.type(getInput(), newValue);

    expect(control.dirty).toEqual(true);
    expect(control.selfDirty).toEqual(false);
    expect(control.childDirty).toEqual(true);
    expect(control.touched).toEqual(false);
    expect(control.selfTouched).toEqual(false);
    expect(control.rawValue).toEqual({ one: 'hi' });
    expect(control.value).toEqual({ one: 'hi' });
    expect(control.invalid).toEqual(false);
    expect(control.selfInvalid).toEqual(false);
    expect(control.errors).toEqual(null);
    expect(control.selfErrors).toEqual(null);

    await o.component.toggle();
    o.fixture.detectChanges();

    expect(getInput()).toBeFalsy();

    expect(control.dirty).toEqual(false);
    expect(control.selfDirty).toEqual(false);
    expect(control.touched).toEqual(false);
    expect(control.selfTouched).toEqual(false);
    expect(control.rawValue).toEqual({ one: '' });
    expect(control.value).toEqual({ one: '' });
    expect(control.invalid).toEqual(true);
    expect(control.selfInvalid).toEqual(false);
    expect(control.errors).toEqual({ required: true });
    expect(control.selfErrors).toEqual(null);
    expect(control.childrenErrors).toEqual({ required: true });

    await o.component.toggle();
    o.fixture.detectChanges();

    expect(getInput()).toBeTruthy();

    userEvent.clear(getInput());
    userEvent.type(getInput(), newValue);

    expect(control.dirty).toEqual(true);
    expect(control.selfDirty).toEqual(false);
    expect(control.childDirty).toEqual(true);
    expect(control.touched).toEqual(false);
    expect(control.selfTouched).toEqual(false);
    expect(control.rawValue).toEqual({ one: 'hi' });
    expect(control.value).toEqual({ one: 'hi' });
    expect(control.invalid).toEqual(false);
    expect(control.selfInvalid).toEqual(false);
    expect(control.errors).toEqual(null);
    expect(control.selfErrors).toEqual(null);

    await o.component.toggle();
    o.fixture.detectChanges();

    expect(getInput()).toBeFalsy();

    expect(control.dirty).toEqual(false);
    expect(control.selfDirty).toEqual(false);
    expect(control.touched).toEqual(false);
    expect(control.selfTouched).toEqual(false);
    expect(control.rawValue).toEqual({ one: '' });
    expect(control.value).toEqual({ one: '' });
    expect(control.invalid).toEqual(true);
    expect(control.selfInvalid).toEqual(false);
    expect(control.errors).toEqual({ required: true });
    expect(control.selfErrors).toEqual(null);
    expect(control.childrenErrors).toEqual({ required: true });

    // for some reason this is necessary to detect infinite loop errors
    await wait(0);
  });
});
