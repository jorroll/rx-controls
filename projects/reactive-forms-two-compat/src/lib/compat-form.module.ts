import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { CompatFormControlDirective } from './compat-form-control.directive';
import { CompatFormControlNameDirective } from './compat-form-control-name.directive';

@NgModule({
  imports: [ReactiveFormsModule],
  providers: [],
  declarations: [CompatFormControlDirective, CompatFormControlNameDirective],
  exports: [CompatFormControlDirective, CompatFormControlNameDirective],
})
export class ReactiveFormsModuleTwoCompat {}
