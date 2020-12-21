# ReactiveFormsTwo

## Potential "Gotchas" for people familiar with the `@angular/forms` `ReactiveFormsModule`

- The new `AbstractControl#valid = (AbstractControl#errors === null)` and `AbstractControl#invalid = (AbstractControl#errors !== null)`. The original abstract control is valid when its `status` is `"VALID"` and invalid when its status is `"INVALID"`. This means that, for the original control, both `valid` and `invalid` would be `false` if the control was pending or disabled. I found this behavior to be unintuitive, which is why it has been changed (note: I don't think there was anything conceptually wrong with the original behavior, but unexpected behavior of any kind should be avoided). Obviously, this change has the downside that people _familiar_ with the original behavior might find the new behavior to be unintuitive. In general though, I think "invalid" being the opposite of "valid" is expected behavior.

## Potential "Gotchas" in general

1. ControlAccessor#control will be set to have the same parent as the linked control except the `ControlAccessor#control` will _not_ be a child of the it's parent. This is intentional and, because of this, an accessor creator cannot manually set `ControlAccessor#control#parent`.
