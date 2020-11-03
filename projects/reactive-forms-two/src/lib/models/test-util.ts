import { AbstractControl } from './abstract-control';

export const mockEventId = { val: 0 };

AbstractControl.eventId = function eventId() {
  return mockEventId.val++;
};
