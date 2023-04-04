import { nextTick } from '../util/next-tick'

/** 实现内部 watcher 异步更新 - nextTick */
let queue = []
let has = {}
let pending = false // 防抖

function flushSchedulerQueue() {
  let flushQueue = queue.slice(0)
  queue = []
  has = {}
  pending = false
  flushQueue.forEach(q => q.run()) // 在刷新的过程中可能还有新的 watcher，重新放到 queue 中
}

export function queueWatcher(watcher) {
  const id = watcher.id
  if (!has[id]) {
    queue.push(watcher)
    has[id] = true
    // 不管我们的 update 执行多少次 ，但是最终只执行一轮刷新操作
    if (!pending) {
      nextTick(flushSchedulerQueue)
      pending = true
    }
  }
}