import {
  Input,
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
  Optional,
} from '@angular/core';

import {
  ControlContainerAccessor,
  ControlAccessor,
  FormControl,
  RX_CONTROL_DIRECTIVE,
  RX_CONTROL_ACCESSOR,
  ɵControlNameDirective as ControlNameDirective,
  ɵresolveControlContainerAccessor as resolveControlContainerAccessor,
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
  selector: '[rxFormControlName][formControl]',
  exportAs: 'rxCompatForm',
  providers: [
    {
      provide: RX_CONTROL_DIRECTIVE,
      useExisting: forwardRef(() => CompatFormControlNameDirective),
    },
  ],
})
export class CompatFormControlNameDirective
  extends ControlNameDirective<FormControl>
  implements ControlAccessor<FormControl>, OnChanges {
  static id = 0;

  @Input('rxFormControlName') controlName!: string;
  @Input('rxFormControlValueMapper')
  valueMapper: IControlValueMapper | undefined;

  protected ngControl = new CompatFormControl(
    new FormControl(undefined, {
      id: Symbol(
        `RxCompatFormControlNameDirective-${CompatFormControlNameDirective.id++}`
      ),
    })
  );

  readonly control = this.ngControl.rxControl;

  protected valueAccessor: ControlValueAccessor | null;

  protected containerAccessor: ControlContainerAccessor;

  constructor(
    @Self()
    @Inject(NgControl)
    protected ngDirective: FormControlDirective,
    @Optional()
    @Inject(RX_CONTROL_DIRECTIVE_CALLBACK)
    protected controlDirectiveCallbacks:
      | IControlDirectiveCallback<FormControl>[]
      | null,
    @SkipSelf()
    @Inject(RX_CONTROL_ACCESSOR)
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

    // respond to control and control ancestor disabled changes
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

  ngOnChanges(_: { controlName?: SimpleChange; valueMapper?: SimpleChange }) {
    if (!this.controlName) {
      throw new Error(
        `RxCompatFormControlNameDirective must be passed a rxFormControlName`
      );
    }

    this.assertValidValueMapper(
      'RxCompatFormControlNameDirective#rxFormControlValueMapper',
      this.valueMapper
    );

    super.ngOnChanges(_);
  }

  protected validateProvidedControl(control: any): control is FormControl {
    if (!(control instanceof FormControl)) {
      throw new Error(
        'RxCompatFormControlNameDirective must link to an instance of (rx)FormControl'
      );
    }

    return true;
  }
}
