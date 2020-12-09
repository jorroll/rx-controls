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
import { SW_CONTROL_DIRECTIVE } from './base.directive';
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
  selector: '[swFormGroup]',
  exportAs: 'ngForm',
  providers: [
    {
      provide: SW_CONTROL_DIRECTIVE,
      useExisting: forwardRef(() => SwFormGroupDirective),
    },
    {
      provide: SW_CONTROL_ACCESSOR,
      useExisting: forwardRef(() => SwFormGroupDirective),
      multi: true,
    },
  ],
})
export class SwFormGroupDirective
  extends SwControlDirective<FormGroup>
  implements OnChanges {
  static id = 0;
  @Input('swFormGroup') providedControl!: FormGroup;
  @Input('swFormGroupValueMapper')
  valueMapper: IControlValueMapper | undefined;

  readonly control: FormGroup;

  // readonly accessor: ControlContainerAccessor | null;

  constructor(
    @Optional()
    @Self()
    @Inject(SW_CONTROL_ACCESSOR)
    accessors: ControlAccessor[] | null,
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
          id: Symbol(`SwFormGroupDirective-${SwFormGroupDirective.id++}`),
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
