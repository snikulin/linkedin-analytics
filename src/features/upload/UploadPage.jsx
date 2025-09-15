import React from 'react'
import { parseFiles } from './parsing'
import { saveDataset, getDatasets, clearDatasets } from '../../data/repo'
import { generateSampleData } from './sampleDataGenerator'

export function UploadPage({ onReady }) {
  const [log, setLog] = React.useState('')
  const [hasExistingData, setHasExistingData] = React.useState(false)
  const [showClearConfirm, setShowClearConfirm] = React.useState(false)
  const [showHowItWorks, setShowHowItWorks] = React.useState(false)

  React.useEffect(() => {
    checkExistingData()
  }, [])

  const checkExistingData = async () => {
    const datasets = await getDatasets()
    setHasExistingData(datasets.length > 0)
  }

  const onFiles = async (files) => {
    setLog('Parsing...')
    try {
      const result = await parseFiles(files)
      const counts = `${result.posts.length} posts, ${result.daily.length} daily rows`
      setLog(`Parsed: ${counts}. Saving...`)
      const datasetName = files.map((f) => f.name).join(', ').slice(0, 80)
      const id = await saveDataset(datasetName, result)
      setLog(`Saved dataset #${id} with ${counts}`)
      await checkExistingData()
      if (onReady) onReady(id)
    } catch (e) {
      console.error(e)
      setLog('Failed to parse files.')
    }
  }

  const onSampleData = async () => {
    setLog('Generating sample data...')
    try {
      const result = generateSampleData()
      const counts = `${result.posts.length} posts, ${result.daily.length} daily rows`
      setLog(`Generated: ${counts}. Saving...`)
      const id = await saveDataset('LinkedIn Analytics Demo Data', result)
      setLog(`Saved sample dataset #${id} with ${counts}`)
      await checkExistingData()
      if (onReady) onReady(id)
    } catch (e) {
      console.error(e)
      setLog('Failed to generate sample data.')
    }
  }

  const onClearData = async () => {
    setLog('Clearing all data...')
    try {
      await clearDatasets()
      setLog('All data cleared successfully')
      await checkExistingData()
      setShowClearConfirm(false)
    } catch (e) {
      console.error(e)
      setLog('Failed to clear data.')
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Privacy Hero Section */}
      <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 rounded-lg p-6 border border-blue-500/20">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.031 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-white mb-2">100% Private & Secure</h2>
            <p className="text-slate-300 mb-4">
              Your LinkedIn data never leaves your device. All processing happens entirely in your browser using client-side JavaScript.
              No data is sent to any servers or third parties.
            </p>
            <a
              href="https://github.com/your-repo/linkedin-analytics"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-blue-400 hover:text-blue-300 text-sm"
            >
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              View source code
            </a>
          </div>
        </div>
      </div>

      {/* Data Warning */}
      {hasExistingData && (
        <div className="bg-amber-900/20 border border-amber-500/30 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <svg className="w-5 h-5 text-amber-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div>
              <p className="text-amber-200 font-medium">Existing data detected</p>
              <p className="text-amber-300/80 text-sm">Uploading new data will replace your current analytics.</p>
            </div>
          </div>
        </div>
      )}

      {/* Two-Path Upload Design */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Try Sample Data */}
        <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white">Try Sample Data</h3>
            <p className="text-slate-300 text-sm">
              Explore the analytics with realistic demo data. Perfect for testing features before uploading your own data.
            </p>
            <button
              onClick={onSampleData}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Generate Sample Data
            </button>
          </div>
        </div>

        {/* Upload Real Data */}
        <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white">Upload Your Data</h3>
            <p className="text-slate-300 text-sm">
              Upload your LinkedIn export files to analyze your actual post performance and engagement patterns.
            </p>
            <div className="space-y-3">
              <input
                type="file"
                multiple
                accept=".xls,.xlsx,.csv,.ods,.XLS,.XLSX,.CSV,.ODS"
                onChange={(e) => onFiles(Array.from(e.target.files))}
                className="block w-full text-sm text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-600 file:text-white hover:file:bg-blue-700 file:cursor-pointer cursor-pointer"
              />
              <p className="text-xs text-slate-400">
                Supports XLS, XLSX, CSV, ODS formats
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* How to Export from LinkedIn */}
      <div className="bg-slate-800/30 rounded-lg p-6 border border-slate-600">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">How to Export from LinkedIn</h3>
          <button
            onClick={() => setShowHowItWorks(!showHowItWorks)}
            className="text-blue-400 hover:text-blue-300 text-sm flex items-center"
          >
            {showHowItWorks ? 'Hide' : 'Show'} guide
            <svg className={`w-4 h-4 ml-1 transition-transform ${showHowItWorks ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {showHowItWorks && (
          <div className="space-y-4 text-sm text-slate-300">
            <div className="space-y-6">
              <div className="bg-red-900/20 rounded-lg p-4 border border-red-500/20">
                <div className="flex items-start space-x-3">
                  <svg className="w-5 h-5 text-red-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <div>
                    <p className="text-red-200 font-medium mb-1">Important Limitation</p>
                    <p className="text-red-300/90 text-sm">LinkedIn analytics export is only available for <strong>LinkedIn Pages</strong> (company/organization pages), not personal profiles.</p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-white mb-3">LinkedIn Page Analytics Export</h4>
                <p className="text-slate-400 mb-3">If you manage a LinkedIn Page (company/organization), you can export analytics:</p>
                <ol className="space-y-2 list-decimal list-inside text-slate-300 ml-4">
                  <li>Access your Page admin view</li>
                  <li>Click <strong>Analytics</strong> in the left menu</li>
                  <li>Select one of: Content, Visitors, Followers, Search Appearances, Leads, Newsletters, or Competitors</li>
                  <li>Click the <strong>Export</strong> button in the upper-right corner</li>
                  <li>Select a timeframe and click the <strong>Export</strong> button</li>
                  <li>The XLS file will be accessible after download</li>
                </ol>
                
                <div className="mt-4 bg-slate-800/50 rounded-lg p-4 border border-slate-600">
                  <p className="text-slate-300 text-sm mb-3">Look for the Export button in the upper-right corner of the analytics page:</p>
                  <img 
                    src="/src/images/linkedin-export.png" 
                    alt="LinkedIn Export button location in analytics interface"
                    className="w-full max-w-md mx-auto rounded border border-slate-500"
                  />
                </div>
              </div>

            </div>

            <div className="bg-blue-900/20 rounded-lg p-4 border border-blue-500/20">
              <p className="text-blue-200 text-sm">
                <strong>Recommendation:</strong> Try the sample data feature above to explore the analytics capabilities. It provides realistic LinkedIn Page-style metrics for demonstration purposes.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Clear Data Section */}
      {hasExistingData && (
        <div className="bg-red-900/20 rounded-lg p-6 border border-red-500/20">
          <h3 className="text-lg font-semibold text-white mb-2">Clear All Data</h3>
          <p className="text-slate-300 text-sm mb-4">
            Remove all stored analytics data from your browser. This action cannot be undone.
          </p>
          {!showClearConfirm ? (
            <button
              onClick={() => setShowClearConfirm(true)}
              className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Clear All Data
            </button>
          ) : (
            <div className="flex space-x-3">
              <button
                onClick={onClearData}
                className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Confirm Clear
              </button>
              <button
                onClick={() => setShowClearConfirm(false)}
                className="bg-slate-600 hover:bg-slate-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      )}

      {/* Status Log */}
      {log && (
        <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
          <pre className="text-xs text-slate-400 whitespace-pre-wrap">{log}</pre>
        </div>
      )}
    </div>
  )
}
