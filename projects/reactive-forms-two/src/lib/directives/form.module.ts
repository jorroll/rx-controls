import { NgModule } from '@angular/core';
import { FormControlNameDirective } from './form-control-name.directive';
import { FormGroupDirective } from './form-group.directive';
import { FormControlDirective } from './form-control.directive';
import { FormGroupNameDirective } from './form-group-name.directive';
import { AccessorsModule } from '../accessors/accessors.module';
import { FormArrayDirective } from './form-array.directive';
import { FormArrayNameDirective } from './form-array-name.directive';

@NgModule({
  imports: [AccessorsModule],
  providers: [],
  declarations: [
    FormControlDirective,
    FormControlNameDirective,
    FormGroupDirective,
    FormGroupNameDirective,
    FormArrayDirective,
    FormArrayNameDirective,
  ],
  exports: [
    AccessorsModule,
    FormControlDirective,
    FormControlNameDirective,
    FormGroupDirective,
    FormGroupNameDirective,
    FormArrayDirective,
    FormArrayNameDirective,
  ],
})
export class ReactiveFormsModuleTwo {}
