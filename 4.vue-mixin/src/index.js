/**
 * @name 实现Vue构造函数
 */

import { initMixin } from './init'
import { initLifeCycle } from './lifecycle'
import { initGlobalAPI } from './gloablAPI'

import { nextTick } from './observe/watcher'

// 通过构造函数扩展方法
function Vue(options) {
  this._init(options) // 默认就调用了init
}

Vue.prototype.$nextTick = nextTick // 把 nextTick 挂载到vue原型上，方便用户在实例上使用

initMixin(Vue) // 在Vue原型上扩展init方法  Vue.prototype._init  Vue.prototype.$mount
initLifeCycle(Vue) // 在Vue原型上扩展 render 函数相关的方法   Vue.prototype._render   Vue.prototype._update

initGlobalAPI(Vue) // 在Vue上扩展全局属性和方法 Vue.options Vue.mixin

export default Vue
