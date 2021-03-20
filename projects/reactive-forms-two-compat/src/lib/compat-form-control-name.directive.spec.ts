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
    this.showFormElement = !this.showFormElement;
    this.replay.subscribe((e) => this.control.processEvent(e));
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

  it('works', async () => {
    const { control } = o.component;
    const newValue = 'hi';

    expect(o.container.querySelector('#theDiv')).toBeTruthy();
    userEvent.clear(o.input);
    userEvent.type(o.input, newValue);

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

    o.component.toggle();

    // for some reason this is necessary to detect infinite loop errors
    await wait(0);

    o.fixture.detectChanges();

    expect(o.container.querySelector('#theDiv')).toBeFalsy();

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
  });
});
