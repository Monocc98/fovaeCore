import { fovaeCoreApi } from "@/api/fovaeCore.api";

export interface TransferRecord {
  id: string;
  from_account_id?: string;
  to_account_id?: string;
  fromAccountId?: string;
  toAccountId?: string;
  amount: number;
  description?: string;
  transfer_date?: string;
  transferDate?: string;
  occurredAt?: string;
  created_at?: string;
  createdAt?: string;
}

export interface CreateTransferPayload {
  fromAccount: string;
  toAccount: string;
  amount: number;
  description: string;
  occurredAt: string;
}

const toArray = (data: any): any[] => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.transfers)) return data.transfers;
  if (Array.isArray(data?.items)) return data.items;
  return [];
};

const normalizeTransfer = (row: any): TransferRecord | null => {
  const id = String(row?.id ?? row?._id ?? "").trim();
  const from = String(
    row?.from_account_id ??
      row?.fromAccountId ??
      row?.fromAccount ??
      row?.fromAccount?._id ??
      row?.fromAccount?.id ??
      ""
  ).trim();
  const to = String(
    row?.to_account_id ??
      row?.toAccountId ??
      row?.toAccount ??
      row?.toAccount?._id ??
      row?.toAccount?.id ??
      ""
  ).trim();
  const amount = Number(row?.amount ?? NaN);
  const date = String(
    row?.occurredAt ??
      row?.transfer_date ??
      row?.transferDate ??
      row?.created_at ??
      row?.createdAt ??
      ""
  ).trim();

  if (!id || !from || !to || !Number.isFinite(amount) || amount <= 0 || !date) {
    return null;
  }

  return {
    id,
    from_account_id: from,
    to_account_id: to,
    amount,
    description: String(row?.description ?? ""),
    transfer_date: date,
    created_at: String(row?.created_at ?? row?.createdAt ?? ""),
  };
};

export const getTransfersByCompanyAction = async (
  idCompany: string
): Promise<TransferRecord[]> => {
  const { data } = await fovaeCoreApi.get(`/transfers/company/${idCompany}`);
  return toArray(data).map(normalizeTransfer).filter(Boolean) as TransferRecord[];
};

export const createTransferAction = async (
  payload: CreateTransferPayload
): Promise<TransferRecord> => {
  const { data } = await fovaeCoreApi.post("/transfers", payload);
  const normalized = normalizeTransfer(data?.transfer ?? data);
  if (normalized) return normalized;

  return {
    id: String((data?.transfer ?? data)?.id ?? Date.now()),
    from_account_id: payload.fromAccount,
    to_account_id: payload.toAccount,
    amount: payload.amount,
    description: payload.description,
    transfer_date: payload.occurredAt,
  };
};
