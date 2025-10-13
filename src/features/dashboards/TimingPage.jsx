import React from 'react'
import { getCurrentDataset, getDaily, getPosts, getDatasetFreshness } from '../../data/repo'
import { groupBy, toArray } from '../../lib/group'
import { dayOfWeekIndex, dayOfWeekLabel } from '../../lib/dates'
import { median } from '../../lib/stats'
import { fmtInt, fmtPct } from '../../lib/format'
import { Chart } from '../../components/Chart'
import { deriveContentType } from '../../lib/contentClassification'

function PerformanceInsightCard({ title, value, subtitle, icon, color = 'text-slate-300' }) {
  return (
    <div className="rounded border border-slate-800 p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">{icon}</span>
        <span className="text-sm font-medium text-slate-400">{title}</span>
      </div>
      <div className={`text-lg font-semibold ${color}`}>{value}</div>
      {subtitle && <div className="text-sm text-slate-400 mt-1">{subtitle}</div>}
    </div>
  )
}

function WeekdayWeekendComparison({ weekdayStats, weekendStats }) {
  if (!weekdayStats.count && !weekendStats.count) return null
  
  return (
    <div className="rounded border border-slate-800 p-4">
      <h3 className="font-medium mb-3">Weekday vs Weekend Performance</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-sm text-slate-400 mb-1">Weekdays (Mon-Fri)</div>
          <div className="text-lg font-semibold">{fmtPct(weekdayStats.medianER)}</div>
          <div className="text-xs text-slate-500">{weekdayStats.count} posts • {fmtInt(weekdayStats.medianImpr)} avg impressions</div>
        </div>
        <div>
          <div className="text-sm text-slate-400 mb-1">Weekends (Sat-Sun)</div>
          <div className="text-lg font-semibold">{fmtPct(weekendStats.medianER)}</div>
          <div className="text-xs text-slate-500">{weekendStats.count} posts • {fmtInt(weekendStats.medianImpr)} avg impressions</div>
        </div>
      </div>
      {weekdayStats.count > 0 && weekendStats.count > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-700">
          <div className="text-sm text-slate-300">
            {weekdayStats.medianER > weekendStats.medianER ? (
              <span>📈 Weekdays perform {(((weekdayStats.medianER / weekendStats.medianER) - 1) * 100).toFixed(1)}% better for engagement</span>
            ) : weekendStats.medianER > weekdayStats.medianER ? (
              <span>🎯 Weekends perform {(((weekendStats.medianER / weekdayStats.medianER) - 1) * 100).toFixed(1)}% better for engagement</span>
            ) : (
              <span>⚖️ Similar performance between weekdays and weekends</span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function ContentTypeAnalysis({ posts }) {
  const analyzeContentLength = (post) => {
    const length = (post.title || '').length
    if (length > 1000) return 'Very Long (1000+)'
    if (length > 500) return 'Long (500-1000)'
    if (length > 200) return 'Medium (200-500)'
    return 'Short (<200)'
  }

  const analyzeEmojiUsage = (post) => {
    const title = post.title || ''
    const emojiCount = (title.match(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu) || []).length
    
    if (emojiCount >= 5) return 'Heavy (5+)'
    if (emojiCount >= 3) return 'Moderate (3-4)'
    if (emojiCount >= 1) return 'Light (1-2)'
    return 'None'
  }

  const contentTypeStats = React.useMemo(() => {
    const stats = {}
    
    posts.forEach(post => {
      const type = deriveContentType(post)
      if (!stats[type]) {
        stats[type] = { count: 0, totalImpressions: 0, totalER: 0, validER: 0 }
      }
      stats[type].count++
      stats[type].totalImpressions += post.impressions || 0
      if (post.engagementRate != null) {
        stats[type].totalER += post.engagementRate
        stats[type].validER++
      }
    })

    return Object.entries(stats)
      .map(([type, data]) => ({
        type,
        count: data.count,
        avgImpressions: data.totalImpressions / data.count,
        avgER: data.validER > 0 ? data.totalER / data.validER : null,
        share: (data.count / posts.length * 100).toFixed(1)
      }))
      .sort((a, b) => b.avgImpressions - a.avgImpressions)
  }, [posts])

  const lengthStats = React.useMemo(() => {
    const stats = {}
    
    posts.forEach(post => {
      const length = analyzeContentLength(post)
      if (!stats[length]) {
        stats[length] = { count: 0, totalImpressions: 0, totalER: 0, validER: 0 }
      }
      stats[length].count++
      stats[length].totalImpressions += post.impressions || 0
      if (post.engagementRate != null) {
        stats[length].totalER += post.engagementRate
        stats[length].validER++
      }
    })

    return Object.entries(stats)
      .map(([length, data]) => ({
        length,
        count: data.count,
        avgImpressions: data.totalImpressions / data.count,
        avgER: data.validER > 0 ? data.totalER / data.validER : null
      }))
      .sort((a, b) => b.avgImpressions - a.avgImpressions)
  }, [posts])

  const emojiStats = React.useMemo(() => {
    const stats = {}
    
    posts.forEach(post => {
      const usage = analyzeEmojiUsage(post)
      if (!stats[usage]) {
        stats[usage] = { count: 0, totalImpressions: 0, totalER: 0, validER: 0 }
      }
      stats[usage].count++
      stats[usage].totalImpressions += post.impressions || 0
      if (post.engagementRate != null) {
        stats[usage].totalER += post.engagementRate
        stats[usage].validER++
      }
    })

    return Object.entries(stats)
      .map(([usage, data]) => ({
        usage,
        count: data.count,
        avgImpressions: data.totalImpressions / data.count,
        avgER: data.validER > 0 ? data.totalER / data.validER : null
      }))
      .sort((a, b) => b.avgImpressions - a.avgImpressions)
  }, [posts])

  if (posts.length === 0) return null

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">Content Intelligence</h3>
      
      {/* Content Type Analysis */}
      <div className="rounded border border-slate-800 p-4">
        <h4 className="font-medium mb-3">Performance by Content Type</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-900">
              <tr>
                <th className="text-left px-3 py-2">Content Type</th>
                <th className="text-right px-3 py-2">Posts</th>
                <th className="text-right px-3 py-2">Share</th>
                <th className="text-right px-3 py-2">Avg Impressions</th>
                <th className="text-right px-3 py-2">Avg ER</th>
                <th className="text-left px-3 py-2">Insight</th>
              </tr>
            </thead>
            <tbody>
              {contentTypeStats.map((stat, i) => {
                const isTopPerformer = i === 0 && contentTypeStats.length > 1
                const insight = isTopPerformer 
                  ? '🏆 Best performer' 
                  : stat.avgER > (contentTypeStats[0]?.avgER * 0.8) 
                    ? '📈 Strong type' 
                    : '📊 Consider optimizing'
                
                return (
                  <tr key={stat.type} className="border-t border-slate-700">
                    <td className="px-3 py-2 font-medium">{stat.type}</td>
                    <td className="px-3 py-2 text-right">{stat.count}</td>
                    <td className="px-3 py-2 text-right text-slate-400">{stat.share}%</td>
                    <td className="px-3 py-2 text-right">{fmtInt(stat.avgImpressions)}</td>
                    <td className="px-3 py-2 text-right">{fmtPct(stat.avgER)}</td>
                    <td className="px-3 py-2 text-sm text-slate-300">{insight}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Content Length Analysis */}
      <div className="rounded border border-slate-800 p-4">
        <h4 className="font-medium mb-3">Performance by Content Length</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {lengthStats.map((stat) => (
            <div key={stat.length} className="bg-slate-900/50 rounded p-3">
              <div className="text-sm text-slate-400 mb-1">{stat.length}</div>
              <div className="text-lg font-semibold">{fmtPct(stat.avgER)}</div>
              <div className="text-xs text-slate-500">{stat.count} posts • {fmtInt(stat.avgImpressions)} avg</div>
            </div>
          ))}
        </div>
      </div>

      {/* Emoji Usage Analysis */}
      <div className="rounded border border-slate-800 p-4">
        <h4 className="font-medium mb-3">Performance by Emoji Usage</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {emojiStats.map((stat) => (
            <div key={stat.usage} className="bg-slate-900/50 rounded p-3">
              <div className="text-sm text-slate-400 mb-1">Emojis: {stat.usage}</div>
              <div className="text-lg font-semibold">{fmtPct(stat.avgER)}</div>
              <div className="text-xs text-slate-500">{stat.count} posts • {fmtInt(stat.avgImpressions)} avg</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function ContentRecommendations({ posts, insights }) {
  const generateRecommendations = () => {
    if (!posts || posts.length === 0) return []
    
    const recommendations = []
    
    // Analyze content types
    const contentTypes = {}
    posts.forEach(post => {
      const title = (post.title || '').toLowerCase()
      const hasLink = post.link && post.link.trim() !== ''
      
      let type = 'text'
      if (title.includes('jobs') || title.includes('hiring')) type = 'jobs'
      else if (title.includes('video')) type = 'video'
      else if (hasLink && !post.link.includes('linkedin.com')) type = 'external'
      else if (hasLink) type = 'linkedin'
      
      if (!contentTypes[type]) {
        contentTypes[type] = { count: 0, totalER: 0, validER: 0 }
      }
      contentTypes[type].count++
      if (post.engagementRate != null) {
        contentTypes[type].totalER += post.engagementRate
        contentTypes[type].validER++
      }
    })
    
    // Find best performing content type
    const typePerformance = Object.entries(contentTypes)
      .map(([type, data]) => ({
        type,
        avgER: data.validER > 0 ? data.totalER / data.validER : 0,
        count: data.count
      }))
      .sort((a, b) => b.avgER - a.avgER)
    
    if (typePerformance.length > 1 && typePerformance[0].avgER > typePerformance[1].avgER * 1.2) {
      const bestType = typePerformance[0]
      const typeLabel = {
        jobs: 'job listing posts',
        video: 'video content',
        external: 'posts with external links',
        linkedin: 'posts with LinkedIn links',
        text: 'text-only posts'
      }[bestType.type] || bestType.type
      
      recommendations.push({
        type: 'content-type',
        icon: '🎯',
        title: 'Optimize Content Mix',
        description: `Your ${typeLabel} perform ${((bestType.avgER / typePerformance[1].avgER - 1) * 100).toFixed(0)}% better than average. Consider creating more of this content type.`,
        priority: 'high'
      })
    }
    
    // Analyze content length
    const lengths = { short: 0, medium: 0, long: 0 }
    posts.forEach(post => {
      const length = (post.title || '').length
      if (length > 500) lengths.long++
      else if (length > 200) lengths.medium++
      else lengths.short++
    })
    
    const totalPosts = posts.length
    if (lengths.long / totalPosts < 0.1 && totalPosts > 10) {
      recommendations.push({
        type: 'content-length',
        icon: '📝',
        title: 'Try Longer Content',
        description: `Only ${((lengths.long / totalPosts) * 100).toFixed(0)}% of your posts are long-form. Longer posts often get higher engagement - try some detailed analysis or educational content.`,
        priority: 'medium'
      })
    }
    
    // Analyze emoji usage
    const emojiPosts = posts.filter(post => {
      const title = post.title || ''
      return (title.match(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu) || []).length > 0
    }).length
    
    if (emojiPosts / totalPosts > 0.8) {
      recommendations.push({
        type: 'emoji-usage',
        icon: '😊',
        title: 'Emoji Optimization',
        description: `${((emojiPosts / totalPosts) * 100).toFixed(0)}% of your posts use emojis. Consider testing some emoji-free posts to see if they perform differently.`,
        priority: 'low'
      })
    } else if (emojiPosts / totalPosts < 0.3) {
      recommendations.push({
        type: 'emoji-usage',
        icon: '🎨',
        title: 'Add Visual Appeal',
        description: `Only ${((emojiPosts / totalPosts) * 100).toFixed(0)}% of your posts use emojis. Strategic emoji use can increase engagement and visual appeal.`,
        priority: 'medium'
      })
    }
    
    return recommendations
  }

  const recommendations = generateRecommendations()
  
  if (recommendations.length === 0) return null

  return (
    <div className="rounded border border-slate-800 p-4">
      <h4 className="font-medium mb-3">Content Strategy Recommendations</h4>
      <div className="space-y-3">
        {recommendations.map((rec, i) => (
          <div key={i} className={`p-3 rounded border-l-4 ${
            rec.priority === 'high' ? 'border-green-400 bg-green-950/20' :
            rec.priority === 'medium' ? 'border-yellow-400 bg-yellow-950/20' :
            'border-blue-400 bg-blue-950/20'
          }`}>
            <div className="flex items-start space-x-3">
              <span className="text-lg flex-shrink-0">{rec.icon}</span>
              <div>
                <div className="font-medium text-sm mb-1">{rec.title}</div>
                <div className="text-sm text-slate-300">{rec.description}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function TimingPage() {
  const [rows, setRows] = React.useState([])
  const [chartData, setChartData] = React.useState(null)
  const [insights, setInsights] = React.useState(null)
  const [posts, setPosts] = React.useState([])
  const [freshness, setFreshness] = React.useState(null)

  React.useEffect(() => {
    (async () => {
      const ds = await getCurrentDataset()
      if (!ds) return
      const [daily, posts, freshnessInfo] = await Promise.all([
        getDaily(ds.id),
        getPosts(ds.id),
        getDatasetFreshness(ds.id),
      ])

      setFreshness(freshnessInfo)

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
      
      // Calculate insights
      const validRows = ordered.filter(r => r.posts > 0 && r.medianER != null)
      const bestDay = validRows.reduce((best, current) => 
        (current.medianER || 0) > (best.medianER || 0) ? current : best, validRows[0])
      const worstDay = validRows.reduce((worst, current) => 
        (current.medianER || 0) < (worst.medianER || 0) ? current : worst, validRows[0])
      
      // Calculate weekday vs weekend stats
      const weekdayRows = ordered.filter(r => r.dow >= 1 && r.dow <= 5 && r.posts > 0)
      const weekendRows = ordered.filter(r => (r.dow === 0 || r.dow === 6) && r.posts > 0)
      
      const weekdayStats = {
        count: weekdayRows.reduce((sum, r) => sum + r.posts, 0),
        medianER: weekdayRows.length > 0 ? median(weekdayRows.map(r => r.medianER).filter(x => x != null)) : null,
        medianImpr: weekdayRows.length > 0 ? median(weekdayRows.map(r => r.medianImpressions).filter(x => x != null)) : null
      }
      
      const weekendStats = {
        count: weekendRows.reduce((sum, r) => sum + r.posts, 0),
        medianER: weekendRows.length > 0 ? median(weekendRows.map(r => r.medianER).filter(x => x != null)) : null,
        medianImpr: weekendRows.length > 0 ? median(weekendRows.map(r => r.medianImpressions).filter(x => x != null)) : null
      }
      
      // Calculate overall average for comparison
      const overallER = median(validRows.map(r => r.medianER))
      const totalPosts = ordered.reduce((sum, r) => sum + r.posts, 0)
      
      setInsights({
        bestDay,
        worstDay,
        weekdayStats,
        weekendStats,
        overallER,
        totalPosts,
        activeDays: validRows.length
      })
      
      setPosts(posts)
      setRows(ordered)
      setChartData({
        x: ordered.map((r) => r.label),
        imp: ordered.map((r) => r.medianImpressions ?? 0),
        er: ordered.map((r) => (r.medianER != null ? +(r.medianER * 100).toFixed(2) : null)),
      })
    })()
  }, [])

  const getConfidenceLevel = (postCount) => {
    if (postCount >= 10) return { level: 'High', color: 'text-green-400', icon: '✓' }
    if (postCount >= 5) return { level: 'Medium', color: 'text-yellow-400', icon: '~' }
    if (postCount >= 2) return { level: 'Low', color: 'text-orange-400', icon: '!' }
    return { level: 'Very Low', color: 'text-red-400', icon: '⚠' }
  }
  
  const getRecommendation = (row, insights) => {
    if (!insights || row.posts === 0) return 'No data - try posting on this day'
    
    const confidence = getConfidenceLevel(row.posts)
    if (confidence.level === 'Very Low' || confidence.level === 'Low') {
      return `${confidence.icon} Small sample (${row.posts} posts) - test more to confirm`
    }
    
    const erDiff = ((row.medianER || 0) - (insights.overallER || 0)) / (insights.overallER || 1)
    
    if (erDiff > 0.2) return '🏆 Top performer - prioritize this day'
    if (erDiff > 0.1) return '📈 Strong day - post regularly here'
    if (erDiff > -0.1) return '⚖️ Average performance - reliable choice'
    if (erDiff > -0.2) return '📉 Below average - consider other days'
    return '❌ Weak performance - avoid or test different content'
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-medium">Posting Timing Strategy</h2>
      {freshness?.display && (
        <p className="text-xs text-slate-500">
          Data current through {freshness.display}.
        </p>
      )}
      
      {insights && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <PerformanceInsightCard
            title="Best Day"
            value={insights.bestDay?.label || 'N/A'}
            subtitle={insights.bestDay ? `${fmtPct(insights.bestDay.medianER)} ER • ${insights.bestDay.posts} posts` : 'No data'}
            icon="🏆"
            color="text-green-400"
          />
          <PerformanceInsightCard
            title="Total Posts"
            value={fmtInt(insights.totalPosts)}
            subtitle={`Across ${insights.activeDays} days`}
            icon="📊"
          />
          <PerformanceInsightCard
            title="Average ER"
            value={fmtPct(insights.overallER)}
            subtitle="Across all days"
            icon="📈"
          />
          <PerformanceInsightCard
            title="Strategy"
            value={insights.bestDay ? `Focus on ${insights.bestDay.label}` : 'Need more data'}
            subtitle={insights.bestDay ? `Your strongest performing day` : 'Post more to see patterns'}
            icon="🎯"
            color={insights.bestDay ? 'text-blue-400' : 'text-slate-400'}
          />
        </div>
      )}
      
      {insights && (
        <WeekdayWeekendComparison 
          weekdayStats={insights.weekdayStats}
          weekendStats={insights.weekendStats}
        />
      )}
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
        <div className="bg-slate-900 px-4 py-3">
          <h3 className="font-medium">Day-of-Week Performance Analysis</h3>
          <p className="text-sm text-slate-400 mt-1">Click on confidence levels to understand sample sizes</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-800">
              <tr>
                <th className="text-left px-3 py-2">Day</th>
                <th className="text-right px-3 py-2">Posts</th>
                <th className="text-right px-3 py-2">Median ER</th>
                <th className="text-right px-3 py-2">Median Impressions</th>
                <th className="text-center px-3 py-2">Confidence</th>
                <th className="text-left px-3 py-2 max-w-xs">Recommendation</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const confidence = getConfidenceLevel(r.posts)
                const recommendation = getRecommendation(r, insights)
                return (
                  <tr key={r.dow} className="border-t border-slate-700 hover:bg-slate-800/50">
                    <td className="px-3 py-2 font-medium">{r.label}</td>
                    <td className="px-3 py-2 text-right">{fmtInt(r.posts)}</td>
                    <td className="px-3 py-2 text-right font-medium">
                      {r.medianER != null ? (
                        <span className={insights && r.medianER > insights.overallER ? 'text-green-400' : 
                                       insights && r.medianER < insights.overallER * 0.8 ? 'text-red-400' : ''}>
                          {fmtPct(r.medianER)}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-3 py-2 text-right">{fmtInt(r.medianImpressions)}</td>
                    <td className="px-3 py-2 text-center">
                      <span className={`${confidence.color} font-medium`} title={`${confidence.level} confidence (${r.posts} posts)`}>
                        {confidence.icon}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-sm text-slate-300 max-w-xs">
                      {recommendation}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className="bg-slate-900/50 px-4 py-3 text-xs text-slate-400">
          <div className="flex flex-wrap gap-4">
            <span><span className="text-green-400">✓</span> High confidence (10+ posts)</span>
            <span><span className="text-yellow-400">~</span> Medium confidence (5-9 posts)</span>
            <span><span className="text-orange-400">!</span> Low confidence (2-4 posts)</span>
            <span><span className="text-red-400">⚠</span> Very low confidence (&lt;2 posts)</span>
          </div>
        </div>
      </div>
      
      <ContentTypeAnalysis posts={posts} />
      
      <ContentRecommendations posts={posts} insights={insights} />
    </div>
  )
}
