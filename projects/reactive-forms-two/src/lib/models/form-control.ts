import { concat, from, Observable } from 'rxjs';
import {
  AbstractControl,
  IControlEventOptions,
  IControlSelfStateChangeEvent,
  IControlStateChange,
} from './abstract-control/abstract-control';
import {
  AbstractControlBase,
  IAbstractControlBaseArgs,
} from './abstract-control/abstract-control-base';
import { buildReplayStateEvent, pluckOptions } from './util';

export type IFormControlArgs<D> = IAbstractControlBaseArgs<D>;

export class FormControl<Value = any, Data = any> extends AbstractControlBase<
  Value,
  Data,
  Value
> {
  static id = 0;

  /** On FormControl, this is an alias for "rawValue". */
  get value() {
    return this.rawValue;
  }

  constructor(
    value: Value = null as any,
    options: IFormControlArgs<Data> = {}
  ) {
    super(options.id || Symbol(`FormControl-${FormControl.id++}`));

    const o = { [AbstractControl.SKIP_CONTROL_SOURCE_QUEUE]: true };
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

  replayState(
    options: Omit<IControlEventOptions, 'idOfOriginatingEvent'> & {
      /**
       * By default, the controls will be cloned so that
       * mutations to them do not affect the replayState snapshot.
       * Pass the `preserveControls: true` option to disable this.
       */
      preserveControls?: boolean;
    } = {}
  ): Observable<IControlSelfStateChangeEvent<Value, Data>> {
    const { _rawValue } = this;

    const changes: Array<{
      change: IControlStateChange<Value, Data>;
      changedProps: string[];
    }> = [
      // we start by clearing the validator store in case whatever
      // the current validator is isn't expecting the new rawValue
      {
        change: { validatorStore: () => new Map() },
        changedProps: ['validatorStore'],
      },
      {
        change: { rawValue: () => _rawValue },
        changedProps: ['value', 'rawValue'],
      },
    ];

    return concat(
      from(
        changes.map<IControlSelfStateChangeEvent<Value, Data>>((change) =>
          buildReplayStateEvent({
            change,
            id: this.id,
            options,
          })
        )
      ),
      super.replayState(options)
    );
  }
}
