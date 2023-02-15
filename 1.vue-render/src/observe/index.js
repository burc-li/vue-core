/**
 * @name 数据劫持
 * @todo 1. 只对对象进行劫持
 * @todo 2. 如果一个对象被劫持过了，那就不需要再被劫持了 (要判断一个对象是否被劫持过，可以增添一个实例，用实例来判断是否被劫持过)
 * @todo 3. Object.defineProperty只能劫持已经存在的属性，新增属性无法劫持 （vue里面会为此单独写一些api  $set $delete）
 * @todo 4. 循环对象，对属性依次递归劫持，性能差
 */

import { newArrayProto } from './array'

class Observer {
  constructor(data) {
    // // Object.defineProperty只能劫持已经存在的属性，新增属性无法劫持 （vue里面会为此单独写一些api  $set $delete）
    // Object.defineProperty(data, '__ob__', {
    //   value: this,
    //   enumerable: false, // 将__ob__ 变成不可枚举 （循环的时候无法获取到）
    // })
    // data.__ob__ = this; // 给数据加了一个标识 如果数据上有__ob__ 则说明这个属性被观测过了
    // if (Array.isArray(data)) {
    //   // 这里我们可以重写数组中的方法 7个变异方法 是可以修改数组本身的
    //   data.__proto__ = newArrayProto // 需要保留数组原有的特性，并且可以重写部分方法
    //   this.observeArray(data) // 如果数组中放的是对象 可以监控到对象的变化
    // } else {
      this.walk(data)
    // }
  }

  // 循环对象 对属性依次劫持，性能差 "重新定义属性"
  walk(data) {
    Object.keys(data).forEach(key => defineReactive(data, key, data[key]))
  }

  // 观测数组
  // observeArray(data) {
  //   data.forEach(item => observe(item))
  // }
}

// 使用defineProperty API进行属性劫持
export function defineReactive(target, key, value) {
  // 深度属性劫持，对所有的对象都进行属性劫持
  observe(value) 

  Object.defineProperty(target, key, {
    // 取值的时候 会执行get
    get() {
      console.log('get_v2')
      return value
    },
    // 修改的时候 会执行set
    set(newValue) {
      console.log('set_v2')
      if (newValue === value) return
      // observe(newValue)
      value = newValue
    },
  })
}

// 数据劫持
export function observe(data) {
  // 只对对象进行劫持
  if (typeof data !== 'object' || data == null) {
    return
  }

  // 如果一个对象被劫持过了，那就不需要再被劫持了 (要判断一个对象是否被劫持过，可以增添一个实例，用实例来判断是否被劫持过)
  if (data.__ob__ instanceof Observer) {
    // 说明这个对象被代理过了
    return data.__ob__
  }

  return new Observer(data)
}
