import { addDays } from 'date-fns';
import express from 'express';
import { calculateNextDueDate } from '../engine/RuleEngine.js';
import type { Rule } from '../domain/Rule.js';

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

app.post('/preview', (req, res) => {
  const { rule, from, months } = req.body as {
    rule: Rule;
    from: string;
    months: number;
  };

  let currentRef = new Date(from);
  const results: Array<{
    calculatedDate: string;
    isEstimated: boolean;
    confidence: number;
  }> = [];

  for (let i = 0; i < months; i++) {
    const result = calculateNextDueDate(rule, currentRef);
    results.push({
      calculatedDate: formatDateAsISO(result.calculatedDate),
      isEstimated: result.isEstimated,
      confidence: result.confidence,
    });
    currentRef = addDays(result.calculatedDate, 1);
  }

  res.json({ results });
});

export { app };
