import {
  AbstractControlBase,
  IAbstractControlBaseArgs,
} from './abstract-control/abstract-control-base';

export type IFormControlArgs<D> = IAbstractControlBaseArgs<D>;

export class FormControl<V = any, D = any> extends AbstractControlBase<V, D> {
  static id = 0;

  protected _value!: V;

  constructor(value: V = null as any, options: IFormControlArgs<D> = {}) {
    super(options.id || Symbol(`FormControl-${FormControl.id++}`));

    this.data = options.data!;
    this.setValue(value);
    if (options.disabled) this.markDisabled(options.disabled);
    if (options.touched) this.markTouched(options.touched);
    if (options.dirty) this.markDirty(options.dirty);
    if (options.readonly) this.markReadonly(options.readonly);
    if (options.submitted) this.markSubmitted(options.submitted);
    if (options.errors) this.setErrors(options.errors);
    if (options.validators) this.setValidators(options.validators);
    if (options.pending) this.markPending(options.pending);
  }
}
