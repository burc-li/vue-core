(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.Vue = factory());
})(this, (function () { 'use strict';

  /**
   * @name Vue初始化状态、初始化数据
   */

  // import { observe } from './observe/index'

  // 初始化状态
  function initState(vm) {
    const opts = vm.$options; // 获取所有的选项
    if (opts.data) {
      initData(vm); // 初始化数据
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
    let data = vm.$options.data; // data可能是函数和对象
    data = typeof data === 'function' ? data.call(vm) : data;
    vm._data = data; // 我将返回的对象放到了_data上

    // // 对数据进行劫持 vue2 里采用了一个api defineProperty
    // observe(data)

    // // 将vm._data 用vm来代理就可以了
    // for (let key in data) {
    //   proxy(vm, '_data', key)
    // }
  }

  /**
   * @name 给Vue扩展初始化方法
   */

  // 就是给Vue增加init方法的
  function initMixin(Vue) {
    // 用于初始化操作
    Vue.prototype._init = function (options) {
      // vm.$options 就是获取用户的配置
      const vm = this;
      vm.$options = options; // 将用户的选项挂载到实例上

      // 初始化状态
      initState(vm);

      // if (options.el) {
      //   vm.$mount(options.el) // 实现数据的挂载
      // }
    };
    // Vue.prototype.$mount = function (el) {
    //   const vm = this
    //   el = document.querySelector(el)
    //   let ops = vm.$options
    //   if (!ops.render) {
    //     // 先进行查找有没有render函数
    //     let template // 没有render看一下是否写了tempate, 没写template采用外部的template
    //     if (!ops.template && el) {
    //       // 没有写模板 但是写了el
    //       template = el.outerHTML
    //     } else {
    //       if (el) {
    //         template = ops.template // 如果有el 则采用模板的内容
    //       }
    //     }
    //     // 写了temlate 就用 写了的template
    //     if (template && el) {
    //       // 这里需要对模板进行编译
    //       const render = compileToFunction(template)
    //       ops.render = render // jsx 最终会被编译成h('xxx')
    //     }
    //   }
    //   mountComponent(vm, el) // 组件的挂载
    //   // 最终就可以获取render方法
    //   // script 标签引用的vue.global.js 这个编译过程是在浏览器运行的
    //   // runtime是不包含模板编译的, 整个编译是打包的时候通过loader来转义.vue文件的, 用runtime的时候不能使用template
    // }
  }

  /**
   * @name 实现Vue构造函数
   */
  // import { initLifeCycle } from "./lifecycle";

  // 通过构造函数扩展方法
  function Vue(options) {
    // options就是用户的选项
    this._init(options); // 默认就调用了init
  }

  initMixin(Vue); // 在Vue原型上扩展init方法

  return Vue;

}));
//# sourceMappingURL=vue.js.map
