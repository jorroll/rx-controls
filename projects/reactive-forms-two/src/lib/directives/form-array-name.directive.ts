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
import { SW_CONTROL_DIRECTIVE } from './base.directive';
import {
  ControlAccessor,
  SW_CONTROL_ACCESSOR,
  ControlContainerAccessor,
} from '../accessors';
import { SwControlNameDirective } from './control-name.directive';
import { resolveControlContainerAccessor } from './util';

@Directive({
  selector: '[ngFormArrayName]',
  exportAs: 'ngForm',
  providers: [
    {
      provide: SW_CONTROL_DIRECTIVE,
      useExisting: forwardRef(() => SwFormArrayNameDirective),
    },
    {
      provide: SW_CONTROL_ACCESSOR,
      useExisting: forwardRef(() => SwFormArrayNameDirective),
      multi: true,
    },
  ],
})
export class SwFormArrayNameDirective
  extends SwControlNameDirective<FormArray>
  implements ControlAccessor, OnChanges, OnDestroy {
  static id = 0;

  @Input('ngFormArrayName') controlName!: string;
  @Input('ngFormArrayValueMapper')
  valueMapper: IControlValueMapper | undefined;

  readonly control = new FormArray<any>(
    {},
    {
      id: Symbol(`SwFormArrayNameDirective-${SwFormArrayNameDirective.id++}`),
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
