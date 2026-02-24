/**
 * Domain input for creating a "card" (Account + Rule + Bill with RANGE rule).
 */

export interface CreateCardInput {
  closingRangeStart: number;
  closingRangeEnd: number;
  dueOffsetDays: number;
  preferredWeekday?: number;
}
