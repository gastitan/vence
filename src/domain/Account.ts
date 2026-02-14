import type { Rule } from "./Rule.js";

export interface Account {
  id: string;
  name: string;
  rule: Rule;
  metadata?: Record<string, unknown>;
}
