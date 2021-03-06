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
import { FormControl } from 'rx-controls';
import { BaseAccessor } from './base.accessor';
import {
  ControlAccessor,
  CONTROL_ACCESSOR_SPECIFICITY,
  RX_CONTROL_ACCESSOR,
} from './interface';
import { setupStdControlEventHandlers, setupListeners } from './util';

declare const ngDevMode: boolean | undefined;

function _buildValueString(id: string | null, value: any): string {
  if (id == null) return `${value}`;
  if (typeof value === 'string') value = `'${value}'`;
  if (value && typeof value === 'object') value = 'Object';
  return `${id}: ${value}`.slice(0, 50);
}

@Directive()
export abstract class SelectAccessor
  extends BaseAccessor
  implements ControlAccessor<FormControl>, OnInit, OnDestroy {
  static id = 0;

  [CONTROL_ACCESSOR_SPECIFICITY] = '0.2.1';

  readonly control = new FormControl(null as any, {
    id: Symbol(`RxSelectAccessor-${SelectAccessor.id++}`),
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

  protected optionMap = new Map<string, RxSelectOption>();
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

  _registerOption(option: RxSelectOption): string {
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

@Directive({ selector: 'option' })
export class RxSelectOption implements OnDestroy {
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

@Directive({
  selector:
    'select:not([multiple])[rxFormControlName],select:not([multiple])[rxFormControl]',
  providers: [
    {
      provide: RX_CONTROL_ACCESSOR,
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

@Directive({
  selector:
    'select[multiple][rxFormControlName],select[multiple][rxFormControl]',
  providers: [
    {
      provide: RX_CONTROL_ACCESSOR,
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
