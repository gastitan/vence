# dueflow – Business Rules

This document is the **single source of truth** for all business rules used by the dueflow engine.

Code must strictly follow the rules defined here.
If a rule changes, this document must be updated *before* modifying code.

---

## General Principles

* Rules describe **how dates are calculated**, not specific dates
* All calculations are deterministic
* Estimated results must be flagged
* User corrections reduce confidence but do not break rules

---

## Rule Types

### 1. Fixed Day Rule

**Description**
A due date that occurs on the same day every month.

**Example**
Rent due on the 5th of every month.

**Rules**

* Due date = same day of month
* If the day does not exist (e.g. 31st in February):

  * Use the last day of the month
  * Mark as estimated

---

### 2. Credit Card – Range Rule

**Description**
Used for credit cards where closing and due dates fall within defined ranges.

**Inputs**

* Closing range: from day X to day Y
* Due date offset: N calendar days after closing
* Optional preferred weekday (based on observed behavior)

**Rules**

1. The closing date must fall within the closing range
2. If a preferred weekday exists inside the range:

   * Use that weekday
3. If not:

   * Use the last day of the range
   * Mark the result as estimated
4. Due date = closing date + offset (calendar days)
5. Due date must fall within the due range
6. If due date falls outside the range:

   * Mark as estimated

**Example**

* Closing range: 5–11
* Preferred weekday: Thursday
* Offset: 8 days

---

### 3. Installments Rule

**Description**
Used for purchases or loans paid in monthly installments.

**Inputs**

* Start date
* Total number of installments

**Rules**

* Each installment is due monthly on the same day as the start date
* Installments stop after the total count is reached
* If the day does not exist in a month:

  * Use the last day of the month
  * Mark as estimated

---

## Confidence Score

* Initial confidence depends on rule type:

  * Fixed Day: 1.0
  * Range Rule: 0.9
  * Installments: 1.0
* Manual corrections decrease confidence
* Repeated confirmations increase confidence

---

## Estimated Dates

A date must be marked as **estimated** if:

* A fallback rule was applied
* The calculated date falls outside a declared range
* The user manually corrected the value

---

## Non-goals (MVP)

* No automatic email parsing
* No bank-specific hardcoding
* No external calendar sync

---

## Change Policy

* Any change to rules requires:

  1. Update this document
  2. Update tests
  3. Update implementation
