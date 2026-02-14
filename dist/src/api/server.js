import express from 'express';
import { calculateNextDueDate } from '../../app/engine/RuleEngine.js';
function formatDateAsISO(date) {
    return date.toISOString().slice(0, 10);
}
const app = express();
app.use(express.json());
app.post('/calculate', (req, res) => {
    const { rule, referenceDate } = req.body;
    const refDate = new Date(referenceDate);
    const result = calculateNextDueDate(rule, refDate);
    res.json({
        calculatedDate: formatDateAsISO(result.calculatedDate),
        isEstimated: result.isEstimated,
        confidence: result.confidence,
    });
});
export { app };
