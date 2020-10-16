import { Subscription, concat, Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { AbstractControl, IControlEventOptions } from './abstract-control';
import {
  ControlContainer,
  ControlsValue,
  ControlsEnabledValue,
  IControlContainerStateChangeEvent,
} from './control-container';
import { ControlBase } from './control-base';
import { capitalize } from './util';

export abstract class ControlContainerBase<
    Controls extends
      | {
          readonly [key: string]: AbstractControl;
        }
      | {
          readonly [key: number]: AbstractControl;
        } = any,
    Data = any
  >
  extends ControlBase<ControlsValue<Controls>, Data>
  implements ControlContainer<Controls, Data> {
  abstract readonly controlsStore: ReadonlyMap<any, AbstractControl>;

  protected abstract _controls: Controls;
  get controls() {
    return this._controls;
  }

  get size() {
    return this.controlsStore.size;
  }

  abstract readonly enabledValue: ControlsEnabledValue<Controls>;

  protected _controlsSubscriptions = new Map<AbstractControl, Subscription>();

  [ControlContainer.INTERFACE]() {
    return this;
  }

  get<A extends AbstractControl = AbstractControl>(...args: any[]): A | null {
    if (args.length === 0) return null;
    else if (args.length === 1) return (this.controls as any)[args[0]];

    return args.reduce((prev: AbstractControl | null, curr) => {
      if (ControlContainer.isControlContainer(prev)) {
        return prev.get(curr);
      }

      return null;
    }, this as AbstractControl | null);
  }

  // abstract equalValue(
  //   value: any,
  //   options?: { assertShape?: boolean },
  // ): value is Value;

  abstract patchValue(value: unknown, options?: IControlEventOptions): void;

  abstract setControls(...args: any[]): void;

  abstract setControl(...args: any[]): void;

  abstract addControl(...args: any[]): void;

  abstract removeControl(...args: any[]): void;

  replayState(
    options: IControlEventOptions = {},
  ): Observable<IControlContainerStateChangeEvent> {
    return concat(
      of({
        eventId: '',
        sourceControlId: options.source || this.id,
        type: 'StateChange',
        changes: {
          controlsStore: { value: new Map(this.controlsStore) },
          parent: { value: this.parent },
        },
        noEmit: options.noEmit,
        meta: options.meta || {},
      }).pipe(
        map((event) => {
          // we reset the applied array so that this saved
          // state change can be applied to the same control
          // multiple times
          event.eventId = AbstractControl.eventId();
          return event as IControlContainerStateChangeEvent;
        }),
      ),
      super.replayState(options),
    );
  }

  abstract clone(): ControlContainerBase<Controls, Data>;

  // protected registerControls(changes: Map<any, any>) {
  //   const subscriptionsStore = new Map<AbstractControl, Subscription>();

  //   this.controlsStore.forEach((control, key) => {
  //     subscriptionsStore.set(
  //       control,
  //       control.events.subscribe((event) =>
  //         this.processChildEvent({ control, key, event })
  //       )
  //     );
  //     control.setParent(this);
  //   });

  // calcChildrenProps(this as any, "disabled", asArray, changes);

  // asArray = asArray.filter(([, c]) => c.enabled);

  // calcChildrenProps(this as any, "touched", asArray, changes);
  // calcChildrenProps(this as any, "readonly", asArray, changes);
  // calcChildrenProps(this as any, "changed", asArray, changes);
  // calcChildrenProps(this as any, "submitted", asArray, changes);
  // calcChildrenProps(this as any, "pending", asArray, changes);
  // calcChildrenProps(this as any, "invalid", asArray, changes);
  // }

  // protected deregisterControls() {
  //   this.controlsStore.forEach((control) => {
  //     control.atomic.delete(this.id);
  //   });
  // }

  // protected setupControls(changes: Map<any, any>) {
  //   let asArray = Array.from(this.controlsStore);

  //   calcChildrenProps(this as any, "disabled", asArray, changes);

  //   asArray = asArray.filter(([, c]) => c.enabled);

  //   calcChildrenProps(this as any, "touched", asArray, changes);
  //   calcChildrenProps(this as any, "readonly", asArray, changes);
  //   calcChildrenProps(this as any, "changed", asArray, changes);
  //   calcChildrenProps(this as any, "submitted", asArray, changes);
  //   calcChildrenProps(this as any, "pending", asArray, changes);
  //   calcChildrenProps(this as any, "invalid", asArray, changes);
  // }

  // protected processChildEvent(args: {
  //   control: AbstractControl;
  //   key: any;
  //   event: ControlEvent;
  // }): ControlEvent | null {
  //   const { control, key, event } = args;

  //   switch (event.type) {
  //     case "StateChange": {
  //       const changes = new Map();

  //       // here, we flatten changes which will result in redundant processing
  //       // e.g. we only need to process "disabled", "childDisabled",
  //       // "childrenDisabled" changes once per event.
  //       new Map(
  //         Array.from((event as StateChange).changes).map(([prop, value]) => {
  //           if (["childDisabled", "childrenDisabled"].includes(prop)) {
  //             return ["disabled", undefined];
  //           }

  //           if (["childTouched", "childrenTouched"].includes(prop)) {
  //             return ["touched", undefined];
  //           }

  //           if (["childPending", "childrenPending"].includes(prop)) {
  //             return ["pending", undefined];
  //           }

  //           if (["childChanged", "childrenChanged"].includes(prop)) {
  //             return ["changed", undefined];
  //           }

  //           if (["childReadonly", "childrenReadonly"].includes(prop)) {
  //             return ["readonly", undefined];
  //           }

  //           if (
  //             ["childInvalid", "childrenInvalid", "errorsStore"].includes(prop)
  //           ) {
  //             return ["invalid", undefined];
  //           }

  //           return [prop, value];
  //         })
  //       ).forEach((value, prop) => {
  //         const success = this.processChildStateChange({
  //           control,
  //           key,
  //           event: event as StateChange,
  //           prop,
  //           value,
  //           changes,
  //         });

  //         if (!success) {
  //           // we want to emit a state change from the parent
  //           // whenever the child emits a state change, to ensure
  //           // that `observe()` calls trigger properly
  //           changes.set("otherChildStateChange", undefined);
  //         }
  //       });

  //       if (changes.size === 0) return null;

  //       return {
  //         ...event,
  //         changes,
  //       } as StateChange;
  //     }
  //   }

  //   return null;
  // }

  // protected processChildStateChange(args: {
  //   control: AbstractControl;
  //   key: any;
  //   event: StateChange;
  //   prop: string;
  //   value: any;
  //   changes: Map<string, any>;
  // }): boolean {
  //   const { control, prop, changes } = args;

  //   switch (prop) {
  //     case "disabled": {
  //       let asArray = Array.from(this.controlsStore);

  //       calcChildrenProps(this as any, "disabled", asArray, changes);

  //       asArray = asArray.filter(([, c]) => c.enabled);

  //       calcChildrenProps(this as any, "touched", asArray, changes);
  //       calcChildrenProps(this as any, "readonly", asArray, changes);
  //       calcChildrenProps(this as any, "changed", asArray, changes);
  //       calcChildrenProps(this as any, "submitted", asArray, changes);
  //       calcChildrenProps(this as any, "pending", asArray, changes);
  //       calcChildrenProps(this as any, "invalid", asArray, changes);

  //       return true;
  //     }
  //     case "touched": {
  //       if (control.disabled) return true;

  //       const asArray = Array.from(this.controlsStore).filter(
  //         ([, c]) => c.enabled
  //       );

  //       calcChildrenProps(this, "touched", asArray, changes);

  //       return true;
  //     }
  //     case "changed": {
  //       if (control.disabled) return true;

  //       const asArray = Array.from(this.controlsStore).filter(
  //         ([, c]) => c.enabled
  //       );

  //       calcChildrenProps(this, "changed", asArray, changes);

  //       return true;
  //     }
  //     case "readonly": {
  //       if (control.disabled) return true;

  //       const asArray = Array.from(this.controlsStore).filter(
  //         ([, c]) => c.enabled
  //       );

  //       calcChildrenProps(this, "readonly", asArray, changes);

  //       return true;
  //     }
  //     case "invalid": {
  //       if (control.disabled) return true;

  //       const asArray = Array.from(this.controlsStore).filter(
  //         ([, c]) => c.enabled
  //       );

  //       calcChildrenProps(this, "invalid", asArray, changes);

  //       return true;
  //     }
  //     case "pending": {
  //       if (control.disabled) return true;

  //       const asArray = Array.from(this.controlsStore).filter(
  //         ([, c]) => c.enabled
  //       );

  //       calcChildrenProps(this, "pending", asArray, changes);

  //       return true;
  //     }
  //   }

  //   return false;
  // }
}

// const asArray = Array.from(this.controlsStore).filter(
//   ([, c]) => c.enabled,
// );

// this._childPending = asArray.some(([, c]) => {
//   if (ControlContainer.isControlContainer(c)) {
//     return c.childPending;
//   } else {
//     return c.changed;
//   }
// });

// this._childrenPending =
//   this.controlsStore.size > 0 &&
//   asArray.every(([, c]) => {
//     if (ControlContainer.isControlContainer(c)) {
//       return c.childrenPending;
//     } else {
//       return c.changed;
//     }
//   });

export function calcChildrenProps(
  parent: ControlContainer,
  prop:
    | 'pending'
    | 'disabled'
    | 'touched'
    | 'submitted'
    | 'changed'
    | 'invalid'
    | 'readonly',
  controls: [any, AbstractControl][],
  changes: Map<any, any>,
) {
  const cprop = capitalize(prop);
  const childProp: string & keyof typeof parent = `child${cprop}` as any;
  const childrenProp: string & keyof typeof parent = `children${cprop}` as any;

  const child = parent[childProp];
  const children = parent[childrenProp];

  (parent as any)[`_${childProp}`] = controls.some(([, c]) => {
    if (ControlContainer.isControlContainer(c)) {
      return (c as any)[childProp];
    } else {
      return (c as any)[prop];
    }
  });

  (parent as any)[`_${childrenProp}`] =
    controls.length > 0 &&
    controls.every(([, c]) => {
      if (ControlContainer.isControlContainer(c)) {
        return (c as any)[childrenProp];
      } else {
        return (c as any)[prop];
      }
    });

  if (child !== parent[childProp]) {
    changes.set(childProp, parent[childProp]);
  }

  if (children !== parent[childrenProp]) {
    changes.set(childrenProp, parent[childrenProp]);
  }
}
