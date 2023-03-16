/**
 * @name 数据劫持
 * @todo 1. 只对对象进行劫持
 * @todo 2. 如果一个对象被劫持过了，那就不需要再被劫持了 (要判断一个对象是否被劫持过，可以在对象上增添一个实例，用实例的原型链来判断是否被劫持过)
 * @todo 3. Object.defineProperty只能劫持已经存在的属性，对象新增属性和数组新增元素无法劫持 （vue会为此单独写一些api语法糖  $set $delete）
 * @todo 4. 循环对象，对属性依次递归劫持，性能差
 * @todo 5. setter方法中修改属性之后重新观测，目的：新值为对象或数组的话，可以劫持其数据
 * @todo 6. 重写数组7个可以改变自身的方法，切片编程
 * @todo 7. this 实例挂载到 data 数据上，将__ob__ 变成不可枚举，防止栈溢出【用于判断对象是否被劫持过 和 劫持变异数组新增数据】
 * @todo 8. 触发 getter 时双向依赖收集操作 dep.depend()
 * @todo 9. 触发 setter 时通知 watcher 更新 dep.notify()
 */

import { newArrayProto } from './array'
import Dep from './dep'

class Observer {
  constructor(data) {
    // 给每个数组/对象都增加 dep 收集功能
    // 对于数组来说，[1, 2, [3, 4, 5], {a: 6}]，其成员中的数组和对象本身是没有被劫持过的
    // 对于对象来说，{list: [1, 2, 3], info:{a: 4, b: 5}}，其属性中的数组和对象本身其实被劫持过了，但是必须引用改变，才可以触发setter，更新 watcher，外部无法调用这个 dep 收集器
    // 如果想要在数组新增成员或者对象新增属性后，也可以更新 watcher，必须在给数组/对象本身增加 dep 收集器，这样就可以通过 xxx.__ob__.dep.notify() 手动触发 watcher 了
    this.dep = new Dep()

    // data.__ob__ = this // 给数据加了一个标识 如果数据上有__ob__ 则说明这个属性被观测过了
    Object.defineProperty(data, '__ob__', {
      value: this,
      enumerable: false, // 将__ob__ 变成不可枚举 （循环的时候无法获取到，防止栈溢出）
    })

    if (Array.isArray(data)) {
      // 这里我们可以重写可以修改数组本身的方法 7个方法，切片编程：需要保留数组原有的特性，并且可以重写部分方法
      data.__proto__ = newArrayProto
      this.observeArray(data) // 如果数组中放的是对象 可以监控到对象的变化
    } else {
      this.walk(data)
    }
  }

  // 循环对象"重新定义属性",对属性依次劫持，性能差
  // "重新定义属性"，个人理解，和proxy类似，对象和proxy返回的代理对象并不全等，其引用不同；
  // 入参属性为data[key]，使用defineProperty劫持之后，其属性变为响应式属性，和之前的普通属性断开了关联，可以理解为重新定义了属性
  // 换句话来说，data[key]仅仅是给其对应的响应式属性提供了一个默认值，无任何关联
  // 如果不传入默认值，而是在getter、setter中访问 data[key]，则会出现栈溢出的现象   getter -> data.name -> getter -> data.name ->...无限循环
  walk(data) {
    Object.keys(data).forEach(key => defineReactive(data, key, data[key]))
  }

  // 观测数组
  observeArray(data) {
    data.forEach(item => observe(item))
  }
}

// 使用defineProperty API进行属性劫持
export function defineReactive(target, key, value) {
  // 深度属性劫持，对所有的数组/对象都进行属性劫持，childOb.dep 用来收集依赖的
  let childOb = observe(value) 

  let dep = new Dep() // 每一个属性都有一个 dep

  // Object.defineProperty只能劫持已经存在的属性，新增属性无法劫持 （vue里面会为此单独写一些语法糖  $set $delete）
  Object.defineProperty(target, key, {
    // 取值的时候 会执行get
    get() {
      // 保证了只有在模版渲染阶段的取值操作才会进行依赖收集
      if (Dep.target) {
        console.log('>>>>>get', key)
        dep.depend() // 让当前的watcher 记住这个 dep；同时让这个属性的 dep 记住当前的 watcher
        if (childOb) {
          childOb.dep.depend() // 让数组/对象本身也实现依赖收集，$set原理
        }
      }
      return value
    },
    // 修改的时候 会执行set
    set(newValue) {
      if (newValue === value) return

      // 修改属性之后重新观测，目的：新值为对象或数组的话，可以劫持其数据
      observe(newValue)
      value = newValue

      console.log('dep', dep)
      // 通知 watcher 更新
      dep.notify()
    },
  })
}

// 数据观测
export function observe(data) {
  // 只对对象进行劫持
  if (typeof data !== 'object' || data == null) {
    return
  }

  // 如果一个对象被劫持过了，那就不需要再被劫持了 (要判断一个对象是否被劫持过，可以在对象上增添一个实例，用实例的原型链来判断是否被劫持过)
  if (data.__ob__ instanceof Observer) {
    return data.__ob__
  }

  return new Observer(data)
}
