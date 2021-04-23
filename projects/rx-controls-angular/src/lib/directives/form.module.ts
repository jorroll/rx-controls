import { NgModule } from '@angular/core';
import { FormControlNameDirective } from './form-control-name.directive';
import { FormGroupDirective } from './form-group.directive';
import { FormControlDirective } from './form-control.directive';
import { FormGroupNameDirective } from './form-group-name.directive';
import { RxAccessorsModule } from '../accessors/accessors.module';
import { FormArrayDirective } from './form-array.directive';
import { FormArrayNameDirective } from './form-array-name.directive';
import { DefaultFormArrayDirectiveAccessor } from './default-form-array.directive.accessor';
import { DefaultFormGroupDirectiveAccessor } from './default-form-group.directive.accessor';

@NgModule({
  imports: [RxAccessorsModule],
  providers: [],
  declarations: [
    FormControlDirective,
    FormControlNameDirective,
    FormGroupDirective,
    FormGroupNameDirective,
    DefaultFormGroupDirectiveAccessor,
    FormArrayDirective,
    FormArrayNameDirective,
    DefaultFormArrayDirectiveAccessor,
  ],
  exports: [
    RxAccessorsModule,
    FormControlDirective,
    FormControlNameDirective,
    FormGroupDirective,
    FormGroupNameDirective,
    DefaultFormGroupDirectiveAccessor,
    FormArrayDirective,
    FormArrayNameDirective,
    DefaultFormArrayDirectiveAccessor,
  ],
})
export class RxFormsModule {}
