import { Observable, Subject } from 'rxjs';
import { takeUntil, toArray } from 'rxjs/operators';
import { FormControl, FormGroup } from '@service-work/reactive-forms';
import { isAncestorControlPropTruthy$ } from './util';

export function subscribeUntilEnd<T extends Observable<any>>(
  obs: T,
  end?: Subject<any>
) {
  if (!end) {
    end = new Subject();
  }

  return [obs.pipe(takeUntil(end), toArray()).toPromise(), end] as const;
}

describe('isAncestorControlPropTruthy$', () => {
  it('', async () => {
    const two = new FormControl('');

    const a = new FormGroup({
      one: new FormGroup({ two }),
    });

    const [promise1, end] = subscribeUntilEnd(
      isAncestorControlPropTruthy$(two, 'selfDisabled')
    );

    a.markDisabled(true);

    end.next();
    end.complete();

    expect(two.parent?.parent?.disabled).toBe(true);
    expect((two.parent?.parent as any)?.selfDisabled).toBe(true);

    const [event1, event2, event3] = await promise1;

    expect(event1).toEqual(false);
    expect(event2).toEqual(true);
    expect(event3).toEqual(undefined);
  });
});
