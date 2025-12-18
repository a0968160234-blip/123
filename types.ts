
export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE'
}

export interface BankAccount {
  id: string;
  name: string;
  bankName: string;
  balance: number;
  color: string;
  userId: string;
  createdAt: number;
}

export interface Transaction {
  id: string;
  accountId: string;
  userId: string;
  amount: number;
  type: TransactionType;
  category: string;
  note: string;
  date: number;
}

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  icon: string;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
}
