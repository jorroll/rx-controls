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
import { FormGroup } from '../models';
import { IControlValueMapper } from './interface';
import { NG_CONTROL_DIRECTIVE } from './base.directive';
import {
  ControlAccessor,
  NG_CONTROL_CONTAINER_ACCESSOR,
  ControlContainerAccessor,
} from '../accessors';
import { NgControlNameDirective } from './control-name.directive';

@Directive({
  selector: '[ngFormGroupName]',
  exportAs: 'ngForm',
  providers: [
    {
      provide: NG_CONTROL_DIRECTIVE,
      useExisting: forwardRef(() => NgFormGroupNameDirective),
    },
    {
      provide: NG_CONTROL_CONTAINER_ACCESSOR,
      useExisting: forwardRef(() => NgFormGroupNameDirective),
      multi: true,
    },
  ],
})
export class NgFormGroupNameDirective
  extends NgControlNameDirective<FormGroup>
  implements ControlAccessor, OnChanges, OnDestroy {
  static id = 0;

  @Input('ngFormGroupName') controlName!: string;
  @Input('ngFormGroupValueMapper')
  valueMapper: IControlValueMapper | undefined;

  readonly control = new FormGroup<any>(
    {},
    {
      id: Symbol(`NgFormGroupNameDirective-${NgFormGroupNameDirective.id++}`),
    }
  );

  protected containerAccessor: ControlContainerAccessor;

  constructor(
    @SkipSelf()
    @Inject(NG_CONTROL_CONTAINER_ACCESSOR)
    containerAccessors: ControlContainerAccessor[],
    renderer: Renderer2,
    el: ElementRef
  ) {
    super(renderer, el);

    this.containerAccessor = containerAccessors[0];
  }

  ngOnChanges(_: { controlName?: SimpleChange; valueMapper?: SimpleChange }) {
    if (!this.controlName) {
      throw new Error(
        `NgFormGroupNameDirective must be passed a ngFormControlName`
      );
    }

    this.assertValidValueMapper(
      'NgFormGroupNameDirective#ngFormControlValueMapper',
      this.valueMapper
    );

    super.ngOnChanges(_);
  }

  protected validateProvidedControl(control: any): control is FormGroup {
    if (!(control instanceof FormGroup)) {
      throw new Error(
        'NgFormGroupNameDirective must link to an instance of FormGroup'
      );
    }

    return true;
  }
}
