/**
 * @name Vue初始化状态、初始化数据
 */

// import { observe } from './observe/index'

// 初始化状态
export function initState(vm) {
  const opts = vm.$options // 获取所有的选项
  if (opts.data) {
    initData(vm) // 初始化数据
  }
}

// function proxy(vm, target, key) {
//   Object.defineProperty(vm, key, {
//     // vm.name
//     get() {
//       return vm[target][key] // vm._data.name
//     },
//     set(newValue) {
//       vm[target][key] = newValue
//     },
//   })
// }

// 初始化数据
function initData(vm) {
  let data = vm.$options.data // data可能是函数和对象
  data = typeof data === 'function' ? data.call(vm) : data 

  vm._data = data // 我将返回的对象放到了_data上

  // // 对数据进行劫持 vue2 里采用了一个api defineProperty
  // observe(data)

  // // 将vm._data 用vm来代理就可以了
  // for (let key in data) {
  //   proxy(vm, '_data', key)
  // }
}
