/**
 * @name 实现Vue构造函数
 */

import { initMixin } from './init'
import { initLifeCycle } from './lifecycle'
import { initGlobalAPI } from './gloablAPI'
import Watcher from './observe/watcher'
import { nextTick } from './util/next-tick'

// 通过构造函数扩展方法
function Vue(options) {
  this._init(options) // 默认就调用了init
}

initMixin(Vue) // 在Vue原型上扩展init方法  Vue.prototype._init  Vue.prototype.$mount
initLifeCycle(Vue) // 在Vue原型上扩展 render 函数相关的方法   Vue.prototype._render   Vue.prototype._update

initGlobalAPI(Vue) // 在Vue上扩展全局属性和方法 Vue.options Vue.mixin

Vue.prototype.$nextTick = nextTick // 把 nextTick 挂载到vue原型上，方便用户在实例上使用

// 监听的值发生变化了，直接执行cb函数即可
Vue.prototype.$watch = function (exprOrFn, cb, options = {}) {
  options.user = true
  // exprOrFn 可能是 字符串firstname or 函数()=>vm.firstname
  const watcher = new Watcher(this, exprOrFn, options, cb)

  // 立即执行
  if(options.immediate){
    cb.call(this, watcher.value, undefined)
  }
}

export default Vue
