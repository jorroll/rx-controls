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
  SW_CONTROL_DIRECTIVE,
  SW_CONTROL_ACCESSOR,
  ɵControlNameDirective as ControlNameDirective,
  ɵresolveControlContainerAccessor as resolveControlContainerAccessor,
  IControlValueMapper,
  IControlDirectiveCallback,
  SW_CONTROL_DIRECTIVE_CALLBACK,
  isAncestorControlPropTruthy$,
} from '@service-work/reactive-forms';

import {
  FormControlDirective,
  NgControl,
  ControlValueAccessor,
} from '@angular/forms';

import { CompatFormControl, FROM_SWCONTROL } from './compat-form-control';
import { combineLatest } from 'rxjs';

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
  implements ControlAccessor<FormControl>, OnChanges {
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

  readonly control = this.ngControl.swControl;

  protected valueAccessor: ControlValueAccessor | null;

  protected containerAccessor: ControlContainerAccessor;

  constructor(
    @Self()
    @Inject(NgControl)
    protected ngDirective: FormControlDirective,
    @Optional()
    @Inject(SW_CONTROL_DIRECTIVE_CALLBACK)
    protected controlDirectiveCallbacks:
      | IControlDirectiveCallback<FormControl>[]
      | null,
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

    // respond to control and control ancestor disabled changes
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
}
