import {
  Input,
  OnDestroy,
  OnChanges,
  Directive,
  Inject,
  Self,
  SimpleChange,
  SkipSelf,
  Renderer2,
  ElementRef,
  forwardRef,
} from '@angular/core';
import { concat } from 'rxjs';
import { AbstractControl, FormControl } from '../models';
import { IControlValueMapper } from './interface';
import { SW_CONTROL_DIRECTIVE } from './interface';
import {
  ControlAccessor,
  SW_CONTROL_ACCESSOR,
  ControlContainerAccessor,
} from '../accessors/interface';
import {
  resolveControlAccessor,
  resolveControlContainerAccessor,
  syncAccessorToControl,
} from './util';
import { SwControlNameDirective } from './control-name.directive';

@Directive({
  selector: '[swFormControlName]:not([formControl])',
  exportAs: 'swForm',
  providers: [
    {
      provide: SW_CONTROL_DIRECTIVE,
      useExisting: forwardRef(() => SwFormControlNameDirective),
    },
  ],
})
export class SwFormControlNameDirective<
    T extends AbstractControl = AbstractControl
  >
  extends SwControlNameDirective<T>
  implements ControlAccessor, OnChanges, OnDestroy {
  static id = 0;

  @Input('swFormControlName') controlName!: string;
  @Input('swFormControlValueMapper')
  valueMapper: IControlValueMapper | undefined;

  readonly control: T;
  //  = new FormControl<any>({
  //   id: Symbol(`NgFormControlNameDirective-${SwFormControlNameDirective.id++}`),
  // });

  // readonly accessor: ControlAccessor;

  protected containerAccessor: ControlContainerAccessor;

  constructor(
    @Self()
    @Inject(SW_CONTROL_ACCESSOR)
    accessors: ControlAccessor[],
    @SkipSelf()
    @Inject(SW_CONTROL_ACCESSOR)
    parentAccessors: ControlAccessor[],
    renderer: Renderer2,
    el: ElementRef
  ) {
    super(renderer, el);

    this.control = resolveControlAccessor(accessors).control as T;

    this.containerAccessor = resolveControlContainerAccessor(parentAccessors);

    // this.subscriptions.push(syncAccessorToControl(this.accessor, this.control));
  }

  ngOnChanges(_: { controlName?: SimpleChange; valueMapper?: SimpleChange }) {
    if (!this.controlName) {
      throw new Error(
        `NgFormControlNameDirective must be passed a swFormControlName`
      );
    }

    this.assertValidValueMapper(
      'NgFormControlNameDirective#swFormControlValueMapper',
      this.valueMapper
    );

    super.ngOnChanges(_);
  }

  protected validateProvidedControl(control: any): control is T {
    if (!AbstractControl.isControl(control)) {
      throw new Error(
        'NgFormControlNameDirective must link to an AbstractControl'
      );
    }

    return true;
  }
}
