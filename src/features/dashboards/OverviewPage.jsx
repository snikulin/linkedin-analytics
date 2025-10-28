import React from 'react'
import { getCurrentDataset, getPosts, getDaily, getDatasetFreshness } from '../../data/repo'
import { median } from '../../lib/stats'
import { fmtInt, fmtPct } from '../../lib/format'
import { Chart } from '../../components/Chart'
import { useSearchParams } from 'react-router-dom'

const TIME_PERIODS = {
  '7d': { label: '7 days', days: 7 },
  '14d': { label: '14 days', days: 14 },
  '30d': { label: '30 days', days: 30 },
  '90d': { label: '90 days', days: 90 },
  'all': { label: 'All time', days: null }
}

const DAY_MS = 24 * 60 * 60 * 1000

function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <h3 className="text-lg font-medium">{title}</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 text-2xl leading-none"
          >
            ×
          </button>
        </div>
        <div className="p-4">
          {children}
        </div>
      </div>
    </div>
  )
}

function DrillDownModal({ isOpen, onClose, metric, posts, timePeriod }) {
  if (!isOpen || !metric) return null

  const getMetricData = () => {
    switch (metric.type) {
      case 'impressions':
        return {
          title: 'Impressions Breakdown',
          data: posts.map(p => ({
            title: p.title || '(untitled)',
            value: p.impressions || 0,
            date: p.createdAt,
            link: p.link
          })).sort((a, b) => b.value - a.value)
        }
      case 'posts':
        return {
          title: 'Posts Details',
          data: posts.map(p => ({
            title: p.title || '(untitled)',
            value: `${fmtInt(p.impressions)} impressions`,
            date: p.createdAt,
            link: p.link,
            engagement: (p.likes || 0) + (p.comments || 0) + (p.reposts || 0)
          })).sort((a, b) => new Date(b.date) - new Date(a.date))
        }
      case 'engagement':
        return {
          title: 'Engagement Breakdown',
          data: posts.map(p => ({
            title: p.title || '(untitled)',
            value: fmtPct(p.engagementRate),
            date: p.createdAt,
            link: p.link,
            details: `${fmtInt(p.likes)} likes, ${fmtInt(p.comments)} comments, ${fmtInt(p.reposts)} reposts`
          })).filter(p => p.value !== '—').sort((a, b) => (b.value?.replace('%', '') || 0) - (a.value?.replace('%', '') || 0))
        }
      default:
        return { title: 'Details', data: [] }
    }
  }

  const { title, data } = getMetricData()

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-4">
        <div className="text-sm text-slate-400">
          Showing {data.length} items for {TIME_PERIODS[timePeriod]?.label.toLowerCase()}
        </div>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {data.map((item, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded bg-slate-900/50">
              <div className="flex-grow min-w-0">
                <div className="font-medium text-sm truncate">
                  {item.link ? (
                    <a href={item.link} target="_blank" rel="noreferrer" className="text-sky-400 hover:underline">
                      {item.title}
                    </a>
                  ) : (
                    item.title
                  )}
                </div>
                {item.date && (
                  <div className="text-xs text-slate-400 mt-1">
                    {new Date(item.date).toLocaleDateString()}
                  </div>
                )}
                {item.details && (
                  <div className="text-xs text-slate-400 mt-1">
                    {item.details}
                  </div>
                )}
              </div>
              <div className="text-sm font-semibold text-right ml-4">
                {item.value}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  )
}


function AdvancedRecommendations({ posts, metrics, timePeriod }) {
  const generateRecommendations = () => {
    const recommendations = []
    
    // Posting frequency analysis
    const days = TIME_PERIODS[timePeriod]?.days || 365
    const postsPerDay = (metrics.postsCount || 0) / days
    
    if (postsPerDay < 0.2) { // Less than 1 post per 5 days
      recommendations.push({
        type: 'frequency',
        icon: '📅',
        title: 'Increase Posting Frequency',
        description: `You're posting ${(postsPerDay * 7).toFixed(1)} times per week. Consider posting 3-5 times per week for better engagement.`,
        priority: 'high'
      })
    }
    
    // Engagement rate analysis
    if (metrics.medER && metrics.medER < 0.02) {
      recommendations.push({
        type: 'engagement',
        icon: '💬',
        title: 'Improve Engagement Rate',
        description: 'Your median engagement rate is below 2%. Try asking questions, using polls, or sharing personal insights.',
        priority: 'high'
      })
    }
    
    // Content type analysis
    const contentTypes = posts.reduce((acc, post) => {
      const hasLink = post.link && post.link.trim() !== ''
      const type = hasLink ? 'with-link' : 'text-only'
      if (!acc[type]) acc[type] = { count: 0, totalImpr: 0 }
      acc[type].count++
      acc[type].totalImpr += post.impressions || 0
      return acc
    }, {})
    
    if (contentTypes['with-link'] && contentTypes['text-only']) {
      const linkAvg = contentTypes['with-link'].totalImpr / contentTypes['with-link'].count
      const textAvg = contentTypes['text-only'].totalImpr / contentTypes['text-only'].count
      
      if (linkAvg > textAvg * 1.5) {
        recommendations.push({
          type: 'content',
          icon: '🔗',
          title: 'Add More Links to Posts',
          description: 'Posts with links perform 50% better on average. Consider sharing relevant articles or resources.',
          priority: 'medium'
        })
      }
    }
    
    // Best performing post analysis
    const bestPost = posts.reduce((best, post) => 
      (post.impressions || 0) > (best.impressions || 0) ? post : best, posts[0])
    
    if (bestPost && bestPost.impressions > (metrics.avgImprPerPost * 2)) {
      const descriptionText = `Your best post got ${fmtInt(bestPost.impressions)} impressions (2x your average).`
      const actionText = `Analyze what made it successful.`
      
      recommendations.push({
        type: 'content',
        icon: '🔥',
        title: 'Replicate Top Content',
        description: descriptionText,
        actionText: actionText,
        priority: 'medium',
        post: bestPost
      })
    }
    
    // Time-based recommendations
    if (timePeriod !== 'all' && metrics.postsCount > 0) {
      const avgImpr = metrics.avgImprPerPost
      if (avgImpr > 1000) {
        recommendations.push({
          type: 'growth',
          icon: '🚀',
          title: 'Scale Your Content',
          description: `Strong performance with ${fmtInt(avgImpr)} avg impressions per post. Consider posting more frequently.`,
          priority: 'low'
        })
      }
    }
    
    return recommendations
  }

  const recommendations = generateRecommendations()
  
  if (recommendations.length === 0) {
    return (
      <div className="rounded border border-slate-800 p-4">
        <h3 className="font-medium mb-3">Performance Recommendations</h3>
        <div className="text-sm text-slate-400">
          Great job! Your content strategy looks solid. Keep up the good work!
        </div>
      </div>
    )
  }

  return (
    <div className="rounded border border-slate-800 p-4">
      <h3 className="font-medium mb-3">Performance Recommendations</h3>
      <div className="space-y-3">
        {recommendations.map((rec, i) => (
          <div key={i} className={`p-3 rounded border-l-4 ${
            rec.priority === 'high' ? 'border-red-400 bg-red-950/20' :
            rec.priority === 'medium' ? 'border-yellow-400 bg-yellow-950/20' :
            'border-green-400 bg-green-950/20'
          }`}>
            <div className="flex items-start space-x-3">
              <span className="text-lg flex-shrink-0">{rec.icon}</span>
              <div>
                <div className="font-medium text-sm mb-1">{rec.title}</div>
                <div className="text-sm text-slate-300">
                  {rec.post && rec.post.link ? (
                    <>
                      <a 
                        href={rec.post.link} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="text-sky-400 hover:underline"
                      >
                        {rec.description}
                      </a>
                      {rec.actionText && <span> {rec.actionText}</span>}
                    </>
                  ) : (
                    <>
                      {rec.description}
                      {rec.actionText && <span> {rec.actionText}</span>}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function MetricCard({ title, value, change, trend, icon, onClick, drillDownType }) {
  const isClickable = onClick && drillDownType
  
  return (
    <div 
      className={`rounded border border-slate-800 p-3 sm:p-4 space-y-2 touch-manipulation transition-all ${
        isClickable ? 'hover:border-slate-600 hover:bg-slate-800/50 cursor-pointer active:scale-95' : ''
      }`}
      onClick={isClickable ? () => onClick(drillDownType) : undefined}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs sm:text-sm text-slate-400 leading-tight">{title}</span>
        <div className="flex items-center space-x-1">
          {icon && <span className="text-slate-500 text-sm sm:text-base">{icon}</span>}
          {isClickable && <span className="text-slate-500 text-xs">🔍</span>}
        </div>
      </div>
      <div className="text-lg sm:text-xl font-semibold">{value}</div>
      {change !== null && change !== undefined && (
        <div className={`flex items-center text-xs sm:text-sm ${
          trend === 'up' ? 'text-green-400' : 
          trend === 'down' ? 'text-red-400' : 'text-slate-400'
        }`}>
          {trend === 'up' && '↗'}
          {trend === 'down' && '↘'}
          {trend === 'neutral' && '→'}
          <span className="ml-1">{change}</span>
        </div>
      )}
    </div>
  )
}

function TimePeriodSelector({ period, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      <span className="text-sm text-slate-400 self-center hidden sm:block">Period:</span>
      {Object.entries(TIME_PERIODS).map(([key, { label }]) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className={`px-2 sm:px-3 py-1 rounded text-xs sm:text-sm touch-manipulation ${
            period === key
              ? 'bg-slate-600 text-white'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-300 active:bg-slate-700'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

function QuickInsights({ insights }) {
  if (!insights || insights.length === 0) return null
  
  return (
    <div className="rounded border border-slate-800 p-4">
      <h3 className="font-medium mb-3">Quick Insights</h3>
      <div className="space-y-2">
        {insights.map((insight, i) => (
          <div key={i} className="text-sm text-slate-300 flex items-center">
            <span className="text-blue-400 mr-2">•</span>
            {insight}
          </div>
        ))}
      </div>
    </div>
  )
}


function RecentActivityFeed({ posts }) {
  const [searchTerm, setSearchTerm] = React.useState('')
  const [showAll, setShowAll] = React.useState(false)
  
  const filteredPosts = posts
    .filter(post => post.createdAt)
    .filter(post => {
      if (!searchTerm) return true
      const title = (post.title || '').toLowerCase()
      return title.includes(searchTerm.toLowerCase())
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  
  const displayPosts = showAll ? filteredPosts : filteredPosts.slice(0, 5)
  const hasMore = filteredPosts.length > 5

  if (posts.length === 0) return null

  const formatDate = (dateStr) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffTime = Math.abs(now - date)
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
    return date.toLocaleDateString()
  }

  const getPerformanceIndicator = (post) => {
    const impressions = post.impressions || 0
    const engagement = (post.likes || 0) + (post.comments || 0) + (post.reposts || 0)
    
    if (impressions > 2000) return { icon: '🔥', label: 'Hot', color: 'text-red-400' }
    if (impressions > 1000) return { icon: '📈', label: 'Strong', color: 'text-green-400' }
    if (engagement > 50) return { icon: '💬', label: 'Engaging', color: 'text-blue-400' }
    if (impressions > 500) return { icon: '👍', label: 'Good', color: 'text-yellow-400' }
    return { icon: '📊', label: 'Normal', color: 'text-slate-400' }
  }

  return (
    <div className="rounded border border-slate-800 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium">Recent Activity</h3>
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Search posts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-3 py-1 rounded text-sm bg-slate-900 border border-slate-700 text-slate-200 placeholder-slate-400 focus:border-slate-500 focus:outline-none w-32 sm:w-40"
          />
          {hasMore && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="px-2 py-1 rounded text-xs bg-slate-700 hover:bg-slate-600 text-slate-300"
            >
              {showAll ? 'Show Less' : `+${filteredPosts.length - 5}`}
            </button>
          )}
        </div>
      </div>
      {displayPosts.length === 0 ? (
        <div className="text-sm text-slate-400 text-center py-4">
          {searchTerm ? 'No posts match your search' : 'No recent posts'}
        </div>
      ) : (
        <div className="space-y-3">
          {displayPosts.map((post, i) => {
          const perf = getPerformanceIndicator(post)
          return (
            <div key={i} className="flex items-start space-x-3 p-3 rounded bg-slate-900/50 hover:bg-slate-900/70 active:bg-slate-900/80 transition-colors touch-manipulation">
              <div className="flex-shrink-0">
                <span className="text-base sm:text-lg">{perf.icon}</span>
              </div>
              <div className="flex-grow min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-slate-400">{formatDate(post.createdAt)}</span>
                  <span className={`text-xs ${perf.color}`}>{perf.label}</span>
                </div>
                <p className="text-sm text-slate-200 line-clamp-2 sm:truncate mb-2">
                  {post.link ? (
                    <a href={post.link} target="_blank" rel="noreferrer" className="text-sky-400 hover:underline active:text-sky-300">
                      {post.title || '(untitled)'}
                    </a>
                  ) : (
                    post.title || '(untitled)'
                  )}
                </p>
                <div className="flex items-center space-x-2 sm:space-x-4 text-xs text-slate-400 flex-wrap">
                  <span>👁 {fmtInt(post.impressions)}</span>
                  <span>❤️ {fmtInt(post.likes)}</span>
                  <span>💬 {fmtInt(post.comments)}</span>
                  <span>🔄 {fmtInt(post.reposts)}</span>
                </div>
              </div>
            </div>
          )
          })}
        </div>
      )}
    </div>
  )
}

export function OverviewPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [metrics, setMetrics] = React.useState(null)
  const [previousMetrics, setPreviousMetrics] = React.useState(null)
  const [series, setSeries] = React.useState(null)
  const [insights, setInsights] = React.useState([])
  const [posts, setPosts] = React.useState([])
  const [drillDownModal, setDrillDownModal] = React.useState({ isOpen: false, metric: null })
  const [freshness, setFreshness] = React.useState(null)
  
  const timePeriod = searchParams.get('period') || '30d'

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

  const getCutoffDate = React.useCallback((period, refDate) => {
    if (period === 'all') return null
    const config = TIME_PERIODS[period]
    if (!config?.days) return null
    const reference = refDate ? new Date(refDate) : getReferenceDate()
    return new Date(reference.getTime() - config.days * DAY_MS)
  }, [getReferenceDate])

  const filterDataByPeriod = React.useCallback((data, period, dateField = 'date', refDate) => {
    const reference = refDate ? new Date(refDate) : getReferenceDate()
    const cutoff = getCutoffDate(period, reference)
    if (!cutoff) return data
    return data.filter(item => {
      const value = item[dateField]
      if (!value) return false
      const date = new Date(value)
      if (Number.isNaN(date.getTime())) return false
      return date >= cutoff && date <= reference
    })
  }, [getCutoffDate, getReferenceDate])

  const calculateMetrics = React.useCallback((posts, daily, period, refDate) => {
    const filteredPosts = filterDataByPeriod(posts, period, 'createdAt', refDate)
    const filteredDaily = filterDataByPeriod(daily, period, 'date', refDate)
    
    const postsCount = filteredPosts.length
    const impressions = filteredPosts.reduce((acc, p) => acc + (p.impressions || 0), 0)
    const likes = filteredPosts.reduce((acc, p) => acc + (p.likes || 0), 0)
    const comments = filteredPosts.reduce((acc, p) => acc + (p.comments || 0), 0)
    const reposts = filteredPosts.reduce((acc, p) => acc + (p.reposts || 0), 0)
    const ers = filteredPosts.map((p) => p.engagementRate).filter((v) => typeof v === 'number')
    const medER = median(ers)
    const avgImprPerPost = postsCount > 0 ? impressions / postsCount : 0
    
    return { postsCount, impressions, likes, comments, reposts, medER, avgImprPerPost }
  }, [filterDataByPeriod])

  const generateInsights = React.useCallback((current, previous, posts) => {
    const insights = []
    
    if (previous) {
      if (current.impressions > previous.impressions) {
        const growth = ((current.impressions - previous.impressions) / previous.impressions * 100).toFixed(1)
        insights.push(`Impressions increased by ${growth}% vs previous period`)
      }
      if (current.medER > previous.medER && previous.medER > 0) {
        insights.push(`Engagement rate is trending upward`)
      }
    }
    
    if (current.avgImprPerPost > 1000) {
      insights.push(`Strong average of ${fmtInt(current.avgImprPerPost)} impressions per post`)
    }
    
    const bestPost = posts.reduce((best, post) => 
      (post.impressions || 0) > (best.impressions || 0) ? post : best, posts[0])
    if (bestPost && bestPost.impressions > 500) {
      insights.push(`Top post reached ${fmtInt(bestPost.impressions)} impressions`)
    }
    
    if (current.postsCount === 0) {
      insights.push(`No posts in selected time period`)
    } else if (current.postsCount === 1) {
      insights.push(`Only 1 post in selected period - consider posting more frequently`)
    }
    
    return insights
  }, [])

  React.useEffect(() => {
    (async () => {
      const ds = await getCurrentDataset()
      if (!ds) return
      const [postsData, dailyData, freshnessInfo] = await Promise.all([
        getPosts(ds.id),
        getDaily(ds.id),
        getDatasetFreshness(ds.id),
      ])

      setFreshness(freshnessInfo)

      const reference = freshnessInfo?.date
        ? new Date(freshnessInfo.date)
        : (referenceDate ? new Date(referenceDate) : new Date())

      const currentMetrics = calculateMetrics(postsData, dailyData, timePeriod, reference)
      setMetrics(currentMetrics)

      const currentDays = TIME_PERIODS[timePeriod]?.days
      let comparisonMetrics = previousMetrics
      if (currentDays) {
        const currentStart = getCutoffDate(timePeriod, reference)
        if (currentStart) {
          const previousStart = new Date(currentStart.getTime() - currentDays * DAY_MS)

          const previousPosts = postsData.filter((p) => {
            if (!p.createdAt) return false
            const date = new Date(p.createdAt)
            if (Number.isNaN(date.getTime())) return false
            return date >= previousStart && date < currentStart
          })

          const previousDaily = dailyData.filter((d) => {
            if (!d.date) return false
            const date = new Date(d.date)
            if (Number.isNaN(date.getTime())) return false
            return date >= previousStart && date < currentStart
          })

          const prevMetrics = calculateMetrics(previousPosts, previousDaily, 'all', reference)
          setPreviousMetrics(prevMetrics)
          comparisonMetrics = prevMetrics
        } else {
          setPreviousMetrics(null)
          comparisonMetrics = null
        }
      } else {
        setPreviousMetrics(null)
        comparisonMetrics = null
      }

      const filteredPosts = filterDataByPeriod(postsData, timePeriod, 'createdAt', reference)
      const newInsights = generateInsights(currentMetrics, comparisonMetrics, filteredPosts)
      setInsights(newInsights)
      setPosts(filteredPosts)

      const filteredDaily = filterDataByPeriod(dailyData, timePeriod, 'date', reference)
      const sorted = filteredDaily
        .filter((d) => d.date)
        .slice()
        .sort((a, b) => new Date(a.date) - new Date(b.date))
      const x = sorted.map((d) => d.date?.slice(0, 10))
      const imp = sorted.map((d) => d.impressions || 0)
      const er = sorted.map((d) => (d.engagementRate != null ? +(d.engagementRate * 100).toFixed(2) : null))
      setSeries({ x, imp, er })
    })()
  }, [timePeriod, calculateMetrics, filterDataByPeriod, generateInsights, previousMetrics, referenceDate, getCutoffDate])

  const getChangeInfo = (current, previous) => {
    if (!previous || previous === 0) return { change: null, trend: 'neutral' }
    const diff = current - previous
    const pctChange = (diff / previous * 100).toFixed(1)
    const change = `${diff > 0 ? '+' : ''}${pctChange}%`
    const trend = diff > 0 ? 'up' : diff < 0 ? 'down' : 'neutral'
    return { change, trend }
  }

  const handleDrillDown = (metricType) => {
    setDrillDownModal({ isOpen: true, metric: { type: metricType } })
  }

  const closeDrillDown = () => {
    setDrillDownModal({ isOpen: false, metric: null })
  }

  return (
    <div className="space-y-4 sm:space-y-6 overview-dashboard">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-lg font-medium">Overview</h2>
        <TimePeriodSelector period={timePeriod} onChange={(period) => {
          const newParams = new URLSearchParams(searchParams)
          if (period === '30d') {
            newParams.delete('period')
          } else {
            newParams.set('period', period)
          }
          setSearchParams(newParams)
        }} />
      </div>
      {freshness?.display && (
        <p className="text-xs text-slate-500">
          Data current through {freshness.display}.
        </p>
      )}
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <MetricCard
          title="Total Impressions"
          value={fmtInt(metrics?.impressions)}
          icon="👁"
          onClick={handleDrillDown}
          drillDownType="impressions"
          {...getChangeInfo(metrics?.impressions || 0, previousMetrics?.impressions || 0)}
        />
        <MetricCard
          title="Posts Published"
          value={fmtInt(metrics?.postsCount)}
          icon="📝"
          onClick={handleDrillDown}
          drillDownType="posts"
          {...getChangeInfo(metrics?.postsCount || 0, previousMetrics?.postsCount || 0)}
        />
        <MetricCard
          title="Median Engagement Rate"
          value={fmtPct(metrics?.medER)}
          icon="📊"
          onClick={handleDrillDown}
          drillDownType="engagement"
          {...getChangeInfo(metrics?.medER || 0, previousMetrics?.medER || 0)}
        />
        <MetricCard
          title="Avg. Impressions/Post"
          value={fmtInt(metrics?.avgImprPerPost)}
          icon="⚡"
          {...getChangeInfo(metrics?.avgImprPerPost || 0, previousMetrics?.avgImprPerPost || 0)}
        />
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <MetricCard
          title="Total Likes"
          value={fmtInt(metrics?.likes)}
          icon="❤️"
          {...getChangeInfo(metrics?.likes || 0, previousMetrics?.likes || 0)}
        />
        <MetricCard
          title="Total Comments"
          value={fmtInt(metrics?.comments)}
          icon="💬"
          {...getChangeInfo(metrics?.comments || 0, previousMetrics?.comments || 0)}
        />
        <MetricCard
          title="Total Reposts"
          value={fmtInt(metrics?.reposts)}
          icon="🔄"
          {...getChangeInfo(metrics?.reposts || 0, previousMetrics?.reposts || 0)}
        />
      </div>
      
      <RecentActivityFeed posts={posts} />
      
      <QuickInsights insights={insights} />
      
      <AdvancedRecommendations posts={posts} metrics={metrics || {}} timePeriod={timePeriod} />
      
      {series && series.x.length > 0 && (
        <div className="rounded border border-slate-800 p-4">
          <h3 className="font-medium mb-3">Performance Trends</h3>
          <Chart
            option={{
              backgroundColor: 'transparent',
              tooltip: { 
                trigger: 'axis',
                backgroundColor: '#1f2937',
                borderColor: '#374151',
                textStyle: { color: '#f3f4f6' }
              },
              legend: { data: ['Impressions', 'ER %'], textStyle: { color: '#cbd5e1' } },
              grid: { left: 50, right: 60, top: 40, bottom: 40 },
              xAxis: { 
                type: 'category', 
                data: series.x, 
                axisLabel: { color: '#94a3b8', rotate: series.x.length > 10 ? 45 : 0 },
                axisTick: { alignWithLabel: true }
              },
              yAxis: [
                { type: 'value', name: 'Impressions', axisLabel: { color: '#94a3b8' }, splitLine: { lineStyle: { color: '#1f2937' } } },
                { type: 'value', name: 'ER %', axisLabel: { color: '#94a3b8' }, splitLine: { show: false } },
              ],
              series: [
                { 
                  name: 'Impressions', 
                  type: 'line', 
                  data: series.imp, 
                  smooth: true,
                  lineStyle: { width: 2 },
                  itemStyle: { color: '#3b82f6' }
                },
                { 
                  name: 'ER %', 
                  type: 'line', 
                  yAxisIndex: 1, 
                  data: series.er, 
                  smooth: true,
                  lineStyle: { width: 2 },
                  itemStyle: { color: '#10b981' }
                },
              ],
            }}
          />
        </div>
      )}
      
      <DrillDownModal
        isOpen={drillDownModal.isOpen}
        onClose={closeDrillDown}
        metric={drillDownModal.metric}
        posts={posts}
        timePeriod={timePeriod}
      />
    </div>
  )
}
