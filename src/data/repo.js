import { db } from './db'

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
  return datasetId
}

export async function getLatestDataset() {
  const ds = await db.datasets.orderBy('id').last()
  return ds || null
}

export async function getPosts(datasetId) {
  if (!datasetId) return []
  return db.posts.where('datasetId').equals(datasetId).toArray()
}

export async function getDaily(datasetId) {
  if (!datasetId) return []
  return db.daily.where('datasetId').equals(datasetId).toArray()
}

