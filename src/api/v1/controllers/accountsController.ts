import type { Request, Response } from 'express';
import * as accountService from '../../../services/account.service.js';
import type { CreateAccountBody } from '../../../validation/index.js';

export async function createAccountHandler(req: Request, res: Response): Promise<void> {
  const { name, type } = req.body as CreateAccountBody;
  const account = await accountService.createAccount({ name, type });
  res.status(201).json(account);
}

export async function listAccountsHandler(_req: Request, res: Response): Promise<void> {
  const accounts = await accountService.listAccounts();
  res.json(accounts);
}
