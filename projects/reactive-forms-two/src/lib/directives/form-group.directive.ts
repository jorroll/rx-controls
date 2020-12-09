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
import { FormGroup } from '../models';
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
    {
      provide: SW_CONTROL_ACCESSOR,
      useExisting: forwardRef(() => FormGroupDirective),
      multi: true,
    },
  ],
})
export class FormGroupDirective
  extends ControlDirective<FormGroup>
  implements OnChanges {
  static id = 0;
  @Input('swFormGroup') providedControl!: FormGroup;
  @Input('swFormGroupValueMapper')
  valueMapper: IControlValueMapper | undefined;

  readonly control: FormGroup;

  constructor(
    @Optional()
    @Self()
    @Inject(SW_CONTROL_ACCESSOR)
    accessors: Array<ControlAccessor | ControlContainerAccessor> | null,
    renderer: Renderer2,
    el: ElementRef
  ) {
    super(renderer, el);

    const accessor = accessors && resolveControlContainerAccessor(accessors);

    if (accessor) {
      this.control = accessor.control as FormGroup;
    } else {
      this.control = new FormGroup<any>(
        {},
        {
          id: Symbol(`SwFormGroupDirective-${FormGroupDirective.id++}`),
        }
      );
    }
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
