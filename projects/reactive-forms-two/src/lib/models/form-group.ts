import { merge, concat } from 'rxjs';
import { map, filter, tap } from 'rxjs/operators';
import {
  AbstractControl,
  IControlEventOptions,
  IControlEvent,
} from './abstract-control';
import { IControlBaseArgs, IStateChange } from './control-base';
import { ControlContainerBase } from './control-container-base';
import {
  ControlContainer,
  ControlsEnabledValue,
  ControlsValue,
  IControlContainerStateChangeEvent,
} from './control-container';
import { pluckOptions, isTruthy } from './util';

export type IFormGroupArgs<D> = IControlBaseArgs<D>;

// export type ControlsValue<T extends { [key: string]: AbstractControl }> = {
//   [P in keyof T]: T[P]['value'];
// };

// export type FormGroupEnabledValue<
//   T extends { [key: string]: AbstractControl }
// > = Partial<
//   {
//     [P in keyof T]: T[P] extends ControlContainer
//       ? T[P]['enabledValue']
//       : T[P]['value'];
//   }
// >;

export class FormGroup<
  Controls extends { readonly [key: string]: AbstractControl } = {
    readonly [key: string]: AbstractControl;
  },
  Data = any
> extends ControlContainerBase<Controls, Data> {
  static id = 0;

  protected _controlsStore: ReadonlyMap<
    keyof Controls,
    Controls[keyof Controls]
  > = new Map();
  get controlsStore() {
    return this._controlsStore;
  }

  protected _controls: Controls;

  protected _enabledValue: ControlsEnabledValue<Controls>;
  get enabledValue() {
    return this._enabledValue;
  }

  constructor(
    controls: Controls = {} as Controls,
    options: IFormGroupArgs<Data> = {},
  ) {
    super(
      options.id || Symbol(`FormGroup-${FormGroup.id++}`),
      extractValue<Controls>(controls),
      options,
    );

    this._controls = { ...controls };
    this._controlsStore = new Map<keyof Controls, Controls[keyof Controls]>(
      Object.entries(this._controls) as any,
    );
    this._enabledValue = extractEnabledValue(controls);

    // this.setupControls(new Map());
    // this.registerControls();
  }

  get<A extends keyof Controls>(a: A): Controls[A];
  get<A extends AbstractControl = AbstractControl>(...args: any[]): A | null;
  get<A extends AbstractControl = AbstractControl>(...args: any[]): A | null {
    return super.get(...args);
  }

  clone() {
    const control = new FormGroup<Controls, Data>();
    this.replayState().subscribe(control.source);
    return control;
  }

  // equalValue(
  //   value: ControlsValue<Controls>,
  //   options: { assertShape?: boolean } = {},
  // ): value is ControlsValue<Controls> {
  //   const error = () => {
  //     console.error(
  //       `FormGroup`,
  //       `incoming value:`,
  //       value,
  //       'current controls:',
  //       this.controls,
  //     );

  //     throw new Error(
  //       `FormGroup "value" must have the ` +
  //         `same shape (keys) as the FormGroup's controls`,
  //     );
  //   };

  //   if (this.controlsStore.size !== Object.keys(value).length) {
  //     if (options.assertShape) error();
  //     return false;
  //   }

  //   return Array.from(this.controlsStore).every(([key, control]) => {
  //     if (!value.hasOwnProperty(key)) {
  //       if (options.assertShape) error();
  //       return false;
  //     }

  //     return ControlContainer.isControlContainer(control)
  //       ? control.equalValue(value[key], options)
  //       : control.equalValue(value[key]);
  //   });
  // }

  setValue(value: ControlsValue<Controls>, options: IControlEventOptions = {}) {
    this.emitEvent<IControlContainerStateChangeEvent>({
      type: 'StateChange',
      changes: {
        value: {
          value,
        },
      },
      ...pluckOptions(options),
    });
  }

  patchValue(
    value: Partial<ControlsValue<Controls>>,
    options: IControlEventOptions = {},
  ) {
    Object.entries(value).forEach(([key, val]) => {
      const c = this.controls[key];

      if (!c) {
        throw new Error(`FormGroup: Invalid patchValue key "${key}".`);
      }

      ControlContainer.isControlContainer(c)
        ? c.patchValue(val, options)
        : c.setValue(val, options);
    });
  }

  setControls(controls: Controls, options?: IControlEventOptions) {
    this.emitEvent<IControlContainerStateChangeEvent>({
      type: 'StateChange',
      changes: {
        controlsStore: {
          value: new Map(Object.entries(controls)),
          // changes: [{ type: 'SET' as const, value: controls }],
        },
      },
      ...pluckOptions(options),
    });
  }

  setControl<N extends keyof Controls>(
    name: N,
    control: Controls[N] | null,
    options?: IControlEventOptions,
  ) {
    const controls = new Map(this.controlsStore);

    if (control) {
      controls.set(name, control);
    } else {
      controls.delete(name);
    }

    this.emitEvent<IControlContainerStateChangeEvent>({
      type: 'StateChange',
      changes: {
        controlsStore: {
          value: controls,
          // changes: [{ type: 'PATCH', value: { [name]: control } }],
        },
      },
      ...pluckOptions(options),
    });
  }

  addControl<N extends keyof Controls>(
    name: N,
    control: Controls[N],
    options?: IControlEventOptions,
  ) {
    if (this.controlsStore.has(name)) return;

    const controls = new Map(this.controlsStore);
    controls.set(name, control);

    this.emitEvent<IControlContainerStateChangeEvent>({
      type: 'StateChange',
      changes: {
        controlsStore: {
          value: controls,
          // changes: [{ type: 'ADD', value: { [name]: control } }],
        },
      },
      ...pluckOptions(options),
    });
  }

  removeControl(name: keyof Controls, options?: IControlEventOptions) {
    if (!this.controlsStore.has(name)) return;

    const controls = new Map(this.controlsStore);
    controls.delete(name);

    this.emitEvent<IControlContainerStateChangeEvent>({
      type: 'StateChange',
      changes: {
        controlsStore: {
          value: controls,
          // changes: [{ type: 'REMOVE', value: name }],
        },
      },
      ...pluckOptions(options),
    });
  }

  // protected registerControls(options?: IControlEventOptions) {
  //   this.controlsStore.forEach((control, key) => {
  //     if (control.parent) {
  //       throw new Error('AbstractControl can only have one parent');
  //     }

  //     const sub = control.events
  //       .pipe(
  //         // filter(event => !event.processed.includes(this.id)),
  //         map((event) => {
  //           // event.processed.push(this.id);
  //           const newEvent = this.processChildEvent({ control, key, event });

  //           /**
  //            * Here, we are sharing the same `processed` array reference between
  //            * child and parent. This is a performance optimization.
  //            *
  //            * Take the following setup as an example:
  //            *
  //            * ```ts
  //            * const child = new FormControl();
  //            * const group1 = new FormGroup({child});
  //            * const group2 = new FormGroup({child});
  //            * group1.events.subscribe(group2.source);
  //            * group2.events.subscribe(group1.source);
  //            * ```
  //            *
  //            * Here, if the child emits a state change, both group1 and group2
  //            * will process it, emit a state change of their own, and then that
  //            * state change will be passed to the subscribed FormGroup for
  //            * processing. Since both controls have the same state, the change
  //            * will be discarded but only after it is determined that no changes
  //            * are needed. By sharing the `processed` array reference, we ensure
  //            * that, when a form group emits an event generated by the child,
  //            * the "processed" array will contain the ID of the subscribed form group,
  //            * ensuring that the subscribed form group will ignore the state change.
  //            *
  //            * This comes with a potential drawback. If `group1` and `group2` are
  //            * different classes, such that, for the same child event they end up
  //            * with a different state, then the user may want the from group's events
  //            * to be shared between them. In this case, even though each form group's
  //            * state change would be meaninful to the other, they still wouldn't be
  //            * shared. This is an acceptable limitation.
  //            */
  //           // if (newEvent) {
  //           //   (newEvent as any).processed = event.processed;
  //           // }

  //           return newEvent;
  //         }),
  //         filter(isTruthy),
  //       )
  //       .subscribe(this._events);

  //     this._controlsSubscriptions.set(control, sub);

  //     control.setParent(this, options);
  //   });
  // }

  // protected processChildEvent({
  //   control,
  //   key,
  //   event,
  // }: {
  //   control: AbstractControl;
  //   key: any;
  //   event: IControlEvent;
  // }): IControlEvent | null {
  //   switch (event.type) {
  //     case 'StateChange': {
  //       const newChanges = new Map();

  //       for (const [prop, change] of Object.entries(event.changes)) {
  //         const success = this.processChildStateChange({
  //           control,
  //           key,
  //           event: event as StateChange,
  //           prop,
  //           change,
  //           changes: newChanges,
  //         });

  //         if (!success) {
  //           // we want to emit a state change from the parent
  //           // whenever the child emits a state change, to ensure
  //           // that `observe()` calls trigger properly
  //           newChanges.set('otherChildStateChange', undefined);
  //         }
  //       }

  //       // // here, we flatten changes which will result in redundant processing
  //       // // e.g. we only need to process "disabled", "childDisabled",
  //       // // "childrenDisabled" changes once per event.
  //       // new Map(
  //       //   Array.from((event as StateChange).changes).map(([prop, value]) => {
  //       //     if (["childDisabled", "childrenDisabled"].includes(prop)) {
  //       //       return ["disabled", undefined];
  //       //     }

  //       //     if (["childTouched", "childrenTouched"].includes(prop)) {
  //       //       return ["touched", undefined];
  //       //     }

  //       //     if (["childPending", "childrenPending"].includes(prop)) {
  //       //       return ["pending", undefined];
  //       //     }

  //       //     if (["childChanged", "childrenChanged"].includes(prop)) {
  //       //       return ["changed", undefined];
  //       //     }

  //       //     if (["childReadonly", "childrenReadonly"].includes(prop)) {
  //       //       return ["readonly", undefined];
  //       //     }

  //       //     if (
  //       //       ["childInvalid", "childrenInvalid", "errorsStore"].includes(prop)
  //       //     ) {
  //       //       return ["invalid", undefined];
  //       //     }

  //       //     return [prop, value];
  //       //   })
  //       // ).forEach(([prop, value]) => {
  //       //   const success = this.processChildStateChange({
  //       //     control,
  //       //     key,
  //       //     event: event as StateChange,
  //       //     prop,
  //       //     value,
  //       //     changes,
  //       //   });

  //       //   if (!success) {
  //       //     // we want to emit a state change from the parent
  //       //     // whenever the child emits a state change, to ensure
  //       //     // that `observe()` calls trigger properly
  //       //     changes.set("otherChildStateChange", undefined);
  //       //   }
  //       // });

  //       if (newChanges.size === 0) return null;

  //       return {
  //         ...event,
  //         changes: newChanges,
  //       } as StateChange;
  //     }
  //   }

  //   return null;
  // }

  // protected setupControls(
  //   changes: Map<string, any>,
  //   options?: IControlEventOptions,
  // ) {
  //   super.setupControls(changes);

  //   const newValue = { ...this._value };
  //   const newEnabledValue = { ...this._enabledValue };

  //   this.controlsStore.forEach((control, key) => {
  //     newValue[key as keyof ControlsValue<T>] = control.value;

  //     if (control.enabled) {
  //       newEnabledValue[
  //         key as keyof ControlsValue<T>
  //       ] = ControlContainer.isControlContainer(control)
  //         ? control.enabledValue
  //         : control.value;
  //     }
  //   });

  //   this._value = newValue;
  //   this._enabledValue = newEnabledValue;

  //   // updateValidation must come before "value" change
  //   // is set
  //   this.updateValidation(changes, options);
  //   changes.set('value', newValue);
  // }

  // protected processStateChange({
  //   change,
  //   prop,
  //   changes,
  //   event,
  // }: {
  //   event: StateChange;
  //   prop: string;
  //   change: IStateChange;
  //   changes: IControlStateChanges;
  // }): boolean {
  //   switch (prop) {
  //     case 'value': {
  //       if (this.equalValue(value, { assertShape: true })) {
  //         return true;
  //       }

  //       this.controlsStore.forEach((control, key) => {
  //         control.patchValue(value[key], event);
  //       });

  //       const newValue = { ...this._value };
  //       const newEnabledValue = { ...this._enabledValue };

  //       Object.keys(value).forEach((k) => {
  //         const c = this.controlsStore.get(k)!;
  //         newValue[k as keyof ControlsValue<Controls>] = c.value;
  //         newEnabledValue[
  //           k as keyof ControlsValue<Controls>
  //         ] = ControlContainer.isControlContainer(c) ? c.enabledValue : c.value;
  //       });

  //       this._value = newValue;
  //       this._enabledValue = newEnabledValue;

  //       // As with the ControlBase "value" change, I think "updateValidation"
  //       // needs to come before the "value" change is set. See the ControlBase
  //       // "value" StateChange for more info.
  //       this.updateValidation(changes, event);
  //       changes.set('value', newValue);
  //       return true;
  //     }
  //     case 'controlsStore': {
  //       // if (isMapEqual(this.controlsStore, value)) return true;

  //       this._controlsStore = new Map(change.value);
  //       this._controls = Object.fromEntries(this._controlsStore) as Controls;

  //       switch (change.type) {
  //         case 'setControl': {
  //         }
  //         case 'addControl': {
  //         }
  //         case 'removeControl': {
  //         }
  //         default: {
  //         }
  //       }

  //       this.deregisterControls();
  //       this._controlsStore = new Map(value);
  //       this._controls = Object.fromEntries(value) as Controls;
  //       changes.set('controlsStore', new Map(value));
  //       this.setupControls(changes, event); // <- will setup value
  //       this.registerControls();
  //       return true;
  //     }
  //     default: {
  //       return super.processStateChange(args);
  //     }
  //   }
  // }

  // protected processChildStateChange({
  //   control,
  //   key,
  //   prop,
  //   change,
  //   event,
  //   changes,
  // }: {
  //   control: AbstractControl;
  //   key: keyof ControlsValue<Controls>;
  //   event: StateChange;
  //   prop: string;
  //   change: IStateChange;
  //   changes: IControlStateChanges;
  // }): boolean {
  //   switch (prop) {
  //     case 'value': {
  //       const newValue = { ...this._value };
  //       const newEnabledValue = { ...this._enabledValue };

  //       newValue[key] = control.value;
  //       newEnabledValue[key] = ControlContainer.isControlContainer(control)
  //         ? control.enabledValue
  //         : control.value;

  //       this._value = newValue;
  //       this._enabledValue = newEnabledValue;

  //       // As with the "value" change, I think "updateValidation"
  //       // needs to come before the "value" change is set
  //       this.updateValidation(changes, event);
  //       changes.set('value', newValue);
  //       return true;
  //     }
  //     case 'disabled': {
  //       super.processChildStateChange(args);

  //       const newEnabledValue = { ...this._enabledValue };

  //       if (control.enabled) {
  //         newEnabledValue[key] = ControlContainer.isControlContainer(control)
  //           ? control.enabledValue
  //           : control.value;
  //       } else {
  //         delete newEnabledValue[key];
  //       }

  //       this._enabledValue = newEnabledValue;

  //       return true;
  //     }
  //   }

  //   return super.processChildStateChange(args);
  // }
}

function extractEnabledValue<T extends { [key: string]: AbstractControl }>(
  obj: T,
) {
  return Object.fromEntries(
    Object.entries(obj)
      .filter(([_, ctrl]) => ctrl.enabled)
      .map(([key, ctrl]) => [
        key,
        ControlContainer.isControlContainer(ctrl)
          ? ctrl.enabledValue
          : ctrl.value,
      ]),
  ) as ControlsEnabledValue<T>;
}

function extractValue<T extends { [key: string]: AbstractControl }>(obj: T) {
  return Object.fromEntries(
    Object.entries(obj).map(([key, ctrl]) => [key, ctrl.value]),
  ) as ControlsValue<T>;
}
