/**
 * @name 实现Vue构造函数
 */

import { initMixin } from './init'
import { initLifeCycle } from './lifecycle'
import { nextTick } from "./observe/watcher";

// 通过构造函数扩展方法
function Vue(options) {
  // options就是用户的选项
  this._init(options) // 默认就调用了init
}

Vue.prototype.$nextTick = nextTick // 把 nextTick 挂载到vue原型上，方便用户在实例上使用
initMixin(Vue) // 在Vue原型上扩展init方法
initLifeCycle(Vue) // 在Vue原型上扩展 render 函数相关的方法

export default Vue
