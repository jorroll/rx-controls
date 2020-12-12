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
              swSource: true,
            });
            break;
          }
          case 'touched': {
            if (this.swControl.touched) {
              this.markAsTouched({
                swSource: true,
              });
            } else {
              this.markAsUntouched({
                swSource: true,
              });
            }
            break;
          }
          case 'dirty': {
            if (this.swControl.dirty) {
              this.markAsDirty({
                swSource: true,
              });
            } else {
              this.markAsPristine({
                swSource: true,
              });
            }
            break;
          }
          case 'disabled': {
            if (this.swControl.disabled) {
              this.disable({
                swSource: true,
              });
            } else {
              this.enable({
                swSource: true,
              });
            }
            break;
          }
          case 'errors': {
            this.setErrors(
              { ...this.swControl.errors },
              {
                swSource: true,
              }
            );
            break;
          }
        }
      });

      this.updateValueAndValidity();
    });
  }

  // private options(op: any) {
  //   return { swSource: op.swSource };
  // }

  markAsTouched(options: any = {}) {
    super.markAsTouched(options);
    if (!this.swControl || options.swSource) return;
    this.swControl.markTouched(true);
  }

  markAsUntouched(options: any = {}) {
    super.markAsUntouched(options);
    if (!this.swControl || options.swSource) return;
    this.swControl.markTouched(false);
  }

  markAsDirty(options: any = {}) {
    super.markAsDirty(options);
    if (!this.swControl || options.swSource) return;
    this.swControl.markDirty(true);
  }

  markAsPristine(options: any = {}) {
    super.markAsPristine(options);
    if (!this.swControl || options.swSource) return;
    this.swControl.markDirty(false);
  }

  disable(options: any = {}) {
    super.disable(options);
    if (!this.swControl || options.swSource) return;
    this.swControl.markDisabled(true);
  }

  enable(options: any = {}) {
    super.enable(options);
    if (!this.swControl || options.swSource) return;
    this.swControl.markDisabled(true);
  }

  setValue(value: any, options: any = {}) {
    super.setValue(value, options);
    if (!this.swControl || options.swSource) return;
    this.swControl.setValue(value);
    this.swControl.setErrors(this.errors);
    this.swControl.markPending(false);
  }

  patchValue(value: any, options: any = {}) {
    super.patchValue(value, options);
    if (!this.swControl || options.swSource) return;
    this.swControl.setValue(value);
    this.swControl.setErrors(this.errors);
    this.swControl.markPending(false);
  }

  setErrors(value: any, options: any = {}) {
    super.setErrors(value, options);
    if (!this.swControl || options.swSource) return;
    this.swControl.setErrors(value);
  }

  markAsPending(options: any = {}) {
    super.markAsPending(options);
    if (!this.swControl || options.swSource) return;
    this.swControl.markPending(true);
  }

  updateValueAndValidity(options: any = {}) {
    const errors = this.errors ? { ...this.errors } : {};
    super.updateValueAndValidity(options);

    if (!this.swControl || options.swSource) return;

    const newErrors = this.errors ? { ...this.errors } : {};

    if (isEqual(errors, newErrors)) return;

    this.swControl.setErrors(this.errors);
  }

  get invalid() {
    return this.swControl.invalid;
  }

  get valid() {
    return this.swControl.valid;
  }
}
