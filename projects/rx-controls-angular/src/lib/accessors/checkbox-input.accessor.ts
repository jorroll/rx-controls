import {
  Directive,
  ElementRef,
  forwardRef,
  Injector,
  OnDestroy,
  OnInit,
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

/**
 * @description
 * A `ControlValueAccessor` for writing a value and listening to changes on a checkbox input
 * element.
 *
 * @usageNotes
 *
 * ### Using a checkbox with a reactive form.
 *
 * The following example shows how to use a checkbox with a reactive form.
 *
 * ```ts
 * const rememberLoginControl = new FormControl();
 * ```
 *
 * ```
 * <input type="checkbox" [formControl]="rememberLoginControl">
 * ```
 *
 * @ngModule ReactiveFormsModule
 * @ngModule FormsModule
 * @publicApi
 */
@Directive({
  selector:
    'input[type=checkbox][rxFormControlName],input[type=checkbox][rxFormControl]' +
    'input[type=checkbox][rxInputAccessor]',
  providers: [
    {
      provide: RX_CONTROL_ACCESSOR,
      useExisting: forwardRef(() => CheckboxInputAccessor),
      multi: true,
    },
  ],
})
export class CheckboxInputAccessor
  extends BaseAccessor
  implements ControlAccessor<FormControl<boolean>>, OnInit, OnDestroy {
  static id = 0;

  [CONTROL_ACCESSOR_SPECIFICITY] = '0.2.1';

  readonly control = new FormControl<boolean>(null as any, {
    id: Symbol(`RxCheckboxInputAccessor-${CheckboxInputAccessor.id++}`),
  });

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
      onValueChangeFn: (value) => {
        this.renderer.setProperty(this.el.nativeElement, 'checked', value);
      },
    });

    this.subscriptions.push(sub1);
  }

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  protected onChange(event: Event) {
    const value = (event.target as HTMLInputElement).checked;

    this.control.markDirty(true);
    this.control.setValue(value);
  }

  protected onBlur() {
    this.control.markTouched(true);
  }
}
