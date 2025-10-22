import React from 'react'
import { getCurrentDataset, getPosts, getDatasetFreshness } from '../../data/repo'
import { fmtInt, fmtPct } from '../../lib/format'
import { Chart } from '../../components/Chart'
import { deriveContentType, bucketizeContentType } from '../../lib/contentClassification'

const BUCKET_ORDER = ['Video', 'Jobs', 'Funding', 'Newsletter', 'Regular']

const SUMMARY_LABELS = {
  Video: 'Video Posts',
  Jobs: 'Jobs Posts',
  Funding: 'Funding Posts',
  Newsletter: 'Newsletter Posts',
  Regular: 'Regular Posts',
}

export function ContentPage() {
  const [posts, setPosts] = React.useState([])
  const [sortConfig, setSortConfig] = React.useState({ key: 'postedAt', direction: 'desc' })
  const [timeFilter, setTimeFilter] = React.useState('all')
  const [contentTypeFilter, setContentTypeFilter] = React.useState('all')
  const [freshness, setFreshness] = React.useState(null)

  const referenceDate = React.useMemo(() => {
    if (freshness?.date) {
      return new Date(freshness.date)
    }
    return null
  }, [freshness])

  const getReferenceDate = React.useCallback(() => {
    if (referenceDate) {
      return new Date(referenceDate.getTime())
    }
    return new Date()
  }, [referenceDate])

  React.useEffect(() => {
    (async () => {
      const ds = await getCurrentDataset()
      if (!ds) return
      const [allPosts, freshnessInfo] = await Promise.all([
        getPosts(ds.id),
        getDatasetFreshness(ds.id),
      ])

      setFreshness(freshnessInfo)

      const normalizedPosts = allPosts.map((p) => {
        const contentType = deriveContentType(p)
        return {
          title: p.title || '(untitled)',
          link: p.link || null,
          postedAt: p.createdAt || null,
          impressions: p.impressions || 0,
          er: p.engagementRate ?? null,
          likes: p.likes || 0,
          comments: p.comments || 0,
          reposts: p.reposts || 0,
          contentType,
          bucket: bucketizeContentType(contentType),
        }
      })

      setPosts(normalizedPosts)
    })()
  }, [])

  const getCutoffDate = React.useCallback((filter) => {
    const reference = getReferenceDate()
    const dayMs = 24 * 60 * 60 * 1000
    switch (filter) {
      case '7d':
        return new Date(reference.getTime() - 7 * dayMs)
      case '14d':
        return new Date(reference.getTime() - 14 * dayMs)
      case '1month':
        return new Date(reference.getFullYear(), reference.getMonth() - 1, reference.getDate())
      case 'all':
      default:
        return null
    }
  }, [getReferenceDate])

  const timeFilteredPosts = React.useMemo(() => {
    if (timeFilter === 'all') return posts
    const cutoff = getCutoffDate(timeFilter)
    if (!cutoff) return posts
    const reference = getReferenceDate()
    return posts.filter(post => {
      if (!post.postedAt) return false
      const date = new Date(post.postedAt)
      if (Number.isNaN(date.getTime())) return false
      return date >= cutoff && date <= reference
    })
  }, [posts, timeFilter, getCutoffDate, getReferenceDate])

  const contentFilteredPosts = React.useMemo(() => {
    if (contentTypeFilter === 'all') return timeFilteredPosts
    const filterMap = {
      video: 'Video',
      jobs: 'Jobs',
      funding: 'Funding',
      newsletter: 'Newsletter',
      regular: 'Regular',
    }
    const targetBucket = filterMap[contentTypeFilter]
    if (!targetBucket) return timeFilteredPosts
    return timeFilteredPosts.filter((post) => post.bucket === targetBucket)
  }, [timeFilteredPosts, contentTypeFilter])

  const handleSort = (key) => {
    let direction = 'asc'
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    setSortConfig({ key, direction })
  }

  const sortedPosts = React.useMemo(() => {
    if (!sortConfig.key) return contentFilteredPosts

    return [...contentFilteredPosts].sort((a, b) => {
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
  }, [contentFilteredPosts, sortConfig])

  const bucketStats = React.useMemo(() => {
    const base = Object.fromEntries(
      BUCKET_ORDER.map((bucket) => [
        bucket,
        { count: 0, totalImpressions: 0, totalER: 0, validER: 0 },
      ]),
    )

    timeFilteredPosts.forEach((post) => {
      const bucket = BUCKET_ORDER.includes(post.bucket) ? post.bucket : 'Regular'
      const stats = base[bucket]
      stats.count += 1
      stats.totalImpressions += post.impressions || 0
      if (post.er != null) {
        stats.totalER += post.er
        stats.validER += 1
      }
    })

    const totalPosts = timeFilteredPosts.length

    const entries = BUCKET_ORDER.map((bucket) => {
      const data = base[bucket]
      return {
        bucket,
        count: data.count,
        share: totalPosts ? (data.count / totalPosts) * 100 : 0,
        totalImpressions: data.totalImpressions,
        avgImpressions: data.count ? data.totalImpressions / data.count : 0,
        avgER: data.validER ? data.totalER / data.validER : null,
      }
    })

    return { entries, totalPosts }
  }, [timeFilteredPosts])

  const summaryMap = React.useMemo(() => (
    Object.fromEntries(bucketStats.entries.map((entry) => [entry.bucket, entry]))
  ), [bucketStats])

  const makeDefaultSummary = (bucket) => ({
    bucket,
    count: 0,
    share: 0,
    totalImpressions: 0,
    avgImpressions: 0,
    avgER: null,
  })

  const videoSummary = summaryMap['Video'] || makeDefaultSummary('Video')
  const jobsSummary = summaryMap['Jobs'] || makeDefaultSummary('Jobs')
  const regularSummary = summaryMap['Regular'] || makeDefaultSummary('Regular')

  const contentTypeStats = React.useMemo(() => (
    bucketStats.entries.map((entry) => ({
      type: entry.bucket,
      count: entry.count,
      share: entry.share,
      totalImpressions: entry.totalImpressions,
      avgImpressions: entry.avgImpressions,
      avgER: entry.avgER,
    }))
  ), [bucketStats])

  const insights = React.useMemo(() => {
    const items = []

    if (videoSummary.count > 0 && regularSummary.count > 0) {
      const impressionLift = regularSummary.avgImpressions > 0
        ? ((videoSummary.avgImpressions / regularSummary.avgImpressions) - 1) * 100
        : null

      if (impressionLift != null && isFinite(impressionLift) && Math.abs(impressionLift) >= 5) {
        items.push(
          impressionLift > 0
            ? `Videos deliver ${impressionLift.toFixed(0)}% more impressions than regular posts.`
            : `Regular posts outperform video by ${Math.abs(impressionLift).toFixed(0)}% on impressions.`
        )
      }

      const erLift = regularSummary.avgER && videoSummary.avgER
        ? ((videoSummary.avgER / regularSummary.avgER) - 1) * 100
        : null

      if (erLift != null && isFinite(erLift) && Math.abs(erLift) >= 5) {
        items.push(
          erLift > 0
            ? `Video engagement rate is ${erLift.toFixed(0)}% higher than regular posts.`
            : `Regular posts see ${Math.abs(erLift).toFixed(0)}% stronger engagement than video.`
        )
      }
    }

    if (videoSummary.count === 0 && timeFilteredPosts.length > 0) {
      items.push('No video posts detected in the selected period—consider testing a short clip or webinar teaser.')
    } else if (videoSummary.count > 0 && videoSummary.share < 20) {
      items.push('Video is under 20% of your output—experiment with more motion content to diversify.')
    }

    if (jobsSummary.count > 0) {
      items.push(`Jobs posts make up ${jobsSummary.share.toFixed(0)}% of your content mix.`)

      if (regularSummary.avgImpressions > 0) {
        const jobsLift = ((jobsSummary.avgImpressions / regularSummary.avgImpressions) - 1) * 100
        if (isFinite(jobsLift) && Math.abs(jobsLift) >= 10) {
          items.push(
            jobsLift > 0
              ? `Jobs posts deliver ${jobsLift.toFixed(0)}% more impressions than regular updates—double down when hiring.`
              : `Jobs posts trail regular updates by ${Math.abs(jobsLift).toFixed(0)}%—try richer storytelling in hiring posts.`
          )
        }
      }
    }

    if (!items.length && timeFilteredPosts.length > 0) {
      items.push('Solid mix of formats—keep testing video vs. regular posts to spot new wins.')
    }

    return items.slice(0, 3)
  }, [videoSummary, regularSummary, jobsSummary, timeFilteredPosts.length])

  const comparisonChartOption = React.useMemo(() => {
    const entries = bucketStats.entries.filter((entry) => entry.count > 0)
    if (!entries.length) return null

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params) => {
          return params.map((p) => {
            if (p.seriesName === 'Avg ER') {
              return `${p.marker}${p.seriesName}: ${(p.data * 100).toFixed(1)}%`
            }
            return `${p.marker}${p.seriesName}: ${fmtInt(p.data)}`
          }).join('<br />')
        }
      },
      legend: {
        data: ['Avg Impressions', 'Avg ER'],
        textStyle: { color: '#94a3b8' }
      },
      grid: { top: 50, left: 60, right: 60, bottom: 40 },
      xAxis: {
        type: 'category',
        data: entries.map((entry) => entry.bucket),
        axisLabel: { color: '#94a3b8' },
        axisLine: { lineStyle: { color: '#475569' } }
      },
      yAxis: [
        {
          type: 'value',
          name: 'Avg Impressions',
          axisLabel: { color: '#94a3b8' },
          axisLine: { lineStyle: { color: '#475569' } },
          splitLine: { lineStyle: { color: '#1e293b' } }
        },
        {
          type: 'value',
          name: 'Avg ER',
          axisLabel: {
            color: '#94a3b8',
            formatter: (value) => `${(value * 100).toFixed(0)}%`
          },
          axisLine: { lineStyle: { color: '#475569' } },
          splitLine: { show: false }
        }
      ],
      series: [
        {
          name: 'Avg Impressions',
          type: 'bar',
          data: entries.map((entry) => Math.round(entry.avgImpressions)),
          itemStyle: { color: '#38bdf8' },
          barWidth: 28
        },
        {
          name: 'Avg ER',
          type: 'line',
          yAxisIndex: 1,
          data: entries.map((entry) => entry.avgER || 0),
          itemStyle: { color: '#f472b6' },
          smooth: true
        }
      ]
    }
  }, [bucketStats])

  const topPostsByBucket = React.useMemo(() => (
    BUCKET_ORDER.map((bucket) => ({
      bucket,
      posts: timeFilteredPosts
        .filter((post) => post.bucket === bucket)
        .sort((a, b) => b.impressions - a.impressions)
        .slice(0, 5),
    })).filter((item) => item.posts.length > 0)
  ), [timeFilteredPosts])

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
                {r.contentType && (
                  <div className="mt-1">
                    <span className="inline-flex items-center text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {r.contentType}
                    </span>
                  </div>
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

  const TimeFilterButton = ({ filter, label }) => (
    <button
      onClick={() => setTimeFilter(filter)}
      className={`px-3 py-1 rounded text-sm ${
        timeFilter === filter
          ? 'bg-slate-600 text-white'
          : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
      }`}
    >
      {label}
    </button>
  )

  const ContentTypeFilterButton = ({ filter, label }) => (
    <button
      onClick={() => setContentTypeFilter(filter)}
      className={`px-3 py-1 rounded text-sm ${
        contentTypeFilter === filter
          ? 'bg-slate-600 text-white'
          : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
      }`}
    >
      {label}
    </button>
  )

  const TopPostsList = ({ title, posts }) => (
    <div className="rounded border border-slate-800 p-4">
      <h4 className="font-medium mb-3">{title}</h4>
      {posts.length === 0 ? (
        <div className="text-sm text-slate-400">No posts in this segment for the selected period.</div>
      ) : (
        <div className="space-y-3">
          {posts.map((post, index) => (
            <div key={index} className="rounded bg-slate-900/50 p-3 space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  {post.link ? (
                    <a
                      href={post.link}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm text-sky-400 hover:underline truncate block"
                    >
                      {post.title}
                    </a>
                  ) : (
                    <span className="text-sm text-slate-200 truncate block">{post.title}</span>
                  )}
                  <div className="text-xs text-slate-400 mt-1">
                    {post.postedAt ? new Date(post.postedAt).toLocaleDateString() : '—'} • {fmtPct(post.er)}
                  </div>
                </div>
                <div className="text-sm font-medium text-slate-200 whitespace-nowrap">
                  {fmtInt(post.impressions)} impr
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>👍 {fmtInt(post.likes)}</span>
                <span>💬 {fmtInt(post.comments)}</span>
                <span>🔁 {fmtInt(post.reposts)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium">Content Performance</h2>
        <p className="text-sm text-slate-400 mt-1">
          Compare video versus regular posts, track mix over time, and surface standout content.
        </p>
        {freshness?.display && (
          <p className="text-xs text-slate-500 mt-2">
            Data current through {freshness.display}.
          </p>
        )}
      </div>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-slate-400">Filter by time:</span>
          <TimeFilterButton filter="7d" label="Past 7 days" />
          <TimeFilterButton filter="14d" label="Past 14 days" />
          <TimeFilterButton filter="1month" label="Past month" />
          <TimeFilterButton filter="all" label="All time" />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-slate-400">Content filter:</span>
           <ContentTypeFilterButton filter="all" label="All formats" />
           <ContentTypeFilterButton filter="video" label="Video only" />
           <ContentTypeFilterButton filter="jobs" label="Jobs only" />
           <ContentTypeFilterButton filter="funding" label="Funding only" />
           <ContentTypeFilterButton filter="newsletter" label="Newsletter only" />
           <ContentTypeFilterButton filter="regular" label="Regular only" />
        </div>
      </section>

      {insights.length > 0 && (
        <section className="rounded border border-slate-800 p-4">
          <h3 className="font-medium mb-2">Insights</h3>
          <ul className="space-y-1 text-sm text-slate-300">
            {insights.map((insight, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-blue-400">•</span>
                <span className="flex-1">{insight}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {bucketStats.entries.map((summary) => (
            <div key={summary.bucket} className="rounded border border-slate-800 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">
                  {SUMMARY_LABELS[summary.bucket] || summary.bucket}
                </span>
                <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                  {summary.share.toFixed(0)}% of posts
                </span>
              </div>
              <div className="text-2xl font-semibold text-slate-100">
                {fmtInt(summary.avgImpressions)}
              </div>
              <div className="text-xs text-slate-400">
                Avg impressions • {summary.count} posts
              </div>
              <div className="text-sm text-slate-300">
                Avg ER: {fmtPct(summary.avgER)}
              </div>
            </div>
          ))}
        </div>
      </section>

      {comparisonChartOption && (
        <section className="space-y-3">
          <h3 className="font-medium">Performance by Content Type</h3>
          <Chart option={comparisonChartOption} />
        </section>
      )}

      {contentTypeStats.length > 0 && (
        <section className="space-y-2">
          <h3 className="font-medium">Content Type Breakdown</h3>
          <div className="rounded border border-slate-800 overflow-hidden">
            <table className="w-full text-sm">
               <thead className="bg-slate-900">
                 <tr>
                   <th className="text-left px-3 py-2">Type</th>
                   <th className="text-right px-3 py-2">Posts</th>
                   <th className="text-right px-3 py-2">Share</th>
                   <th className="text-right px-3 py-2">Total Impr</th>
                   <th className="text-right px-3 py-2">Avg Impr</th>
                   <th className="text-right px-3 py-2">Avg ER</th>
                 </tr>
               </thead>
              <tbody>
                 {contentTypeStats.map((stat) => (
                   <tr key={stat.type} className="border-t border-slate-800">
                     <td className="px-3 py-2 text-slate-200">{stat.type}</td>
                     <td className="px-3 py-2 text-right">{fmtInt(stat.count)}</td>
                     <td className="px-3 py-2 text-right text-slate-400">{stat.share.toFixed(1)}%</td>
                     <td className="px-3 py-2 text-right">{fmtInt(stat.totalImpressions)}</td>
                     <td className="px-3 py-2 text-right">{fmtInt(stat.avgImpressions)}</td>
                     <td className="px-3 py-2 text-right">{fmtPct(stat.avgER)}</td>
                   </tr>
                 ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {topPostsByBucket.length > 0 && (
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {topPostsByBucket.map(({ bucket, posts }) => (
            <TopPostsList
              key={bucket}
              title={`Top ${bucket} Posts`}
              posts={posts}
            />
          ))}
        </section>
      )}

      <section className="space-y-2">
        <h3 className="font-medium">
          Chronological View ({sortedPosts.length} posts shown)
        </h3>
        <Table rows={sortedPosts} />
      </section>
    </div>
  )
}
