import {
  ElementRef,
  Renderer2,
  forwardRef,
  Directive,
  OnInit,
  OnDestroy,
  Injector,
  Input,
} from '@angular/core';
import { setupStdControlEventHandlers, setupListeners } from './util';
import { FormControl } from '../models';
import {
  SW_CONTROL_ACCESSOR,
  ControlAccessor,
  CONTROL_ACCESSOR_SPECIFICITY,
} from './interface';
import { Subscription } from 'rxjs';
import { BaseAccessor } from './base.accessor';

/**
 * @description
 * The default `ControlValueAccessor` for writing a value and listening to changes on input
 * elements. The accessor is used by the `FormControlDirective`, `FormControlName`, and
 * `NgModel` directives.
 *
 * @usageNotes
 *
 * ### Using the default value accessor
 *
 * The following example shows how to use an input element that activates the default value accessor
 * (in this case, a text field).
 *
 * ```ts
 * const firstNameControl = new FormControl();
 * ```
 *
 * ```
 * <input type="text" [formControl]="firstNameControl">
 * ```
 *
 * @ngModule ReactiveFormsModule
 * @ngModule FormsModule
 * @publicApi
 */
@Directive({ selector: 'DefaultAccessor' })
export abstract class DefaultAccessor
  extends BaseAccessor
  implements ControlAccessor<FormControl<string>>, OnInit, OnDestroy {
  readonly control = new FormControl();

  private subscriptions: Subscription[] = [];

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

  protected onInput(event: Event): void {
    const { value } = event.target as HTMLInputElement | HTMLTextAreaElement;

    this.control.markDirty(true);
    this.control.setValue(value);
  }

  protected onBlur() {
    this.control.markTouched(true);
  }
}

export function a(s: string, d: any) {
  return {
    selector: s,
    providers: [
      {
        provide: SW_CONTROL_ACCESSOR,
        useExisting: d,
        multi: true,
      },
      {
        provide: DefaultAccessor,
        useExisting: d,
      },
    ],
  };
}

@Directive(
  a(
    'input[swFormControl],input[swFormControlName],' +
      'textarea[swFormControl],textarea[swFormControlName],',
    DefaultAccessorInputTextarea
  )
)
export class DefaultAccessorInputTextarea extends DefaultAccessor {
  [CONTROL_ACCESSOR_SPECIFICITY] = '0.1.1';
}

@Directive(a('[swInputAccessor]', DefaultAccessorAttribute))
export class DefaultAccessorAttribute extends DefaultAccessor {
  [CONTROL_ACCESSOR_SPECIFICITY] = '0.1.0';
}