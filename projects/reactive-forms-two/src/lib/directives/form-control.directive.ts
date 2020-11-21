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
import { FormControl } from '../models';
import { SW_CONTROL_DIRECTIVE } from './base.directive';
import { resolveControlAccessor, syncAccessorToControl } from './util';
import { ControlAccessor, SW_CONTROL_ACCESSOR } from '../accessors';
import { SwControlDirective } from './control.directive';
import { IControlValueMapper } from './interface';
import { concat } from 'rxjs';

@Directive({
  selector: '[swFormControl]:not([formControl])',
  exportAs: 'ngForm',
  providers: [
    {
      provide: SW_CONTROL_DIRECTIVE,
      useExisting: forwardRef(() => SwFormControlDirective),
    },
  ],
})
export class SwFormControlDirective
  extends SwControlDirective<FormControl>
  implements ControlAccessor, OnChanges, OnDestroy {
  static id = 0;
  @Input('swFormControl') providedControl!: FormControl;
  @Input('swFormControlValueMapper')
  valueMapper: IControlValueMapper | undefined;

  readonly control = new FormControl<any>(null, {
    id: Symbol(`SwFormControlDirective-${SwFormControlDirective.id++}`),
  });

  readonly accessor: ControlAccessor;

  constructor(
    @Self()
    @Inject(SW_CONTROL_ACCESSOR)
    accessors: ControlAccessor[],
    renderer: Renderer2,
    el: ElementRef
  ) {
    super(renderer, el);

    this.accessor = resolveControlAccessor(accessors);

    this.subscriptions.push(syncAccessorToControl(this.accessor, this.control));
  }

  ngOnChanges(_: {
    providedControl?: SimpleChange;
    valueMapper?: SimpleChange;
  }) {
    if (!this.providedControl) {
      throw new Error(`SwFormControlDirective must be passed a swFormControl`);
    }

    this.assertValidValueMapper(
      'SwFormControlDirective#swFormControlValueMapper',
      this.valueMapper
    );

    super.ngOnChanges(_);
  }
}
