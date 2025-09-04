import React from 'react'
import { getLatestDataset, getPosts } from '../../data/repo'
import { groupBy, toArray } from '../../lib/group'
import { median } from '../../lib/stats'
import { fmtInt, fmtPct } from '../../lib/format'
import { Chart } from '../../components/Chart'

export function ContentPage() {
  const [byType, setByType] = React.useState([])
  const [linkStats, setLinkStats] = React.useState(null)
  const [lengthBins, setLengthBins] = React.useState([])
  const [charts, setCharts] = React.useState(null)

  React.useEffect(() => {
    (async () => {
      const ds = await getLatestDataset()
      if (!ds) return
      const posts = await getPosts(ds.id)

      const safeType = (t) => {
        if (!t || typeof t !== 'string' || t.trim() === '') return 'Unknown'
        const x = t.toLowerCase()
        if (x.includes('video')) return 'Video'
        if (x.includes('article')) return 'Article'
        if (x.includes('image')) return 'Image'
        if (x.includes('carousel')) return 'Carousel'
        if (x.includes('text')) return 'Text'
        return t
      }

      const extended = posts.map((p) => {
        const title = p.title || ''
        const hasLink = /https?:\/\//i.test(title) || /https?:\/\//i.test(p.link || '')
        const len = title.length
        return { ...p, _type: safeType(p.type), _hasLink: hasLink, _len: len }
      })

      // Group by content type
      const groups = toArray(groupBy(extended, (p) => p._type))
        .map(({ key, values }) => ({
          type: key,
          n: values.length,
          medER: median(values.map((v) => v.engagementRate).filter((x) => x != null)),
          medImpr: median(values.map((v) => v.impressions || 0)),
        }))
        .sort((a, b) => (b.medER ?? 0) - (a.medER ?? 0))
      setByType(groups)

      // Link penalty
      const withLink = extended.filter((p) => p._hasLink)
      const noLink = extended.filter((p) => !p._hasLink)
      const medERL = median(withLink.map((v) => v.engagementRate).filter((x) => x != null))
      const medERN = median(noLink.map((v) => v.engagementRate).filter((x) => x != null))
      const medImprL = median(withLink.map((v) => v.impressions || 0))
      const medImprN = median(noLink.map((v) => v.impressions || 0))
      const penalty = medERN != null && medERL != null ? (medERL - medERN) / medERN : null
      const imprDelta = medImprN != null && medImprL != null ? (medImprL - medImprN) / medImprN : null
      const linkData = {
        withLink: { n: withLink.length, medER: medERL, medImpr: medImprL },
        noLink: { n: noLink.length, medER: medERN, medImpr: medImprN },
        penalty, imprDelta,
      }
      setLinkStats(linkData)

      // Length bins (e.g., 0-200, 201-400, 401-800, 801+)
      const bins = [
        { name: '0–200', min: 0, max: 200 },
        { name: '201–400', min: 201, max: 400 },
        { name: '401–800', min: 401, max: 800 },
        { name: '801+', min: 801, max: Infinity },
      ]
      const binStats = bins.map((b) => {
        const items = extended.filter((p) => p._len >= b.min && p._len <= b.max)
        return {
          bin: b.name,
          n: items.length,
          medER: median(items.map((v) => v.engagementRate).filter((x) => x != null)),
        }
      })
      setLengthBins(binStats)

      // Build charts data
      setCharts({
        type: {
          x: groups.map((g) => g.type),
          er: groups.map((g) => (g.medER != null ? +(g.medER * 100).toFixed(2) : null)),
          impr: groups.map((g) => g.medImpr ?? 0),
        },
        link: {
          x: ['With link', 'No link'],
          er: [linkData.withLink.medER, linkData.noLink.medER].map((v) => (v != null ? +(v * 100).toFixed(2) : null)),
          impr: [linkData.withLink.medImpr ?? 0, linkData.noLink.medImpr ?? 0],
        },
        length: {
          x: binStats.map((b) => b.bin),
          er: binStats.map((b) => (b.medER != null ? +(b.medER * 100).toFixed(2) : null)),
        },
      })
    })()
  }, [])

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-medium">Content Performance</h2>

      <section className="space-y-2">
        <h3 className="font-medium">By Content Type</h3>
        {charts && (
          <Chart
            option={{
              backgroundColor: 'transparent',
              tooltip: { trigger: 'axis' },
              legend: { data: ['Median ER %', 'Median Impr'], textStyle: { color: '#cbd5e1' } },
              grid: { left: 40, right: 50, top: 30, bottom: 30 },
              xAxis: { type: 'category', data: charts.type.x, axisLabel: { color: '#94a3b8' } },
              yAxis: [
                { type: 'value', name: 'ER %', axisLabel: { color: '#94a3b8' }, splitLine: { lineStyle: { color: '#1f2937' } } },
                { type: 'value', name: 'Impr', axisLabel: { color: '#94a3b8' }, splitLine: { show: false } },
              ],
              series: [
                { name: 'Median ER %', type: 'bar', data: charts.type.er },
                { name: 'Median Impr', type: 'bar', yAxisIndex: 1, data: charts.type.impr },
              ],
            }}
          />
        )}
        <div className="rounded border border-slate-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-900">
              <tr>
                <th className="text-left px-3 py-2">Type</th>
                <th className="text-right px-3 py-2">Posts</th>
                <th className="text-right px-3 py-2">Median ER</th>
                <th className="text-right px-3 py-2">Median Impr</th>
              </tr>
            </thead>
            <tbody>
              {byType.map((r) => (
                <tr key={r.type} className="border-t border-slate-800">
                  <td className="px-3 py-2">{r.type}</td>
                  <td className="px-3 py-2 text-right">{fmtInt(r.n)}</td>
                  <td className="px-3 py-2 text-right">{fmtPct(r.medER)}</td>
                  <td className="px-3 py-2 text-right">{fmtInt(r.medImpr)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-2">
        <h3 className="font-medium">Link Impact</h3>
        {charts && (
          <Chart
            option={{
              backgroundColor: 'transparent',
              tooltip: { trigger: 'axis' },
              legend: { data: ['Median ER %', 'Median Impr'], textStyle: { color: '#cbd5e1' } },
              grid: { left: 40, right: 50, top: 30, bottom: 30 },
              xAxis: { type: 'category', data: charts.link.x, axisLabel: { color: '#94a3b8' } },
              yAxis: [
                { type: 'value', name: 'ER %', axisLabel: { color: '#94a3b8' }, splitLine: { lineStyle: { color: '#1f2937' } } },
                { type: 'value', name: 'Impr', axisLabel: { color: '#94a3b8' }, splitLine: { show: false } },
              ],
              series: [
                { name: 'Median ER %', type: 'bar', data: charts.link.er },
                { name: 'Median Impr', type: 'bar', yAxisIndex: 1, data: charts.link.impr },
              ],
            }}
          />
        )}
        <div className="rounded border border-slate-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-900">
              <tr>
                <th className="text-left px-3 py-2">Group</th>
                <th className="text-right px-3 py-2">Posts</th>
                <th className="text-right px-3 py-2">Median ER</th>
                <th className="text-right px-3 py-2">Median Impr</th>
              </tr>
            </thead>
            <tbody>
              {linkStats && (
                <>
                  <tr className="border-t border-slate-800">
                    <td className="px-3 py-2">With link</td>
                    <td className="px-3 py-2 text-right">{fmtInt(linkStats.withLink.n)}</td>
                    <td className="px-3 py-2 text-right">{fmtPct(linkStats.withLink.medER)}</td>
                    <td className="px-3 py-2 text-right">{fmtInt(linkStats.withLink.medImpr)}</td>
                  </tr>
                  <tr className="border-t border-slate-800">
                    <td className="px-3 py-2">No link</td>
                    <td className="px-3 py-2 text-right">{fmtInt(linkStats.noLink.n)}</td>
                    <td className="px-3 py-2 text-right">{fmtPct(linkStats.noLink.medER)}</td>
                    <td className="px-3 py-2 text-right">{fmtInt(linkStats.noLink.medImpr)}</td>
                  </tr>
                  <tr className="border-t border-slate-800">
                    <td className="px-3 py-2">Estimated ER delta vs no-link</td>
                    <td className="px-3 py-2 text-right">—</td>
                    <td className="px-3 py-2 text-right">{linkStats.penalty != null ? fmtPct(linkStats.penalty) : '—'}</td>
                    <td className="px-3 py-2 text-right">{linkStats.imprDelta != null ? fmtPct(linkStats.imprDelta) : '—'}</td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-2">
        <h3 className="font-medium">Text Length vs ER</h3>
        {charts && (
          <Chart
            option={{
              backgroundColor: 'transparent',
              tooltip: { trigger: 'axis' },
              legend: { data: ['Median ER %'], textStyle: { color: '#cbd5e1' } },
              grid: { left: 40, right: 30, top: 30, bottom: 30 },
              xAxis: { type: 'category', data: charts.length.x, axisLabel: { color: '#94a3b8' } },
              yAxis: { type: 'value', name: 'ER %', axisLabel: { color: '#94a3b8' }, splitLine: { lineStyle: { color: '#1f2937' } } },
              series: [
                { name: 'Median ER %', type: 'bar', data: charts.length.er },
              ],
            }}
          />
        )}
        <div className="rounded border border-slate-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-900">
              <tr>
                <th className="text-left px-3 py-2">Length Bin</th>
                <th className="text-right px-3 py-2">Posts</th>
                <th className="text-right px-3 py-2">Median ER</th>
              </tr>
            </thead>
            <tbody>
              {lengthBins.map((r) => (
                <tr key={r.bin} className="border-t border-slate-800">
                  <td className="px-3 py-2">{r.bin}</td>
                  <td className="px-3 py-2 text-right">{fmtInt(r.n)}</td>
                  <td className="px-3 py-2 text-right">{fmtPct(r.medER)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
