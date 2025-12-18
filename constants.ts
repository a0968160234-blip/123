
import { TransactionType, Category } from './types';

export const DEFAULT_CATEGORIES: Category[] = [
  { id: '1', name: '飲食', type: TransactionType.EXPENSE, icon: '🍔' },
  { id: '2', name: '交通', type: TransactionType.EXPENSE, icon: '🚗' },
  { id: '3', name: '娛樂', type: TransactionType.EXPENSE, icon: '🎮' },
  { id: '4', name: '購物', type: TransactionType.EXPENSE, icon: '🛍️' },
  { id: '5', name: '醫療', type: TransactionType.EXPENSE, icon: '🏥' },
  { id: '6', name: '居住', type: TransactionType.EXPENSE, icon: '🏠' },
  { id: '7', name: '薪資', type: TransactionType.INCOME, icon: '💰' },
  { id: '8', name: '獎金', type: TransactionType.INCOME, icon: '🎁' },
  { id: '9', name: '投資', type: TransactionType.INCOME, icon: '📈' },
];

export const APP_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#64748b'
];
