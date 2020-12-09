import { NgModule } from '@angular/core';
import { SwCompatFormControlDirective } from './compat_form_control_directive';
import { SwCompatFormControlNameDirective } from './compat_form_control_name_directive';

@NgModule({
  imports: [],
  providers: [],
  declarations: [
    SwCompatFormControlDirective,
    SwCompatFormControlNameDirective,
  ],
  exports: [SwCompatFormControlDirective, SwCompatFormControlNameDirective],
})
export class ReactiveFormsModule2Compat {}
