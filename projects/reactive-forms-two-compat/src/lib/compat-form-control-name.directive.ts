import {
  Input,
  OnDestroy,
  OnChanges,
  Directive,
  ElementRef,
  Inject,
  Self,
  SimpleChange,
  SimpleChanges,
  SkipSelf,
  forwardRef,
  Renderer2,
} from '@angular/core';

import {
  AbstractControl,
  ControlContainerAccessor,
  ControlAccessor,
  FormControl,
  SW_CONTROL_DIRECTIVE,
  SW_CONTROL_ACCESSOR,
  ɵControlNameDirective as ControlNameDirective,
  ɵresolveControlContainerAccessor as resolveControlContainerAccessor,
  IControlValueMapper,
} from '@service-work/reactive-forms';

import {
  FormControlDirective,
  NgControl,
  ControlValueAccessor,
} from '@angular/forms';

import { CompatFormControl } from './compat-form-control';

@Directive({
  selector: '[swFormControlName][formControl]',
  exportAs: 'swCompatForm',
  providers: [
    {
      provide: SW_CONTROL_DIRECTIVE,
      useExisting: forwardRef(() => CompatFormControlNameDirective),
    },
  ],
})
export class CompatFormControlNameDirective
  extends ControlNameDirective<FormControl>
  implements ControlAccessor<FormControl>, OnChanges, OnDestroy {
  static id = 0;

  @Input('swFormControlName') controlName!: string;
  @Input('swFormControlValueMapper')
  valueMapper: IControlValueMapper | undefined;

  protected ngControl = new CompatFormControl(
    new FormControl(undefined, {
      id: Symbol(
        `SwCompatFormControlNameDirective-${CompatFormControlNameDirective.id++}`
      ),
    })
  );

  control = this.ngControl.swControl;

  protected valueAccessor: ControlValueAccessor | null;

  protected containerAccessor: ControlContainerAccessor;

  constructor(
    @Self()
    @Inject(NgControl)
    protected ngDirective: FormControlDirective,
    @SkipSelf()
    @Inject(SW_CONTROL_ACCESSOR)
    parentAccessors: ControlAccessor[],
    renderer: Renderer2,
    el: ElementRef
  ) {
    super(renderer, el);

    this.containerAccessor = resolveControlContainerAccessor(parentAccessors);

    const self = this;

    const orig = this.ngDirective.ngOnChanges.bind(this.ngDirective);

    let index = 0;

    this.ngDirective.ngOnChanges = (changes: SimpleChanges) => {
      const old = self.ngDirective.form;
      self.ngDirective.form = self.ngControl;
      orig({
        ...changes,
        form: new SimpleChange(old, self.ngControl, index === 0),
      });
      index++;
    };

    this.valueAccessor = this.ngDirective.valueAccessor;
  }

  ngOnChanges(_: { controlName?: SimpleChange; valueMapper?: SimpleChange }) {
    if (!this.controlName) {
      throw new Error(
        `SwCompatFormControlNameDirective must be passed a swFormControlName`
      );
    }

    this.assertValidValueMapper(
      'SwCompatFormControlNameDirective#swFormControlValueMapper',
      this.valueMapper
    );

    super.ngOnChanges(_);
  }

  protected validateProvidedControl(control: any): control is FormControl {
    if (!(control instanceof FormControl)) {
      throw new Error(
        'SwCompatFormControlNameDirective must link to an instance of (sw)FormControl'
      );
    }

    return true;
  }

  // ngOnChanges(_: { controlName?: SimpleChange }) {
  //   if (!this.controlName) {
  //     throw new Error(
  //       `NgCompatFormControlNameDirective must be passed a ngFormControlName`
  //     );
  //   }

  //   super.ngOnChanges(_);
  // }

  // protected validateProvidedControl(control: any): control is FormControl {
  //   if (!(control instanceof FormControl)) {
  //     throw new Error(
  //       'NgCompatFormControlNameDirective must link to an instance of FormControl'
  //     );
  //   }

  //   return true;
  // }
}
