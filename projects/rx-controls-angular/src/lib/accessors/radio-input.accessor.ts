import {
  Directive,
  ElementRef,
  forwardRef,
  Injectable,
  Injector,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Renderer2,
  SimpleChange,
  SimpleChanges,
} from '@angular/core';
import { BehaviorSubject, Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { isStateChangeEvent, FormControl } from 'rx-controls';
import { BaseAccessor } from './base.accessor';
import {
  ControlAccessor,
  CONTROL_ACCESSOR_SPECIFICITY,
  RX_CONTROL_ACCESSOR,
} from './interface';
import { setupStdControlEventHandlers, setupListeners } from './util';

function subscribeToRelevantChanges(
  source: ControlAccessor,
  subscribee: ControlAccessor
) {
  return source.control.events
    .pipe(
      filter(
        (e) =>
          isStateChangeEvent(e) &&
          (e.changes.rawValue !== undefined || e.changes.dirty !== undefined)
      )
    )
    .subscribe((e) => subscribee.control.processEvent(e));
}

@Injectable({
  providedIn: 'root',
})
export class RadioInputRegistry {
  private radioAccessorRegistry = new Map<string, RadioInputAccessor[]>();

  private radioAccessorInfo = new Map<
    RadioInputAccessor,
    { radioName: string; subscriptions: Subscription[] }
  >();

  add(accessor: RadioInputAccessor) {
    const radioName = accessor.name;

    const subscriptions: Subscription[] = [];

    this.radioAccessorInfo.set(accessor, { radioName, subscriptions });

    if (!radioName) return;

    let accessors = this.radioAccessorRegistry.get(radioName);

    if (!accessors) {
      accessors = [];
      this.radioAccessorRegistry.set(radioName, accessors);
    }

    const isNewAccessorSelected =
      accessor.control.rawValue === accessor.radioValue;
    // it doesn't matter which we select since all the existing ones have
    // their value synced
    const existingAccessor = accessors[0];

    // In the DOM in Google Chrome, if you add a radio control that is already
    // selected to a radio group, then it becomes the "selected" control in the
    // new group
    if (!isNewAccessorSelected && existingAccessor) {
      accessor.control.setValue(existingAccessor.control.rawValue);
    } else if (isNewAccessorSelected && existingAccessor) {
      existingAccessor.control.setValue(accessor.control.rawValue);
    }

    if (existingAccessor) {
      accessor.control.markDirty(existingAccessor.control.dirty);
    }

    accessors.forEach((otherAccessor) => {
      const sub1 = subscribeToRelevantChanges(otherAccessor, accessor);
      const sub2 = subscribeToRelevantChanges(accessor, otherAccessor);

      this.radioAccessorInfo.get(otherAccessor)!.subscriptions.push(sub1);
      subscriptions.push(sub2);
    });

    accessors.push(accessor);
  }

  remove(accessor: RadioInputAccessor) {
    if (!this.radioAccessorInfo.has(accessor)) return;

    const { radioName, subscriptions } = this.radioAccessorInfo.get(accessor)!;

    subscriptions.forEach((sub) => sub.unsubscribe());

    this.radioAccessorInfo.delete(accessor);

    if (!radioName) return;

    const accessors = this.radioAccessorRegistry.get(radioName)!;

    if (accessors.length === 1) {
      this.radioAccessorRegistry.delete(radioName);
    } else {
      accessors.splice(accessors.indexOf(accessor), 1);
    }
  }

  updateRadioAccessorName(accessor: RadioInputAccessor) {
    if (!this.radioAccessorInfo.has(accessor)) return;

    const { radioName } = this.radioAccessorInfo.get(accessor)!;

    if (accessor.name === radioName) return;

    this.remove(accessor);
    this.add(accessor);
  }
}

@Directive({
  selector:
    'input[type=radio][rxFormControlName],input[type=radio][rxFormControl]' +
    'input[type=radio][rxInputAccessor]',
  providers: [
    {
      provide: RX_CONTROL_ACCESSOR,
      useExisting: forwardRef(() => RadioInputAccessor),
      multi: true,
    },
  ],
})
export class RadioInputAccessor
  extends BaseAccessor
  implements ControlAccessor<FormControl>, OnChanges, OnInit, OnDestroy {
  static id = 0;

  [CONTROL_ACCESSOR_SPECIFICITY] = '0.2.1';

  readonly control = new FormControl(null as any, {
    id: Symbol(`RxRadioInputAccessor-${RadioInputAccessor.id++}`),
  });

  /**
   * Tracks the name of the radio input element.
   */
  @Input() name = '';

  /**
   * Tracks the value property of the radio input element
   * (which, as a reminder, is not necessarily equal to the
   * value of this accessor's "control")
   */
  @Input('value') radioValue: unknown;

  private name$ = new BehaviorSubject<string | undefined>(undefined);
  private value$ = new BehaviorSubject<SimpleChange>(null!);

  constructor(
    protected renderer: Renderer2,
    protected el: ElementRef,
    protected registry: RadioInputRegistry,
    protected injector: Injector
  ) {
    super(injector);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (this.deactivated) return;
    else if (this.deactivated === undefined && this.shouldDeactivate()) {
      return;
    }

    if (changes.name) this.name$.next(this.name);
    if (changes.value) this.value$.next(changes.value);
  }

  /** @nodoc */
  ngOnInit(): void {
    if (this.deactivated) return;

    setupListeners(this, 'change', 'onChange');
    setupListeners(this, 'blur', 'onBlur');

    const sub1 = setupStdControlEventHandlers(this, {
      onValueChangeFn: (value) => {
        this.renderer.setProperty(
          this.el.nativeElement,
          'checked',
          value === this.radioValue
        );
      },
    });

    this.subscriptions.push(sub1);

    const sub2 = this.name$.subscribe(() =>
      this.registry.updateRadioAccessorName(this)
    );

    const sub3 = this.value$.subscribe((change) => {
      if (change.previousValue !== this.control.rawValue) return;
      this.control.setValue(change.currentValue);
    });

    this.subscriptions.push(sub1, sub2, sub3);
  }

  /** @nodoc */
  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
    this.registry.remove(this);
  }

  select() {
    this.control.markDirty(true);
    this.control.setValue(this.radioValue);
  }

  protected onChange() {
    this.select();
  }

  protected onBlur() {
    this.control.markTouched(true);
  }
}
