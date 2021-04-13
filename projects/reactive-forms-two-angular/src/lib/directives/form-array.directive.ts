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
import {
  AbstractControlContainer,
  FormArray,
} from '@service-work/reactive-forms';
import {
  IControlDirectiveCallback,
  SW_CONTROL_DIRECTIVE,
  SW_CONTROL_DIRECTIVE_CALLBACK,
} from './interface';
import { resolveControlContainerAccessor } from './util';
import {
  ControlContainerAccessor,
  SW_CONTROL_ACCESSOR,
  ControlAccessor,
} from '../accessors/interface';
import { ControlDirective } from './control.directive';

@Directive({
  selector: '[swFormArray]',
  exportAs: 'swForm',
  providers: [
    {
      provide: SW_CONTROL_DIRECTIVE,
      useExisting: forwardRef(() => FormArrayDirective),
    },
  ],
})
export class FormArrayDirective<T extends AbstractControlContainer = FormArray>
  extends ControlDirective<T>
  implements ControlContainerAccessor<T>, OnChanges {
  @Input('swFormArray') providedControl!: T;

  readonly control: T;

  constructor(
    @Self()
    @Inject(SW_CONTROL_ACCESSOR)
    accessors: Array<ControlAccessor | ControlContainerAccessor>,
    @Optional()
    @Inject(SW_CONTROL_DIRECTIVE_CALLBACK)
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
      throw new Error(`SwFormArrayDirective must be passed a swFormArray`);
    }

    super.ngOnChanges(_);
  }
}
