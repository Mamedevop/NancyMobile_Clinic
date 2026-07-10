import { useState, useEffect } from 'react'
import { FaChartBar, FaShoppingBag, FaMoneyBillWave, FaUsers, FaTools } from 'react-icons/fa'
import { Bar, Line, Doughnut, Pie } from 'react-chartjs-2'
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, ArcElement, Title, Tooltip, Legend
} from 'chart.js'
import { useLanguage } from '../../context/LanguageContext'
import api from '../../services/api'

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend)

const COLORS = ['#4361ee', '#f72585', '#f8961e', '#28a745', '#3f37c9', '#4895ef', '#560bad']

const chartOpts = (title) => ({
  responsive: true,
  plugins: { legend: { position: 'bottom' }, title: { display: !!title, text: title } },
  scales: { y: { beginAtZero: true } }
})

const doughnutOpts = {
  responsive: true,
  plugins: { legend: { position: 'bottom' } }
}

export default function Reports() {
  const [stats, setStats] = useState(null)
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const { t } = useLanguage()

  useEffect(() => {
    Promise.all([
      api.get('/admin/dashboard/stats'),
      api.get('/admin/analytics')
    ]).then(([s, a]) => {
      if (s.data.success) setStats(s.data.stats)
      if (a.data.success) setAnalytics(a.data.analytics)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="page"><p>{t('loading')}</p></div>

  const revenueChart = {
    labels: analytics?.revenueByMonth?.map(r => r.month) || [],
    datasets: [{
      label: 'Revenue (ETB)',
      data: analytics?.revenueByMonth?.map(r => parseFloat(r.revenue)) || [],
      backgroundColor: 'rgba(67,97,238,0.2)',
      borderColor: '#4361ee',
      borderWidth: 2,
      fill: true,
      tension: 0.4
    }]
  }

  const ordersChart = {
    labels: analytics?.ordersByMonth?.map(r => r.month) || [],
    datasets: [{
      label: 'Orders',
      data: analytics?.ordersByMonth?.map(r => parseInt(r.count)) || [],
      backgroundColor: COLORS[1] + '33',
      borderColor: COLORS[1],
      borderWidth: 2,
      tension: 0.4
    }]
  }

  const orderStatusChart = {
    labels: analytics?.ordersByStatus?.map(r => r.status) || [],
    datasets: [{
      data: analytics?.ordersByStatus?.map(r => parseInt(r.count)) || [],
      backgroundColor: COLORS,
    }]
  }

  const topProductsChart = {
    labels: analytics?.topProducts?.map(r => r.name) || [],
    datasets: [{
      label: 'Units Sold',
      data: analytics?.topProducts?.map(r => parseInt(r.total_sold)) || [],
      backgroundColor: COLORS,
    }]
  }

  const userRoleChart = {
    labels: analytics?.usersByRole?.map(r => r.role) || [],
    datasets: [{
      data: analytics?.usersByRole?.map(r => parseInt(r.count)) || [],
      backgroundColor: COLORS,
    }]
  }

  const repairStatusChart = {
    labels: analytics?.repairsByStatus?.map(r => r.status) || [],
    datasets: [{
      data: analytics?.repairsByStatus?.map(r => parseInt(r.count)) || [],
      backgroundColor: COLORS,
    }]
  }

  const dailyRevenueChart = {
    labels: analytics?.recentRevenue?.map(r => r.day) || [],
    datasets: [{
      label: 'Daily Revenue (ETB)',
      data: analytics?.recentRevenue?.map(r => parseFloat(r.revenue)) || [],
      backgroundColor: 'rgba(40,167,69,0.2)',
      borderColor: '#28a745',
      borderWidth: 2,
      fill: true,
      tension: 0.4
    }]
  }

  return (
    <div className="page">
      <h2 style={{ marginBottom: 20 }}><FaChartBar style={{ marginRight: 8, color: 'var(--primary)' }} />{t('reportsAnalytics')}</h2>

      <div className="stats-grid" style={{ marginBottom: 24 }}>
        {[
          { label: t('totalRevenue'), value: `ETB ${parseFloat(stats?.revenue || 0).toFixed(2)}`, icon: <FaMoneyBillWave />, color: 'success' },
          { label: t('totalOrders'), value: stats?.orders || 0, icon: <FaShoppingBag />, color: 'primary' },
          { label: t('totalUsers'), value: stats?.users || 0, icon: <FaUsers />, color: 'warning' },
          { label: t('repairRequests'), value: stats?.repairs || 0, icon: <FaTools />, color: 'danger' },
        ].map((s, i) => (
          <div className="stat-card" key={i}>
            <div className={`stat-icon ${s.color}`}>{s.icon}</div>
            <div className="stat-info"><h3>{s.value}</h3><p>{s.label}</p></div>
          </div>
        ))}
      </div>

      {/* Row 1: Revenue + Orders over time */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        <div className="card">
          <h4 style={{ marginBottom: 16 }}>{t('revenueLastMonths')}</h4>
          <Line data={revenueChart} options={chartOpts()} />
        </div>
        <div className="card">
          <h4 style={{ marginBottom: 16 }}>{t('ordersLastMonths')}</h4>
          <Line data={ordersChart} options={chartOpts()} />
        </div>
      </div>

      {/* Row 2: Daily revenue + Top products */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        <div className="card">
          <h4 style={{ marginBottom: 16 }}>{t('dailyRevenue')}</h4>
          <Bar data={dailyRevenueChart} options={chartOpts()} />
        </div>
        <div className="card">
          <h4 style={{ marginBottom: 16 }}>{t('topProducts')}</h4>
          <Bar data={topProductsChart} options={{ ...chartOpts(), indexAxis: 'y' }} />
        </div>
      </div>

      {/* Row 3: Doughnut charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20, marginBottom: 20 }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <h4 style={{ marginBottom: 16 }}>{t('ordersByStatus')}</h4>
          <Doughnut data={orderStatusChart} options={doughnutOpts} />
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <h4 style={{ marginBottom: 16 }}>{t('usersByRole')}</h4>
          <Pie data={userRoleChart} options={doughnutOpts} />
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <h4 style={{ marginBottom: 16 }}>{t('repairsByStatus')}</h4>
          <Doughnut data={repairStatusChart} options={doughnutOpts} />
        </div>
      </div>

      {analytics?.paymentsByMethod?.length > 0 && (
        <div className="card">
          <h4 style={{ marginBottom: 16 }}>{t('paymentMethodsSummary')}</h4>
          <table className="data-table">
            <thead>
              <tr><th>{t('paymentMethod')}</th><th>{t('transactions')}</th><th>{t('totalRevenue')}</th></tr>
            </thead>
            <tbody>
              {analytics.paymentsByMethod.map((p, i) => (
                <tr key={i}>
                  <td style={{ textTransform: 'capitalize' }}>{p.method?.replace('_', ' ') || '-'}</td>
                  <td>{p.count}</td>
                  <td style={{ fontWeight: 600, color: 'var(--primary)' }}>ETB {parseFloat(p.total).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
