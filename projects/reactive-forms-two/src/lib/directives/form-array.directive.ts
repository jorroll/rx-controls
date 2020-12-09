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
import { FormArray } from '../models';
import { SW_CONTROL_DIRECTIVE } from './interface';
import { resolveControlContainerAccessor, syncAccessorToControl } from './util';
import {
  ControlContainerAccessor,
  SW_CONTROL_ACCESSOR,
  ControlAccessor,
} from '../accessors/interface';
import { SwControlDirective } from './control.directive';
import { IControlValueMapper } from './interface';
import { concat } from 'rxjs';

@Directive({
  selector: '[swFormArray]',
  exportAs: 'swForm',
  providers: [
    {
      provide: SW_CONTROL_DIRECTIVE,
      useExisting: forwardRef(() => SwFormArrayDirective),
    },
    {
      provide: SW_CONTROL_ACCESSOR,
      useExisting: forwardRef(() => SwFormArrayDirective),
      multi: true,
    },
  ],
})
export class SwFormArrayDirective
  extends SwControlDirective<FormArray>
  implements OnChanges {
  static id = 0;
  @Input('swFormArray') providedControl!: FormArray;
  @Input('swFormArrayValueMapper')
  valueMapper: IControlValueMapper | undefined;

  readonly control: FormArray;

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
      this.control = accessor.control as FormArray;
    } else {
      this.control = new FormArray<any>([], {
        id: Symbol(`SwFormArrayDirective-${SwFormArrayDirective.id++}`),
      });
    }
  }

  ngOnChanges(_: {
    providedControl?: SimpleChange;
    valueMapper?: SimpleChange;
  }) {
    if (!this.providedControl) {
      throw new Error(`SwFormArrayDirective must be passed a swFormArray`);
    }

    this.assertValidValueMapper(
      'SwFormArrayDirective#swFormArrayValueMapper',
      this.valueMapper
    );

    super.ngOnChanges(_);
  }
}
