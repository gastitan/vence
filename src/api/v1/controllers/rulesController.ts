import type { Request, Response } from 'express';
import { validateRule } from '@dueflow/engine';

export function validateRuleHandler(req: Request, res: Response): void {
  const { rule } = req.body as { rule: unknown };
  const { valid, errors } = validateRule(rule);
  if (!valid) {
    res.status(400).json({ valid: false, errors });
    return;
  }
  res.status(200).json({ valid: true });
}
