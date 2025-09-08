import React from 'react'
import { getCurrentDataset, getDaily, getPosts } from '../../data/repo'
import { groupBy, toArray } from '../../lib/group'
import { dayOfWeekIndex, dayOfWeekLabel } from '../../lib/dates'
import { median } from '../../lib/stats'
import { fmtInt, fmtPct } from '../../lib/format'
import { Chart } from '../../components/Chart'

export function TimingPage() {
  const [rows, setRows] = React.useState([])
  const [chartData, setChartData] = React.useState(null)

  React.useEffect(() => {
    (async () => {
      const ds = await getCurrentDataset()
      if (!ds) return
      const [daily, posts] = await Promise.all([getDaily(ds.id), getPosts(ds.id)])

      // DOW from daily for impressions
      const dailyGroups = toArray(groupBy(daily, (d) => dayOfWeekIndex(d.date)))
        .filter((g) => g.key != null)
        .map(({ key, values }) => ({
          dow: key,
          label: dayOfWeekLabel(values[0]?.date),
          medianImpressions: median(values.map((v) => v.impressions || 0)),
        }))

      // DOW from posts for ER
      const postGroups = new Map()
      for (const p of posts) {
        const k = dayOfWeekIndex(p.createdAt)
        if (k == null) continue
        const bucket = postGroups.get(k) || []
        bucket.push(p)
        postGroups.set(k, bucket)
      }

      const erByDow = Array.from(postGroups.entries()).map(([k, values]) => ({
        dow: k,
        medianER: median(values.map((v) => v.engagementRate).filter((x) => x != null)),
        count: values.length,
        label: dayOfWeekLabel(values[0]?.createdAt),
      }))

      // Join on DOW index
      const mapDaily = new Map(dailyGroups.map((d) => [d.dow, d]))
      const allDows = Array.from(new Set([...mapDaily.keys(), ...erByDow.map((r) => r.dow)])).sort((a, b) => a - b)
      const joined = allDows.map((dow) => {
        const d = mapDaily.get(dow)
        const e = erByDow.find((x) => x.dow === dow)
        return {
          dow,
          label: d?.label || e?.label || ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][dow],
          medianImpressions: d?.medianImpressions ?? null,
          medianER: e?.medianER ?? null,
          posts: e?.count ?? 0,
        }
      })

      const ordered = joined.sort((a, b) => a.dow - b.dow)
      setRows(ordered)
      setChartData({
        x: ordered.map((r) => r.label),
        imp: ordered.map((r) => r.medianImpressions ?? 0),
        er: ordered.map((r) => (r.medianER != null ? +(r.medianER * 100).toFixed(2) : null)),
      })
    })()
  }, [])

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-medium">Timing</h2>
      {chartData && (
        <Chart
          option={{
            backgroundColor: 'transparent',
            tooltip: { trigger: 'axis' },
            legend: { data: ['Median Impressions', 'Median ER %'], textStyle: { color: '#cbd5e1' } },
            grid: { left: 40, right: 50, top: 30, bottom: 30 },
            xAxis: { type: 'category', data: chartData.x, axisLabel: { color: '#94a3b8' } },
            yAxis: [
              { type: 'value', name: 'Impr', axisLabel: { color: '#94a3b8' }, splitLine: { lineStyle: { color: '#1f2937' } } },
              { type: 'value', name: 'ER %', axisLabel: { color: '#94a3b8' }, splitLine: { show: false } },
            ],
            series: [
              { name: 'Median Impressions', type: 'bar', data: chartData.imp },
              { name: 'Median ER %', type: 'bar', yAxisIndex: 1, data: chartData.er },
            ],
          }}
        />
      )}
      <div className="rounded border border-slate-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-900">
            <tr>
              <th className="text-left px-3 py-2">Day</th>
              <th className="text-right px-3 py-2">Median Impressions (daily)</th>
              <th className="text-right px-3 py-2">Median ER (posts)</th>
              <th className="text-right px-3 py-2">Posts</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.dow} className="border-t border-slate-800">
                <td className="px-3 py-2">{r.label}</td>
                <td className="px-3 py-2 text-right">{fmtInt(r.medianImpressions)}</td>
                <td className="px-3 py-2 text-right">{fmtPct(r.medianER)}</td>
                <td className="px-3 py-2 text-right">{fmtInt(r.posts)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
