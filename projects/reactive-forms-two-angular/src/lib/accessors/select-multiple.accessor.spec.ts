import { CommonModule } from '@angular/common';
import { Component, ViewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import userEvent from '@testing-library/user-event';
import {
  SelectAccessor,
  SwSelectOption,
  SelectMultipleAccessor,
  SelectSingleAccessor,
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
  template: ` <select multiple swFormControl></select> `,
})
export class SelectNoOptionsComponent {
  @ViewChild(SelectAccessor) accessor!: SelectAccessor;
}

describe('SelectNoOptionsComponent', () => {
  const o: TestArgs<SelectNoOptionsComponent> = {} as any;

  beforeEach(beforeEachFn(SelectNoOptionsComponent, o));

  it('initializes', () => {
    expect(o.select.value).toEqual('');
    expect(o.select.selectedOptions.length).toEqual(0);
    expect(o.accessor.deactivated).toBe(false);
    expect(o.control.rawValue).toEqual([]);
    expect(o.control.dirty).toEqual(false);
    expect(o.control.touched).toEqual(false);
  });

  it('markDisabled', () => {
    o.control.markDisabled(true);

    expect(o.select.disabled).toEqual(true);
    expect(o.select.selectedOptions.length).toEqual(0);
    expect(o.accessor.deactivated).toBe(false);
    expect(o.control.rawValue).toEqual([]);
    expect(o.control.dirty).toEqual(false);
    expect(o.control.touched).toEqual(false);

    o.control.markDisabled(false);

    expect(o.select.disabled).toEqual(false);
    expect(o.select.selectedOptions.length).toEqual(0);
    expect(o.accessor.deactivated).toBe(false);
    expect(o.control.rawValue).toEqual([]);
    expect(o.control.dirty).toEqual(false);
    expect(o.control.touched).toEqual(false);
  });
});

@Component({
  selector: 'my-test-component',
  template: `
    <select multiple swFormControl>
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
    expect(o.select.value).toEqual('');
    expect(o.select.selectedOptions.length).toEqual(0);
    expect(o.accessor.deactivated).toBe(false);
    expect(o.control.rawValue).toEqual([]);
    expect(o.control.dirty).toEqual(false);
    expect(o.control.touched).toEqual(false);
  });

  it('select option with value', () => {
    userEvent.selectOptions(o.select, "1: 'linux'");

    expect(o.select.value).toEqual("1: 'linux'");
    expect(o.select.selectedIndex).toEqual(1);
    expect(o.select.selectedOptions.length).toEqual(1);
    expect(o.control.rawValue).toEqual(['linux']);
    expect(o.control.dirty).toEqual(true);
    expect(o.control.touched).toEqual(false);

    userEvent.selectOptions(o.select, "0: 'mac'");

    expect(o.select.value).toEqual("0: 'mac'");
    expect(o.select.selectedIndex).toEqual(0);
    expect(o.select.selectedOptions.length).toEqual(2);
    expect(o.control.rawValue).toEqual(['mac', 'linux']);
    expect(o.control.dirty).toEqual(true);
    expect(o.control.touched).toEqual(false);
  });

  it('select option with ngValue', () => {
    const option = o.container.querySelector(
      '#objectValue'
    ) as HTMLOptionElement;

    userEvent.selectOptions(o.select, option);

    expect(o.select.value).toEqual('3: Object');
    expect(o.select.selectedOptions.length).toEqual(1);
    expect(o.control.rawValue).toEqual([o.component.objectValue]);
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
      o.control.setValue(['mac']);
      expect(o.select.value).toEqual("0: 'mac'");
      expect(o.select.selectedIndex).toEqual(0);
      expect(o.select.selectedOptions.length).toEqual(1);
      expect(o.control.rawValue).toEqual(['mac']);
      expect(o.control.dirty).toEqual(false);
      expect(o.control.touched).toEqual(false);
    });

    it('"linux" and "mac"', () => {
      o.control.setValue(['linux', 'mac']);
      expect(o.select.value).toEqual("0: 'mac'");
      expect(o.select.selectedIndex).toEqual(0);
      expect(o.select.selectedOptions.length).toEqual(2);
      expect(o.control.rawValue).toEqual(['linux', 'mac']);
      expect(o.control.dirty).toEqual(false);
      expect(o.control.touched).toEqual(false);
    });

    it('"pizza"', () => {
      o.control.setValue(['pizza']);
      expect(o.select.value).toEqual('');
      expect(o.select.selectedOptions.length).toEqual(0);
      expect(o.select.selectedIndex).toEqual(-1);
      expect(o.control.rawValue).toEqual(['pizza']);
      expect(o.control.dirty).toEqual(false);
      expect(o.control.touched).toEqual(false);
    });

    it('stringValue', () => {
      o.control.setValue(o.component.stringValue);
      expect(o.select.value).toEqual('');
      expect(o.select.selectedIndex).toEqual(-1);
      expect(o.select.selectedOptions.length).toEqual(0);
      expect(o.control.rawValue).toEqual(o.component.stringValue);
      expect(o.control.dirty).toEqual(false);
      expect(o.control.touched).toEqual(false);
    });

    it('mixed existance', () => {
      o.control.setValue(['linux', 'pizza']);
      expect(o.select.value).toEqual("1: 'linux'");
      expect(o.select.selectedIndex).toEqual(1);
      expect(o.select.selectedOptions.length).toEqual(1);
      expect(o.control.rawValue).toEqual(['linux', 'pizza']);
      expect(o.control.dirty).toEqual(false);
      expect(o.control.touched).toEqual(false);
    });
  });
});

@Component({
  selector: 'my-test-component',
  template: `
    <select multiple swFormControl>
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
    expect(o.select.value).toEqual('');
    expect(o.select.selectedIndex).toEqual(-1);
    expect(o.select.selectedOptions.length).toEqual(0);
    expect(o.accessor.deactivated).toBe(false);
    expect(o.control.rawValue).toEqual([]);
    expect(o.control.dirty).toEqual(false);
    expect(o.control.touched).toEqual(false);
  });

  it('works', () => {
    o.component.one = true;
    o.fixture.detectChanges();

    expect(o.select.value).toEqual('');
    expect(o.select.selectedIndex).toEqual(-1);
    expect(o.select.selectedOptions.length).toEqual(0);
    expect(o.control.rawValue).toEqual([]);
    expect(o.control.dirty).toEqual(false);
    expect(o.control.touched).toEqual(false);

    o.control.setValue(['mac', 'windows']);

    expect(o.select.value).toEqual("2: 'mac'");
    expect(o.select.selectedIndex).toEqual(0);
    expect(o.select.selectedOptions.length).toEqual(2);
    expect(o.control.rawValue).toEqual(['mac', 'windows']);
    expect(o.control.dirty).toEqual(false);
    expect(o.control.touched).toEqual(false);

    o.component.one = false;
    o.fixture.detectChanges();

    expect(o.select.value).toEqual("1: 'windows'");
    expect(o.select.selectedIndex).toEqual(1);
    expect(o.select.selectedOptions.length).toEqual(1);
    expect(o.control.rawValue).toEqual(['windows']);
    expect(o.control.dirty).toEqual(false);
    expect(o.control.touched).toEqual(false);
  });
});
