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
  selector: '[swFormControl][formControl]',
  exportAs: 'swCompatForm',
  providers: [
    {
      provide: SW_CONTROL_DIRECTIVE,
      useExisting: forwardRef(() => CompatFormControlDirective),
    },
  ],
})
export class CompatFormControlDirective
  extends ControlNameDirective<FormControl>
  implements ControlAccessor<FormControl>, OnChanges, OnDestroy {
  static id = 0;

  @Input('swFormControl') providedControl!: FormControl;
  @Input('swFormControlValueMapper')
  valueMapper: IControlValueMapper | undefined;

  protected ngControl = new CompatFormControl(
    new FormControl(undefined, {
      id: Symbol(
        `SwCompatFormControlDirective-${CompatFormControlDirective.id++}`
      ),
    })
  );

  control = this.ngControl.swControl;

  protected valueAccessor: ControlValueAccessor | null;

  constructor(
    @Self()
    @Inject(NgControl)
    protected ngDirective: FormControlDirective,
    renderer: Renderer2,
    el: ElementRef
  ) {
    super(renderer, el);

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

  ngOnChanges(_: {
    providedControl?: SimpleChange;
    valueMapper?: SimpleChange;
  }) {
    if (!AbstractControl.isControl(this.providedControl)) {
      throw new Error(
        `SwFormControlDirective must be passed an instance of (sw)FormControl via swFormControl`
      );
    }

    this.assertValidValueMapper(
      'SwFormControlDirective#swFormControlValueMapper',
      this.valueMapper
    );

    super.ngOnChanges(_);
  }

  // ngOnChanges(changes: { providedControl?: SimpleChange }) {
  //   if (!this.providedControl) {
  //     throw new Error(
  //       `NgCompatFormControlDirective must be passed a FormControl`
  //     );
  //   }

  //   if (!this.valueAccessor) {
  //     throw new Error(
  //       `NgCompatFormControlDirective could not find valueAccessor`
  //     );
  //   }

  //   super.ngOnChanges(changes);
  // }
}
