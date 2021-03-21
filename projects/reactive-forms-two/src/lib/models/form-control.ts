import {
  AbstractControlBase,
  IAbstractControlBaseArgs,
} from './abstract-control/abstract-control-base';

export type IFormControlArgs<
  Data = any,
  Value = unknown
> = IAbstractControlBaseArgs<Data, Value, Value>;

export class FormControl<Value = any, Data = any> extends AbstractControlBase<
  Value,
  Data,
  Value
> {
  static id = 0;

  get value() {
    return this.rawValue;
  }

  constructor(
    value: Value = null as any,
    options: IFormControlArgs<Data, Value> = {}
  ) {
    super(options.id || Symbol(`FormControl-${FormControl.id++}`));

    const o = { debugPath: 'constructor' };
    this.data = options.data!;
    this.setValue(value, o);
    if (options.disabled) this.markDisabled(options.disabled, o);
    if (options.touched) this.markTouched(options.touched, o);
    if (options.dirty) this.markDirty(options.dirty, o);
    if (options.readonly) this.markReadonly(options.readonly, o);
    if (options.submitted) this.markSubmitted(options.submitted, o);
    if (options.validators) this.setValidators(options.validators, o);
    if (options.pending) this.markPending(options.pending, o);
    // this needs to be last to ensure that the errors aren't overwritten
    if (options.errors) this.patchErrors(options.errors, o);
  }
}
