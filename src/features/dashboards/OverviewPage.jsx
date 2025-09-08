import React from 'react'
import { getCurrentDataset, getPosts, getDaily } from '../../data/repo'
import { median } from '../../lib/stats'
import { Chart } from '../../components/Chart'

export function OverviewPage() {
  const [metrics, setMetrics] = React.useState(null)
  const [series, setSeries] = React.useState(null)

  React.useEffect(() => {
    (async () => {
      const ds = await getCurrentDataset()
      if (!ds) return
      const [posts, daily] = await Promise.all([getPosts(ds.id), getDaily(ds.id)])
      const postsCount = posts.length
      const impressions = posts.reduce((acc, p) => acc + (p.impressions || 0), 0)
      const likes = posts.reduce((acc, p) => acc + (p.likes || 0), 0)
      const ers = posts.map((p) => p.engagementRate).filter((v) => typeof v === 'number')
      const medER = median(ers)
      setMetrics({ postsCount, impressions, likes, medER })

      // Build time series from daily
      const sorted = daily
        .filter((d) => d.date)
        .slice()
        .sort((a, b) => new Date(a.date) - new Date(b.date))
      const x = sorted.map((d) => d.date?.slice(0, 10))
      const imp = sorted.map((d) => d.impressions || 0)
      const er = sorted.map((d) => (d.engagementRate != null ? +(d.engagementRate * 100).toFixed(2) : null))
      setSeries({ x, imp, er })
    })()
  }, [])

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-medium">Overview</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded border border-slate-800 p-3">Impressions: {metrics?.impressions ?? '—'}</div>
        <div className="rounded border border-slate-800 p-3">Posts: {metrics?.postsCount ?? '—'}</div>
        <div className="rounded border border-slate-800 p-3">Median ER: {metrics?.medER != null ? `${(metrics.medER * 100).toFixed(2)}%` : '—'}</div>
        <div className="rounded border border-slate-800 p-3">Likes: {metrics?.likes ?? '—'}</div>
      </div>
      {series && (
        <Chart
          option={{
            backgroundColor: 'transparent',
            tooltip: { trigger: 'axis' },
            legend: { data: ['Impressions', 'ER %'], textStyle: { color: '#cbd5e1' } },
            grid: { left: 40, right: 50, top: 30, bottom: 30 },
            xAxis: { type: 'category', data: series.x, axisLabel: { color: '#94a3b8' } },
            yAxis: [
              { type: 'value', name: 'Impressions', axisLabel: { color: '#94a3b8' }, splitLine: { lineStyle: { color: '#1f2937' } } },
              { type: 'value', name: 'ER %', axisLabel: { color: '#94a3b8' }, splitLine: { show: false } },
            ],
            series: [
              { name: 'Impressions', type: 'line', data: series.imp, smooth: true },
              { name: 'ER %', type: 'line', yAxisIndex: 1, data: series.er, smooth: true },
            ],
          }}
        />
      )}
    </div>
  )
}
