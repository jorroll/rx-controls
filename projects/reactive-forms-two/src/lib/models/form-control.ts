import { ControlBase, IControlBaseArgs } from './control-base';

export type IFormControlArgs<D> = IControlBaseArgs<D>;

export class FormControl<V = any, D = any> extends ControlBase<V, D> {
  static id = 0;

  constructor(value: V = null as any, options: IFormControlArgs<D> = {}) {
    super(options.id || Symbol(`FormControl-${FormControl.id++}`));

    this.data = options.data!;

    this.setValue(value);

    if (options.errors) {
      this.setErrors(options.errors);
    }
  }

  clone() {
    const control = new FormControl<V, D>();
    this.replayState().subscribe(control.source);
    return control;
  }
}
