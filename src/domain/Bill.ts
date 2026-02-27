/**
 * Domain Bill entity. Links an Account to a Rule (e.g. credit card = account + billing rule).
 */

export interface Bill {
  id: string;
  accountId: string;
  ruleId: string;
  amount: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateBillInput {
  accountId: string;
  ruleId: string;
  amount?: number | null;
}
