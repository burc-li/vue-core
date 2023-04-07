/**
 * @name 实现Vue构造函数
 */

import { initMixin } from './init'
import { initLifeCycle } from './lifecycle'
import { initStateMixin } from "./state"
import { initGlobalAPI } from './gloablAPI'

// 通过构造函数扩展方法
function Vue(options) {
  this._init(options) // 默认就调用了init
}

initMixin(Vue) // 在Vue原型上扩展init方法  Vue.prototype._init  Vue.prototype.$mount
initLifeCycle(Vue) // 在Vue原型上扩展 render 函数相关的方法   Vue.prototype._render   Vue.prototype._update
initStateMixin(Vue); // 在Vue原型上扩展 $nextTick $watch 方法

initGlobalAPI(Vue) // 在Vue上扩展全局属性和方法 Vue.options Vue.mixin

export default Vue
