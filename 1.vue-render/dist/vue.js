(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.Vue = factory());
})(this, (function () { 'use strict';

  function compileToFunction(template) {
    // 1.就是将 template 转化成 ast 语法树
    // 2.生成render方法 (render方法执行后的返回的结果就是 虚拟DOM)
  }

  /**
   * @name 重写数组7个可以改变自身的方法，切片编程
   * @todo 1. Vue 的响应式是通过 Object.defineProperty() 实现的，这个 api 没办法监听数组长度的变化，也就没办法监听数组的新增。
   * @todo 2. Vue 无法检测通过数组索引改变数组的操作，这不是 Object.defineProperty() api 的原因，而是尤大认为性能消耗与带来的用户体验不成正比。对数组进行响应式检测会带来很大的性能消耗，因为数组项可能会大，比如1000条、10000条。
   * @todo 3. defineProperty无法监听数组的新增，即无法触set方法。可手动对新增内容进行观测 并 手动触发更新 - ob.dep.notify()
   */

  let oldArrayProto = Array.prototype; // 获取数组的原型
  // newArrayProto.__proto__  = oldArrayProto
  let newArrayProto = Object.create(oldArrayProto);

  // 找到所有的变异方法
  let methods = ['push', 'pop', 'shift', 'unshift', 'reverse', 'sort', 'splice']; // concat slice 都不会改变原数组

  methods.forEach(method => {
    // 这里重写了数组的方法
    newArrayProto[method] = function (...args) {
      // args reset参数收集，args为真正数组，arguments为伪数组
      const result = oldArrayProto[method].call(this, ...args); // 内部调用原来的方法，函数的劫持，切片编程

      // 我们需要对新增的数据再次进行劫持
      let inserted;
      let ob = this.__ob__;
      switch (method) {
        case 'push':
        case 'unshift':
          // arr.unshift(1,2,3)
          inserted = args;
          break;
        case 'splice':
          // arr.splice(0,1,{a:1},{a:1})
          inserted = args.slice(2);
      }
      if (inserted) {
        // 对新增的内容再次进行观测
        ob.observeArray(inserted);
      }
      return result;
    };
  });

  /**
   * @name 数据劫持
   * @todo 1. 只对对象进行劫持
   * @todo 2. 如果一个对象被劫持过了，那就不需要再被劫持了 (要判断一个对象是否被劫持过，可以在对象上增添一个实例，用实例的原型链来判断是否被劫持过)
   * @todo 3. Object.defineProperty只能劫持已经存在的属性，对象新增属性和数组新增元素无法劫持 （vue会为此单独写一些api语法糖  $set $delete）
   * @todo 4. 循环对象，对属性依次递归劫持，性能差
   * @todo 5. setter方法中修改属性之后重新观测，目的：新值为对象或数组的话，可以劫持其数据
   * @todo 6. 重写数组7个可以改变自身的方法，切片编程
   * @todo 7. this 实例挂载到 data 数据上，将__ob__ 变成不可枚举，防止栈溢出【用于判断对象是否被劫持过 和 劫持变异数组新增数据】
   */
  class Observer {
    constructor(data) {
      // data.__ob__ = this // 给数据加了一个标识 如果数据上有__ob__ 则说明这个属性被观测过了
      Object.defineProperty(data, '__ob__', {
        value: this,
        enumerable: false // 将__ob__ 变成不可枚举 （循环的时候无法获取到，防止栈溢出）
      });

      if (Array.isArray(data)) {
        // 这里我们可以重写可以修改数组本身的方法 7个方法，切片编程：需要保留数组原有的特性，并且可以重写部分方法
        data.__proto__ = newArrayProto;
        this.observeArray(data); // 如果数组中放的是对象 可以监控到对象的变化
      } else {
        this.walk(data);
      }
    }

    // 循环对象"重新定义属性",对属性依次劫持，性能差
    // "重新定义属性"，个人理解，和proxy类似，对象和proxy返回的代理对象并不全等，其引用不同；
    // 入参属性为data[key]，使用defineProperty劫持之后，其属性变为响应式属性，和之前的普通属性断开了关联，可以理解为重新定义了属性
    // 换句话来说，data[key]仅仅是给其对应的响应式属性提供了一个默认值，无任何关联
    walk(data) {
      Object.keys(data).forEach(key => defineReactive(data, key, data[key]));
    }

    // 观测数组
    observeArray(data) {
      data.forEach(item => observe(item));
    }
  }

  // 使用defineProperty API进行属性劫持
  function defineReactive(target, key, value) {
    // 深度属性劫持，对所有的对象都进行属性劫持
    observe(value);

    // Object.defineProperty只能劫持已经存在的属性，新增属性无法劫持 （vue里面会为此单独写一些语法糖  $set $delete）
    Object.defineProperty(target, key, {
      // 取值的时候 会执行get
      get() {
        console.log('get_v2');
        return value;
      },
      // 修改的时候 会执行set
      set(newValue) {
        console.log('set_v2');
        if (newValue === value) return;

        // 修改属性之后重新观测，目的：新值为对象或数组的话，可以劫持其数据
        observe(newValue);
        value = newValue;
      }
    });
  }

  // 数据观测
  function observe(data) {
    // 只对对象进行劫持
    if (typeof data !== 'object' || data == null) {
      return;
    }

    // 如果一个对象被劫持过了，那就不需要再被劫持了 (要判断一个对象是否被劫持过，可以在对象上增添一个实例，用实例的原型链来判断是否被劫持过)
    if (data.__ob__ instanceof Observer) {
      return data.__ob__;
    }
    return new Observer(data);
  }

  /**
   * @name Vue初始化状态、初始化数据
   * @todo 1. 对data进行劫持，并将data挂载到vm上 vm._data = data
   * @todo 2. 循环data，将vm._data用vm来代理
   */

  // 初始化状态
  function initState(vm) {
    const opts = vm.$options; // 获取所有的选项
    if (opts.data) {
      initData(vm); // 初始化数据
    }
  }

  function proxy(vm, target, key) {
    Object.defineProperty(vm, key, {
      // vm.name
      get() {
        return vm[target][key]; // vm._data.name
      },

      set(newValue) {
        vm[target][key] = newValue;
      }
    });
  }

  // 初始化数据
  function initData(vm) {
    let data = vm.$options.data; // data可能是函数和对象
    data = typeof data === 'function' ? data.call(vm) : data;
    vm._data = data; // 我将返回的对象放到了_data上

    // vue2采用 defineProperty API，对data进行劫持
    observe(data);

    // 将vm._data 用 vm来代理 ，访问 vm.name = vm._data.name
    for (let key in data) {
      if (key === '_data') return;
      proxy(vm, '_data', key);
    }
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
      if (options.el) {
        vm.$mount(options.el); // 实现数据的挂载
      }
    };

    Vue.prototype.$mount = function (el) {
      const vm = this;
      el = document.querySelector(el);
      let ops = vm.$options;

      // 没有render函数
      if (!ops.render) {
        let template;
        // 没有render函数，看一下是否写了tempate, 没写template则采用外部的template
        if (!ops.template && el) {
          template = el.outerHTML;
        } else if (ops.template && el) {
          template = ops.template;
        }
        if (template && el) {
          // 这里需要对模板进行编译
          const render = compileToFunction();
          ops.render = render; // 最终会被编译成 h('xxx')
        }
      }
      // mountComponent(vm, el) // 组件的挂载
      // 最终就可以获取render方法

      // script 标签引用的 vue.global.js 这个编译过程是在浏览器运行的
      // runtime是不包含模板编译的, 整个编译是打包的时候通过loader来转义.vue文件的, 用runtime的时候不能使用template
    };
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
