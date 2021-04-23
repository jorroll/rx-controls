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
import { AbstractControl } from 'rx-controls';
import {
  IControlDirectiveCallback,
  RX_CONTROL_DIRECTIVE,
  RX_CONTROL_DIRECTIVE_CALLBACK,
} from './interface';
import { resolveControlAccessor } from './util';
import { ControlAccessor, RX_CONTROL_ACCESSOR } from '../accessors/interface';
import { ControlDirective } from './control.directive';
import { IControlValueMapper } from './interface';

@Directive({
  selector: '[rxFormControl]:not([formControl])',
  exportAs: 'rxForm',
  providers: [
    {
      provide: RX_CONTROL_DIRECTIVE,
      useExisting: forwardRef(() => FormControlDirective),
    },
  ],
})
export class FormControlDirective<T extends AbstractControl = AbstractControl>
  extends ControlDirective<T>
  implements ControlAccessor<T>, OnChanges, OnDestroy {
  @Input('rxFormControl') providedControl: T | undefined;
  @Input('rxFormControlValueMapper')
  valueMapper: IControlValueMapper | undefined;

  readonly control: T;

  constructor(
    @Self()
    @Inject(RX_CONTROL_ACCESSOR)
    accessors: ControlAccessor[],
    @Optional()
    @Inject(RX_CONTROL_DIRECTIVE_CALLBACK)
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
    // Here, we allow doing <input rxFormControl> which simply applies
    // the appropriate css to the host element and doesn't link a providedControl.
    // We do *not* allow actively setting <input [rxFormControl]="null">
    // or <input [rxFormControl]="undefined">
    if ((this.providedControl as unknown) === '') {
      this.providedControl = undefined;
      return;
    }

    if (!AbstractControl.isControl(this.providedControl)) {
      throw new Error(
        `RxFormControlDirective must be passed an AbstractControl via rxFormControl`
      );
    }

    this.assertValidValueMapper(
      'RxFormControlDirective#rxFormControlValueMapper',
      this.valueMapper
    );

    super.ngOnChanges(_);
  }
}
