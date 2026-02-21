import type { Request, Response } from 'express';
import { validateRule } from '@dueflow/engine';
import { ValidationError } from '../../errors.js';

export function validateRuleHandler(req: Request, res: Response): void {
  const { rule } = req.body as { rule: unknown };
  const { valid, errors } = validateRule(rule);
  if (!valid) {
    throw new ValidationError('Rule validation failed', { errors });
  }
  res.status(200).json({ valid: true });
}
