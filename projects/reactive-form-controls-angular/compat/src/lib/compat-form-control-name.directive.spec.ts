import { Component } from '@angular/core';
import userEvent from '@testing-library/user-event';
import { TestSingleChild, wait } from './test-utils';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { CompatFormControlNameDirective } from './compat-form-control-name.directive';
import {
  ReactiveFormsModuleTwo,
  FormGroup,
  FormControl,
} from 'reactive-form-controls-angular';
import { CommonModule } from '@angular/common';

const beforeEachFn = TestSingleChild.buildBeforeEachFn({
  declarations: [CompatFormControlNameDirective],
  imports: [
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModuleTwo,
    CommonModule,
  ],
});

@Component({
  selector: 'my-test-component',
  template: `
    <div id="theDiv" *ngIf="showFormElement" [swFormGroup]="control">
      <mat-form-field>
        <input matInput formControl swFormControlName="one" />
      </mat-form-field>
    </div>
  `,
})
export class MatInputTestComponent {
  readonly control = new FormGroup({
    one: new FormControl('', {
      validators: (c) =>
        typeof c.value === 'string' && c.value.length > 0
          ? null
          : { required: true },
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

describe('MatInputTestComponent', () => {
  const o: TestSingleChild.TestArgs<
    MatInputTestComponent,
    HTMLInputElement,
    'input'
  > = {} as any;

  beforeEach(beforeEachFn(MatInputTestComponent, 'input', o));

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
