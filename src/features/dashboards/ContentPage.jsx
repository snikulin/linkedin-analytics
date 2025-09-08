import React from 'react'
import { getLatestDataset, getPosts } from '../../data/repo'
import { fmtInt, fmtPct } from '../../lib/format'

export function ContentPage() {
  const [posts, setPosts] = React.useState([])
  const [sortConfig, setSortConfig] = React.useState({ key: 'postedAt', direction: 'desc' })

  React.useEffect(() => {
    (async () => {
      const ds = await getLatestDataset()
      if (!ds) return
      const allPosts = await getPosts(ds.id)
      
      // Normalize posts
      const normalizedPosts = allPosts.map((p) => ({
        title: p.title || '(untitled)',
        link: p.link || null,
        postedAt: p.createdAt || null, // Assuming 'createdAt' is the correct field for "postedAt"
        impressions: p.impressions || 0,
        er: p.engagementRate ?? null,
        likes: p.likes || 0,
        comments: p.comments || 0,
        reposts: p.reposts || 0,
      }));
      
      setPosts(normalizedPosts)
    })()
  }, [])

  const handleSort = (key) => {
    let direction = 'asc'
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    setSortConfig({ key, direction })
  }

  const sortedPosts = React.useMemo(() => {
    if (!sortConfig.key) return posts

    return [...posts].sort((a, b) => {
      let aValue = a[sortConfig.key]
      let bValue = b[sortConfig.key]

      // Handle null/undefined values - sort them last
      if (aValue == null && bValue == null) return 0
      if (aValue == null) return 1
      if (bValue == null) return -1

      // Specific handling for date strings
      if (sortConfig.key === 'postedAt') {
        aValue = new Date(aValue)
        bValue = new Date(bValue)
      }

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1
      }
      return 0
    })
  }, [posts, sortConfig])

  const getSortIndicator = (columnKey) => {
    if (sortConfig.key === columnKey) {
      return sortConfig.direction === 'asc' ? ' ↑' : ' ↓'
    }
    return ''
  }

  const Table = ({ rows }) => (
    <div className="rounded border border-slate-800 overflow-hidden">
      <table className="w-full text-sm table-fixed">
        <thead className="bg-slate-900">
          <tr>
            <th className="text-left px-3 py-2 w-1/3">Post</th>
            <th className="text-left px-3 py-2 cursor-pointer hover:bg-slate-800 w-1/6" onClick={() => handleSort('postedAt')}>
              Posted At{getSortIndicator('postedAt')}
            </th>
            <th className="text-right px-3 py-2 cursor-pointer hover:bg-slate-800 w-1/12" onClick={() => handleSort('impressions')}>
              Impr{getSortIndicator('impressions')}
            </th>
            <th className="text-right px-3 py-2 cursor-pointer hover:bg-slate-800 w-1/12" onClick={() => handleSort('er')}>
              ER{getSortIndicator('er')}
            </th>
            <th className="text-right px-3 py-2 cursor-pointer hover:bg-slate-800 w-1/12" onClick={() => handleSort('likes')}>
              Likes{getSortIndicator('likes')}
            </th>
            <th className="text-right px-3 py-2 cursor-pointer hover:bg-slate-800 w-1/12" onClick={() => handleSort('comments')}>
              Comments{getSortIndicator('comments')}
            </th>
            <th className="text-right px-3 py-2 cursor-pointer hover:bg-slate-800 w-1/12" onClick={() => handleSort('reposts')}>
              Reposts{getSortIndicator('reposts')}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-slate-800">
              <td className="px-3 py-2 truncate max-w-[300px] w-[300px]">
                {r.link ? (
                  <a href={r.link} target="_blank" rel="noreferrer" className="text-sky-400 hover:underline truncate">{r.title}</a>
                ) : (
                  <span className="truncate">{r.title}</span>
                )}
              </td>
              <td className="px-3 py-2">
                {r.postedAt ? new Date(r.postedAt).toLocaleDateString('de-DE') : '—'}
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
      <h2 className="text-lg font-medium">Content Chronological View</h2>
      <section className="space-y-2">
        <h3 className="font-medium">All Posts</h3>
        <Table rows={sortedPosts} />
      </section>
    </div>
  )
}
