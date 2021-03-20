import {
  Directive,
  ElementRef,
  forwardRef,
  Host,
  Injector,
  Input,
  OnDestroy,
  OnInit,
  Optional,
  Renderer2,
} from '@angular/core';
import { Subscription } from 'rxjs';
import { FormControl } from '../models';
import { BaseAccessor } from './base.accessor';
import {
  ControlAccessor,
  CONTROL_ACCESSOR_SPECIFICITY,
  SW_CONTROL_ACCESSOR,
} from './interface';
import { setupStdControlEventHandlers, setupListeners } from './util';

declare const ngDevMode: boolean | undefined;

function _buildValueString(id: string | null, value: any): string {
  if (id == null) return `${value}`;
  if (typeof value === 'string') value = `'${value}'`;
  if (value && typeof value === 'object') value = 'Object';
  return `${id}: ${value}`.slice(0, 50);
}

/** Mock interface for HTML Options */
interface HTMLOption {
  value: string;
  selected: boolean;
}

/** Mock interface for HTMLCollection */
abstract class HTMLCollection {
  // TODO(issue/24571): remove '!'.
  length!: number;
  abstract item(_: number): HTMLOption;
}

@Directive()
export abstract class SelectAccessor
  extends BaseAccessor
  implements ControlAccessor<FormControl>, OnInit, OnDestroy {
  static id = 0;

  [CONTROL_ACCESSOR_SPECIFICITY] = '0.2.1';

  readonly control = new FormControl(null as any, {
    id: Symbol(`SwSelectAccessor-${SelectAccessor.id++}`),
  });

  private _compareWith = Object.is;

  /**
   * @description
   * Tracks the option comparison algorithm for tracking identities when
   * checking for changes.
   */
  @Input()
  set compareWith(fn: (o1: any, o2: any) => boolean) {
    if (
      typeof fn !== 'function' &&
      (typeof ngDevMode === 'undefined' || ngDevMode)
    ) {
      throw new Error(
        `compareWith must be a function, but received ${JSON.stringify(fn)}`
      );
    }

    this._compareWith = fn;
  }

  protected abstract onValueChangeFn: (value: any) => void;

  protected optionMap = new Map<string, SwSelectOption>();
  protected optionIdCounter = 0;

  constructor(
    protected renderer: Renderer2,
    protected el: ElementRef,
    protected injector: Injector
  ) {
    super(injector);
  }

  ngOnInit() {
    if (this.shouldDeactivate()) return;

    setupListeners(this, 'change', 'onChange');
    setupListeners(this, 'blur', 'onBlur');

    const sub1 = setupStdControlEventHandlers(this, {
      onValueChangeFn: this.onValueChangeFn,
    });

    this.subscriptions.push(sub1);
  }

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  protected abstract onChange(event: Event): void;

  protected onBlur() {
    this.control.markTouched(true);
  }

  _registerOption(option: SwSelectOption): string {
    const id: string = (this.optionIdCounter++).toString();
    this.optionMap.set(id, option);
    return id;
  }

  abstract _optionDestroyed(id: string): void;

  protected getOptionValueFromDOMValue(providedDomValue: string): any {
    const id = this.getOptionIdFromDOMValue(providedDomValue);

    if (!this.optionMap.has(id)) {
      throw new Error('Unexpected...');
    }

    return this.optionMap.get(id)!.value;
  }

  protected getIdOfOptionAssociatedWithControlValue(
    controlValue: any
  ): string | null {
    for (const [id, { value }] of this.optionMap) {
      if (this._compareWith(value, controlValue)) return id;
    }

    return null;
  }

  protected getOptionIdFromDOMValue(domValue: string) {
    return domValue.split(':')[0];
  }
}

/**
 * @description
 * Marks `<option>` as dynamic, so Angular can be notified when options change.
 *
 * @see `SelectMultipleControlValueAccessor`
 *
 * @ngModule ReactiveFormsModule
 * @ngModule FormsModule
 * @publicApi
 */
@Directive({ selector: 'option' })
export class SwSelectOption implements OnDestroy {
  /**
   * @description
   * Tracks the value bound to the option element. Unlike the value binding,
   * ngValue supports binding to objects.
   */
  @Input('ngValue')
  set ngValue(value: any) {
    if (this.select == null) return;
    this._value = value;
    this.domValue = _buildValueString(this.id!, value);
    this.setElementValue(this.domValue);
  }
  get ngValue() {
    return this._value;
  }

  /**
   * @description
   * Tracks simple string values bound to the option element.
   * For objects, use the `ngValue` input binding.
   */
  @Input('value')
  set value(value: any) {
    if (this.select) {
      this._value = value;
      this.domValue = _buildValueString(this.id!, value);
      this.setElementValue(this.domValue);
    } else {
      this.setElementValue(value);
    }
  }
  get value() {
    return this._value;
  }
  private _value: any;

  /**
   * @description
   * ID of the option element
   */
  id: string | undefined;

  domValue = '';

  private select: SelectAccessor | null = null;

  constructor(
    private el: ElementRef,
    private renderer: Renderer2,
    @Optional() @Host() select: SelectAccessor
  ) {
    this.select = select;
    if (this.select) this.id = this.select._registerOption(this);
  }

  ngOnDestroy(): void {
    if (this.select) {
      this.select._optionDestroyed(this.id!);
    }
  }

  setSelected(selected: boolean) {
    this.renderer.setProperty(this.el.nativeElement, 'selected', selected);
  }

  protected setElementValue(value: string): void {
    this.renderer.setProperty(this.el.nativeElement, 'value', value);
  }
}

/**
 * @description
 * The `ControlValueAccessor` for writing select control values and listening to select control
 * changes. The value accessor is used by the `FormControlDirective`, `FormControlName`, and
 * `NgModel` directives.
 *
 * @usageNotes
 *
 * ### Using select controls in a reactive form
 *
 * The following examples show how to use a select control in a reactive form.
 *
 * {@example forms/ts/reactiveSelectControl/reactive_select_control_example.ts region='Component'}
 *
 * ### Using select controls in a template-driven form
 *
 * To use a select in a template-driven form, simply add an `ngModel` and a `name`
 * attribute to the main `<select>` tag.
 *
 * {@example forms/ts/selectControl/select_control_example.ts region='Component'}
 *
 * ### Customizing option selection
 *
 * Angular uses object identity to select option. It's possible for the identities of items
 * to change while the data does not. This can happen, for example, if the items are produced
 * from an RPC to the server, and that RPC is re-run. Even if the data hasn't changed, the
 * second response will produce objects with different identities.
 *
 * To customize the default option comparison algorithm, `<select>` supports `compareWith` input.
 * `compareWith` takes a **function** which has two arguments: `option1` and `option2`.
 * If `compareWith` is given, Angular selects option by the return value of the function.
 *
 * ```ts
 * const selectedCountriesControl = new FormControl();
 * ```
 *
 * ```
 * <select [compareWith]="compareFn"  [formControl]="selectedCountriesControl">
 *     <option *ngFor="let country of countries" [ngValue]="country">
 *         {{country.name}}
 *     </option>
 * </select>
 *
 * compareFn(c1: Country, c2: Country): boolean {
 *     return c1 && c2 ? c1.id === c2.id : c1 === c2;
 * }
 * ```
 *
 * **Note:** We listen to the 'change' event because 'input' events aren't fired
 * for selects in Firefox and IE:
 * https://bugzilla.mozilla.org/show_bug.cgi?id=1024350
 * https://developer.microsoft.com/en-us/microsoft-edge/platform/issues/4660045/
 *
 * @ngModule ReactiveFormsModule
 * @ngModule FormsModule
 * @publicApi
 */
@Directive({
  selector:
    'select:not([multiple])[swFormControlName],select:not([multiple])[swFormControl]',
  providers: [
    {
      provide: SW_CONTROL_ACCESSOR,
      useExisting: forwardRef(() => SelectAccessor),
      multi: true,
    },
    {
      provide: SelectAccessor,
      useExisting: SelectSingleAccessor,
    },
  ],
})
export class SelectSingleAccessor
  extends SelectAccessor
  implements ControlAccessor<FormControl>, OnInit, OnDestroy {
  selectedId: string | null = null;

  protected onValueChangeFn = (value: unknown) => {
    const selectedId = this.getIdOfOptionAssociatedWithControlValue(value);

    if (!selectedId) {
      this.renderer.setProperty(
        this.el.nativeElement,
        'value',
        _buildValueString(null, value)
      );

      this.selectedId = null;
      return;
    }

    this.selectedId = selectedId;

    if (!this.optionMap.has(selectedId)) {
      throw new Error('Unexpected...');
    }

    this.optionMap.get(selectedId)!.setSelected(true);
  };

  protected onChange(event: Event) {
    const { value } = event.target as HTMLSelectElement;
    this.control.markDirty(true);
    this.control.setValue(this.getOptionValueFromDOMValue(value));
  }

  _optionDestroyed(id: string) {
    const data = this.optionMap.get(id);

    if (!data) return;

    this.optionMap.delete(id);

    if (this.selectedId === id) {
      // When the selected option is removed from the dom,
      // the first option in the dom is automatically selected but
      // no event is emitted. We need to manually set the control
      // value to the value of the newly selected option to keep
      // the control/dom in sync. Unfortunately, we can't determine
      // what the "first" option is, because items may have been
      // moved around since being added to the dom and because
      // we don't know what environment this code is running in.
      // Our only solution is to randomly make a new option the
      // "selected" option. This will ensure that, when the old
      // option is removed from the DOM, since it isn't selected
      // the "select" element will not have it's value silently
      // changed in an unpredictable way. If you want
      // to prevent this from happening, manually select a new option
      // before removing an option from the DOM.

      for (const { value } of this.optionMap.values()) {
        this.control.setValue(value);
        return;
      }
    }
  }
}

/**
 * @description
 * The `ControlValueAccessor` for writing multi-select control values and listening to multi-select
 * control changes. The value accessor is used by the `FormControlDirective`, `FormControlName`, and
 * `NgModel` directives.
 *
 * @see `SelectControlValueAccessor`
 *
 * @usageNotes
 *
 * ### Using a multi-select control
 *
 * The follow example shows you how to use a multi-select control with a reactive form.
 *
 * ```ts
 * const countryControl = new FormControl();
 * ```
 *
 * ```
 * <select multiple name="countries" [formControl]="countryControl">
 *   <option *ngFor="let country of countries" [ngValue]="country">
 *     {{ country.name }}
 *   </option>
 * </select>
 * ```
 *
 * ### Customizing option selection
 *
 * To customize the default option comparison algorithm, `<select>` supports `compareWith` input.
 * See the `SelectControlValueAccessor` for usage.
 *
 * @ngModule ReactiveFormsModule
 * @ngModule FormsModule
 * @publicApi
 */
@Directive({
  selector:
    'select[multiple][swFormControlName],select[multiple][swFormControl]',
  providers: [
    {
      provide: SW_CONTROL_ACCESSOR,
      useExisting: forwardRef(() => SelectMultipleAccessor),
      multi: true,
    },
    {
      provide: SelectAccessor,
      useExisting: SelectMultipleAccessor,
    },
  ],
})
export class SelectMultipleAccessor
  extends SelectAccessor
  implements ControlAccessor<FormControl<unknown[]>>, OnInit, OnDestroy {
  readonly control = new FormControl<unknown[]>([]);

  selectedIds: string[] = [];

  protected onValueChangeFn = (value: unknown) => {
    this.selectedIds = [];

    if (!Array.isArray(value)) {
      this.optionMap.forEach((opt) => opt.setSelected(false));
      return;
    }

    value.map((v) => {
      const id = this.getIdOfOptionAssociatedWithControlValue(v);

      if (!id) return;

      this.selectedIds.push(id);
    });

    this.optionMap.forEach((opt, optId) => {
      opt.setSelected(this.selectedIds.includes(optId));
    });
  };

  _optionDestroyed(id: string): void {
    const { value } = this.optionMap.get(id)!;

    this.optionMap.delete(id);

    if (!Array.isArray(this.control.rawValue)) return;

    const newValue = this.control.rawValue.slice();
    newValue.splice(newValue.indexOf(value), 1);
    this.control.setValue(newValue);
  }

  protected onChange(event: Event) {
    const el = event.target as HTMLSelectElement;

    let selected: Array<any>;

    if (el.selectedOptions !== undefined) {
      selected = Array.from(el.selectedOptions).map((option) =>
        this.getOptionValueFromDOMValue(option.value)
      );
    }
    // Degrade on IE
    else {
      selected = Array.from(el.options)
        .filter((o) => o.selected)
        .map((o) => this.getOptionValueFromDOMValue(o.value));
    }

    this.control.markDirty(true);
    this.control.setValue(selected);
  }
}
