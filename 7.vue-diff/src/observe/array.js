/**
 * @name 重写数组7个可以改变自身的方法，切片编程
 * @todo 1. Vue 的响应式是通过 Object.defineProperty() 实现的，这个 api 没办法监听数组长度的变化，也就没办法监听数组的新增。
 * @todo 2. Vue 无法检测通过数组索引改变数组的操作，这不是 Object.defineProperty() api 的原因，而是尤大认为性能消耗与带来的用户体验不成正比。对数组进行响应式检测会带来很大的性能消耗，因为数组项可能会大，比如1000条、10000条。
 * @todo 3. defineProperty无法监听数组的新增，即无法触发set方法。可手动对新增内容进行观测 并 手动触发watcher更新 - ob.dep.notify()
 */

let oldArrayProto = Array.prototype // 获取数组的原型
// newArrayProto.__proto__  = oldArrayProto
export let newArrayProto = Object.create(oldArrayProto)

// 找到所有的变异方法
let methods = ['push', 'pop', 'shift', 'unshift', 'reverse', 'sort', 'splice'] // concat slice 都不会改变原数组

methods.forEach(method => {
  // 这里重写了数组的方法
  newArrayProto[method] = function (...args) {
    // args reset参数收集，args为真正数组，arguments为伪数组
    const result = oldArrayProto[method].call(this, ...args) // 内部调用原来的方法，函数的劫持，切片编程

    // 我们需要对新增的数据再次进行劫持
    let inserted
    let ob = this.__ob__

    switch (method) {
      case 'push':
      case 'unshift': // arr.unshift(1,2,3)
        inserted = args
        break
      case 'splice': // arr.splice(0,1,{a:1},{a:1})
        inserted = args.slice(2)
      default:
        break
    }

    if (inserted) {
      // 对新增的内容再次进行观测
      ob.observeArray(inserted)
    }

    // 通知 watcher 更新渲染
    ob.dep.notify()
    return result
  }
})
