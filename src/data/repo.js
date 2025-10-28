import { db } from './db'
import { bucketizeContentType } from '../lib/contentClassification'

const CURRENT_DATASET_KEY = 'linkedin-analytics-current-dataset-id'

export async function saveDataset(name, { posts = [], daily = [], followersDaily = [], followersDemographics = [] }, isSampleData = false) {
  const datasetId = await db.transaction('rw', db.datasets, db.posts, db.daily, db.followersDaily, db.followersDemographics, db.postSnapshots, async () => {
    let id

    if (isSampleData) {
      // For sample data, always create a new dataset and clear existing data
      id = await db.datasets.add({ name, createdAt: new Date().toISOString() })
    } else {
      // For regular uploads, try to update existing dataset or create new one
      const existingDataset = await db.datasets.orderBy('id').last()
      if (existingDataset) {
        id = existingDataset.id
        // Update the dataset name and timestamp
        await db.datasets.update(id, { name, createdAt: new Date().toISOString() })
      } else {
        id = await db.datasets.add({ name, createdAt: new Date().toISOString() })
      }
    }

    // Only save data types that have content
    if (posts.length) {
      if (!isSampleData) {
        // Clear existing posts for this dataset before adding new ones
        await db.posts.where('datasetId').equals(id).delete()
      }
      const postsWithDataset = posts.map((p) => ({ ...p, datasetId: id }))
      await db.posts.bulkAdd(postsWithDataset)
      await savePostSnapshots(postsWithDataset, id)
    }

    if (daily.length) {
      if (!isSampleData) {
        // Clear existing daily data for this dataset before adding new ones
        await db.daily.where('datasetId').equals(id).delete()
      }
      await db.daily.bulkAdd(daily.map((d) => ({ ...d, datasetId: id })))
    }

    if (followersDaily.length) {
      if (!isSampleData) {
        // Clear existing followers daily data for this dataset before adding new ones
        await db.followersDaily.where('datasetId').equals(id).delete()
      }
      await db.followersDaily.bulkAdd(followersDaily.map((f) => ({ ...f, datasetId: id })))
    }

    if (followersDemographics.length) {
      if (!isSampleData) {
        // Clear existing followers demographics for this dataset before adding new ones
        await db.followersDemographics.where('datasetId').equals(id).delete()
      }
      await db.followersDemographics.bulkAdd(followersDemographics.map((f) => ({ ...f, datasetId: id })))
    }

    return id
  })

  // Persist the dataset ID
  setCurrentDatasetId(datasetId)
  return datasetId
}

async function savePostSnapshots(posts, datasetId) {
  if (!posts.length) return
  const observedAt = new Date().toISOString()
  const rows = posts
    .map((post) => {
      if (!post.activityId) return null
      return {
        activityId: post.activityId,
        datasetId,
        observedAt,
        contentType: post.contentType || 'Regular',
        bucket: bucketizeContentType(post.contentType || 'Regular'),
        publishedAt: post.createdAt || null,
        impressions: post.impressions || 0,
        likes: post.likes || 0,
        comments: post.comments || 0,
        reposts: post.reposts || 0,
        engagementRate: post.engagementRate ?? null,
      }
    })
    .filter(Boolean)

  if (!rows.length) return
  await db.postSnapshots.bulkAdd(rows)
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

export async function getDatasetFreshness(datasetId) {
  if (!datasetId) return null

  const [posts, daily, followers] = await Promise.all([
    db.posts.where('datasetId').equals(datasetId).toArray(),
    db.daily.where('datasetId').equals(datasetId).toArray(),
    db.followersDaily.where('datasetId').equals(datasetId).toArray(),
  ])

  let latest = null

  const considerDate = (value) => {
    if (!value) return
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return
    if (!latest || date > latest) latest = date
  }

  posts.forEach((post) => considerDate(post.createdAt))
  daily.forEach((row) => considerDate(row.date))
  followers.forEach((row) => considerDate(row.date))

  if (!latest) return null

  return {
    iso: latest.toISOString(),
    date: latest,
    display: latest.toLocaleDateString(),
  }
}

export async function getPosts(datasetId) {
  if (!datasetId) return []
  return db.posts.where('datasetId').equals(datasetId).toArray()
}

export async function getPostById(postId) {
  if (!postId) return null
  return db.posts.get(Number(postId))
}

export async function getPostSnapshots(activityId) {
  if (!activityId) return []
  const snapshots = await db.postSnapshots.where('activityId').equals(activityId).toArray()
  return snapshots.sort((a, b) => new Date(a.observedAt) - new Date(b.observedAt))
}

export async function getBucketSnapshots(bucket, limit = 500) {
  if (!bucket) return []
  const rows = await db.postSnapshots.where('bucket').equals(bucket).toArray()
  const sorted = rows.sort((a, b) => new Date(a.observedAt) - new Date(b.observedAt))
  return limit ? sorted.slice(-limit) : sorted
}

export async function getDaily(datasetId) {
  if (!datasetId) return []
  return db.daily.where('datasetId').equals(datasetId).toArray()
}

export async function getFollowersDaily(datasetId) {
  if (!datasetId) return []
  return db.followersDaily.where('datasetId').equals(datasetId).toArray()
}

export async function getFollowersDemographics(datasetId) {
  if (!datasetId) return []
  return db.followersDemographics.where('datasetId').equals(datasetId).toArray()
}

export async function getDatasets() {
  return db.datasets.orderBy('createdAt').reverse().toArray()
}

export async function clearDatasets() {
  await db.transaction('rw', db.datasets, db.posts, db.daily, db.followersDaily, db.followersDemographics, async () => {
    await db.datasets.clear()
    await db.posts.clear()
    await db.daily.clear()
    await db.followersDaily.clear()
    await db.followersDemographics.clear()
  })
  setCurrentDatasetId(null)
}
