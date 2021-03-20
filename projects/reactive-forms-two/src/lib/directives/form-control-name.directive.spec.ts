import { Component } from '@angular/core';
import userEvent from '@testing-library/user-event';
import { TestSingleChild } from './test-utils';
import { FormGroupDirective } from './form-group.directive';
import { FormControlNameDirective } from './form-control-name.directive';
import { wait } from '../models/test-util';
import { FormControl, FormGroup, IControlStateChangeEvent } from '../models';
import { DefaultFormGroupDirectiveAccessor } from './default-form-group.directive.accessor';

const beforeEachFn = TestSingleChild.buildBeforeEachFn({
  declarations: [
    FormControlNameDirective,
    FormGroupDirective,
    DefaultFormGroupDirectiveAccessor,
  ],
});

@Component({
  selector: 'my-test-component',
  template: `
    <div id="theDiv" *ngIf="showFormElement" [swFormGroup]="control">
      <input swFormControlName="one" />
    </div>
  `,
})
export class InputTestComponent {
  readonly control = new FormGroup({
    one: new FormControl('', {
      validators: (c) => (c.value.length > 0 ? null : { required: true }),
    }),
  });

  showFormElement = true;

  replay = this.control.replayState();

  async toggle() {
    if (this.showFormElement) {
      this.control.processEvent(await this.replay.toPromise());
    }

    this.showFormElement = !this.showFormElement;
  }
}

describe('InputTestComponent', () => {
  const o: TestSingleChild.TestArgs<
    InputTestComponent,
    HTMLInputElement,
    'input'
  > = {} as any;

  beforeEach(beforeEachFn(InputTestComponent, 'input', o));

  it('initializes', () => {
    expect(o.component.control.errors).toEqual({ required: true });
    expect(o.input.value).toEqual(o.component.control.value.one);
  });

  it('updates', () => {
    const newValue = 'hi';

    userEvent.clear(o.input);
    userEvent.paste(o.input, newValue);

    expect(o.component.control.rawValue).toEqual({ one: newValue });
    expect(o.input.value).toEqual(newValue);
  });

  it('disables', () => {
    o.component.control.markDisabled(true);
    expect(o.component.control.controls.one.disabled).toEqual(false);
    expect(o.input.disabled).toEqual(true);
  });

  it('enables', () => {
    o.component.control.markDisabled(true);
    o.component.control.markDisabled(false);
    expect(o.input.disabled).toEqual(false);
  });

  // This test setup (including use of `toggle()`) is mimicking
  // a bug I found in another app. The repitition in the test
  // is important since the bug was only showing up after doing
  // the same thing multiple times
  it('replayState resets value', async () => {
    const { control } = o.component;
    const newValue = 'hi';
    const getInput = () => o.container.querySelector('input')!;
    const getDev = () => o.container.querySelector('#theDiv');

    expect(getDev()).toBeTruthy();

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

    expect(getDev()).toBeFalsy();

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

    expect(getDev()).toBeTruthy();

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

    expect(getDev()).toBeFalsy();

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
