import {
  OnChanges,
  Directive,
  SimpleChange,
  forwardRef,
  Self,
  Inject,
  Renderer2,
  ElementRef,
  Optional,
  Input,
} from '@angular/core';
import { AbstractControlContainer, FormGroup } from 'reactive-form-controls';
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
  selector: '[swFormGroup]',
  exportAs: 'swForm',
  providers: [
    {
      provide: SW_CONTROL_DIRECTIVE,
      useExisting: forwardRef(() => FormGroupDirective),
    },
  ],
})
export class FormGroupDirective<T extends AbstractControlContainer = FormGroup>
  extends ControlDirective<T>
  implements ControlContainerAccessor<T>, OnChanges {
  @Input('swFormGroup') providedControl!: T;

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
      throw new Error(`SwFormGroupDirective must be passed a swFormGroup`);
    }

    super.ngOnChanges(_);
  }
}
