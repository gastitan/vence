import { Router } from 'express';
import { getHealth } from './controllers/healthController.js';
import { validateRuleHandler } from './controllers/rulesController.js';
import {
  calculateHandler,
  previewHandler,
  simulateCardHandler,
} from './controllers/calculatorController.js';
import {
  createCardHandler,
  getAllCardsHandler,
  deleteCardHandler,
} from './controllers/cardsController.js';

const router = Router();

router.get('/health', getHealth);
router.post('/rules/validate', validateRuleHandler);
router.post('/calculate', calculateHandler);
router.post('/preview', previewHandler);
router.post('/simulate-card', simulateCardHandler);
router.post('/cards', createCardHandler);
router.get('/cards', getAllCardsHandler);
router.delete('/cards/:id', deleteCardHandler);

export const v1Router = router;
