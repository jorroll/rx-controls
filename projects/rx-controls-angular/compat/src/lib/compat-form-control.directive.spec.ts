import { Component } from '@angular/core';
import { FormControl, IControlValueMapper } from 'rx-controls-angular';
import userEvent from '@testing-library/user-event';
import { CompatFormControlDirective } from './compat-form-control.directive';
import { TestSingleChild } from './test-utils';

const beforeEachFn = TestSingleChild.buildBeforeEachFn({
  declarations: [CompatFormControlDirective],
});

@Component({
  selector: 'my-test-component',
  template: `
    <input
      formControl
      [rxFormControl]="control"
      [rxFormControlValueMapper]="valueMapper"
    />
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

  it('disables', () => {
    o.component.control.markDisabled(true);
    expect(o.input.disabled).toEqual(true);
  });

  it('enables', () => {
    o.component.control.markDisabled(true);
    o.component.control.markDisabled(false);
    expect(o.input.disabled).toEqual(false);
  });
});
