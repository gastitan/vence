# Vence

Vence is a mobile app that reminds and *predicts* financial due dates (cards, services, loans, installments) using **rules instead of manually entered dates**.

The core idea is simple:

> Users should define *how* something expires, not *when* it expires each month.

Vence is powered by **dueflow**, a small rule engine that calculates upcoming due dates based on explicit rules, observed patterns, and user corrections.

---

## ✨ Key Concepts

* **Rules, not dates**: due dates are calculated dynamically
* **Predictable but honest**: estimated dates are marked as such
* **User feedback loop**: manual corrections improve confidence
* **Local-first**: MVP works fully offline

---

## 🧱 Project Structure

```
/app
  /domain        # Core domain models
  /rules         # Rule definitions (Fixed, Range, Installments)
  /engine        # Rule calculation engine
  /utils         # Date helpers
  /tests         # Unit tests for rules
RULES.md         # Business rules (source of truth)
README.md
```

---

## 🧠 Architecture (MVP)

* **Frontend**: React Native + Expo (TypeScript)
* **Storage**: SQLite (local)
* **Logic**: Pure rule engine (no side effects)
* **Notifications**: Local notifications

No backend is required for the MVP.

---

## 🧩 Rule Engine

The rule engine:

* Takes a rule + reference date
* Returns the next due date
* Indicates whether the date is estimated
* Provides a confidence score

```ts
calculateNextDueDate({ rule, referenceDate }) → CalculationResult
```

All business logic is documented in **RULES.md**.

---

## 🚀 Roadmap

### MVP

* Fixed day rules
* Range-based credit card rules
* Installments
* Notifications

### v1

* Rule confidence
* Deviation detection
* Timeline view

### v2

* Email parsing
* Automatic rule inference
* Sync & backup

---

## 🧭 Guiding Principles

* Business rules live in markdown, not code comments
* Code must follow RULES.md strictly
* Prefer correctness and clarity over cleverness

---

## 🛠️ Development

This project is designed to be built with AI-assisted tools (e.g. Cursor).

Before implementing logic:

1. Update RULES.md
2. Define contracts
3. Generate implementation
4. Add tests

---

## 📄 License

Private / Personal Project
