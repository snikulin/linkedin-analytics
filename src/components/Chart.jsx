import React from 'react'
import ReactECharts from 'echarts-for-react'

export function Chart({ option, style }) {
  const defaultStyle = { width: '100%', height: '320px', ...style }
  return (
    <div className="rounded border border-slate-800">
      <ReactECharts option={option} style={defaultStyle} notMerge={true} lazyUpdate={true} theme={undefined} />
    </div>
  )
}

