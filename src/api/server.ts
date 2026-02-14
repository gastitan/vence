import express from 'express';
import { calculateNextDueDate } from '../../app/engine/RuleEngine.js';
import type { Rule } from '../../app/domain/Rule.js';

function formatDateAsISO(date: Date): string {
  return date.toISOString().slice(0, 10);
}

const app = express();
app.use(express.json());

app.post('/calculate', (req, res) => {
  const { rule, referenceDate } = req.body as {
    rule: Rule;
    referenceDate: string;
  };

  const refDate = new Date(referenceDate);
  const result = calculateNextDueDate(rule, refDate);

  res.json({
    calculatedDate: formatDateAsISO(result.calculatedDate),
    isEstimated: result.isEstimated,
    confidence: result.confidence,
  });
});

export { app };
