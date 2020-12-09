import { NgModule } from '@angular/core';
import {
  DefaultAccessorAttribute,
  DefaultAccessorInputTextarea,
} from './default.accessor';

@NgModule({
  declarations: [DefaultAccessorInputTextarea, DefaultAccessorAttribute],
  exports: [DefaultAccessorInputTextarea, DefaultAccessorAttribute],
  providers: [],
})
export class AccessorsModule {}
