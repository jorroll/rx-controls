import { merge, concat } from 'rxjs';
import { AbstractControl, IControlEventOptions } from './abstract-control';
import { filter, map, tap } from 'rxjs/operators';
import { IControlBaseArgs } from './control-base';
import { ControlContainerBase } from './control-container-base';
import {
  ControlContainer,
  ControlsEnabledValue,
  ControlsValue,
  IControlContainerStateChangeEvent,
} from './control-container';
import { pluckOptions } from './util';

export type IFormArrayArgs<D> = IControlBaseArgs<D>;

// export type ControlsValue<
//   T extends readonly AbstractControl[]
// > = T[number]['value'][];

// export type FormArrayEnabledValue<
//   T extends readonly AbstractControl[]
// > = T[number] extends ControlContainer
//   ? T[number]['enabledValue'][]
//   : T[number]['value'][];

// export type FormArrayCloneValue<T extends readonly AbstractControl[]> =
//   T[number] extends ControlContainer ? ReturnType<T[number]['cloneValue']>[] : T[number]['value'][];

// export type FormArrayCloneRawValue<T extends readonly AbstractControl[]> =
//   T[number] extends ControlContainer ? ReturnType<T[number]['cloneRawValue']>[] : T[number]['value'][];

// type ArrayElement<T> = T extends Array<infer R> ? R : any;

// // Typescript currently cannot easily get indices of a tuple
// // see https://github.com/microsoft/TypeScript/issues/32917
// // This work-around taken from
// // https://github.com/microsoft/TypeScript/issues/27995#issuecomment-441157546
// // and https://stackoverflow.com/a/57510063/5490505
// type ArrayKeys = keyof any[];
// type StringIndices<T> = Exclude<keyof T, ArrayKeys>;
// interface IndexMap {
//   '0': 0;
//   '1': 1;
//   '2': 2;
//   '3': 3;
//   '4': 4;
//   '5': 5;
//   '6': 6;
//   '7': 7;
//   '8': 8;
//   '9': 9;
//   '10': 10;
//   '11': 11;
//   '12': 12;
// }
// type CastToNumber<T> = [T] extends [never]
//   ? number
//   : T extends keyof IndexMap
//   ? IndexMap[T]
//   : number;
// type Indices<T> = CastToNumber<StringIndices<T>>;

// type Indices<T extends {length: number}> = Exclude<Partial<T>["length"], T['length']>;

export class FormArray<
  Controls extends ReadonlyArray<AbstractControl> = ReadonlyArray<
    AbstractControl
  >,
  Data = any
> extends ControlContainerBase<Controls, Data> {
  static id = 0;

  // protected _controlsStore: ReadonlyMap<number, Controls[number]> = new Map();
  // get controlsStore() {
  //   return this._controlsStore;
  // }

  // protected _controls: Controls;

  // protected _enabledValue: ControlsEnabledValue<Controls>;
  // get enabledValue() {
  //   return this._enabledValue;
  // }

  constructor(
    controls: Controls = ([] as unknown) as Controls,
    options: IFormArrayArgs<Data> = {}
  ) {
    super(
      options.id || Symbol(`FormArray-${FormArray.id++}`),
      controls,
      options
    );

    // The constructor's call to "setControls" will only actually fire
    // if a non-default value is provided. In the case of a default value,
    // the following properties need be manually set.
    if (!this._controls) this._controls = ([] as unknown) as Controls;
    if (!this._value) this._value = ([] as unknown) as ControlsValue<Controls>;
    if (!this._enabledValue) {
      this._enabledValue = ([] as unknown) as ControlsEnabledValue<Controls>;
    }
  }

  get<A extends number>(a: A): Controls[A];
  get<A extends AbstractControl = AbstractControl>(...args: any[]): A | null;
  get<A extends AbstractControl = AbstractControl>(...args: any[]): A | null {
    return super.get(...args);
  }

  clone() {
    const control = new FormArray<Controls, Data>();
    this.replayState().subscribe(control.source);
    return control;
  }

  // equalValue(
  //   value: ControlsValue<Controls>,
  //   options: { assertShape?: boolean } = {},
  // ): value is ControlsValue<Controls> {
  //   const error = () => {
  //     console.error(
  //       `FormArray`,
  //       `incoming value:`,
  //       value,
  //       'current controls:',
  //       this.controls,
  //     );

  //     throw new Error(
  //       `FormArray "value" must have the ` +
  //         `same shape (indices) as the FormArray's controls`,
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
    value: ControlsValue<Controls>,
    options: IControlEventOptions = {}
  ) {
    // if (!Array.isArray(value)) {
    //   throw new Error(
    //     'FormArray#patchValue() must be provided with an array value',
    //   );
    // }

    value.forEach((v, i) => {
      const c = this.controls[i];

      if (!c) {
        throw new Error(`FormArray: Invalid patchValue index "${i}".`);
      }

      ControlContainer.isControlContainer(c)
        ? c.patchValue(v, options)
        : c.setValue(v, options);
    });
  }

  setControls(controls: Controls, options: IControlEventOptions = {}) {
    // if (!Array.isArray(controls)) {
    //   throw new Error(
    //     'FormArray#setControls expects an array of AbstractControls.',
    //   );
    // }

    this.emitEvent<IControlContainerStateChangeEvent>({
      type: 'StateChange',
      changes: {
        controlsStore: {
          value: new Map(controls.map((c, i) => [i, c])),
        },
      },
      ...pluckOptions(options),
    });
  }

  setControl<N extends number>(
    index: N,
    control: Controls[N] | null,
    options: IControlEventOptions = {}
  ) {
    if (index > this._controls.length) {
      throw new Error(
        'Invalid FormArray#setControl index value. ' +
          'Provided index cannot be greater than FormArray#controls.length'
      );
    }

    const controls = this.controls.slice();

    if (control) {
      controls[index] = control;
    } else {
      controls.splice(index, 1);
    }

    this.emitEvent<IControlContainerStateChangeEvent>({
      type: 'StateChange',
      changes: {
        controlsStore: {
          value: new Map(controls.map((c, i) => [i, c])),
        },
      },
      ...pluckOptions(options),
    });
  }

  addControl(control: Controls[number], options: IControlEventOptions = {}) {
    const controls = new Map(this.controlsStore);

    controls.set(controls.size as number, control);

    this.emitEvent<IControlContainerStateChangeEvent>({
      type: 'StateChange',
      changes: {
        controlsStore: {
          value: controls,
        },
      },
      ...pluckOptions(options),
    });
  }

  removeControl<N extends number>(
    control: N | Controls[number],
    options: IControlEventOptions = {}
  ) {
    const index =
      typeof control === 'object'
        ? this.controls.findIndex((c) => c === control)
        : control;

    if (!this.controls[index]) return;

    const controls = this.controls.slice();

    controls.splice(index, 1);

    this.emitEvent<IControlContainerStateChangeEvent>({
      type: 'StateChange',
      changes: {
        controlsStore: {
          value: new Map(controls.map((c, i) => [i, c])),
        },
      },
      ...pluckOptions(options),
    });
  }

  // protected setupControls(
  //   changes: Map<string, any>,
  //   options?: IControlEventOptions,
  // ) {
  //   super.setupControls(changes);

  //   const newValue = [...this._value];
  //   const newEnabledValue = [...this._enabledValue] as FormArrayEnabledValue<Controls>;

  //   this.controlsStore.forEach((control, key) => {
  //     newValue[key] = control.value;

  //     if (control.enabled) {
  //       newEnabledValue[key] = ControlContainer.isControlContainer(control)
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

  // protected processStateChange(args: {
  //   event: StateChange;
  //   value: any;
  //   prop: string;
  //   changes: Map<string, any>;
  // }): boolean {
  //   const { value, prop, changes, event } = args;

  //   switch (prop) {
  //     case 'value': {
  //       if (this.equalValue(value, { assertShape: true })) {
  //         return true;
  //       }

  //       this.controls.forEach((control, index) => {
  //         control.patchValue(value[index], event);
  //       });

  //       const newValue = [...this._value];
  //       const newEnabledValue = [
  //         ...this._enabledValue,
  //       ] as FormArrayEnabledValue<Controls>;

  //       (value as ControlsValue<Controls>).forEach((_, i) => {
  //         const c = this.controls[i];
  //         newValue[i] = c.value;
  //         newEnabledValue[i] = ControlContainer.isControlContainer(c)
  //           ? c.enabledValue
  //           : c.value;
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
  //       if (isMapEqual(this.controlsStore, value)) return true;

  //       this.deregisterControls();
  //       this._controlsStore = new Map(value);
  //       this._controls = (Array.from(value.values()) as any) as Controls;
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

  // protected processChildStateChange(args: {
  //   control: AbstractControl;
  //   key: Indices<Controls>;
  //   event: StateChange;
  //   prop: string;
  //   value: any;
  //   changes: Map<string, any>;
  // }): boolean {
  //   const { control, key, prop, value, event, changes } = args;

  //   switch (prop) {
  //     case 'value': {
  //       const newValue = [...this._value];
  //       const newEnabledValue = [
  //         ...this._enabledValue,
  //       ] as FormArrayEnabledValue<Controls>;

  //       newValue[key] = control.value;
  //       newEnabledValue[key] = ControlContainer.isControlContainer(control)
  //         ? control.enabledValue
  //         : control.value;

  //       this._value = newValue;
  //       this._enabledValue = newEnabledValue;

  //       // As with the ControlBase "value" change, I think "updateValidation"
  //       // needs to come before the "value" change is set. See the ControlBase
  //       // "value" StateChange for more info.
  //       this.updateValidation(changes, event);
  //       changes.set('value', newValue);
  //       return true;
  //     }
  //     case 'disabled': {
  //       super.processChildStateChange(args);

  //       const newEnabledValue = [
  //         ...this._enabledValue,
  //       ] as FormArrayEnabledValue<Controls>;

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

function extractEnabledValue<T extends ReadonlyArray<AbstractControl>>(
  controls: T
): ControlsEnabledValue<T> {
  return controls
    .filter((c) => c.enabled)
    .map((ctrl) =>
      ControlContainer.isControlContainer(ctrl) ? ctrl.enabledValue : ctrl.value
    ) as any;
}

function extractValue<T extends ReadonlyArray<AbstractControl>>(
  controls: T
): ControlsValue<T> {
  return controls.map((ctrl) => ctrl.value) as any;
}
