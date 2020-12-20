import {
  Input,
  OnDestroy,
  OnChanges,
  Directive,
  Inject,
  Self,
  SimpleChange,
  SkipSelf,
  Renderer2,
  ElementRef,
  forwardRef,
  Optional,
} from '@angular/core';
import { concat } from 'rxjs';
import { AbstractControl, FormControl } from '../models';
import {
  IControlDirectiveCallback,
  IControlValueMapper,
  SW_CONTROL_DIRECTIVE_CALLBACK,
} from './interface';
import { SW_CONTROL_DIRECTIVE } from './interface';
import {
  ControlAccessor,
  SW_CONTROL_ACCESSOR,
  ControlContainerAccessor,
} from '../accessors/interface';
import {
  resolveControlAccessor,
  resolveControlContainerAccessor,
} from './util';
import { ControlNameDirective } from './control-name.directive';

@Directive({
  selector: '[swFormControlName]:not([formControl])',
  exportAs: 'swForm',
  providers: [
    {
      provide: SW_CONTROL_DIRECTIVE,
      useExisting: forwardRef(() => FormControlNameDirective),
    },
  ],
})
export class FormControlNameDirective<
    T extends AbstractControl = AbstractControl
  >
  extends ControlNameDirective<T>
  implements ControlAccessor<T>, OnChanges, OnDestroy {
  @Input('swFormControlName') controlName!: string;
  @Input('swFormControlValueMapper')
  valueMapper: IControlValueMapper | undefined;

  readonly control: T;

  protected containerAccessor: ControlContainerAccessor;

  constructor(
    @Self()
    @Inject(SW_CONTROL_ACCESSOR)
    accessors: ControlAccessor[],
    @SkipSelf()
    @Inject(SW_CONTROL_ACCESSOR)
    parentAccessors: ControlAccessor[],
    @Optional()
    @Inject(SW_CONTROL_DIRECTIVE_CALLBACK)
    protected controlDirectiveCallbacks: IControlDirectiveCallback<T>[] | null,
    renderer: Renderer2,
    el: ElementRef
  ) {
    super(renderer, el);

    this.control = resolveControlAccessor(accessors).control as T;

    this.containerAccessor = resolveControlContainerAccessor(parentAccessors);
  }

  ngOnChanges(_: { controlName?: SimpleChange; valueMapper?: SimpleChange }) {
    if (!this.controlName) {
      throw new Error(
        `NgFormControlNameDirective must be passed a swFormControlName`
      );
    }

    this.assertValidValueMapper(
      'NgFormControlNameDirective#swFormControlValueMapper',
      this.valueMapper
    );

    super.ngOnChanges(_);
  }

  protected validateProvidedControl(control: any): control is T {
    if (!AbstractControl.isControl(control)) {
      throw new Error(
        'NgFormControlNameDirective must link to an AbstractControl'
      );
    }

    return true;
  }
}
