import { NgModule } from '@angular/core';
import { CheckboxInputAccessor } from './checkbox-input.accessor';
import {
  DefaultAccessorAttribute,
  DefaultAccessorInputTextarea,
} from './default.accessor';
import { NumberInputAccessor } from './number-input.accessor';
import { RadioInputAccessor } from './radio-input.accessor';
import { RangeInputAccessor } from './range-input.accessor';
import {
  SelectMultipleAccessor,
  SelectSingleAccessor,
} from './select.accessor';

@NgModule({
  declarations: [
    DefaultAccessorInputTextarea,
    DefaultAccessorAttribute,
    CheckboxInputAccessor,
    NumberInputAccessor,
    RadioInputAccessor,
    RangeInputAccessor,
    SelectSingleAccessor,
    SelectMultipleAccessor,
  ],
  exports: [
    DefaultAccessorInputTextarea,
    DefaultAccessorAttribute,
    CheckboxInputAccessor,
    NumberInputAccessor,
    RadioInputAccessor,
    RangeInputAccessor,
    SelectSingleAccessor,
    SelectMultipleAccessor,
  ],
  providers: [],
})
export class AccessorsModule {}
