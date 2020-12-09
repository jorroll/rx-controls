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
} from '@angular/core';
import { AbstractControl, FormControl } from '../models';
import { SW_CONTROL_DIRECTIVE } from './interface';
import { resolveControlAccessor, syncAccessorToControl } from './util';
import { ControlAccessor, SW_CONTROL_ACCESSOR } from '../accessors/interface';
import { SwControlDirective } from './control.directive';
import { IControlValueMapper } from './interface';
import { concat } from 'rxjs';

@Directive({
  selector: '[swFormControl]:not([formControl])',
  exportAs: 'swForm',
  providers: [
    {
      provide: SW_CONTROL_DIRECTIVE,
      useExisting: forwardRef(() => SwFormControlDirective),
    },
  ],
})
export class SwFormControlDirective<T extends AbstractControl = AbstractControl>
  extends SwControlDirective<T>
  implements ControlAccessor, OnChanges, OnDestroy {
  static id = 0;
  @Input('swFormControl') providedControl: T | undefined;
  @Input('swFormControlValueMapper')
  valueMapper: IControlValueMapper | undefined;

  readonly control: T;
  // get control() {
  //   return this.accessor.control as FormControl;
  // }

  // readonly control = new FormControl<any>(null, {
  //   id: Symbol(`SwFormControlDirective-${SwFormControlDirective.id++}`),
  // });

  // readonly accessor: ControlAccessor;

  constructor(
    @Self()
    @Inject(SW_CONTROL_ACCESSOR)
    accessors: ControlAccessor[],
    renderer: Renderer2,
    el: ElementRef
  ) {
    super(renderer, el);

    this.control = resolveControlAccessor(accessors).control as T;

    // this.subscriptions.push(syncAccessorToControl(this.accessor, this.control));
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
