import { FormControl as OldFormControl } from '@angular/forms';
import { FormControl, isStateChange } from 'rx-controls-angular';
import { filter } from 'rxjs/operators';

export const FROM_RXCONTROL = Symbol('change from rxControl');

export class CompatFormControl extends OldFormControl {
  constructor(readonly rxControl: FormControl) {
    super();

    this.rxControl.events.pipe(filter(isStateChange)).subscribe((event) => {
      Object.entries(event.changes).map(([prop, value]) => {
        switch (prop) {
          case 'rawValue':
          case 'value': {
            this.setValue(value, { [FROM_RXCONTROL]: true });
            break;
          }
          case 'touched': {
            if (value) {
              this.markAsTouched({ [FROM_RXCONTROL]: true });
            } else {
              this.markAsUntouched({ [FROM_RXCONTROL]: true });
            }
            break;
          }
          case 'dirty': {
            if (value) {
              this.markAsDirty({ [FROM_RXCONTROL]: true });
            } else {
              this.markAsPristine({ [FROM_RXCONTROL]: true });
            }
            break;
          }
          // this is handled in the ControlDirective
          // case 'disabled': {
          //   if (value) {
          //     this.disable({ [FROM_SWCONTROL]: true });
          //   } else {
          //     this.enable({ [FROM_SWCONTROL]: true });
          //   }
          //   break;
          // }
          case 'pending': {
            if (value) {
              this.markAsPending({ [FROM_RXCONTROL]: true });
            } else {
              this.updateValueAndValidity({ [FROM_RXCONTROL]: true });
            }
            break;
          }
          case 'errors': {
            this.setErrors(value, { [FROM_RXCONTROL]: true });
            break;
          }
        }
      });
    });
  }

  markAsTouched(options: any = {}) {
    super.markAsTouched(options);
    if (!this.rxControl || options[FROM_RXCONTROL]) return;
    this.rxControl.markTouched(true);
  }

  markAsUntouched(options: any = {}) {
    super.markAsUntouched(options);
    if (!this.rxControl || options[FROM_RXCONTROL]) return;
    this.rxControl.markTouched(false);
  }

  markAsDirty(options: any = {}) {
    super.markAsDirty(options);
    if (!this.rxControl || options[FROM_RXCONTROL]) return;
    this.rxControl.markDirty(true);
  }

  markAsPristine(options: any = {}) {
    super.markAsPristine(options);
    if (!this.rxControl || options[FROM_RXCONTROL]) return;
    this.rxControl.markDirty(false);
  }

  disable(options: any = {}) {
    super.disable(options);
    if (!this.rxControl || options[FROM_RXCONTROL]) return;
    this.rxControl.markDisabled(true);
  }

  enable(options: any = {}) {
    super.enable(options);
    if (!this.rxControl || options[FROM_RXCONTROL]) return;
    this.rxControl.markDisabled(false);
  }

  setValue(value: any, options: any = {}) {
    super.setValue(value === undefined || value === null ? '' : value, options);
    if (!this.rxControl || options[FROM_RXCONTROL]) return;
    this.rxControl.setValue(value);
    this.rxControl.setErrors(this.errors);
    this.rxControl.markPending(false);
  }

  patchValue(value: any, options: any = {}) {
    super.patchValue(value, options);
    if (!this.rxControl || options[FROM_RXCONTROL]) return;
    this.rxControl.setValue(value);
    this.rxControl.setErrors(this.errors);
    this.rxControl.markPending(false);
  }

  setErrors(value: any, options: any = {}) {
    super.setErrors(value, options);
    if (!this.rxControl || options[FROM_RXCONTROL]) return;
    this.rxControl.setErrors(value);
  }

  // I believe the standard AbstractControl does not
  // immediately become invalid when you add a validator
  // to it. We want to retain that behavior.
  // setValidators(value: any, options: any = {}) {
  //   super.setValidators(value);
  //   if (!this.swControl || options[FROM_SWCONTROL]) return;
  //   this.updateValueAndValidity(options);
  //   // this.swControl.setErrors(this.errors);
  // }

  markAsPending(options: any = {}) {
    super.markAsPending(options);
    if (!this.rxControl || options[FROM_RXCONTROL]) return;
    this.rxControl.markPending(true);
  }

  updateValueAndValidity(options: any = {}) {
    super.updateValueAndValidity(options);
    if (!this.rxControl || options[FROM_RXCONTROL]) return;
    this.rxControl.setErrors(this.errors);
  }
}
