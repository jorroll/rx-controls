import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ReactiveFormsModuleTwo } from '@service-work/reactive-forms';
import { ReactiveFormsModuleTwoCompat } from 'projects/reactive-forms-two-compat';

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    ReactiveFormsModuleTwo,
    ReactiveFormsModuleTwoCompat,
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
