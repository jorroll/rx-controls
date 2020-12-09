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
import { SW_CONTROL_DIRECTIVE } from './interface';
import {
  ControlAccessor,
  SW_CONTROL_ACCESSOR,
  ControlContainerAccessor,
} from '../accessors/interface';
import { SwControlNameDirective } from './control-name.directive';
import { resolveControlContainerAccessor } from './util';

@Directive({
  selector: '[swFormGroupName]',
  exportAs: 'swForm',
  providers: [
    {
      provide: SW_CONTROL_DIRECTIVE,
      useExisting: forwardRef(() => SwFormGroupNameDirective),
    },
    {
      provide: SW_CONTROL_ACCESSOR,
      useExisting: forwardRef(() => SwFormGroupNameDirective),
      multi: true,
    },
  ],
})
export class SwFormGroupNameDirective
  extends SwControlNameDirective<FormGroup>
  implements ControlAccessor, OnChanges, OnDestroy {
  static id = 0;

  @Input('swFormGroupName') controlName!: string;
  @Input('swFormGroupValueMapper')
  valueMapper: IControlValueMapper | undefined;

  readonly control = new FormGroup<any>(
    {},
    {
      id: Symbol(`SwFormGroupNameDirective-${SwFormGroupNameDirective.id++}`),
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
        `SwFormGroupNameDirective must be passed a swFormControlName`
      );
    }

    this.assertValidValueMapper(
      'SwFormGroupNameDirective#swFormControlValueMapper',
      this.valueMapper
    );

    super.ngOnChanges(_);
  }

  protected validateProvidedControl(control: any): control is FormGroup {
    if (!(control instanceof FormGroup)) {
      throw new Error(
        'SwFormGroupNameDirective must link to an instance of FormGroup'
      );
    }

    return true;
  }
}
