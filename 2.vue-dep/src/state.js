/**
 * @name Vue初始化状态、初始化数据
 * @todo 1. 对data进行劫持，并将data挂载到vm上 vm._data = data
 * @todo 2. 循环data，将vm._data用vm来代理
 */

import { observe } from './observe/index'

// 初始化状态
export function initState(vm) {
  const opts = vm.$options // 获取所有的选项
  if (opts.data) {
    initData(vm) // 初始化数据
  }
}

function proxy(vm, target, key) {
  Object.defineProperty(vm, key, {
    // vm.name
    get() {
      return vm[target][key] // vm._data.name
    },
    set(newValue) {
      vm[target][key] = newValue
    },
  })
}


// 初始化数据
function initData(vm) {
  let data = vm.$options.data // data可能是函数和对象
  data = typeof data === 'function' ? data.call(vm) : data

  vm._data = data // 我将返回的对象放到了_data上

  // vue2采用 defineProperty API，对data进行劫持
  observe(data)

  // 将vm._data 用 vm来代理 ，访问 vm.name = vm._data.name
  for (let key in data) {
    if(key === '_data') return

    proxy(vm, '_data', key)
  }
}
