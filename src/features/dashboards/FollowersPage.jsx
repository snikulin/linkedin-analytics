import React from 'react'
import { getCurrentDataset, getFollowersDaily, getFollowersDemographics } from '../../data/repo'
import { fmtInt } from '../../lib/format'
import { Chart } from '../../components/Chart'

const TIME_PERIODS = {
  '7d': { label: '7 days', days: 7 },
  '14d': { label: '14 days', days: 14 },
  '30d': { label: '30 days', days: 30 },
  '90d': { label: '90 days', days: 90 },
  'all': { label: 'All time', days: null }
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

function GranularitySelector({ granularity, onChange }) {
  const options = [
    { key: 'daily', label: 'Daily' },
    { key: 'weekly', label: 'Weekly' },
    { key: 'monthly', label: 'Monthly' }
  ]

  return (
    <div className="flex flex-wrap gap-2">
      <span className="text-sm text-slate-400 self-center hidden sm:block">View:</span>
      {options.map(({ key, label }) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className={`px-2 sm:px-3 py-1 rounded text-xs sm:text-sm touch-manipulation ${
            granularity === key
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

function aggregateFollowersByWeek(dailyData) {
  const weeklyMap = new Map()

  dailyData.forEach(day => {
    const date = new Date(day.date)
    // Get the start of the week (Monday)
    const dayOfWeek = date.getDay()
    const diff = date.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1) // Adjust for Sunday
    const weekStart = new Date(date.setDate(diff))
    const weekKey = weekStart.toISOString().split('T')[0]

    if (!weeklyMap.has(weekKey)) {
      weeklyMap.set(weekKey, {
        date: weekKey,
        organicFollowers: 0,
        sponsoredFollowers: 0,
        autoInvitedFollowers: 0,
        totalFollowers: 0,
        days: 0
      })
    }

    const week = weeklyMap.get(weekKey)
    week.organicFollowers += day.organicFollowers || 0
    week.sponsoredFollowers += day.sponsoredFollowers || 0
    week.autoInvitedFollowers += day.autoInvitedFollowers || 0
    week.totalFollowers += day.totalFollowers || 0
    week.days += 1
  })

  return Array.from(weeklyMap.values())
    .sort((a, b) => new Date(a.date) - new Date(b.date))
}

function aggregateFollowersByMonth(dailyData) {
  const monthlyMap = new Map()

  dailyData.forEach(day => {
    const date = new Date(day.date)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`

    if (!monthlyMap.has(monthKey)) {
      monthlyMap.set(monthKey, {
        date: monthKey,
        organicFollowers: 0,
        sponsoredFollowers: 0,
        autoInvitedFollowers: 0,
        totalFollowers: 0,
        days: 0
      })
    }

    const month = monthlyMap.get(monthKey)
    month.organicFollowers += day.organicFollowers || 0
    month.sponsoredFollowers += day.sponsoredFollowers || 0
    month.autoInvitedFollowers += day.autoInvitedFollowers || 0
    month.totalFollowers += day.totalFollowers || 0
    month.days += 1
  })

  return Array.from(monthlyMap.values())
    .sort((a, b) => new Date(a.date) - new Date(b.date))
}

function DemographicsChart({ demographics, categoryType }) {
  if (!demographics || demographics.length === 0) return null

  const filtered = demographics.filter(d => d.categoryType === categoryType)
  if (filtered.length === 0) return null

  const sorted = filtered
    .sort((a, b) => b.count - a.count)
    .slice(0, 10) // Top 10

  const labels = sorted.map(d => d.category)
  const values = sorted.map(d => d.count)

  return (
    <div className="rounded border border-slate-800 p-4">
      <h3 className="font-medium mb-3 capitalize">{categoryType.replace('_', ' ')} Distribution</h3>
      <Chart
        option={{
          backgroundColor: 'transparent',
          tooltip: {
            trigger: 'axis',
            backgroundColor: '#1f2937',
            borderColor: '#374151',
            textStyle: { color: '#f3f4f6' }
          },
          grid: { left: 100, right: 60, top: 40, bottom: 40 },
          xAxis: {
            type: 'value',
            axisLabel: { color: '#94a3b8' },
            splitLine: { lineStyle: { color: '#1f2937' } }
          },
          yAxis: {
            type: 'category',
            data: labels,
            axisLabel: { color: '#94a3b8' }
          },
          series: [
            {
              type: 'bar',
              data: values,
              itemStyle: { color: '#3b82f6' },
              barWidth: '60%'
            }
          ]
        }}
      />
    </div>
  )
}

export function FollowersPage() {
  const [metrics, setMetrics] = React.useState(null)
  const [previousMetrics, setPreviousMetrics] = React.useState(null)
  const [series, setSeries] = React.useState(null)
  const [timePeriod, setTimePeriod] = React.useState('30d')
  const [granularity, setGranularity] = React.useState('daily')
  const [followersDaily, setFollowersDaily] = React.useState([])
  const [followersDemographics, setFollowersDemographics] = React.useState([])

  const getCutoffDate = React.useCallback((period) => {
    if (period === 'all') return null
    const days = TIME_PERIODS[period].days
    const now = new Date()
    return new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
  }, [])

  const filterDataByPeriod = React.useCallback((data, period, dateField = 'date') => {
    const cutoff = getCutoffDate(period)
    if (!cutoff) return data
    return data.filter(item => {
      const date = new Date(item[dateField])
      return date >= cutoff
    })
  }, [getCutoffDate])

  const calculateMetrics = React.useCallback((followersDaily, period) => {
    const filteredFollowers = filterDataByPeriod(followersDaily, period, 'date')

    const totalNewFollowers = filteredFollowers.reduce((acc, f) => acc + (f.totalFollowers || 0), 0)
    const organicFollowers = filteredFollowers.reduce((acc, f) => acc + (f.organicFollowers || 0), 0)
    const sponsoredFollowers = filteredFollowers.reduce((acc, f) => acc + (f.sponsoredFollowers || 0), 0)
    const autoInvitedFollowers = filteredFollowers.reduce((acc, f) => acc + (f.autoInvitedFollowers || 0), 0)

    const avgDailyNewFollowers = filteredFollowers.length > 0 ? totalNewFollowers / filteredFollowers.length : 0

    return {
      totalNewFollowers,
      organicFollowers,
      sponsoredFollowers,
      autoInvitedFollowers,
      avgDailyNewFollowers,
      daysCount: filteredFollowers.length
    }
  }, [filterDataByPeriod])

  React.useEffect(() => {
    (async () => {
      const ds = await getCurrentDataset()
      if (!ds) return
      const [followersDailyData, followersDemographicsData] = await Promise.all([
        getFollowersDaily(ds.id),
        getFollowersDemographics(ds.id)
      ])

      // Calculate current period metrics
      const currentMetrics = calculateMetrics(followersDailyData, timePeriod)
      setMetrics(currentMetrics)

      // Calculate previous period metrics for comparison
      const currentDays = TIME_PERIODS[timePeriod].days
      if (currentDays) {
        const previousCutoff = new Date(Date.now() - currentDays * 2 * 24 * 60 * 60 * 1000)
        const currentCutoff = new Date(Date.now() - currentDays * 24 * 60 * 60 * 1000)

        const previousFollowers = followersDailyData.filter(f => {
          const date = new Date(f.date)
          return date >= previousCutoff && date < currentCutoff
        })

        const prevMetrics = calculateMetrics(previousFollowers, 'all')
        setPreviousMetrics(prevMetrics)
      } else {
        setPreviousMetrics(null)
      }

      setFollowersDaily(filterDataByPeriod(followersDailyData, timePeriod, 'date'))
      setFollowersDemographics(followersDemographicsData)

      // Build time series from followers daily data
      let chartData = filterDataByPeriod(followersDailyData, timePeriod, 'date')
        .filter((d) => d.date)
        .sort((a, b) => new Date(a.date) - new Date(b.date))

      // Aggregate data based on granularity
      if (granularity === 'weekly') {
        chartData = aggregateFollowersByWeek(chartData)
      } else if (granularity === 'monthly') {
        chartData = aggregateFollowersByMonth(chartData)
      }

      const x = chartData.map((d) => {
        if (granularity === 'weekly') {
          const date = new Date(d.date)
          // Show compact format: "Sep 30" or "Sep 30 25" for different years
          const month = date.toLocaleDateString('en-US', { month: 'short' })
          const day = date.getDate()
          const year = date.getFullYear()
          const currentYear = new Date().getFullYear()

          if (year !== currentYear) {
            return `${month} ${day} ${String(year).slice(-2)}`
          } else {
            return `${month} ${day}`
          }
        } else if (granularity === 'monthly') {
          const date = new Date(d.date)
          return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
        }
        return d.date?.slice(0, 10)
      })
      const organic = chartData.map((d) => d.organicFollowers || 0)
      const sponsored = chartData.map((d) => d.sponsoredFollowers || 0)
      const autoInvited = chartData.map((d) => d.autoInvitedFollowers || 0)
      const total = chartData.map((d) => d.totalFollowers || 0)
      setSeries({ x, organic, sponsored, autoInvited, total })
    })()
  }, [timePeriod, granularity, calculateMetrics, filterDataByPeriod])

  const getChangeInfo = (current, previous) => {
    if (!previous || previous === 0) return { change: null, trend: 'neutral' }
    const diff = current - previous
    const pctChange = (diff / previous * 100).toFixed(1)
    const change = `${diff > 0 ? '+' : ''}${pctChange}%`
    const trend = diff > 0 ? 'up' : diff < 0 ? 'down' : 'neutral'
    return { change, trend }
  }

  return (
    <div className="space-y-4 sm:space-y-6 followers-dashboard">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-lg font-medium">Followers Analytics</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <TimePeriodSelector period={timePeriod} onChange={setTimePeriod} />
          <GranularitySelector granularity={granularity} onChange={setGranularity} />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <MetricCard
          title="Total New Followers"
          value={fmtInt(metrics?.totalNewFollowers)}
          icon="👥"
          {...getChangeInfo(metrics?.totalNewFollowers || 0, previousMetrics?.totalNewFollowers || 0)}
        />
        <MetricCard
          title="Organic Followers"
          value={fmtInt(metrics?.organicFollowers)}
          icon="🌱"
          {...getChangeInfo(metrics?.organicFollowers || 0, previousMetrics?.organicFollowers || 0)}
        />
        <MetricCard
          title="Sponsored Followers"
          value={fmtInt(metrics?.sponsoredFollowers)}
          icon="📢"
          {...getChangeInfo(metrics?.sponsoredFollowers || 0, previousMetrics?.sponsoredFollowers || 0)}
        />
        <MetricCard
          title="Avg. Daily New"
          value={fmtInt(metrics?.avgDailyNewFollowers)}
          icon="📈"
          {...getChangeInfo(metrics?.avgDailyNewFollowers || 0, previousMetrics?.avgDailyNewFollowers || 0)}
        />
      </div>

      {series && series.x.length > 0 && (
        <div className="rounded border border-slate-800 p-4">
          <h3 className="font-medium mb-3">Followers Growth Trends</h3>
          <Chart
            option={{
              backgroundColor: 'transparent',
              tooltip: {
                trigger: 'axis',
                backgroundColor: '#1f2937',
                borderColor: '#374151',
                textStyle: { color: '#f3f4f6' }
              },
              legend: { data: ['Organic', 'Sponsored', 'Auto-Invited', 'Total'], textStyle: { color: '#cbd5e1' } },
              grid: { left: 50, right: 60, top: 40, bottom: 40 },
              xAxis: {
                type: 'category',
                data: series.x,
                axisLabel: {
                  color: '#94a3b8',
                  rotate: granularity === 'weekly' && series.x.length > 12 ? 45 : (series.x.length > 10 ? 45 : 0),
                  interval: granularity === 'weekly' && series.x.length > 12 ? 'auto' : 0,
                  fontSize: granularity === 'weekly' && series.x.length > 12 ? 10 : 11
                },
                axisTick: { alignWithLabel: true }
              },
              yAxis: {
                type: 'value',
                name: 'New Followers',
                axisLabel: { color: '#94a3b8' },
                splitLine: { lineStyle: { color: '#1f2937' } }
              },
              series: [
                {
                  name: 'Organic',
                  type: 'line',
                  data: series.organic,
                  smooth: true,
                  lineStyle: { width: 2 },
                  itemStyle: { color: '#10b981' }
                },
                {
                  name: 'Sponsored',
                  type: 'line',
                  data: series.sponsored,
                  smooth: true,
                  lineStyle: { width: 2 },
                  itemStyle: { color: '#f59e0b' }
                },
                {
                  name: 'Auto-Invited',
                  type: 'line',
                  data: series.autoInvited,
                  smooth: true,
                  lineStyle: { width: 2 },
                  itemStyle: { color: '#8b5cf6' }
                },
                {
                  name: 'Total',
                  type: 'line',
                  data: series.total,
                  smooth: true,
                  lineStyle: { width: 3 },
                  itemStyle: { color: '#3b82f6' }
                }
              ]
            }}
          />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <DemographicsChart demographics={followersDemographics} categoryType="location" />
        <DemographicsChart demographics={followersDemographics} categoryType="job_function" />
        <DemographicsChart demographics={followersDemographics} categoryType="seniority" />
        <DemographicsChart demographics={followersDemographics} categoryType="industry" />
        <DemographicsChart demographics={followersDemographics} categoryType="company_size" />
      </div>
    </div>
  )
}