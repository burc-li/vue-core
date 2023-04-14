/**
 * @name 全局API
 */

import { mergeOptions } from './utils'

export function initGlobalAPI(Vue) {
  // 静态属性 - 选项
  Vue.options = {
    _base: Vue
  }
  // 静态方法 - 混入
  Vue.mixin = function (mixin) {
    // 将 全局的options 和 用户的选项 进行合并
    this.options = mergeOptions(this.options, mixin)
    return this
  }

  // 静态方法 - 继承： 使用基础 Vue 构造器，创建一个“子类”。参数是一个包含组件选项的对象
  Vue.extend = function (options) {
    function Sub(options = {}) {
      this._init(options) // 默认对子类进行初始化操作
    }
    // Sub -> Sub.prototype -> Vue.prototype  实例获取不到构造函数本身的全局方法，例如 Vue.mixin / Vue.extend / Sub.options
    Sub.prototype = Object.create(Vue.prototype) // Sub.prototype.__proto__ === Vue.prototype
    Sub.prototype.constructor = Sub

    // 将全局的 Vue.options 和 用户选项 合并
    // 对于 Sub.options.components 来说【键值对 取 options.components中的数据，__proto__ 指向 Vue.options.components，即Sub.options.components.__proto__ = Vue.options.components】
    Sub.options = mergeOptions(Vue.options, options)
    return Sub
  }

  // 静态属性 - 缓存全局组件 {key(string): value(Sub构造函数)}
  Vue.options.components = {}
  // 静态方法 - 注册全局组件
  Vue.component = function (id, definition) {
    // 如果 definition是一个函数，说明用户自己调用了 Vue.extend
    definition = typeof definition === 'function' ? definition : Vue.extend(definition)
    Vue.options.components[id] = definition // definition 最终是一个Sub构造函数
  }
}
