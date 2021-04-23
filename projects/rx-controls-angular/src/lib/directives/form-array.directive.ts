import {
  OnChanges,
  Directive,
  SimpleChange,
  forwardRef,
  Self,
  Inject,
  Renderer2,
  ElementRef,
  Input,
  Optional,
} from '@angular/core';
import { AbstractControlContainer, FormArray } from 'rx-controls';
import {
  IControlDirectiveCallback,
  RX_CONTROL_DIRECTIVE,
  RX_CONTROL_DIRECTIVE_CALLBACK,
} from './interface';
import { resolveControlContainerAccessor } from './util';
import {
  ControlContainerAccessor,
  RX_CONTROL_ACCESSOR,
  ControlAccessor,
} from '../accessors/interface';
import { ControlDirective } from './control.directive';

@Directive({
  selector: '[rxFormArray]',
  exportAs: 'rxForm',
  providers: [
    {
      provide: RX_CONTROL_DIRECTIVE,
      useExisting: forwardRef(() => FormArrayDirective),
    },
  ],
})
export class FormArrayDirective<T extends AbstractControlContainer = FormArray>
  extends ControlDirective<T>
  implements ControlContainerAccessor<T>, OnChanges {
  @Input('rxFormArray') providedControl!: T;

  readonly control: T;

  constructor(
    @Self()
    @Inject(RX_CONTROL_ACCESSOR)
    accessors: Array<ControlAccessor | ControlContainerAccessor>,
    @Optional()
    @Inject(RX_CONTROL_DIRECTIVE_CALLBACK)
    protected controlDirectiveCallbacks: IControlDirectiveCallback<T>[] | null,
    renderer: Renderer2,
    el: ElementRef
  ) {
    super(renderer, el);

    this.control = resolveControlContainerAccessor(accessors).control as T;
  }

  ngOnChanges(_: {
    providedControl?: SimpleChange;
    valueMapper?: SimpleChange;
  }) {
    if (!this.providedControl) {
      throw new Error(`RxFormArrayDirective must be passed a rxFormArray`);
    }

    super.ngOnChanges(_);
  }
}
