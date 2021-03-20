import { FormControl as OldFormControl } from '@angular/forms';
import { FormControl, isStateChange } from '@service-work/reactive-forms';
import { filter } from 'rxjs/operators';

export const FROM_SWCONTROL = Symbol('change from swControl');

export class CompatFormControl extends OldFormControl {
  constructor(readonly swControl: FormControl) {
    super();

    this.swControl.events.pipe(filter(isStateChange)).subscribe((event) => {
      event.changedProps.forEach((prop) => {
        switch (prop) {
          case 'rawValue':
          case 'value': {
            this.setValue(this.swControl.rawValue, {
              [FROM_SWCONTROL]: true,
            });
            break;
          }
          case 'touched': {
            if (this.swControl.touched) {
              this.markAsTouched({ [FROM_SWCONTROL]: true });
            } else {
              this.markAsUntouched({ [FROM_SWCONTROL]: true });
            }
            break;
          }
          case 'dirty': {
            if (this.swControl.dirty) {
              this.markAsDirty({ [FROM_SWCONTROL]: true });
            } else {
              this.markAsPristine({ [FROM_SWCONTROL]: true });
            }
            break;
          }
          // this is handled in the ControlDirective
          // case 'disabled': {
          //   if (this.swControl.disabled) {
          //     this.disable({ [FROM_SWCONTROL]: true });
          //   } else {
          //     this.enable({ [FROM_SWCONTROL]: true });
          //   }
          //   break;
          // }
          case 'pending': {
            if (this.swControl.pending) {
              this.markAsPending({ [FROM_SWCONTROL]: true });
            } else {
              this.updateValueAndValidity({ [FROM_SWCONTROL]: true });
            }
            break;
          }
          case 'errors': {
            this.setErrors(this.swControl.errors, {
              [FROM_SWCONTROL]: true,
            });
            break;
          }
        }
      });
    });
  }

  markAsTouched(options: any = {}) {
    super.markAsTouched(options);
    if (!this.swControl || options[FROM_SWCONTROL]) return;
    this.swControl.markTouched(true);
  }

  markAsUntouched(options: any = {}) {
    super.markAsUntouched(options);
    if (!this.swControl || options[FROM_SWCONTROL]) return;
    this.swControl.markTouched(false);
  }

  markAsDirty(options: any = {}) {
    super.markAsDirty(options);
    if (!this.swControl || options[FROM_SWCONTROL]) return;
    this.swControl.markDirty(true);
  }

  markAsPristine(options: any = {}) {
    super.markAsPristine(options);
    if (!this.swControl || options[FROM_SWCONTROL]) return;
    this.swControl.markDirty(false);
  }

  disable(options: any = {}) {
    super.disable(options);
    if (!this.swControl || options[FROM_SWCONTROL]) return;
    this.swControl.markDisabled(true);
  }

  enable(options: any = {}) {
    super.enable(options);
    if (!this.swControl || options[FROM_SWCONTROL]) return;
    this.swControl.markDisabled(false);
  }

  setValue(value: any, options: any = {}) {
    super.setValue(value === undefined || value === null ? '' : value, options);
    if (!this.swControl || options[FROM_SWCONTROL]) return;
    this.swControl.setValue(value);
    this.swControl.setErrors(this.errors);
    this.swControl.markPending(false);
  }

  patchValue(value: any, options: any = {}) {
    super.patchValue(value, options);
    if (!this.swControl || options[FROM_SWCONTROL]) return;
    this.swControl.setValue(value);
    this.swControl.setErrors(this.errors);
    this.swControl.markPending(false);
  }

  setErrors(value: any, options: any = {}) {
    super.setErrors(value, options);
    if (!this.swControl || options[FROM_SWCONTROL]) return;
    this.swControl.setErrors(value);
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
    if (!this.swControl || options[FROM_SWCONTROL]) return;
    this.swControl.markPending(true);
  }

  updateValueAndValidity(options: any = {}) {
    super.updateValueAndValidity(options);
    if (!this.swControl || options[FROM_SWCONTROL]) return;
    this.swControl.setErrors(this.errors);
  }
}
