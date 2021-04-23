import {
  Directive,
  ElementRef,
  forwardRef,
  Injector,
  OnDestroy,
  OnInit,
  Renderer2,
} from '@angular/core';
import { Subscription } from 'rxjs';
import { FormControl } from 'reactive-form-controls';
import { BaseAccessor } from './base.accessor';
import {
  ControlAccessor,
  CONTROL_ACCESSOR_SPECIFICITY,
  SW_CONTROL_ACCESSOR,
} from './interface';
import { setupStdControlEventHandlers, setupListeners } from './util';

/**
 * @description
 * The `ControlValueAccessor` for writing a number value and listening to number input changes.
 * The value accessor is used by the `FormControlDirective`, `FormControlName`, and `NgModel`
 * directives.
 *
 * @usageNotes
 *
 * ### Using a number input with a reactive form.
 *
 * The following example shows how to use a number input with a reactive form.
 *
 * ```ts
 * const totalCountControl = new FormControl();
 * ```
 *
 * ```
 * <input type="number" [formControl]="totalCountControl">
 * ```
 *
 * @ngModule ReactiveFormsModule
 * @ngModule FormsModule
 * @publicApi
 */
@Directive({
  selector:
    'input[type=number][swFormControlName],input[type=number][swFormControl]' +
    'input[type=number][swInputAccessor]',
  providers: [
    {
      provide: SW_CONTROL_ACCESSOR,
      useExisting: forwardRef(() => NumberInputAccessor),
      multi: true,
    },
  ],
})
export class NumberInputAccessor
  extends BaseAccessor
  implements ControlAccessor<FormControl<number | null>>, OnInit, OnDestroy {
  static id = 0;

  [CONTROL_ACCESSOR_SPECIFICITY] = '0.2.1';

  readonly control = new FormControl<number | null>(null, {
    id: Symbol(`SwNumberInputAccessor-${NumberInputAccessor.id++}`),
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

    setupListeners(this, 'input', 'onInput');
    setupListeners(this, 'blur', 'onBlur');

    const sub1 = setupStdControlEventHandlers(this, {
      onValueChangeFn: (value) => {
        // The value needs to be normalized for IE9, otherwise it is set to 'null' when null
        const normalizedValue = value == null ? '' : value;
        this.renderer.setProperty(
          this.el.nativeElement,
          'value',
          normalizedValue
        );
      },
    });

    this.subscriptions.push(sub1);
  }

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  protected onInput(event: Event) {
    const value = (event.target as HTMLInputElement).value;

    this.control.markDirty(true);
    this.control.setValue(value == '' ? null : parseFloat(value));
  }

  protected onBlur() {
    this.control.markTouched(true);
  }
}
