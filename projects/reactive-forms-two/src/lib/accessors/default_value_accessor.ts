/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {
  ElementRef,
  InjectionToken,
  Renderer2,
  forwardRef,
  Inject,
  Optional,
  Directive,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { ɵgetDOM as getDOM } from '@angular/platform-browser';
import { distinctUntilChanged, filter, map } from 'rxjs/operators';
import { setupListeners } from './util';
import { FormControl } from '../models';
import { SW_CONTROL_ACCESSOR, ControlAccessor } from './interface';
import { isStateChange } from '../models/util';
import { Subscription } from 'rxjs';

/**
 * We must check whether the agent is Android because composition events
 * behave differently between iOS and Android.
 */
function _isAndroid(): boolean {
  const userAgent = getDOM() ? getDOM().getUserAgent() : '';
  return /android (\d+)/.test(userAgent.toLowerCase());
}

/**
 * @description
 * Provide this token to control if form directives buffer IME input until
 * the "compositionend" event occurs.
 * @publicApi
 */
export const COMPOSITION_BUFFER_MODE = new InjectionToken<boolean>(
  'CompositionEventMode'
);

/**
 * @description
 * The default `ControlValueAccessor` for writing a value and listening to changes on input
 * elements. The accessor is used by the `FormControlDirective`, `FormControlName`, and
 * `NgModel` directives.
 *
 * @usageNotes
 *
 * ### Using the default value accessor
 *
 * The following example shows how to use an input element that activates the default value accessor
 * (in this case, a text field).
 *
 * ```ts
 * const firstNameControl = new FormControl();
 * ```
 *
 * ```
 * <input type="text" [formControl]="firstNameControl">
 * ```
 *
 * @ngModule ReactiveFormsModule
 * @ngModule FormsModule
 * @publicApi
 */
@Directive({
  selector: 'input:not([type=checkbox]),textarea,[swDefaultControl]',
  providers: [
    {
      provide: SW_CONTROL_ACCESSOR,
      useExisting: forwardRef(() => DefaultValueAccessor),
      multi: true,
    },
  ],
})
export class DefaultValueAccessor
  implements ControlAccessor, OnInit, OnDestroy {
  readonly control = new FormControl();

  private subscriptions: Subscription[] = [];

  constructor(
    protected renderer: Renderer2,
    protected el: ElementRef,
    @Optional()
    @Inject(COMPOSITION_BUFFER_MODE)
    protected _compositionMode: boolean
  ) {}

  ngOnInit() {
    setupListeners(this, 'blur', 'onTouched');
    setupListeners(this, 'input', '_handleInput');
    setupListeners(this, 'compositionstart', '_compositionStart');
    setupListeners(this, 'compositionend', '_compositionEnd');

    if (this._compositionMode == null) {
      this._compositionMode = !_isAndroid();
    }

    const sub1 = this.control.events
      .pipe(
        filter(
          (event) =>
            isStateChange(event) &&
            !!event.change.value &&
            event.source !== this.control.id
        ),
        map(() => this.control.value)
      )
      .subscribe((value) => {
        const normalizedValue = value == null ? '' : value;

        this.renderer.setProperty(
          this.el.nativeElement,
          'value',
          normalizedValue
        );
      });

    const sub2 = this.control.events
      .pipe(
        filter(
          (event) =>
            isStateChange(event) &&
            !!event.change.disabled &&
            event.source !== this.control.id
        ),
        map(() => this.control.disabled),
        distinctUntilChanged()
      )
      .subscribe((isDisabled) => {
        this.renderer.setProperty(
          this.el.nativeElement,
          'disabled',
          isDisabled
        );
      });

    this.subscriptions.push(sub1, sub2);
  }

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  /** Whether the user is creating a composition string (IME events). */
  private _composing = false;
  /**
   * @description
   * The registered callback function called when an input event occurs on the input element.
   */
  onChange = (_: any) => {
    this.control.markDirty(true);
    this.control.setValue(_);
  };

  /**
   * @description
   * The registered callback function called when a blur event occurs on the input element.
   */
  onTouched = () => {
    this.control.markTouched(true);
  };

  /** @internal */
  _handleInput(event: any): void {
    const value = event.target.value;

    if (!this._compositionMode || (this._compositionMode && !this._composing)) {
      this.onChange(value);
    }
  }

  /** @internal */
  _compositionStart(): void {
    this._composing = true;
  }

  /** @internal */
  _compositionEnd(event: any): void {
    const value = event.target.value;

    this._composing = false;

    if (this._compositionMode) {
      this.onChange(value);
    }
  }
}
