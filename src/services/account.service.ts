/**
 * Account application service. Orchestrates use cases; uses repository only.
 */
import type { Account, CreateAccountInput } from '../domain/Account.js';
import * as accountRepository from '../infrastructure/repositories/account.repository.js';

export async function createAccount(data: CreateAccountInput): Promise<Account> {
  return accountRepository.create(data);
}

export async function listAccounts(): Promise<Account[]> {
  return accountRepository.findAll();
}
