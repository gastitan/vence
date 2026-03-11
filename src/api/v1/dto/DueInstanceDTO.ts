/**
 * DTO for GET /api/v1/due-instances. Enriched with bill and account.
 */
export interface DueInstanceDTO {
  id: string;
  dueDate: string;
  estimatedAmount: number | null;
  confirmedAmount: number | null;
  status: string;
  bill: {
    id: string;
    name: string;
    currency: string;
    account: {
      id: string;
      name: string;
      type: string;
    };
  };
}

/**
 * Shape returned by Prisma when including bill and account (for mapper input).
 */
export interface DueInstanceWithBillAndAccount {
  id: string;
  dueDate: Date;
  estimatedAmount: number | null;
  confirmedAmount: number | null;
  status: string;
  bill: {
    id: string;
    name: string;
    currency: string;
    account: {
      id: string;
      name: string;
      type: string;
    };
  };
}

export function toDueInstanceDTO(row: DueInstanceWithBillAndAccount): DueInstanceDTO {
  return {
    id: row.id,
    dueDate: row.dueDate instanceof Date ? row.dueDate.toISOString().slice(0, 10) : String(row.dueDate).slice(0, 10),
    estimatedAmount: row.estimatedAmount,
    confirmedAmount: row.confirmedAmount,
    status: row.status,
    bill: {
      id: row.bill.id,
      name: row.bill.name,
      currency: row.bill.currency,
      account: {
        id: row.bill.account.id,
        name: row.bill.account.name,
        type: row.bill.account.type,
      },
    },
  };
}
