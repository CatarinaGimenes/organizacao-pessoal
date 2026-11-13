import { useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { EXPENSE_CATEGORIES } from '../../data/finance.js'
import { calculateDashboardKpis, calculateExpenseDistribution, calculateMonthlyTotals, calculateSummary } from '../../state/finance.js'
import { formatCurrency } from '../../utils/currency.js'
import { getMonthKey } from '../../utils/calendar.js'
import styles from './FinanceDashboardPage.module.css'

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]
const CHART_COLORS = ['#ff47b2', '#35a31f', '#1DA1B8', '#6A2C91', '#7a7274', '#a80e68', '#257b14']

function formatValue(value) {
  return formatCurrency(value)
}

function ChartEmpty({ children }) {
  return <div className={styles.chartEmpty}>{children}</div>
}

function FinancialTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className={styles.tooltip}>
      <strong>{label}</strong>
      {payload.map((item) => (
        <span key={item.dataKey} style={{ color: item.color }}>
          {item.name}: {formatValue(item.value)}
        </span>
      ))}
    </div>
  )
}

function ExpenseTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const item = payload[0]
  return (
    <div className={styles.tooltip}>
      <strong>{item.payload.label}</strong>
      <span style={{ color: item.color }}>
        {formatValue(item.value)}
      </span>
    </div>
  )
}

function KpiCard({ label, value, children, tone = 'default' }) {
  return (
    <article className={styles.kpi} data-tone={tone}>
      <span>{label}</span>
      <strong>{formatValue(value)}</strong>
      {children}
    </article>
  )
}

export default function FinanceDashboardPage({
  selectedDate,
  period,
  onPeriodChange,
  transactions,
  range,
  loading,
}) {
  const [selectedCategory, setSelectedCategory] = useState(EXPENSE_CATEGORIES[0].id)
  const summary = calculateSummary(transactions)
  const kpis = calculateDashboardKpis(transactions, selectedCategory)
  const distribution = calculateExpenseDistribution(transactions)
  const totalExpenses = distribution.reduce((total, item) => total + item.amount, 0)
  const distributionWithPercentage = distribution.map((item) => ({
    ...item,
    percentage: totalExpenses > 0 ? Math.round((item.amount / totalExpenses) * 100) : 0,
  }))
  const annualTotals = calculateMonthlyTotals(transactions, selectedDate.slice(0, 4))
  const barData = period === 'annual'
    ? annualTotals
    : [{
        label: MONTHS[Number(getMonthKey(selectedDate).slice(5)) - 1],
        ganhos: summary.ganhos,
        gastos: summary.gastos,
      }]
  const rangeLabel = range
    ? `${range.start.split('-').reverse().join('/')} a ${range.end.split('-').reverse().join('/')}`
    : ''

  return (
    <>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Análise financeira</p>
          <h1>Visualização Financeira</h1>
          <p className={styles.subtitle}>Acompanhe suas movimentações e decisões em um só lugar.</p>
        </div>
        <div className={styles.periodFilter} role="group" aria-label="Período da dashboard">
          <button type="button" className={period === 'monthly' ? styles.activePeriod : ''} aria-pressed={period === 'monthly'} onClick={() => onPeriodChange('monthly')}>
            Mensal
          </button>
          <button type="button" className={period === 'annual' ? styles.activePeriod : ''} aria-pressed={period === 'annual'} onClick={() => onPeriodChange('annual')}>
            Anual
          </button>
        </div>
      </header>

      <p className={styles.rangeLabel}>Período analisado: <strong>{rangeLabel}</strong></p>

      {loading ? <p className={styles.status}>Carregando movimentações...</p> : (
        <>
          <section className={styles.kpis} aria-label="Indicadores financeiros">
            <KpiCard label="Total gasto por categoria" value={kpis.totalByCategory} tone="expense">
              <select aria-label="Categoria do total gasto" value={selectedCategory} onChange={(event) => setSelectedCategory(event.target.value)}>
                {EXPENSE_CATEGORIES.map((category) => <option key={category.id} value={category.id}>{category.label}</option>)}
              </select>
            </KpiCard>
            <KpiCard label="Outras fontes de renda" value={kpis.otherIncome} tone="income" />
            <KpiCard label="Total investido" value={kpis.invested} tone="investment" />
            <KpiCard label="Gastos não essenciais" value={kpis.nonEssential} tone="optional" />
          </section>

          <section className={styles.charts} aria-label="Gráficos financeiros">
            <article className={styles.chartCard}>
              <header className={styles.cardHeader}>
                <div><p className={styles.cardEyebrow}>Para onde vai o dinheiro</p><h2>Distribuição de despesas</h2></div>
                <span>{formatValue(summary.gastos)}</span>
              </header>
              {distribution.length === 0 ? <ChartEmpty>Nenhuma despesa no período selecionado.</ChartEmpty> : (
                <div className={styles.donutLayout}>
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie
                        data={distributionWithPercentage}
                        dataKey="amount"
                        nameKey="label"
                        outerRadius="82%"
                        paddingAngle={3}
                        stroke="none"
                        startAngle={90}
                        endAngle={-270}
                      >
                        {distributionWithPercentage.map((item, index) => <Cell key={item.category} fill={CHART_COLORS[index % CHART_COLORS.length]} />)}
                      </Pie>
                      <Tooltip content={<ExpenseTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <ul className={styles.legendList}>
                    {distributionWithPercentage.map((item, index) => (
                      <li key={item.category}>
                        <span className={styles.legendDot} style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }} />
                        <span>{item.label}</span>
                        <strong>{item.percentage}%</strong>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </article>

            <article className={styles.chartCard}>
              <header className={styles.cardHeader}>
                <div><p className={styles.cardEyebrow}>Entradas e saídas</p><h2>Receitas x Despesas</h2></div>
                <span>Saldo {formatValue(summary.saldo)}</span>
              </header>
              {summary.ganhos === 0 && summary.gastos === 0 ? <ChartEmpty>Nenhuma movimentação no período selecionado.</ChartEmpty> : (
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={barData} barCategoryGap="28%" barGap={6} margin={{ top: 16, right: 12, left: 8, bottom: 8 }}>
                    <CartesianGrid vertical={false} strokeDasharray="4 4" stroke="#eee7e8" />
                    <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#7a7274', fontSize: 12 }} />
                    <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `R$ ${value / 100}`} tick={{ fill: '#7a7274', fontSize: 11 }} />
                    <Tooltip content={<FinancialTooltip />} />
                    <Legend iconType="circle" wrapperStyle={{ paddingTop: 12, fontSize: 12 }} />
                    <Bar dataKey="ganhos" name="Receitas" fill="#35a31f" maxBarSize={42} radius={[7, 7, 0, 0]} />
                    <Bar dataKey="gastos" name="Despesas" fill="#ff47b2" maxBarSize={42} radius={[7, 7, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </article>
          </section>
        </>
      )}
    </>
  )
}
