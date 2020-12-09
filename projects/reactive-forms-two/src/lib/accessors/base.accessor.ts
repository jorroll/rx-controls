import { Directive, forwardRef, InjectFlags, Injector } from '@angular/core';
import { CONTROL_ACCESSOR_SPECIFICITY, SW_CONTROL_ACCESSOR } from './interface';

@Directive({ selector: 'BaseAccessor' })
export abstract class BaseAccessor {
  abstract [CONTROL_ACCESSOR_SPECIFICITY]: string;

  deactivated!: boolean;

  constructor(protected injector: Injector) {}

  protected shouldDeactivate() {
    const accessors = this.injector.get(
      SW_CONTROL_ACCESSOR,
      [],
      InjectFlags.Self
    );

    this.deactivated = accessors.some(
      (a) =>
        !a[CONTROL_ACCESSOR_SPECIFICITY] ||
        a[CONTROL_ACCESSOR_SPECIFICITY]! > this[CONTROL_ACCESSOR_SPECIFICITY]
    );

    return this.deactivated;
  }
}
