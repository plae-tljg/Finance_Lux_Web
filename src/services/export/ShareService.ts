import type { ReportData } from './ExportService';

export interface ShareCardOptions {
  data: ReportData;
  theme?: 'dark' | 'light';
  format?: 'png' | 'jpeg';
}

const THEME_COLORS = {
  dark: {
    background: ['#1a1a2e', '#16213e', '#0f3460'],
    text: '#ffffff',
    textSecondary: 'rgba(255,255,255,0.7)',
    accent: '#e94560',
    income: '#10b981',
    expense: '#ef4444',
    savings: '#3b82f6',
    gradient: ['#e94560', '#0f3460'],
  },
  light: {
    background: ['#fef3c7', '#fde68a', '#f59e0b'],
    text: '#1f2937',
    textSecondary: 'rgba(31,41,55,0.6)',
    accent: '#e94560',
    income: '#059669',
    expense: '#dc2626',
    savings: '#2563eb',
    gradient: ['#f59e0b', '#e94560'],
  },
};

export class ShareService {
  static async generateShareCard(options: ShareCardOptions): Promise<string> {
    const { data, theme = 'dark', format = 'png' } = options;
    const colors = THEME_COLORS[theme];

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas context not available');

    canvas.width = 800;
    canvas.height = 600;

    const gradient = ctx.createLinearGradient(0, 0, 800, 600);
    colors.background.forEach((color, i) => {
      gradient.addColorStop(i / (colors.background.length - 1), color);
    });
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = colors.accent;
    ctx.globalAlpha = 0.1;
    ctx.fillRect(0, 0, 800, 600);
    ctx.globalAlpha = 1;

    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    ctx.beginPath();
    ctx.arc(700, 100, 200, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(255,255,255,0.03)';
    ctx.beginPath();
    ctx.arc(100, 500, 150, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = colors.text;
    ctx.font = 'bold 32px system-ui, sans-serif';
    ctx.fillText('💰 Financial Report', 50, 60);

    ctx.font = '18px system-ui, sans-serif';
    ctx.fillStyle = colors.textSecondary;
    ctx.fillText(`📅 ${data.selectedMonth}`, 50, 90);

    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.fillRect(40, 110, 720, 1);

    const cardY = 140;
    const cardHeight = 100;
    const cardWidth = 220;
    const cardGap = 20;

    const cards = [
      { label: 'Total Income', value: `¥${data.income.toLocaleString()}`, color: colors.income, icon: '📈' },
      { label: 'Total Expense', value: `¥${data.expense.toLocaleString()}`, color: colors.expense, icon: '📉' },
      { label: 'Net Savings', value: `¥${data.netSavings.toLocaleString()}`, color: colors.savings, icon: '💎' },
    ];

    cards.forEach((card, i) => {
      const cardX = 50 + i * (cardWidth + cardGap);

      ctx.fillStyle = 'rgba(255,255,255,0.1)';
      ctx.beginPath();
      ctx.roundRect(cardX, cardY, cardWidth, cardHeight, 16);
      ctx.fill();

      const innerGradient = ctx.createLinearGradient(cardX, cardY, cardX, cardY + cardHeight);
      innerGradient.addColorStop(0, `${card.color}33`, `${card.color}11`);
      innerGradient.addColorStop(1, 'transparent');
      ctx.fillStyle = innerGradient;
      ctx.beginPath();
      ctx.roundRect(cardX, cardY, cardWidth, cardHeight, 16);
      ctx.fill();

      ctx.font = '14px system-ui, sans-serif';
      ctx.fillStyle = colors.textSecondary;
      ctx.fillText(card.label, cardX + 15, cardY + 30);

      ctx.font = 'bold 20px system-ui, sans-serif';
      ctx.fillStyle = card.color;
      ctx.fillText(card.value, cardX + 15, cardY + 60);

      ctx.font = '24px system-ui, sans-serif';
      ctx.fillText(card.icon, cardX + cardWidth - 45, cardY + 50);
    });

    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.fillRect(40, 260, 720, 1);

    ctx.fillStyle = colors.text;
    ctx.font = 'bold 18px system-ui, sans-serif';
    ctx.fillText('📊 Category Breakdown', 50, 295);

    const expenseCategories = data.categorySummary.filter(c => c.category.type === 'expense').slice(0, 5);
    const incomeCategories = data.categorySummary.filter(c => c.category.type === 'income').slice(0, 5);

    const totalAmount = data.income + data.expense;
    let categoryY = 330;

    if (expenseCategories.length > 0) {
      ctx.font = '14px system-ui, sans-serif';
      ctx.fillStyle = colors.expense;
      ctx.fillText('Expense', 50, categoryY);
      categoryY += 25;

      expenseCategories.forEach((item) => {
        const percentage = totalAmount > 0 ? (item.total / totalAmount) * 100 : 0;

        ctx.font = '13px system-ui, sans-serif';
        ctx.fillStyle = colors.text;
        ctx.fillText(`${item.category.icon} ${item.category.name}`, 50, categoryY);

        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.fillRect(180, categoryY - 12, 150, 16);

        const barGradient = ctx.createLinearGradient(180, 0, 330, 0);
        barGradient.addColorStop(0, colors.expense);
        barGradient.addColorStop(1, `${colors.expense}88`);
        ctx.fillStyle = barGradient;
        ctx.beginPath();
        ctx.roundRect(180, categoryY - 12, Math.min(percentage / 100 * 150, 150), 16, 8);
        ctx.fill();

        ctx.fillStyle = colors.textSecondary;
        ctx.font = '12px system-ui, sans-serif';
        ctx.fillText(`${percentage.toFixed(1)}%`, 340, categoryY);

        categoryY += 22;
      });
    }

    if (incomeCategories.length > 0) {
      categoryY += 10;
      ctx.font = '14px system-ui, sans-serif';
      ctx.fillStyle = colors.income;
      ctx.fillText('Income', 50, categoryY);
      categoryY += 25;

      incomeCategories.forEach((item) => {
        const percentage = totalAmount > 0 ? (item.total / totalAmount) * 100 : 0;

        ctx.font = '13px system-ui, sans-serif';
        ctx.fillStyle = colors.text;
        ctx.fillText(`${item.category.icon} ${item.category.name}`, 50, categoryY);

        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.fillRect(180, categoryY - 12, 150, 16);

        const barGradient = ctx.createLinearGradient(180, 0, 330, 0);
        barGradient.addColorStop(0, colors.income);
        barGradient.addColorStop(1, `${colors.income}88`);
        ctx.fillStyle = barGradient;
        ctx.beginPath();
        ctx.roundRect(180, categoryY - 12, Math.min(percentage / 100 * 150, 150), 16, 8);
        ctx.fill();

        ctx.fillStyle = colors.textSecondary;
        ctx.font = '12px system-ui, sans-serif';
        ctx.fillText(`${percentage.toFixed(1)}%`, 340, categoryY);

        categoryY += 22;
      });
    }

    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.fillRect(40, 540, 720, 1);

    ctx.font = '12px system-ui, sans-serif';
    ctx.fillStyle = colors.textSecondary;
    ctx.fillText('✨ Generated by Finance Management App', 50, 570);

    ctx.font = '12px system-ui, sans-serif';
    ctx.fillStyle = colors.textSecondary;
    ctx.fillText(new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), 620, 570);

    return canvas.toDataURL(`image/${format}`, 0.95);
  }

  static downloadShareCard(dataUrl: string, filename: string = 'financial-report'): void {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `${filename}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  static async generateAndDownload(options: ShareCardOptions, filename: string = 'financial-report'): Promise<void> {
    const dataUrl = await this.generateShareCard(options);
    this.downloadShareCard(dataUrl, filename);
  }
}