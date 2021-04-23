import {
  Input,
  OnDestroy,
  OnChanges,
  Directive,
  Inject,
  SimpleChange,
  SkipSelf,
  Renderer2,
  ElementRef,
  forwardRef,
  Self,
  Optional,
} from '@angular/core';
import { FormArray } from 'rx-controls';
import {
  IControlDirectiveCallback,
  RX_CONTROL_DIRECTIVE_CALLBACK,
} from './interface';
import { RX_CONTROL_DIRECTIVE } from './interface';
import {
  ControlAccessor,
  RX_CONTROL_ACCESSOR,
  ControlContainerAccessor,
} from '../accessors/interface';
import { ControlNameDirective } from './control-name.directive';
import { resolveControlContainerAccessor } from './util';

@Directive({
  selector: '[rxFormArrayName]',
  exportAs: 'rxForm',
  providers: [
    {
      provide: RX_CONTROL_DIRECTIVE,
      useExisting: forwardRef(() => FormArrayNameDirective),
    },
  ],
})
export class FormArrayNameDirective<T extends FormArray = FormArray>
  extends ControlNameDirective<T>
  implements ControlContainerAccessor<T>, OnChanges, OnDestroy {
  @Input('rxFormArrayName') controlName!: string;

  readonly control: T;

  protected containerAccessor: ControlContainerAccessor;

  constructor(
    @Self()
    @Inject(RX_CONTROL_ACCESSOR)
    accessors: Array<ControlAccessor | ControlContainerAccessor>,
    @SkipSelf()
    @Inject(RX_CONTROL_ACCESSOR)
    parentAccessors: Array<ControlAccessor | ControlContainerAccessor>,
    @Optional()
    @Inject(RX_CONTROL_DIRECTIVE_CALLBACK)
    protected controlDirectiveCallbacks: IControlDirectiveCallback<T>[] | null,
    renderer: Renderer2,
    el: ElementRef
  ) {
    super(renderer, el);

    this.control = resolveControlContainerAccessor(accessors).control as T;

    this.containerAccessor = resolveControlContainerAccessor(parentAccessors);
  }

  ngOnChanges(_: { controlName?: SimpleChange; valueMapper?: SimpleChange }) {
    if (!this.controlName) {
      throw new Error(
        `RxFormArrayNameDirective must be passed a ngFormArrayName`
      );
    }

    super.ngOnChanges(_);
  }

  protected validateProvidedControl(control: any): control is T {
    if (!(control instanceof FormArray)) {
      throw new Error(
        'RxFormArrayNameDirective must link to an instance of FormArray'
      );
    }

    return true;
  }
}
