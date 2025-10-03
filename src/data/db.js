import Dexie from 'dexie'

export const db = new Dexie('li-analytics')

db.version(1).stores({
  datasets: '++id,name,createdAt',
  mappings: '++id,datasetId',
  views: '++id,name',
})

db.version(3).stores({
  datasets: '++id,name,createdAt',
  mappings: '++id,datasetId',
  views: '++id,name',
  posts: '++id,datasetId',
  daily: '++id,datasetId',
  followersDaily: '++id,datasetId',
  followersDemographics: '++id,datasetId',
})
