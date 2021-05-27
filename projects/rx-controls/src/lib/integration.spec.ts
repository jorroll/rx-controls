import { AbstractControl } from './abstract-control/abstract-control';
import { FormControl } from './form-control';
import { FormGroup } from './form-group';
import { switchMap } from 'rxjs/operators';
import { FormArray } from './form-array';
import { combineLatest, concat } from 'rxjs';
import { AbstractControlContainer } from './abstract-control-container/abstract-control-container';
import { wait } from './test-util';

describe('Integration', () => {
  describe(`scenerios`, () => {
    it('recreation of a bug I discovered in the react implementation', async () => {
      // EVERYTHING here is required to trigger this bug. I've already removed
      // all the unnecessary bits.
      //
      // The issue was somehow related to adding a different validator function instance
      // in otherwise identical controls and then trying to sync the controls.
      // I fixed the issue by removing a seemingly unnecessary equality check in
      // FormGroup#setControl()

      const licenseNumberFactory = () => new FormControl<string>('');

      const driversInformationFactory = () =>
        new FormGroup({
          licenseNumber: licenseNumberFactory(),
          policyExpirationDate: new FormControl(null, {
            // when the test was still failing, commenting the next line would make it work
            validators: () => null,
          }),
        });

      const formPageFactory = () =>
        new FormGroup({
          driversInformation: driversInformationFactory(),
        });

      const formPage = formPageFactory();
      const driversInformation = driversInformationFactory();
      const licenseNumber = licenseNumberFactory();
      const source = licenseNumberFactory();

      const syncParentToChild = (
        parent: AbstractControlContainer,
        key: string | number,
        child: AbstractControl
      ) => {
        parent
          .observe('controls', key)
          .pipe(
            switchMap((control: AbstractControl) =>
              concat(control!.replayState(), control!.events)
            )
          )
          .subscribe((e) => child.processEvent(e));

        combineLatest([
          parent.observe('controls', key),
          child.events,
        ]).subscribe(([control, e]) => {
          control!.processEvent(e);
        });
      };

      syncParentToChild(formPage, 'driversInformation', driversInformation);
      syncParentToChild(driversInformation, 'licenseNumber', licenseNumber);

      // manually since the source control with licenseNumber
      concat(licenseNumber.replayState(), licenseNumber.events).subscribe((e) =>
        source.processEvent(e)
      );
      source.events.subscribe((e) => {
        licenseNumber.processEvent(e);
      });

      source.setValue('test');

      await wait(0); // needed to surface some internal code errors

      expect(licenseNumber.value).toEqual('test');

      expect(driversInformation.value).toEqual({
        licenseNumber: 'test',
        policyExpirationDate: null,
      });

      expect(formPage.value).toEqual({
        driversInformation: {
          licenseNumber: 'test',
          policyExpirationDate: null,
        },
      });
    });
  });
});
