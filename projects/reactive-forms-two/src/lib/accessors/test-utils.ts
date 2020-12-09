import { CommonModule } from '@angular/common';
import { AbstractType, Type } from '@angular/core';
import { ComponentFixture } from '@angular/core/testing';
import { render } from '@testing-library/angular';
import { ControlAccessor } from './interface';

export type BuildTestArgs<
  T,
  A extends ControlAccessor,
  E extends HTMLElement,
  S extends string
> = {
  container: HTMLElement;
  fixture: ComponentFixture<T>;
  component: T;
  accessor: A;
  control: A['control'];
} & { [P in S]: E };

export function buildBeforeEachFn<
  A extends ControlAccessor,
  S extends string
>(args: {
  declarations: [
    Type<A> | AbstractType<A>,
    ...Array<Type<unknown> | AbstractType<unknown>>
  ];
  element: S;
}) {
  return function beforeEachFn<T extends { accessor: A }>(
    ctor: Type<T>,
    options: {
      container: HTMLElement;
      fixture: ComponentFixture<T>;
      component: T;
      accessor: A;
      control: A['control'];
    } & { [P in S]: HTMLElement }
  ) {
    return async () => {
      const { container, fixture } = await render(ctor, {
        imports: [CommonModule],
        declarations: args.declarations,
      });

      options.container = container;
      options.fixture = fixture;
      options.component = fixture.componentInstance;
      options.accessor = options.component.accessor;
      options.control = options.accessor.control;
      options[args.element] = container.querySelector(args.element) as any;
    };
  };
}
