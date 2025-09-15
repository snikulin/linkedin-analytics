import { db } from './db'

const CURRENT_DATASET_KEY = 'linkedin-analytics-current-dataset-id'

export async function saveDataset(name, { posts = [], daily = [] }) {
  const datasetId = await db.transaction('rw', db.datasets, db.posts, db.daily, async () => {
    const id = await db.datasets.add({ name, createdAt: new Date().toISOString() })
    if (posts.length) {
      await db.posts.bulkAdd(posts.map((p) => ({ ...p, datasetId: id })))
    }
    if (daily.length) {
      await db.daily.bulkAdd(daily.map((d) => ({ ...d, datasetId: id })))
    }
    return id
  })
  
  // Persist the dataset ID
  setCurrentDatasetId(datasetId)
  return datasetId
}

export async function getLatestDataset() {
  const ds = await db.datasets.orderBy('id').last()
  return ds || null
}

export function setCurrentDatasetId(id) {
  if (id) {
    localStorage.setItem(CURRENT_DATASET_KEY, id)
  } else {
    localStorage.removeItem(CURRENT_DATASET_KEY)
  }
}

export function getCurrentDatasetId() {
  const id = localStorage.getItem(CURRENT_DATASET_KEY)
  return id ? parseInt(id, 10) : null
}

export async function getCurrentDataset() {
  const id = getCurrentDatasetId()
  if (!id) return null
  
  try {
    const ds = await db.datasets.get(id)
    return ds || null
  } catch (error) {
    console.error('Error fetching current dataset:', error)
    return null
  }
}

export async function getPosts(datasetId) {
  if (!datasetId) return []
  return db.posts.where('datasetId').equals(datasetId).toArray()
}

export async function getDaily(datasetId) {
  if (!datasetId) return []
  return db.daily.where('datasetId').equals(datasetId).toArray()
}

export async function getDatasets() {
  return db.datasets.orderBy('createdAt').reverse().toArray()
}

export async function clearDatasets() {
  await db.transaction('rw', db.datasets, db.posts, db.daily, async () => {
    await db.datasets.clear()
    await db.posts.clear()
    await db.daily.clear()
  })
  setCurrentDatasetId(null)
}

