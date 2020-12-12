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
  SkipSelf,
} from '@angular/core';
import { AbstractControlContainer, FormGroup } from '../models';
import { SW_CONTROL_DIRECTIVE } from './interface';
import { resolveControlContainerAccessor, syncAccessorToControl } from './util';
import {
  ControlContainerAccessor,
  SW_CONTROL_ACCESSOR,
  ControlAccessor,
} from '../accessors/interface';
import { ControlDirective } from './control.directive';
import { IControlValueMapper } from './interface';
import { concat } from 'rxjs';

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
  @Input('swFormGroupValueMapper')
  valueMapper: IControlValueMapper | undefined;

  readonly control: T;

  constructor(
    @Self()
    @Inject(SW_CONTROL_ACCESSOR)
    accessors: Array<ControlAccessor | ControlContainerAccessor>,
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

    this.assertValidValueMapper(
      'SwFormGroupDirective#swFormGroupValueMapper',
      this.valueMapper
    );

    super.ngOnChanges(_);
  }
}
