import { FormControl as OldFormControl } from '@angular/forms';

import {
  FormControl,
  isStateChange,
  ɵisEqual as isEqual,
} from '@service-work/reactive-forms';

import { filter } from 'rxjs/operators';

export class CompatFormControl extends OldFormControl {
  get id() {
    return this.swControl.id;
  }

  constructor(readonly swControl: FormControl) {
    super();

    this.swControl.events.pipe(filter(isStateChange)).subscribe((event) => {
      event.changedProps.forEach((prop) => {
        switch (prop) {
          case 'value': {
            this.setValue(this.swControl.value, {
              swSource: event.source,
            });
            break;
          }
          case 'touched': {
            if (this.swControl.touched) {
              this.markAsTouched({
                swSource: event.source,
              });
            } else {
              this.markAsUntouched({
                swSource: event.source,
              });
            }
            break;
          }
          case 'dirty': {
            if (this.swControl.dirty) {
              this.markAsDirty({
                swSource: event.source,
              });
            } else {
              this.markAsPristine({
                swSource: event.source,
              });
            }
            break;
          }
          case 'disabled': {
            if (this.swControl.disabled) {
              this.disable({
                swSource: event.source,
              });
            } else {
              this.enable({
                swSource: event.source,
              });
            }
            break;
          }
          case 'errors': {
            this.setErrors(
              { ...this.swControl.errors },
              {
                swSource: event.source,
              }
            );
            break;
          }
        }
      });

      this.updateValueAndValidity();
    });
  }

  private options(op: any) {
    return { source: op.swSource || this.id };
  }

  markAsTouched(options: any = {}) {
    super.markAsTouched(options);
    if (!this.swControl || options.source === this.id) {
      return;
    }
    this.swControl.markTouched(true, this.options(options));
  }

  markAsUntouched(options: any = {}) {
    super.markAsUntouched(options);
    if (!this.swControl || options.source === this.id) {
      return;
    }
    this.swControl.markTouched(false, this.options(options));
  }

  markAsDirty(options: any = {}) {
    super.markAsDirty(options);
    if (!this.swControl || options.source === this.id) {
      return;
    }
    this.swControl.markDirty(true, this.options(options));
  }

  markAsPristine(options: any = {}) {
    super.markAsPristine(options);
    if (!this.swControl || options.source === this.id) {
      return;
    }
    this.swControl.markDirty(false, this.options(options));
  }

  disable(options: any = {}) {
    super.disable(options);
    if (!this.swControl || options.source === this.id) {
      return;
    }
    this.swControl.markDisabled(true, this.options(options));
  }

  enable(options: any = {}) {
    super.enable(options);
    if (!this.swControl || options.source === this.id) {
      return;
    }
    this.swControl.markDisabled(true, this.options(options));
  }

  setValue(value: any, options: any = {}) {
    super.setValue(value, options);
    if (!this.swControl || options.source === this.id) {
      return;
    }
    this.swControl.setValue(value, this.options(options));
    this.swControl.setErrors(this.errors, this.options(options));
    this.swControl.markPending(false, this.options(options));
  }

  patchValue(value: any, options: any = {}) {
    super.patchValue(value, options);
    if (!this.swControl || options.source === this.id) {
      return;
    }
    this.swControl.setValue(value, this.options(options));
    this.swControl.setErrors(this.errors, this.options(options));
    this.swControl.markPending(false, this.options(options));
  }

  setErrors(value: any, options: any = {}) {
    super.setErrors(value, options);
    if (!this.swControl || options.source === this.id) {
      return;
    }
    this.swControl.setErrors(value, this.options(options));
  }

  markAsPending(options: any = {}) {
    super.markAsPending(options);
    if (!this.swControl || options.source === this.id) {
      return;
    }
    this.swControl.markPending(true, this.options(options));
  }

  updateValueAndValidity(options: any = {}) {
    const errors = this.errors ? { ...this.errors } : {};
    super.updateValueAndValidity(options);

    if (!this.swControl || options.source === this.id) {
      return;
    }

    const newErrors = this.errors ? { ...this.errors } : {};

    if (isEqual(errors, newErrors)) return;

    this.swControl.setErrors(this.errors, this.options(options));
  }

  get invalid() {
    return this.swControl.invalid;
  }

  get valid() {
    return this.swControl.valid;
  }
}

// class CompatFormControl implements OldAbstractControl {

//   get dirty() {
//     return this.control.dirty;
//   }

//   get pristine() {
//     return !this.control.dirty;
//   }

//   get disabled() {
//     return this.control.disabled;
//   }

//   get enabled() {
//     return this.control.enabled;
//   }

//   get errors() {
//     return this.control.errors;
//   }

//   get invalid() {
//     return this.control.invalid;
//   }

//   get pending() {
//     return this.control.pending;
//   }

//   get touched() {
//     return this.control.touched;
//   }

//   get untouched() {
//     return !this.control.touched;
//   }

//   get status() {
//     return this.control.status;
//   }

//   get valid() {
//     return this.control.valid;
//   }

//   get value() {
//     return this.control.value;
//   }

//   readonly valueChanges = this.control.observeChanges('value');
//   readonly statusChanges = this.control.observeChanges('status');

//   readonly updateOn = 'change';
//   parent = null!;
//   root = null!;
//   asyncValidator = null;

//   get validator() {
//     return this.control.validator ? this._validator : null;
//   }
//   private _validator: OldValidatorFn = () => null;

//   constructor(public control: FormControl) {}

//   reset() {
//     throw new Error('not implemented');
//   }

//   disable() {
//     this.control.markDisabled(true);
//   }

//   enable() {
//     this.control.markDisabled(false);
//   }

//   get() {
//     return null;
//   }

//   markAsTouched() {
//     this.control.markTouched(true);
//   }

//   markAsUntouched() {
//     this.control.markTouched(false);
//   }

//   markAsDirty() {
//     this.control.markDirty(true);
//   }

//   markAsPristine() {
//     this.control.markDirty(false);
//   }

//   patchValue(value: any) {
//     this.control.setValue(value);
//   }

//   setValue(value: any) {
//     this.control.setValue(value);
//   }

//   setErrors(errors: any) {
//     this.control.setErrors(errors);
//   }

//   markAsPending() {
//     throw new Error('not implemented');
//   }

//   markAllAsTouched() {
//     this.control.markTouched(true);
//   }

//   setValidators(validators: any) {
//     throw new Error('not implemented');
//   }

//   clearValidators() {
//     throw new Error('not implemented');
//   }

//   clearAsyncValidators() {
//     throw new Error('not implemented');
//   }

//   setAsyncValidators(validators: any) {
//     throw new Error('not implemented');
//   }

//   setParent(parent: any) {
//     throw new Error('not implemented');
//   }

//   getError() {
//     throw new Error('not implemented');
//   }

//   hasError(): boolean {
//     throw new Error('not implemented');
//   }

//   updateValueAndValidity() {
//     // noop
//   }
// }
