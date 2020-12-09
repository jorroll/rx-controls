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
} from '@angular/core';
import { FormArray } from '../models';
import { IControlValueMapper } from './interface';
import { SW_CONTROL_DIRECTIVE } from './interface';
import {
  ControlAccessor,
  SW_CONTROL_ACCESSOR,
  ControlContainerAccessor,
} from '../accessors/interface';
import { ControlNameDirective } from './control-name.directive';
import { resolveControlContainerAccessor } from './util';

@Directive({
  selector: '[swFormArrayName]',
  exportAs: 'swForm',
  providers: [
    {
      provide: SW_CONTROL_DIRECTIVE,
      useExisting: forwardRef(() => FormArrayNameDirective),
    },
    {
      provide: SW_CONTROL_ACCESSOR,
      useExisting: forwardRef(() => FormArrayNameDirective),
      multi: true,
    },
  ],
})
export class FormArrayNameDirective
  extends ControlNameDirective<FormArray>
  implements ControlAccessor, OnChanges, OnDestroy {
  static id = 0;

  @Input('swFormArrayName') controlName!: string;
  @Input('swFormArrayValueMapper')
  valueMapper: IControlValueMapper | undefined;

  readonly control = new FormArray<any>(
    {},
    {
      id: Symbol(`SwFormArrayNameDirective-${FormArrayNameDirective.id++}`),
    }
  );

  protected containerAccessor: ControlContainerAccessor;

  constructor(
    @SkipSelf()
    @Inject(SW_CONTROL_ACCESSOR)
    parentAccessors: ControlAccessor[],
    renderer: Renderer2,
    el: ElementRef
  ) {
    super(renderer, el);

    this.containerAccessor = resolveControlContainerAccessor(parentAccessors);
  }

  ngOnChanges(_: { controlName?: SimpleChange; valueMapper?: SimpleChange }) {
    if (!this.controlName) {
      throw new Error(
        `SwFormArrayNameDirective must be passed a ngFormArrayName`
      );
    }

    this.assertValidValueMapper(
      'SwFormArrayNameDirective#ngFormControlValueMapper',
      this.valueMapper
    );

    super.ngOnChanges(_);
  }

  protected validateProvidedControl(control: any): control is FormArray {
    if (!(control instanceof FormArray)) {
      throw new Error(
        'SwFormArrayNameDirective must link to an instance of FormArray'
      );
    }

    return true;
  }
}
