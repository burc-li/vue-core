/**
 * @name 给Vue扩展初始化方法
 */

import { compileToFunction } from './compiler'
import { mountComponent, callHook } from './lifecycle'
import { initState } from './state'
import { mergeOptions } from './utils'

// 就是给Vue增加init方法的
export function initMixin(Vue) {
  // 用于初始化操作
  Vue.prototype._init = function (options) {
    // vm.$options 就是获取用户的配置
    const vm = this
    
    // mixin原理 将合并后的选项挂载到vm实例上    
    // this.constructor.options  即构造函数上的options = Vue.options|Sub.options
    vm.$options = mergeOptions(this.constructor.options, options)

    callHook(vm, 'beforeCreate') // 访问不到 this.xxx

    // 初始化状态
    initState(vm)

    callHook(vm, 'created') // 可以访问到 this.xxx

    if (options.el) {
      vm.$mount(options.el) // 实现数据的挂载
    }
  }
  Vue.prototype.$mount = function (el) {
    const vm = this
    el = document.querySelector(el)
    let ops = vm.$options

    // 没有render函数
    if (!ops.render) {
      let template
      // 没有render函数，看一下是否写了tempate, 没写template则采用外部的template
      if (ops.template) {
        template = ops.template
      } else if (!ops.template && el) {
        template = el.outerHTML
      }
      if (template) {
        // 这里需要对模板进行编译
        const render = compileToFunction(template)
        ops.render = render // 最终会被编译成 h('xxx')
      }
    }
    mountComponent(vm, el) // 组件的挂载

    // script 标签引用的 vue.global.js 这个编译过程是在浏览器运行的
    // runtime是不包含模板编译的, 整个编译是打包的时候通过loader来转义.vue文件的, 用runtime的时候不能使用template
  }
}
