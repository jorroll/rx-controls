import { NgModule } from '@angular/core';
import { SwFormControlNameDirective } from './form-control-name.directive';
import { SwFormGroupDirective } from './form-group.directive';
import { SwFormControlDirective } from './form-control.directive';
import { SwFormGroupNameDirective } from './form-group-name.directive';
import { AccessorsModule } from '../accessors/accessors.module';
import { SwFormArrayDirective } from './form-array.directive';
import { SwFormArrayNameDirective } from './form-array-name.directive';

@NgModule({
  imports: [AccessorsModule],
  providers: [],
  declarations: [
    SwFormControlDirective,
    SwFormControlNameDirective,
    SwFormGroupDirective,
    SwFormGroupNameDirective,
    SwFormArrayDirective,
    SwFormArrayNameDirective,
  ],
  exports: [
    AccessorsModule,
    SwFormControlDirective,
    SwFormControlNameDirective,
    SwFormGroupDirective,
    SwFormGroupNameDirective,
    SwFormArrayDirective,
    SwFormArrayNameDirective,
  ],
})
export class ReactiveFormsModuleTwo {}
