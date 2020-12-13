import {
  OnDestroy,
  OnChanges,
  Directive,
  Inject,
  Self,
  SimpleChange,
  Renderer2,
  ElementRef,
  forwardRef,
  Input,
  Optional,
} from '@angular/core';
import { AbstractControl, FormControl } from '../models';
import {
  IControlDirectiveCallback,
  SW_CONTROL_DIRECTIVE,
  SW_CONTROL_DIRECTIVE_CALLBACK,
} from './interface';
import { resolveControlAccessor, syncAccessorToControl } from './util';
import { ControlAccessor, SW_CONTROL_ACCESSOR } from '../accessors/interface';
import { ControlDirective } from './control.directive';
import { IControlValueMapper } from './interface';
import { concat } from 'rxjs';

@Directive({
  selector: '[swFormControl]:not([formControl])',
  exportAs: 'swForm',
  providers: [
    {
      provide: SW_CONTROL_DIRECTIVE,
      useExisting: forwardRef(() => FormControlDirective),
    },
  ],
})
export class FormControlDirective<T extends AbstractControl = AbstractControl>
  extends ControlDirective<T>
  implements ControlAccessor<T>, OnChanges, OnDestroy {
  @Input('swFormControl') providedControl: T | undefined;
  @Input('swFormControlValueMapper')
  valueMapper: IControlValueMapper | undefined;

  readonly control: T;

  constructor(
    @Self()
    @Inject(SW_CONTROL_ACCESSOR)
    accessors: ControlAccessor[],
    @Optional()
    @Inject(SW_CONTROL_DIRECTIVE_CALLBACK)
    protected controlDirectiveCallbacks: IControlDirectiveCallback<T>[] | null,
    renderer: Renderer2,
    el: ElementRef
  ) {
    super(renderer, el);

    this.control = resolveControlAccessor(accessors).control as T;
  }

  ngOnChanges(_: {
    providedControl?: SimpleChange;
    valueMapper?: SimpleChange;
  }) {
    // Here, we allow doing <input swFormControl> which simply applies
    // the appropriate css to the host element and doesn't link a providedControl.
    // We do *not* allow actively setting <input [swFormControl]="null">
    // or <input [swFormControl]="undefined">
    if ((this.providedControl as unknown) === '') {
      this.providedControl = undefined;
      return;
    }

    if (!AbstractControl.isControl(this.providedControl)) {
      throw new Error(
        `SwFormControlDirective must be passed an AbstractControl via swFormControl`
      );
    }

    this.assertValidValueMapper(
      'SwFormControlDirective#swFormControlValueMapper',
      this.valueMapper
    );

    super.ngOnChanges(_);
  }
}
