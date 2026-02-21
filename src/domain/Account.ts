import type { Rule } from '@dueflow/engine';

export interface Account {
  id: string;
  name: string;
  rule: Rule;
  metadata?: Record<string, unknown>;
}
