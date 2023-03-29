/**
 * @name 全局API
 */

import { mergeOptions } from './utils'

export function initGlobalAPI(Vue) {
  // 静态属性
  Vue.options = {}
  // 静态方法
  Vue.mixin = function (mixin) {
    // 将 全局的options 和 用户的选项 进行合并
    this.options = mergeOptions(this.options, mixin)
    return this
  }
}
