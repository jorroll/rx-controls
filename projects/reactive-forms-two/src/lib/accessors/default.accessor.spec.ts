import { Component, ViewChild } from '@angular/core';
import {
  DefaultAccessor,
  DefaultAccessorAttribute,
  DefaultAccessorInputTextarea,
} from './default.accessor';
import { buildBeforeEachFn, BuildTestArgs } from './test-utils';

type TestArgs<T> = BuildTestArgs<T, DefaultAccessor, HTMLInputElement, 'input'>;

const beforeEachFn = buildBeforeEachFn<DefaultAccessor, 'input'>({
  declarations: [DefaultAccessorInputTextarea, DefaultAccessorAttribute],
  element: 'input',
});

@Component({
  selector: 'my-test-component',
  template: ` <input swFormControl type="text" /> `,
})
export class TextInputComponent {
  @ViewChild(DefaultAccessor) accessor!: DefaultAccessor;
}

describe('TextInputComponent', () => {
  const o: TestArgs<TextInputComponent> = {} as any;

  beforeEach(beforeEachFn(TextInputComponent, o));

  it('initializes', () => {
    expect(o.input.value).toEqual('');
    expect(o.accessor.deactivated).toBe(false);
    expect(o.control.rawValue).toEqual('');
    expect(o.control.value).toEqual('');
    expect(o.control.dirty).toEqual(false);
    expect(o.control.touched).toEqual(false);
  });
});

@Component({
  selector: 'my-test-component',
  template: ` <input swFormControl type="text" value="hi" /> `,
})
export class InitialValueTextInputComponent {
  @ViewChild(DefaultAccessor) accessor!: DefaultAccessor;
}

describe('InitialValueTextInputComponent', () => {
  const o: TestArgs<InitialValueTextInputComponent> = {} as any;

  beforeEach(beforeEachFn(InitialValueTextInputComponent, o));

  it('initializes', () => {
    expect(o.input.value).toEqual('hi');
    expect(o.accessor.deactivated).toBe(false);
    expect(o.control.rawValue).toEqual('');
    expect(o.control.value).toEqual('');
    expect(o.control.dirty).toEqual(false);
    expect(o.control.touched).toEqual(false);
  });
});
