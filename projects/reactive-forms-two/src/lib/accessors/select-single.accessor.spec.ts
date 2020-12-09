import { CommonModule } from '@angular/common';
import { Component, ViewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import userEvent from '@testing-library/user-event';
import {
  SelectAccessor,
  SwSelectOption,
  SelectSingleAccessor,
  SelectMultipleAccessor,
} from './select.accessor';
// import { SelectAccessor, SwSelectOption } from './select.accessor';
import { buildBeforeEachFn, BuildTestArgs } from './test-utils';

type TestArgs<T> = BuildTestArgs<
  T,
  SelectAccessor,
  HTMLSelectElement,
  'select'
>;

const beforeEachFn = buildBeforeEachFn<SelectAccessor, 'select'>({
  declarations: [SelectSingleAccessor, SelectMultipleAccessor, SwSelectOption],
  element: 'select',
});

@Component({
  selector: 'my-test-component',
  template: ` <select swFormControl></select> `,
})
export class SelectNoOptionsComponent {
  @ViewChild(SelectAccessor) accessor!: SelectAccessor;
}

describe('SelectNoOptionsComponent', () => {
  const o: TestArgs<SelectNoOptionsComponent> = {} as any;

  beforeEach(beforeEachFn(SelectNoOptionsComponent, o));

  it('initializes', () => {
    expect(o.select.value).toEqual('');
    expect(o.accessor.deactivated).toBe(false);
    expect(o.control.value).toEqual(null);
    expect(o.control.dirty).toEqual(false);
    expect(o.control.touched).toEqual(false);
  });

  it('markDisabled', () => {
    o.control.markDisabled(true);

    expect(o.select.disabled).toEqual(true);
    expect(o.accessor.deactivated).toBe(false);
    expect(o.control.value).toEqual(null);
    expect(o.control.dirty).toEqual(false);
    expect(o.control.touched).toEqual(false);

    o.control.markDisabled(false);

    expect(o.select.disabled).toEqual(false);
    expect(o.accessor.deactivated).toBe(false);
    expect(o.control.value).toEqual(null);
    expect(o.control.dirty).toEqual(false);
    expect(o.control.touched).toEqual(false);
  });
});

@Component({
  selector: 'my-test-component',
  template: `
    <select swFormControl>
      <option value="mac">macOS</option>
      <option value="linux">Linux</option>
      <option id="stringValue" [value]="stringValue">Windows</option>
      <option id="objectValue" [ngValue]="objectValue"></option>
    </select>
  `,
})
export class SelectWithOptionsComponent {
  @ViewChild(SelectAccessor) accessor!: SelectAccessor;

  stringValue = 'windows';
  objectValue = new Map([['one', { three: 3 }]]);
}

describe('SelectWithOptionsComponent', () => {
  const o: TestArgs<SelectWithOptionsComponent> = {} as any;

  beforeEach(beforeEachFn(SelectWithOptionsComponent, o));

  it('initializes', () => {
    expect(o.select.value).toEqual("0: 'mac'");
    expect(o.accessor.deactivated).toBe(false);
    expect(o.control.value).toEqual(null);
    expect(o.control.dirty).toEqual(false);
    expect(o.control.touched).toEqual(false);
  });

  it('select option with value', () => {
    userEvent.selectOptions(o.select, "1: 'linux'");

    expect(o.select.value).toEqual("1: 'linux'");
    expect(o.control.value).toEqual('linux');
    expect(o.control.dirty).toEqual(true);
    expect(o.control.touched).toEqual(false);
  });

  it('select option with ngValue', () => {
    const option = o.container.querySelector(
      '#objectValue'
    ) as HTMLOptionElement;

    userEvent.selectOptions(o.select, option);

    expect(o.select.value).toEqual('3: Object');
    expect(o.control.value).toEqual(o.component.objectValue);
    expect(o.control.dirty).toEqual(true);
    expect(o.control.touched).toEqual(false);
  });

  it('is touched on blur', () => {
    o.select.focus();
    expect(o.control.touched).toEqual(false);
    o.select.blur();
    expect(o.control.touched).toEqual(true);
  });

  describe('setValue on control', () => {
    it('"mac"', () => {
      o.control.setValue('mac');
      expect(o.select.value).toEqual("0: 'mac'");
      expect(o.select.selectedIndex).toEqual(0);
      expect(o.control.value).toEqual('mac');
      expect(o.control.dirty).toEqual(false);
      expect(o.control.touched).toEqual(false);
    });

    it('"linux"', () => {
      o.control.setValue('linux');
      expect(o.select.value).toEqual("1: 'linux'");
      expect(o.select.selectedIndex).toEqual(1);
      expect(o.control.value).toEqual('linux');
      expect(o.control.dirty).toEqual(false);
      expect(o.control.touched).toEqual(false);
    });

    it('"pizza"', () => {
      o.control.setValue('pizza');
      expect(o.select.value).toEqual('');
      expect(o.select.selectedOptions.length).toEqual(0);
      expect(o.select.selectedIndex).toEqual(-1);
      expect(o.control.value).toEqual('pizza');
      expect(o.control.dirty).toEqual(false);
      expect(o.control.touched).toEqual(false);
    });

    it('stringValue', () => {
      o.control.setValue(o.component.stringValue);
      expect(o.select.value).toEqual("2: 'windows'");
      expect(o.select.selectedIndex).toEqual(2);
      expect(o.control.value).toEqual('windows');
      expect(o.control.dirty).toEqual(false);
      expect(o.control.touched).toEqual(false);
    });

    it('objectValue', () => {
      o.control.setValue(o.component.objectValue);
      expect(o.select.value).toEqual('3: Object');
      expect(o.select.selectedIndex).toEqual(3);
      expect(o.control.value).toEqual(o.component.objectValue);
      expect(o.control.dirty).toEqual(false);
      expect(o.control.touched).toEqual(false);
    });

    it('Set', () => {
      const set = new Set(['one']);

      o.control.setValue(set);
      expect(o.select.value).toEqual('');
      expect(o.select.selectedIndex).toEqual(-1);
      expect(o.control.value).toEqual(set);
      expect(o.control.dirty).toEqual(false);
      expect(o.control.touched).toEqual(false);
    });
  });
});

@Component({
  selector: 'my-test-component',
  template: `
    <select swFormControl>
      <option *ngIf="one" value="mac">macOS</option>
      <option value="linux">Linux</option>
      <option value="windows">Windows</option>
    </select>
  `,
})
export class SelectNgIfComponent {
  @ViewChild(SelectAccessor) accessor!: SelectAccessor;
  one = false;
}

describe('SelectNgIfComponent', () => {
  const o: TestArgs<SelectNgIfComponent> = {} as any;

  beforeEach(beforeEachFn(SelectNgIfComponent, o));

  it('initializes', () => {
    expect(o.select.value).toEqual("0: 'linux'");
    expect(o.select.selectedIndex).toEqual(0);
    expect(o.accessor.deactivated).toBe(false);
    expect(o.control.value).toEqual(null);
    expect(o.control.dirty).toEqual(false);
    expect(o.control.touched).toEqual(false);
  });

  it('works', () => {
    o.component.one = true;
    o.fixture.detectChanges();

    expect(o.select.value).toEqual("0: 'linux'");
    expect(o.select.selectedIndex).toEqual(1);
    expect(o.control.value).toEqual(null);
    expect(o.control.dirty).toEqual(false);
    expect(o.control.touched).toEqual(false);

    o.control.setValue('mac');

    expect(o.select.value).toEqual("2: 'mac'");
    expect(o.select.selectedIndex).toEqual(0);
    expect(o.control.value).toEqual('mac');
    expect(o.control.dirty).toEqual(false);
    expect(o.control.touched).toEqual(false);

    o.component.one = false;
    o.fixture.detectChanges();

    expect(o.select.value).toEqual("0: 'linux'");
    expect(o.select.selectedIndex).toEqual(0);
    expect(o.control.value).toEqual('linux');
    expect(o.control.dirty).toEqual(false);
    expect(o.control.touched).toEqual(false);
  });
});
