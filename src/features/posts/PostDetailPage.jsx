import React from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Chart } from '../../components/Chart'
import {
  getCurrentDataset,
  getPostById,
  getPosts,
  getPostSnapshots,
  getBucketSnapshots,
} from '../../data/repo'
import { bucketizeContentType } from '../../lib/contentClassification'
import { fmtInt, fmtPct } from '../../lib/format'
import { median } from '../../lib/stats'

const HOURS_RANGE = 168

const FINGERPRINT_FIELDS = [
  { key: 'wordCount', label: 'Words' },
  { key: 'charCount', label: 'Characters' },
  { key: 'sentenceCount', label: 'Sentences' },
  { key: 'emojiCount', label: 'Emojis' },
  { key: 'hashtagCount', label: 'Hashtags' },
  { key: 'mentionCount', label: 'Mentions' },
  { key: 'linkCount', label: 'Links' },
  { key: 'ctaCount', label: 'CTA Phrases' },
]

function formatDate(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString()
}

function formatDateTime(value) {
  if (!value) return 'Unknown'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Unknown'
  const formatter = new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
  return formatter.format(date).replace(',', '')
}

function formatRelative(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const diffMs = Date.now() - date.getTime()
  const hours = Math.floor(diffMs / (60 * 60 * 1000))
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function buildTimelineSeries(post, snapshots, cohortSnapshots) {
  if (!post || !post.createdAt) return { series: null, summary: null }
  const published = new Date(post.createdAt)
  if (Number.isNaN(published.getTime())) return { series: null, summary: null }

  const preparePoint = (snap) => {
    const observed = new Date(snap.observedAt)
    if (Number.isNaN(observed.getTime())) return null
    const hoursSince = Math.max(0, (observed - published) / (60 * 60 * 1000))
    if (hoursSince > HOURS_RANGE) return null
    const engagement = (snap.likes || 0) + (snap.comments || 0) + (snap.reposts || 0)
    return {
      hours: Number(hoursSince.toFixed(1)),
      impressions: snap.impressions || 0,
      engagement,
    }
  }

  const timelinePoints = snapshots
    .map(preparePoint)
    .filter(Boolean)
    .sort((a, b) => a.hours - b.hours)

  const cohortBuckets = new Map()
  cohortSnapshots.forEach((snap) => {
    if (!snap.publishedAt) return
    const publishedAt = new Date(snap.publishedAt)
    const observedAt = new Date(snap.observedAt)
    if (Number.isNaN(publishedAt.getTime()) || Number.isNaN(observedAt.getTime())) return
    const hours = Math.round((observedAt - publishedAt) / (60 * 60 * 1000))
    if (hours < 0 || hours > HOURS_RANGE) return
    const engagement = (snap.likes || 0) + (snap.comments || 0) + (snap.reposts || 0)
    if (!cohortBuckets.has(hours)) {
      cohortBuckets.set(hours, [])
    }
    cohortBuckets.get(hours).push({ impressions: snap.impressions || 0, engagement })
  })

  const cohortPoints = Array.from(cohortBuckets.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([hour, rows]) => ({
      hour,
      impressions: median(rows.map((r) => r.impressions)) || 0,
      engagement: median(rows.map((r) => r.engagement)) || 0,
    }))

  if (timelinePoints.length === 0 && cohortPoints.length === 0) {
    return { series: null, summary: null }
  }

  const series = {
    tooltip: {
      trigger: 'axis',
    },
    legend: {
      data: ['Post Impressions', 'Cohort Impressions', 'Post Engagement', 'Cohort Engagement'],
      textStyle: { color: '#94a3b8' },
    },
    grid: { top: 50, left: 60, right: 60, bottom: 40 },
    xAxis: {
      type: 'value',
      name: 'Hours Since Publish',
      max: HOURS_RANGE,
      axisLabel: { color: '#94a3b8' },
      splitLine: { lineStyle: { color: '#1e293b' } },
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: '#94a3b8' },
      splitLine: { lineStyle: { color: '#1e293b' } },
    },
    series: [
      {
        name: 'Post Impressions',
        type: 'line',
        smooth: true,
        itemStyle: { color: '#38bdf8' },
        data: timelinePoints.map((p) => [p.hours, p.impressions]),
      },
      {
        name: 'Cohort Impressions',
        type: 'line',
        smooth: true,
        itemStyle: { color: '#0ea5e9' },
        lineStyle: { type: 'dashed' },
        data: cohortPoints.map((p) => [p.hour, p.impressions]),
      },
      {
        name: 'Post Engagement',
        type: 'line',
        smooth: true,
        itemStyle: { color: '#f472b6' },
        data: timelinePoints.map((p) => [p.hours, p.engagement]),
      },
      {
        name: 'Cohort Engagement',
        type: 'line',
        smooth: true,
        itemStyle: { color: '#fb7185' },
        lineStyle: { type: 'dashed' },
        data: cohortPoints.map((p) => [p.hour, p.engagement]),
      },
    ],
  }

  const latestPoint = timelinePoints[timelinePoints.length - 1]
  const summary = latestPoint ? {
    impressions: latestPoint.impressions,
    engagement: latestPoint.engagement,
    horizon: latestPoint.hours,
  } : null

  return { series, summary }
}

function aggregateFingerprints(posts) {
  if (!posts.length) return null
  const totals = {}
  posts.forEach((post) => {
    FINGERPRINT_FIELDS.forEach(({ key }) => {
      totals[key] = (totals[key] || 0) + (post[key] || 0)
    })
  })
  const averages = {}
  FINGERPRINT_FIELDS.forEach(({ key }) => {
    averages[key] = totals[key] / posts.length
  })
  return averages
}

function computeEngagementMix(post) {
  const likes = post?.likes || 0
  const comments = post?.comments || 0
  const reposts = post?.reposts || 0
  const total = likes + comments + reposts
  return [
    { label: 'Likes', value: likes, share: total ? likes / total : 0 },
    { label: 'Comments', value: comments, share: total ? comments / total : 0 },
    { label: 'Reposts', value: reposts, share: total ? reposts / total : 0 },
  ]
}

function aggregateEngagementMix(posts) {
  if (!posts.length) return null
  const totals = { likes: 0, comments: 0, reposts: 0 }
  posts.forEach((post) => {
    totals.likes += post.likes || 0
    totals.comments += post.comments || 0
    totals.reposts += post.reposts || 0
  })
  const sum = totals.likes + totals.comments + totals.reposts
  if (!sum) return null
  return [
    { label: 'Likes', share: totals.likes / sum },
    { label: 'Comments', share: totals.comments / sum },
    { label: 'Reposts', share: totals.reposts / sum },
  ]
}

function tokenize(text) {
  if (!text) return []
  return text.toLowerCase().split(/[^\p{L}\d]+/u).filter((token) => token.length > 2)
}

function jaccardScore(aTokens, bTokens) {
  if (!aTokens.length || !bTokens.length) return 0
  const setA = new Set(aTokens)
  const setB = new Set(bTokens)
  let intersection = 0
  setA.forEach((token) => {
    if (setB.has(token)) intersection += 1
  })
  const union = setA.size + setB.size - intersection
  return union ? intersection / union : 0
}

function computeSimilarity(target, candidate) {
  if (target.id === candidate.id) return -Infinity
  const targetBucket = bucketizeContentType(target.contentType || 'Regular')
  const candidateBucket = bucketizeContentType(candidate.contentType || 'Regular')
  if (targetBucket !== candidateBucket) return -Infinity

  const textScore = jaccardScore(tokenize(target.fullText || target.title || ''), tokenize(candidate.fullText || candidate.title || ''))
  const targetWords = target.wordCount || (target.fullText || '').split(/\s+/).length
  const candidateWords = candidate.wordCount || (candidate.fullText || '').split(/\s+/).length
  const lengthDiff = Math.abs(targetWords - candidateWords)
  const lengthScore = 1 - Math.min(lengthDiff / Math.max(targetWords || 1, 1), 1)
  const impressionDiff = Math.abs((target.impressions || 0) - (candidate.impressions || 0))
  const impressionScale = Math.max(target.impressions || 1, 1)
  const performanceScore = 1 - Math.min(impressionDiff / impressionScale, 1)

  return (textScore * 0.6) + (lengthScore * 0.25) + (performanceScore * 0.15)
}

function getTopSimilarPosts(target, candidates, limit = 3) {
  if (!target) return []
  const scored = candidates
    .map((candidate) => ({ candidate, score: computeSimilarity(target, candidate) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
  return scored.slice(0, limit).map((entry) => entry.candidate)
}

export function PostDetailPage() {
  const { postId } = useParams()
  const navigate = useNavigate()
  const [post, setPost] = React.useState(null)
  const [snapshots, setSnapshots] = React.useState([])
  const [cohortSnapshots, setCohortSnapshots] = React.useState([])
  const [peerPosts, setPeerPosts] = React.useState([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    let cancelled = false
    ;(async () => {
      const currentDataset = await getCurrentDataset()
      if (!currentDataset) {
        navigate('/upload', { replace: true })
        return
      }
      const [postRecord, allPosts] = await Promise.all([
        getPostById(postId),
        getPosts(currentDataset.id),
      ])
      if (!postRecord || postRecord.datasetId !== currentDataset.id) {
        navigate('/content', { replace: true })
        return
      }

      const bucket = bucketizeContentType(postRecord.contentType || 'Regular')
      const [postHistory, bucketHistory] = await Promise.all([
        getPostSnapshots(postRecord.activityId),
        getBucketSnapshots(bucket, 750),
      ])

      if (!cancelled) {
        setPost(postRecord)
        setPeerPosts(allPosts)
        setSnapshots(postHistory)
        setCohortSnapshots(bucketHistory)
        setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [postId, navigate])

  if (loading) {
    return <div className="text-slate-300">Loading post…</div>
  }

  if (!post) {
    return <div className="text-red-400">Post not found.</div>
  }

  const bucket = bucketizeContentType(post.contentType || 'Regular')
  const bucketPeers = peerPosts.filter((p) => bucketizeContentType(p.contentType || 'Regular') === bucket)
  const fingerprintBenchmarks = aggregateFingerprints(bucketPeers)
  const engagementMix = computeEngagementMix(post)
  const cohortMix = aggregateEngagementMix(bucketPeers)
  const similarPosts = getTopSimilarPosts(post, bucketPeers)
  const timeline = buildTimelineSeries(post, snapshots, cohortSnapshots)
  const displayText = (post.fullText && post.fullText.trim()) || post.title || '(untitled post)'

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <button className="text-slate-400 hover:text-white text-sm" onClick={() => navigate(-1)}>&larr; Back</button>
        <div className="flex-1">
          <div className="text-sm uppercase tracking-wide text-slate-500">{bucket}</div>
          <h1 className="text-2xl font-semibold text-slate-100">Post Detail</h1>
          <div className="text-sm text-slate-400 space-x-2">
            <span>{formatDateTime(post.createdAt)}</span>
            <span>{formatRelative(post.createdAt)}</span>
          </div>
        </div>
        {post.link && (
          <a
            href={post.link}
            target="_blank"
            rel="noreferrer"
            className="text-sky-400 text-sm border border-sky-500 px-3 py-1 rounded hover:bg-sky-500/10"
          >
            View on LinkedIn →
          </a>
        )}
      </div>

      {displayText && (
        <section className="rounded border border-slate-800 p-4">
          <h3 className="font-medium text-slate-200 mb-2">Post Text</h3>
          <p className="whitespace-pre-line text-slate-300 leading-relaxed">{displayText}</p>
        </section>
      )}

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Impressions', value: fmtInt(post.impressions || 0) },
          { label: 'Engagement Rate', value: fmtPct(post.engagementRate) },
          { label: 'Engagements', value: fmtInt((post.likes || 0) + (post.comments || 0) + (post.reposts || 0)) },
        ].map((card) => (
          <div key={card.label} className="rounded border border-slate-800 p-4">
            <div className="text-sm text-slate-400">{card.label}</div>
            <div className="text-2xl font-semibold text-slate-100">{card.value}</div>
          </div>
        ))}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-medium">Timeline vs Cohort</h3>
          {timeline.summary && (
            <div className="text-sm text-slate-400">
              {fmtInt(timeline.summary.impressions)} impressions over {timeline.summary.horizon.toFixed(1)}h
            </div>
          )}
        </div>
        {timeline.series ? (
          <Chart option={timeline.series} />
        ) : (
          <div className="text-sm text-slate-400 border border-dashed border-slate-700 rounded p-4">
            Not enough history yet to chart this post. Upload another export to build the timeline.
          </div>
        )}
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded border border-slate-800 p-4 space-y-3">
          <h3 className="font-medium">Format Fingerprints</h3>
          <div className="grid grid-cols-2 gap-3">
            {FINGERPRINT_FIELDS.map(({ key, label }) => (
              <div key={key} className="bg-slate-900/40 rounded p-3">
                <div className="text-xs text-slate-500">{label}</div>
                <div className="text-xl font-semibold text-slate-100">{fmtInt(post[key] || 0)}</div>
                {fingerprintBenchmarks && (
                  <div className="text-xs text-slate-400">Avg {label.toLowerCase()}: {fmtInt(Math.round(fingerprintBenchmarks[key] || 0))}</div>
                )}
              </div>
            ))}
          </div>
          <div className="text-sm text-slate-400">
            Media: {post.hasMedia ? 'Contains rich media' : 'Text / link only'}
          </div>
        </div>

        <div className="rounded border border-slate-800 p-4 space-y-3">
          <h3 className="font-medium">Engagement Mix</h3>
          <div className="space-y-2">
            {engagementMix.map((slice) => (
              <div key={slice.label} className="flex items-center gap-3">
                <div className="w-24 text-sm text-slate-400">{slice.label}</div>
                <div className="flex-1 h-2 rounded bg-slate-800 overflow-hidden">
                  <div
                    className="h-2 bg-sky-500"
                    style={{ width: `${(slice.share * 100).toFixed(1)}%` }}
                  />
                </div>
                <div className="text-sm text-slate-200 w-16 text-right">{fmtPct(slice.share)}</div>
              </div>
            ))}
          </div>
          {cohortMix && (
            <div className="text-xs text-slate-400">Cohort avg — Likes {fmtPct(cohortMix[0].share)}, Comments {fmtPct(cohortMix[1].share)}, Reposts {fmtPct(cohortMix[2].share)}</div>
          )}
        </div>
      </section>

      <section className="rounded border border-slate-800 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-medium">Historical Twins</h3>
          <Link to="/content" className="text-sm text-slate-400 hover:text-white">View all content →</Link>
        </div>
        {similarPosts.length ? (
          <div className="divide-y divide-slate-800 border border-slate-800 rounded">
            {similarPosts.map((p) => (
              <div key={p.id} className="px-3 py-2">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                  <div className="flex-1 min-w-0">
                    <Link to={`/posts/${p.id}`} className="text-sky-400 hover:underline truncate block">
                      {p.title || '(untitled)'}
                    </Link>
                    <div className="text-xs text-slate-500">
                      {formatDate(p.createdAt)} • {bucketizeContentType(p.contentType || 'Regular')}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-slate-300 sm:min-w-[160px]">
                    <span className="text-slate-200 whitespace-nowrap">{fmtInt(p.impressions || 0)} impr</span>
                    <span className="text-slate-400 whitespace-nowrap">{fmtPct(p.engagementRate)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-slate-400">No close matches yet. Add more posts to build a richer history.</div>
        )}
      </section>
    </div>
  )
}
