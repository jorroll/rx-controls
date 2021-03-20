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
} from '@service-work/reactive-forms';
import { CommonModule } from '@angular/common';
import { AbstractControl } from '@service-work/reactive-forms/src/lib/models';
import { inspect } from 'util';

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
      validators: (c) => (c.value.length > 0 ? null : { required: true }),
    }),
  });

  showFormElement = true;

  private replay = this.control.replayState();

  toggle() {
    // this.showFormElement = !this.showFormElement;
    this.replay.subscribe(this.control.source);
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

  it.only('works', async () => {
    const { control } = o.component;
    const newValue = 'hi';

    expect(o.container.querySelector('#theDiv')).toBeTruthy();
    userEvent.clear(o.input);
    userEvent.type(o.input, newValue);

    expect(control.dirty).toEqual(true);
    expect(control.touched).toEqual(false);
    expect(control.value).toEqual({ one: 'hi' });
    expect(control.invalid).toEqual(false);
    expect(control.errors).toEqual(null);

    /**
     * The problem appears to be that `component.toggle()` replayState
     * is resetting the component#control's `controlStore` property.
     * Even though the new `controlStore` is a clone of the old one,
     * it still triggers the ControlNameDirective's `observe('controls', controlName)`
     * to fire again which causes `ControlNameDirective#control.setValidators(new Map())`
     * to fire but queue with the `providedControl.replayState()` to also fire and queue
     * causing an infinite loop.
     */

    AbstractControl.throwInfiniteLoopErrorAfterEventCount = 200;
    AbstractControl.debugCallback = function (a) {
      console.log(inspect({ id: this.id, ...a }, { depth: null }));

      if (a.event?.eventId === 209) {
        console.log(
          inspect(
            {
              id: this.id,
              validatorStore: this.validatorStore,
              errorsStore: this.errorsStore,
              errors: this.errors,
            },
            { depth: null }
          )
        );
      }
    };
    o.component.toggle();
    AbstractControl.debugCallback = undefined;

    await wait(0);

    o.fixture.detectChanges();

    expect(o.container.querySelector('#theDiv')).toBeFalsy();

    expect(control.dirty).toEqual(false);
    expect(control.touched).toEqual(false);
    expect(control.value).toEqual({ one: '' });
    expect(control.invalid).toEqual(true);
    expect(control.errors).toEqual({ required: true });
  });
});
