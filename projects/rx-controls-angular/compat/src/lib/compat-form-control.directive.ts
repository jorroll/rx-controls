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
  RX_CONTROL_DIRECTIVE,
  ɵControlDirective as ControlDirective,
  IControlValueMapper,
  IControlDirectiveCallback,
  RX_CONTROL_DIRECTIVE_CALLBACK,
  isAncestorControlPropTruthy$,
} from 'rx-controls-angular';

import {
  FormControlDirective,
  NgControl,
  ControlValueAccessor,
} from '@angular/forms';

import { CompatFormControl, FROM_RXCONTROL } from './compat-form-control';
import { combineLatest } from 'rxjs';

@Directive({
  selector: '[rxFormControl][formControl]',
  exportAs: 'rxCompatForm',
  providers: [
    {
      provide: RX_CONTROL_DIRECTIVE,
      useExisting: forwardRef(() => CompatFormControlDirective),
    },
  ],
})
export class CompatFormControlDirective
  extends ControlDirective<FormControl>
  implements ControlAccessor<FormControl>, OnChanges {
  static id = 0;

  @Input('rxFormControl') providedControl!: FormControl;
  @Input('rxFormControlValueMapper')
  valueMapper: IControlValueMapper | undefined;

  protected ngControl = new CompatFormControl(
    new FormControl(undefined, {
      id: Symbol(
        `RxCompatFormControlDirective-${CompatFormControlDirective.id++}`
      ),
    })
  );

  readonly control = this.ngControl.rxControl;

  protected valueAccessor: ControlValueAccessor | null;

  constructor(
    @Self()
    @Inject(NgControl)
    protected ngDirective: FormControlDirective,
    @Optional()
    @Inject(RX_CONTROL_DIRECTIVE_CALLBACK)
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
          this.ngControl.disable({ [FROM_RXCONTROL]: true });
        } else {
          this.ngControl.enable({ [FROM_RXCONTROL]: true });
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
        `RxFormControlDirective must be passed an instance of (rx)FormControl via rxFormControl`
      );
    }

    this.assertValidValueMapper(
      'RxFormControlDirective#rxFormControlValueMapper',
      this.valueMapper
    );

    super.ngOnChanges(_);
  }
}
