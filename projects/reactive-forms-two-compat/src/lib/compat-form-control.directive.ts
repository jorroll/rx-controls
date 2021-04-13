import {
  Input,
  OnChanges,
  Directive,
  ElementRef,
  Inject,
  Self,
  SimpleChange,
  SimpleChanges,
  forwardRef,
  Renderer2,
  Optional,
} from '@angular/core';

import {
  ControlAccessor,
  FormControl,
  SW_CONTROL_DIRECTIVE,
  ɵControlDirective as ControlDirective,
  IControlValueMapper,
  IControlDirectiveCallback,
  SW_CONTROL_DIRECTIVE_CALLBACK,
  isAncestorControlPropTruthy$,
} from '@service-work/angular-reactive-forms';

import {
  FormControlDirective,
  NgControl,
  ControlValueAccessor,
} from '@angular/forms';

import { CompatFormControl, FROM_SWCONTROL } from './compat-form-control';
import { combineLatest } from 'rxjs';

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
  extends ControlDirective<FormControl>
  implements ControlAccessor<FormControl>, OnChanges {
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

  readonly control = this.ngControl.swControl;

  protected valueAccessor: ControlValueAccessor | null;

  constructor(
    @Self()
    @Inject(NgControl)
    protected ngDirective: FormControlDirective,
    @Optional()
    @Inject(SW_CONTROL_DIRECTIVE_CALLBACK)
    protected controlDirectiveCallbacks:
      | IControlDirectiveCallback<FormControl>[]
      | null,
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

    this.subscriptions.push(
      combineLatest([
        this.control.observe('disabled'),
        isAncestorControlPropTruthy$(this.control, 'selfDisabled'),
      ]).subscribe(([a, b]) => {
        if (a || b) {
          this.ngControl.disable({ [FROM_SWCONTROL]: true });
        } else {
          this.ngControl.enable({ [FROM_SWCONTROL]: true });
        }
      })
    );
  }

  ngOnChanges(_: {
    providedControl?: SimpleChange;
    valueMapper?: SimpleChange;
  }) {
    if (!(this.providedControl instanceof FormControl)) {
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
}
