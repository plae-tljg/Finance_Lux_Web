import type { Transaction } from '../database/schemas/Transaction';
import type { Category } from '../database/schemas/Category';
import type { Account } from '../database/schemas/Account';
import type { Budget } from '../database/schemas/Budget';

export interface ReportData {
  selectedMonth: string;
  income: number;
  expense: number;
  netSavings: number;
  transactions: Transaction[];
  categories: Category[];
  accounts: Account[];
  budgets: Budget[];
  categorySummary: Array<{ category: Category; total: number; count: number }>;
  accountSummary: Array<{ account: Account; total: number; count: number }>;
}

export class ExportService {
  static exportToCSV(data: ReportData, filename: string = 'report'): void {
    const lines: string[] = [];

    lines.push('=== Financial Report ===');
    lines.push(`Period: ${data.selectedMonth}`);
    lines.push(`Generated: ${new Date().toLocaleString()}`);
    lines.push('');

    lines.push('=== Summary ===');
    lines.push(`Total Income,${data.income}`);
    lines.push(`Total Expense,${data.expense}`);
    lines.push(`Net Savings,${data.netSavings}`);
    lines.push('');

    lines.push('=== Category Summary ===');
    lines.push('Category,Type,Total,Count');
    data.categorySummary.forEach(item => {
      lines.push(`${item.category.name},${item.category.type},${item.total},${item.count}`);
    });
    lines.push('');

    lines.push('=== Account Summary ===');
    lines.push('Account,Type,Total,Count');
    data.accountSummary.forEach(item => {
      lines.push(`${item.account.name},${item.account.type},${item.total},${item.count}`);
    });
    lines.push('');

    lines.push('=== Transactions ===');
    lines.push('Date,Type,Amount,Category,Account,Description');
    data.transactions.forEach(t => {
      const category = data.categories.find(c => c.id === t.categoryId);
      const account = data.accounts.find(a => a.id === t.accountId);
      lines.push(`${t.date},${t.type},${t.amount},${category?.name || 'N/A'},${account?.name || 'N/A'},"${t.description || ''}"`);
    });

    const csvContent = lines.join('\n');
    this.downloadFile(csvContent, `${filename}.csv`, 'text/csv');
  }

  static exportToExcel(data: ReportData, filename: string = 'report'): void {
    const lines: string[] = [];

    lines.push('Financial Report');
    lines.push(`Period: ${data.selectedMonth}`);
    lines.push(`Generated: ${new Date().toLocaleString()}`);
    lines.push('');

    lines.push('Summary');
    lines.push('Description,Amount');
    lines.push(`Total Income,${data.income}`);
    lines.push(`Total Expense,${data.expense}`);
    lines.push(`Net Savings,${data.netSavings}`);
    lines.push('');

    lines.push('Category Summary');
    lines.push('Category,Type,Total,Count,% of Total');
    const totalAmount = data.income + data.expense;
    data.categorySummary.forEach(item => {
      const percentage = totalAmount > 0 ? ((item.total / totalAmount) * 100).toFixed(1) : '0';
      lines.push(`${item.category.name},${item.category.type},${item.total},${item.count},${percentage}%`);
    });
    lines.push('');

    lines.push('Account Summary');
    lines.push('Account,Type,Total,Count');
    data.accountSummary.forEach(item => {
      lines.push(`${item.account.name},${item.account.type},${item.total},${item.count}`);
    });
    lines.push('');

    lines.push('Transactions');
    lines.push('Date,Type,Amount,Category,Account,Description');
    data.transactions.forEach(t => {
      const category = data.categories.find(c => c.id === t.categoryId);
      const account = data.accounts.find(a => a.id === t.accountId);
      lines.push(`${t.date},${t.type},${t.amount},${category?.name || 'N/A'},${account?.name || 'N/A'},"${(t.description || '').replace(/"/g, '""')}"`);
    });

    const xlsContent = this.generateXLS(lines.join('\n'));
    this.downloadFile(xlsContent, `${filename}.xls`, 'application/vnd.ms-excel');
  }

  static exportToPDF(data: ReportData, filename: string = 'report'): void {
    const lines: string[] = [];

    lines.push('╔═══════════════════════════════════════════════════════════════╗');
    lines.push('║                   FINANCIAL REPORT                           ║');
    lines.push('╚═══════════════════════════════════════════════════════════════╝');
    lines.push('');
    lines.push(`Period: ${data.selectedMonth}`);
    lines.push(`Generated: ${new Date().toLocaleString()}`);
    lines.push('');
    lines.push('───────────────────────────────────────────────────────────────');
    lines.push('                           SUMMARY                             ');
    lines.push('───────────────────────────────────────────────────────────────');
    lines.push(`  Total Income:     ¥${data.income.toLocaleString()}`);
    lines.push(`  Total Expense:    ¥${data.expense.toLocaleString()}`);
    lines.push(`  Net Savings:      ¥${data.netSavings.toLocaleString()}`);
    lines.push('');
    lines.push('───────────────────────────────────────────────────────────────');
    lines.push('                      CATEGORY BREAKDOWN                       ');
    lines.push('───────────────────────────────────────────────────────────────');

    const expenseCategories = data.categorySummary.filter(c => c.category.type === 'expense');
    const incomeCategories = data.categorySummary.filter(c => c.category.type === 'income');

    if (incomeCategories.length > 0) {
      lines.push('  Income:');
      incomeCategories.forEach(item => {
        lines.push(`    ${item.category.icon} ${item.category.name}: ¥${item.total.toLocaleString()}`);
      });
      lines.push('');
    }

    if (expenseCategories.length > 0) {
      lines.push('  Expense:');
      expenseCategories.forEach(item => {
        lines.push(`    ${item.category.icon} ${item.category.name}: ¥${item.total.toLocaleString()}`);
      });
      lines.push('');
    }

    lines.push('───────────────────────────────────────────────────────────────');
    lines.push('                      ACCOUNT BREAKDOWN                        ');
    lines.push('───────────────────────────────────────────────────────────────');
    data.accountSummary.forEach(item => {
      lines.push(`  ${item.account.name}: ¥${item.total.toLocaleString()} (${item.count} transactions)`);
    });
    lines.push('');

    lines.push('───────────────────────────────────────────────────────────────');
    lines.push('                      TRANSACTION LIST                         ');
    lines.push('───────────────────────────────────────────────────────────────');
    lines.push('  Date       Type      Amount       Category       Account');
    lines.push('  ─────────────────────────────────────────────────────────');

    data.transactions.slice(0, 50).forEach(t => {
      const category = data.categories.find(c => c.id === t.categoryId);
      const account = data.accounts.find(a => a.id === t.accountId);
      const dateStr = t.date.padEnd(10);
      const typeStr = t.type.padEnd(8);
      const amountStr = `¥${t.amount.toLocaleString()}`.padEnd(12);
      const catStr = (category?.name || 'N/A').substring(0, 12).padEnd(13);
      const accStr = account?.name || 'N/A';
      lines.push(`  ${dateStr} ${typeStr} ${amountStr} ${catStr} ${accStr}`);
    });

    if (data.transactions.length > 50) {
      lines.push(`  ... and ${data.transactions.length - 50} more transactions`);
    }

    lines.push('');
    lines.push('═══════════════════════════════════════════════════════════════');
    lines.push('            Thank you for using Finance Management            ');
    lines.push('═══════════════════════════════════════════════════════════════');

    const textContent = lines.join('\n');
    this.downloadFile(textContent, `${filename}.txt`, 'text/plain');
  }

  private static generateXLS(csvContent: string): string {
    const header = 'MIME-Version: 1.0\nContent-Type: text/plain; charset=UTF-8\n';
    return header + csvContent;
  }

  private static downloadFile(content: string | Blob, filename: string, mimeType: string): void {
    let blob: Blob;
    if (typeof content === 'string') {
      blob = new Blob([content], { type: mimeType });
    } else {
      blob = content;
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}