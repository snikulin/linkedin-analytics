import React from 'react'
import { Routes, Route, Link, useLocation, useNavigate, Navigate } from 'react-router-dom'
import { UploadPage } from '../features/upload/UploadPage'
import { OverviewPage } from '../features/dashboards/OverviewPage'
import { TimingPage } from '../features/dashboards/TimingPage'
import { ContentPage } from '../features/dashboards/ContentPage'

import { getCurrentDatasetId } from '../data/repo'

function NavLink({ to, label }) {
  const location = useLocation()
  const isActive = location.pathname === to
  return (
    <Link
      to={to}
      className={`px-3 py-1 rounded text-sm ${isActive ? 'bg-slate-600' : 'bg-slate-800 hover:bg-slate-700'}`}
    >
      {label}
    </Link>
  )
}

function RootRedirect() {
  const navigate = useNavigate()
  const persistedDatasetId = getCurrentDatasetId()
  React.useEffect(() => {
    navigate(persistedDatasetId ? '/overview' : '/upload', { replace: true })
  }, [navigate, persistedDatasetId])
  return null
}

export function App() {
  const navigate = useNavigate()

  return (
    <div className="min-h-full">
      <header className="border-b border-slate-700">
        <div className="container mx-auto px-4 py-3 flex items-center gap-3">
          <h1 className="font-semibold text-slate-100">LinkedIn Analytics</h1>
          <div className="flex gap-2 ml-auto">
            <NavLink to="/upload" label="Upload" />
            <NavLink to="/overview" label="Overview" />
            <NavLink to="/timing" label="Timing" />
            <NavLink to="/content" label="Content" />

          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-6">
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/upload" element={<UploadPage onReady={() => navigate('/overview')} />} />
          <Route path="/overview" element={<OverviewPage />} />
          <Route path="/timing" element={<TimingPage />} />
          <Route path="/content" element={<ContentPage />} />

        </Routes>
      </main>
    </div>
  )
}
