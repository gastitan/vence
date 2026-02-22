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
import {
  validate,
  CalculateBodySchema,
  PreviewBodySchema,
  RulesValidateBodySchema,
  SimulateCardBodySchema,
  CreateCardBodySchema,
} from '../../validation/index.js';

const router = Router();

router.get('/health', getHealth);
router.post('/rules/validate', validate(RulesValidateBodySchema), validateRuleHandler);
router.post('/calculate', validate(CalculateBodySchema), calculateHandler);
router.post('/preview', validate(PreviewBodySchema), previewHandler);
router.post('/simulate-card', validate(SimulateCardBodySchema), simulateCardHandler);
router.post('/cards', validate(CreateCardBodySchema), createCardHandler);
router.get('/cards', getAllCardsHandler);
router.delete('/cards/:id', deleteCardHandler);

export const v1Router = router;
