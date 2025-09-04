export class ComputeClient {
  constructor() {
    this.worker = new Worker(new URL('../workers/compute.js', import.meta.url), {
      type: 'module',
    })
    this.reqId = 0
    this.pending = new Map()
    this.worker.onmessage = (e) => {
      const { id, ok, data, error } = e.data || {}
      const resolve = this.pending.get(id)
      if (resolve) {
        this.pending.delete(id)
        ok ? resolve.resolve(data) : resolve.reject(new Error(error))
      }
    }
  }

  call(action, payload) {
    const id = ++this.reqId
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject })
      this.worker.postMessage({ id, action, payload })
    })
  }
}

