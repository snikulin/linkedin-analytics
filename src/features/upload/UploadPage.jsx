import React from 'react'
import { parseFiles } from './parsing'
import { saveDataset } from '../../data/repo'

export function UploadPage({ onReady }) {
  const [log, setLog] = React.useState('')
  const onFiles = async (files) => {
    setLog('Parsing...')
    try {
      const result = await parseFiles(files)
      const counts = `${result.posts.length} posts, ${result.daily.length} daily rows`
      setLog(`Parsed: ${counts}. Saving...`)
      const datasetName = files.map((f) => f.name).join(', ').slice(0, 80)
      const id = await saveDataset(datasetName, result)
      setLog(`Saved dataset #${id} with ${counts}`)
      if (onReady) onReady(id)
    } catch (e) {
      console.error(e)
      setLog('Failed to parse files.')
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-slate-300">Upload LinkedIn export files (XLS/XLSX/ODS/CSV).</p>
      <input
        type="file"
        multiple
        accept=".xls,.xlsx,.csv,.ods,.XLS,.XLSX,.CSV,.ODS"
        onChange={(e) => onFiles(Array.from(e.target.files))}
        className="block w-full text-sm"
      />
      <pre className="text-xs text-slate-400 whitespace-pre-wrap">{log}</pre>
    </div>
  )
}
