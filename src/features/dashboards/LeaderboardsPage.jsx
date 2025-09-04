import React from 'react'
import { getLatestDataset, getPosts } from '../../data/repo'
import { fmtInt, fmtPct } from '../../lib/format'

export function LeaderboardsPage() {
  const [topER, setTopER] = React.useState([])
  const [topImpr, setTopImpr] = React.useState([])

  React.useEffect(() => {
    (async () => {
      const ds = await getLatestDataset()
      if (!ds) return
      const posts = await getPosts(ds.id)
      const norm = posts.map((p) => ({
        title: p.title || '(untitled)',
        link: p.link || null,
        impressions: p.impressions || 0,
        er: p.engagementRate ?? null,
        likes: p.likes || 0,
        comments: p.comments || 0,
        reposts: p.reposts || 0,
      }))
      const tER = norm
        .filter((p) => p.er != null && p.impressions > 0)
        .sort((a, b) => (b.er ?? 0) - (a.er ?? 0))
        .slice(0, 20)
      const tImpr = norm
        .sort((a, b) => (b.impressions ?? 0) - (a.impressions ?? 0))
        .slice(0, 20)
      setTopER(tER)
      setTopImpr(tImpr)
    })()
  }, [])

  const Table = ({ rows }) => (
    <div className="rounded border border-slate-800 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-slate-900">
          <tr>
            <th className="text-left px-3 py-2">Post</th>
            <th className="text-right px-3 py-2">Impr</th>
            <th className="text-right px-3 py-2">ER</th>
            <th className="text-right px-3 py-2">Likes</th>
            <th className="text-right px-3 py-2">Comments</th>
            <th className="text-right px-3 py-2">Reposts</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-slate-800">
              <td className="px-3 py-2 truncate max-w-[420px]">
                {r.link ? (
                  <a href={r.link} target="_blank" rel="noreferrer" className="text-sky-400 hover:underline">{r.title}</a>
                ) : (
                  r.title
                )}
              </td>
              <td className="px-3 py-2 text-right">{fmtInt(r.impressions)}</td>
              <td className="px-3 py-2 text-right">{fmtPct(r.er)}</td>
              <td className="px-3 py-2 text-right">{fmtInt(r.likes)}</td>
              <td className="px-3 py-2 text-right">{fmtInt(r.comments)}</td>
              <td className="px-3 py-2 text-right">{fmtInt(r.reposts)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-medium">Leaderboards</h2>
      <section className="space-y-2">
        <h3 className="font-medium">Top 20 by Engagement Rate</h3>
        <Table rows={topER} />
      </section>
      <section className="space-y-2">
        <h3 className="font-medium">Top 20 by Impressions</h3>
        <Table rows={topImpr} />
      </section>
    </div>
  )
}

