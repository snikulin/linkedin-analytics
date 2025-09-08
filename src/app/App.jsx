import React from 'react'
import { UploadPage } from '../features/upload/UploadPage'
import { OverviewPage } from '../features/dashboards/OverviewPage'
import { TimingPage } from '../features/dashboards/TimingPage'
import { ContentPage } from '../features/dashboards/ContentPage'
import { LeaderboardsPage } from '../features/dashboards/LeaderboardsPage'
import { getCurrentDatasetId } from '../data/repo'

function NavLink({ label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-sm"
    >
      {label}
    </button>
  )
}

export function App() {
  const [route, setRoute] = React.useState('upload')
  
  React.useEffect(() => {
    // Check if we have a persisted dataset on initial load
    const persistedDatasetId = getCurrentDatasetId()
    if (persistedDatasetId) {
      setRoute('overview')
    }
  }, [])

  return (
    <div className="min-h-full">
      <header className="border-b border-slate-700">
        <div className="container mx-auto px-4 py-3 flex items-center gap-3">
          <h1 className="font-semibold text-slate-100">LinkedIn Analytics</h1>
          <div className="flex gap-2 ml-auto">
            <NavLink label="Upload" onClick={() => setRoute('upload')} />
            <NavLink label="Overview" onClick={() => setRoute('overview')} />
            <NavLink label="Timing" onClick={() => setRoute('timing')} />
            <NavLink label="Content" onClick={() => setRoute('content')} />
            <NavLink label="Leaderboards" onClick={() => setRoute('leaderboards')} />
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-6">
        {route === 'upload' && <UploadPage onReady={() => setRoute('overview')} />}
        {route === 'overview' && <OverviewPage />}
        {route === 'timing' && <TimingPage />}
        {route === 'content' && <ContentPage />}
        {route === 'leaderboards' && <LeaderboardsPage />}
      </main>
    </div>
  )
}
