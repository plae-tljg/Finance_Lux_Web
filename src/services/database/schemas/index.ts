export type { Category } from './Category';
export type { Transaction } from './Transaction';
export type { Budget } from './Budget';
export type { Account } from './Account';
export type { AccountBalance } from './AccountBalance';
export type { Achievement, AchievementCategory } from './Achievement';
export type { CheckIn } from './CheckIn';

import { DEFAULT_CATEGORIES, CategoryQueries, CATEGORY_INDEXES } from './Category';
import { SAMPLE_TRANSACTIONS, TransactionQueries, TRANSACTION_INDEXES } from './Transaction';
import { SAMPLE_BUDGETS, BudgetQueries, BUDGET_INDEXES } from './Budget';
import { DEFAULT_ACCOUNTS, AccountQueries, ACCOUNT_INDEXES } from './Account';
import { SAMPLE_ACCOUNT_BALANCES, AccountBalanceQueries, ACCOUNT_BALANCE_INDEXES } from './AccountBalance';
import { AchievementQueries, ACHIEVEMENT_INDEXES } from './Achievement';
import { CheckInQueries, CHECKIN_INDEXES } from './CheckIn';

export const SCHEMA_VERSIONS = {
  v1: '1.0.0',
  v2: '2.0.0',
};

export const SCHEMAS = {
  categories: CategoryQueries.CREATE_TABLE,
  accounts: AccountQueries.CREATE_TABLE,
  account_balances: AccountBalanceQueries.CREATE_TABLE,
  budgets: BudgetQueries.CREATE_TABLE,
  transactions: TransactionQueries.CREATE_TABLE,
  achievements: AchievementQueries.CREATE_TABLE,
  checkins: CheckInQueries.CREATE_TABLE,
};

export const SCHEMAS_SAMPLE_DATA = {
    categories: DEFAULT_CATEGORIES,
    transactions: SAMPLE_TRANSACTIONS,
    budgets: SAMPLE_BUDGETS,
    accounts: DEFAULT_ACCOUNTS,
    account_balances: SAMPLE_ACCOUNT_BALANCES,
}

export const SCHEMAS_VERSION = "2.0.0"

export const CHECK_TABLES_EXISTS = CategoryQueries.COUNT_ALL;

export const SCHEMAS_INDEXES = [
  ...CATEGORY_INDEXES,
  ...ACCOUNT_INDEXES,
  ...ACCOUNT_BALANCE_INDEXES,
  ...TRANSACTION_INDEXES,
  ...BUDGET_INDEXES,
  ...ACHIEVEMENT_INDEXES,
  ...CHECKIN_INDEXES,
]