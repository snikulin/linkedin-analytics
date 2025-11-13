import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useSettings } from '../../lib/SettingsContext'

export function SettingsPage() {
  const navigate = useNavigate()
  const { companyId, updateCompanyId } = useSettings()
  const [localCompanyId, setLocalCompanyId] = React.useState(companyId)

  const handleSave = () => {
    updateCompanyId(localCompanyId)
    navigate(-1) // Go back
  }

  return (
    <div className="space-y-6">
      <div>
        <button className="text-slate-400 hover:text-white text-sm mb-4" onClick={() => navigate(-1)}>&larr; Back</button>
        <h1 className="text-2xl font-semibold text-slate-100">Settings</h1>
        <p className="text-sm text-slate-400 mt-1">
          Configure your LinkedIn analytics preferences.
        </p>
      </div>

      <section className="rounded border border-slate-800 p-4 space-y-4">
        <div>
          <h3 className="font-medium text-slate-200 mb-2">LinkedIn Company ID</h3>
          <p className="text-sm text-slate-400 mb-3">
            Enter your company page ID to link to admin post analytics instead of regular post views.
            Find this in your LinkedIn company page URL (e.g., linkedin.com/company/2697303).
          </p>
          <input
            type="text"
            value={localCompanyId}
            onChange={(e) => setLocalCompanyId(e.target.value)}
            placeholder="e.g., 2697303"
            className="px-3 py-2 rounded text-sm bg-slate-800 text-slate-300 border border-slate-700 focus:border-slate-600 focus:outline-none w-full max-w-xs"
          />
          {localCompanyId && (
            <p className="text-xs text-slate-500 mt-1">
              Admin links enabled. Example: linkedin.com/company/{localCompanyId}/admin/post-analytics/...
            </p>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-sm rounded"
          >
            Save Settings
          </button>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm rounded"
          >
            Cancel
          </button>
        </div>
      </section>
    </div>
  )
}