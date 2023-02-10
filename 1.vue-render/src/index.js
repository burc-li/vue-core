/**
 * @name 实现Vue构造函数
 */

import { initMixin } from "./init";
// import { initLifeCycle } from "./lifecycle";

// 通过构造函数扩展方法
function Vue(options){ // options就是用户的选项
    this._init(options); // 默认就调用了init
}

initMixin(Vue); // 在Vue原型上扩展init方法
// initLifeCycle(Vue);


export default Vue