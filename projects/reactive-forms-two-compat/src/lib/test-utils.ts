import { CommonModule } from '@angular/common';
import { AbstractType, Type } from '@angular/core';
import { ComponentFixture } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { render } from '@testing-library/angular';

export namespace TestSingleChild {
  export type TestArgs<T, E extends HTMLElement, S extends string> = {
    container: Element;
    fixture: ComponentFixture<T>;
    component: T;
  } & { [P in S]: E };

  export function buildBeforeEachFn(args: {
    imports?: any[];
    declarations: [
      Type<any> | AbstractType<any>,
      ...Array<Type<unknown> | AbstractType<unknown>>
    ];
  }) {
    return function beforeEachFn<T, S extends string>(
      ctor: Type<T>,
      element: S,
      options: {
        container: Element;
        fixture: ComponentFixture<T>;
        component: T;
      } & { [P in S]: HTMLElement }
    ) {
      return async () => {
        const { container, fixture } = await render(ctor, {
          imports: [CommonModule, ReactiveFormsModule, ...(args.imports || [])],
          declarations: args.declarations,
        });

        options.container = container;
        options.fixture = fixture;
        options.component = fixture.componentInstance;
        // options.accessor = options.component.accessor;
        // options.control = options.accessor.control;
        options[element] = container.querySelector(element) as any;
      };
    };
  }
}
