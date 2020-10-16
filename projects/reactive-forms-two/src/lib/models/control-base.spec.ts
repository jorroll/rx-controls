import { fakeAsync, tick } from '@angular/core/testing';
import { ControlBase, IControlBaseArgs } from './control-base';

export type ITestControlArgs<D> = IControlBaseArgs<D>;

export class TestControl<V = any, D = any> extends ControlBase<V, D> {
  static id = 0;

  constructor(value: V = null as any, options: ITestControlArgs<D> = {}) {
    super(
      options.id || Symbol(`TestControl-${TestControl.id++}`),
      value,
      options,
    );
  }

  clone() {
    const control = new TestControl();
    this.replayState().subscribe(control.source);
    return control;
  }
}

describe('TestControl', () => {
  it('should default the value to null', () => {
    const c = new TestControl();
    expect(c.value).toBe(null);
  });

  describe('setValue', () => {
    // let g: FormGroup;
    let c: TestControl;
    let o: TestControl;
    beforeEach(() => {
      c = new TestControl('oldValue');
      o = new TestControl('otherValue');
      // g = new FormGroup({ one: c });
    });

    it('should have starting value', () => {
      expect(c.value).toEqual('oldValue');
      expect(o.value).toEqual('otherValue');
    });

    it('should set the value of the control', () => {
      c.setValue('newValue');
      expect(c.value).toEqual('newValue');
    });

    it.only('should fire a StateChange event', () => {
      expect.assertions(2);

      c.events.subscribe((event) => {
        expect(event).toEqual({
          eventId: '1',
          sourceId: c.id,
          type: 'StateChange',
          meta: {},
          changes: new Map([['value', 'newValue']]),
        });
      });

      c.setValue('newValue', { eventId: '1' });
      expect(c.value).toEqual('newValue');
    });

    describe('when linked', () => {
      it('should set the value of other FormControl', () => {
        c.events.subscribe(o.source);
        c.setValue('newValue');
        expect(c.value).toEqual('newValue');
        expect(o.value).toEqual('newValue');
      });

      it('should not enter infinite loop', () => {
        c.events.subscribe(o.source);
        o.events.subscribe(c.source);
        c.setValue('newValue');
        expect(c.value).toEqual('newValue');
        expect(o.value).toEqual('newValue');
      });
    });
  });

  describe('setParent', () => {
    // let g: FormGroup;
    let c: TestControl;
    beforeEach(() => {
      c = new TestControl('oldValue');
    });

    it('should start with no parent', () => {
      expect(c.parent).toEqual(null);
    });

    // it('should set the parent of the control', () => {
    //   const parent = new TestControl();
    //   c.setParent(parent);
    //   expect(c.parent).toEqual(parent);
    // });

    it('should set the parent of the control', () => {
      const parent = new TestControl();

      c.events.subscribe((event) => {
        console.log('test');
        expect(event).toEqual({
          eventId: '2',
          sourceId: c.id,
          type: 'StateChange',
          meta: {},
          changes: {
            parent: { value: parent },
          },
        });
      });

      c.setParent(parent, { eventId: '1' });
      expect(c.parent).toEqual(parent);
    });

    // describe('when linked', () => {
    //   it('should set the value of other FormControl', () => {
    //     c.events.subscribe(o.source);
    //     c.setValue('newValue');
    //     expect(c.value).toEqual('newValue');
    //     expect(o.value).toEqual('newValue');
    //   });

    //   it('should not enter infinite loop', () => {
    //     c.events.subscribe(o.source);
    //     o.events.subscribe(c.source);
    //     c.setValue('newValue');
    //     expect(c.value).toEqual('newValue');
    //     expect(o.value).toEqual('newValue');
    //   });
    // });
  });
});
