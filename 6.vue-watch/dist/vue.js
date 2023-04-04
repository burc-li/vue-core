(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.Vue = factory());
})(this, (function () { 'use strict';

  /**
   * @name 正则表达式，用于匹配开始标签、结束标签、属性
   * @returns
   */

  const ncname = `[a-zA-Z_][\\-\\.0-9_a-zA-Z]*`;
  const qnameCapture = `((?:${ncname}\\:)?${ncname})`;
  // 匹配的是 <xxx  第一个分组就是开始标签的名字
  const startTagOpen = new RegExp(`^<${qnameCapture}`);
  // 匹配的是 </xxxx>  第一个分组就是结束标签的名字
  const endTag = new RegExp(`^<\\/${qnameCapture}[^>]*>`);
  // 分组1: 属性的key 分组2: =  分组3/分组4/分组5: value值
  const attribute = /^\s*([^\s"'<>\/=]+)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/; // 匹配属性
  const startTagClose = /^\s*(\/?)>/; // 匹配开始标签的结束 > 或 />  <div id = 'app' >  <br/>

  /**
   * @name 对模板进行编译处理
   * @desc 循环遍历html字符串，利用正则表达式对其进行匹配【开始标签、属性、开始标签的闭合标签、文本、结束标签】，
   * @desc 利用 start chars end 方法去处理开始标签、文本、结束标签
   * @desc 利用栈型结构，构造一颗AST语法树，匹配到开始标签就入栈，匹配到结束标签就出栈
   */
  // 对模板进行编译处理
  function parseHTML(html) {
    const ELEMENT_TYPE = 1; // 元素类型
    const TEXT_TYPE = 3; // 文本类型
    const stack = []; // 用于存放元素的栈
    let currentParent; // 指向的是栈中的最后一个
    let root;

    // 最终需要转化成一颗抽象语法树
    function createASTElement(tag, attrs) {
      return {
        tag,
        // 标签名
        type: ELEMENT_TYPE,
        // 类型
        attrs,
        // 属性
        parent: null,
        children: []
      };
    }

    // 处理开始标签，利用栈型结构 来构造一颗树
    function start(tag, attrs) {
      let node = createASTElement(tag, attrs); // 创造一个 ast节点
      if (!root) {
        root = node; // 如果root为空，则当前是树的根节点
      }

      if (currentParent) {
        node.parent = currentParent; // 只赋予了parent属性
        currentParent.children.push(node); // 还需要让父亲记住自己
      }

      stack.push(node);
      currentParent = node; // currentParent为栈中的最后一个
    }

    // 处理文本
    function chars(text) {
      text = text.replace(/\s/g, '');
      // 文本直接放到当前指向的节点中
      if (text) {
        currentParent.children.push({
          type: TEXT_TYPE,
          text,
          parent: currentParent
        });
      }
    }

    // 处理结束标签
    function end(tag) {
      stack.pop(); // 弹出栈中最后一个ast节点\
      currentParent = stack[stack.length - 1];
    }

    // 剔除 template 已匹配的内容
    function advance(n) {
      html = html.substring(n);
    }

    // 解析开始标签
    function parseStartTag() {
      const start = html.match(startTagOpen);
      if (start) {
        const match = {
          tagName: start[1],
          // 标签名
          attrs: []
        };
        advance(start[0].length);
        let attr, end;
        // 如果不是开始标签的结束 就一直匹配下去
        while (!(end = html.match(startTagClose)) && (attr = html.match(attribute))) {
          advance(attr[0].length);
          match.attrs.push({
            name: attr[1],
            value: attr[3] || attr[4] || attr[5] || true
          });
        }

        // 如果不是开始标签的结束
        if (end) {
          advance(end[0].length);
        }
        return match;
      }
      return false;
    }
    while (html) {
      // 如果textEnd = 0 说明是一个开始标签或者结束标签
      // 如果textEnd > 0 说明就是文本的结束位置
      let textEnd = html.indexOf('<');
      if (textEnd == 0) {
        // 开始标签的解析結果，包括 标签名 和 属性
        const startTagMatch = parseStartTag();
        if (startTagMatch) {
          start(startTagMatch.tagName, startTagMatch.attrs);
          continue;
        }

        // 匹配结束标签
        let endTagMatch = html.match(endTag);
        if (endTagMatch) {
          advance(endTagMatch[0].length);
          end(endTagMatch[1]);
          continue;
        }
      }
      if (textEnd > 0) {
        let text = html.substring(0, textEnd); // 截取文本内容
        if (text) {
          chars(text);
          advance(text.length);
        }
      }
    }
    return root;
  }

  // 根据ast语法树的 attrs属性对象 生成相对应的属性字符串
  function genProps(attrs) {
    let str = '';
    for (let i = 0; i < attrs.length; i++) {
      let attr = attrs[i];
      if (attr.name === 'style') {
        // color:red;background:red => {color:'red',background:red}
        let obj = {};
        // 可以使用 qs 库
        attr.value.split(';').forEach(item => {
          let [key, value] = item.split(':');
          obj[key.trim()] = value.trim();
        });
        attr.value = obj;
      }
      str += `${attr.name}:${JSON.stringify(attr.value)},`; // id:'app',class:'app-inner',
    }

    return `{${str.slice(0, -1)}}`;
  }
  const defaultTagRE = /\{\{((?:.|\r?\n)+?)\}\}/g; // 匹配到的内容就是我们表达式的变量，例如 {{ name }}
  function gen(node) {
    if (node.type === 1) {
      // 元素
      return codegen(node);
    } else {
      // 文本
      let text = node.text;
      if (!defaultTagRE.test(text)) {
        // _v('hello')
        return `_v(${JSON.stringify(text)})`;
      } else {
        //_v( _s(name) + 'hello' + _s(age))
        let tokens = [];
        let match;
        defaultTagRE.lastIndex = 0;
        let lastIndex = 0;
        while (match = defaultTagRE.exec(text)) {
          let index = match.index; // 匹配项的第一个字符在字符串中的位置  {{name}} hello  {{age}} word
          if (index > lastIndex) {
            tokens.push(JSON.stringify(text.slice(lastIndex, index)));
          }
          tokens.push(`_s(${match[1].trim()})`);
          lastIndex = index + match[0].length;
        }
        if (lastIndex < text.length) {
          tokens.push(JSON.stringify(text.slice(lastIndex)));
        }
        return `_v(${tokens.join('+')})`;
      }
    }
  }

  // 根据ast语法树的 children对象 生成相对应的 children字符串
  function genChildren(children) {
    return children.map(child => gen(child)).join(',');
  }

  /**
   * @name 代码生成
   * @desc 生成指定格式的render方法代码字符串，再利用模版引擎生成render函数
   * @desc 我们会在Vue原型上扩展 render 函数相关的方法， _c _s _v
   * @desc _c: 创建节点虚拟节点VNode    _v: 创建文本虚拟节点VNode   _s: 处理变量
   */
  function codegen(ast) {
    let children = genChildren(ast.children);
    let code = `_c('${ast.tag}',${ast.attrs.length > 0 ? genProps(ast.attrs) : 'null'}${ast.children.length ? `,${children}` : ''})`;
    return code;
  }
  function compileToFunction(template) {
    console.log('html模版字符串：\n', template);

    // 1.就是将 template 转化成 ast 语法树
    let ast = parseHTML(template);
    console.log('AST语法树：\n', ast);

    // 2.生成render方法代码字符串 (render方法执行后的返回的结果就是 虚拟DOM)
    let code = codegen(ast);
    console.log('代码串：\n', code);

    // 模板引擎的实现原理就是 with + new Function
    code = `with(this){return ${code}}`;
    let render = new Function(code); // 根据代码生成render函数
    console.log('render：\n', render);
    return render;
  }

  //  html模版字符串
  // <div id="app" style="color: red; background: yellow">
  //   hello {{ name }} world
  //   <span></span>
  // </div>

  // 转换为 AST语法树
  // {
  //   tag: 'div',
  //   type: 1,
  //   attrs: [
  //     { name: 'id', value: 'app' },
  //     { name: 'style', value: { color: 'red', background: 'yellow' } },
  //   ],
  //   parent: null,
  //   children: [
  //     { text: 'hello{{name}}world', type: 3, parent: {...} },
  //     { tag: 'span', type: 1, attrs: [], children: [], parent: {...} },
  //   ],
  // }

  // 将 AST语法树 转化成 render代码字符串
  // _c: 创建节点虚拟节点VNode    _v: 创建文本虚拟节点VNode   _s: 处理变量
  // `_c('div',{id:"app",style:{"color":"red"," background":"yellow"}},_v("hello"+_s(name)+"world"),_c('span',null))`
  // 利用模版引擎转换成可执行的render函数
  // ƒ anonymous(
  //   ) {
  //     with(this){
  //       return _c('div',{id:"app",style:{"color":"red","background":"yellow"}},
  //                 _v("hello"+_s(name)+"world"),
  //                 _c('span',null))}
  //   }

  /**
   * @name Dep收集器
   * @decs 每个响应式属性有一个 dep 收集器（属性就是被观察者，watcher就是观察者），属性变化了会通知观察者来更新 -》 这就是我们的观察者模式
   * @decs 需要给每个响应式属性增加一个 dep， 目的就是收集watcher，当响应式数据发生变化时，更新收集的所有 watcher
   * @todo 1. dep 和 watcher 是一个多对多的关系
   * @todo 2. 一个属性可以在多个组件中使用 （一个 dep 对应多个 watcher）
   * @todo 3. 一个组件中由多个属性组成 （一个 watcher 对应多个 dep）
   * @split 计算属性---------
   * @todo 1. pushTarget
   * @todo 2. popTarget
   */

  let id$1 = 0;
  class Dep {
    constructor() {
      this.id = id$1++;
      // 依赖收集，收集当前属性对应的观察者 watcher
      this.subs = [];
    }
    // 通知 watcher 收集 dep
    depend() {
      Dep.target.addDep(this);
    }
    // 让当前的 dep收集 watcher
    addSub(watcher) {
      this.subs.push(watcher);
    }
    // 通知当前 dep关联的所有 watcher 去更新
    notify() {
      this.subs.forEach(watcher => watcher.update());
    }
  }

  // 当前渲染的 watcher，静态变量，类似于全局变量，只有一份
  Dep.target = null;

  // 存放 watcher 的栈， 目的：用于洋葱模型中，计算属性watcher 订阅的dep去收集上层watcher（可能是计算属性watcher，也可能是渲染watcher)
  let stack = [];
  // 当前 watcher 入栈， Dep.target 指向 当前 watcher
  function pushTarget(watcher) {
    stack.push(watcher);
    Dep.target = watcher;
  }
  // 栈中最后一个 watcher 出栈，Dep.target指向栈中 最后一个 watcher，若栈为空，则为 undefined
  function popTarget() {
    stack.pop();
    Dep.target = stack[stack.length - 1];
  }

  /** 实现暴露给用户API回调的异步更新 - nextTick */
  let callbacks = []; // 存储 nextTick 回调
  let waiting = false; // 防抖

  function flushCallbacks() {
    let cbs = callbacks.slice(0);
    waiting = false;
    callbacks = [];
    cbs.forEach(cb => cb()); // 按照顺序依次执行
  }

  // vue2中 nextTick 没有直接使用某个api 而是采用优雅降级的方式
  // 内部先采用的是 promise(IE不兼容，微任务)  MutationObserver(H5的api，微任务)  setImmediate(IE专享，宏任务)  setTimeout（宏任务)
  let timerFunc;
  if (Promise) {
    timerFunc = () => {
      Promise.resolve().then(flushCallbacks);
    };
  } else if (MutationObserver) {
    let observer = new MutationObserver(flushCallbacks); // 这里传入的回调是异步执行的
    let textNode = document.createTextNode(1);
    observer.observe(textNode, {
      characterData: true
    });
    timerFunc = () => {
      textNode.textContent = 2;
    };
  } else if (setImmediate) {
    timerFunc = () => {
      setImmediate(flushCallbacks);
    };
  } else {
    timerFunc = () => {
      setTimeout(flushCallbacks);
    };
  }
  function nextTick(cb) {
    // 先内部还是先用户的？按照顺序依次执行
    callbacks.push(cb); // 维护 nextTick 中的 cakllback 方法
    if (!waiting) {
      timerFunc();
      waiting = true;
    }
  }

  /** 实现内部 watcher 异步更新 - nextTick */
  let queue = [];
  let has = {};
  let pending = false; // 防抖

  function flushSchedulerQueue() {
    let flushQueue = queue.slice(0);
    queue = [];
    has = {};
    pending = false;
    flushQueue.forEach(q => q.run()); // 在刷新的过程中可能还有新的 watcher，重新放到 queue 中
  }

  function queueWatcher(watcher) {
    const id = watcher.id;
    if (!has[id]) {
      queue.push(watcher);
      has[id] = true;
      // 不管我们的 update 执行多少次 ，但是最终只执行一轮刷新操作
      if (!pending) {
        nextTick(flushSchedulerQueue);
        pending = true;
      }
    }
  }

  /**
   * @name Watcher
   * @decs 每个响应式属性有一个dep 收集器（属性就是被观察者，watcher就是观察者），属性变化了会通知观察者来更新 -》 这就是我们的观察者模式
   * @decs 不同组件有不同的 watcher，目前我们只有一个渲染根实例的 watcher
   * @todo 1. 当我们创建渲染 watcher 的时候，我们会把当前的渲染 watcher 放到 Dep.target 上
   * @todo 2. 调用_render() 会取值，走到 getter 上，调用 dep.depend() 进行双向依赖收集操作
   * @split 计算属性watcher---------
   * @todo 1. lazy：懒的，不会立即执行get方法
   * @todo 2. dirty：脏的，决定重新读取get返回值 还是 读取缓存值
   * @todo 3. value：存储 get返回值
   * @todo 4. evaluate 计算属性watcher为脏时，执行 evaluate，并将其标识为干净的
   * @todo 5. depend 用于洋葱模型中计算属性watcher订阅的dep 去depend收集上层watcher 即Dep.target（可能是计算属性watcher，也可能是渲染watcher)
   * @split 监听器watcher---------
   * @todo 1. user：用户watcher，即监听器watcher
   * @todo 2. deep：深度监听，若为深度监听，则在 get 方法中递归取值，让每一个子属性都收集监听器watcher
   * @todo 3. cb：监听器回调
   * @todo 4. 在 queueWatcher 内部执行 run 方法时，如果是 用户watcher，则执行监听器cb回调方法
   */
  let id = 0;
  class Watcher {
    constructor(vm, exprOrFn, options, cb) {
      this.id = id++;
      if (typeof exprOrFn === 'string') {
        this.getter = function () {
          return vm[exprOrFn];
        };
      } else {
        this.getter = exprOrFn; // getter意味着调用这个函数可以发生取值操作
      }

      this.deps = []; // 存储订阅dep，用于后续我们实现计算属性洋葱模型，和一些清理工作
      this.depsId = new Set(); // 用于去重

      // 计算属性watcher 用到的属性
      this.vm = vm;
      this.lazy = options.lazy; // 懒的，不会立即执行get方法
      this.dirty = this.lazy; // 脏的，决定重新读取get返回值 还是 读取缓存值

      // 监听器watcher 用到的属性
      this.user = options.user; // 标识是否是用户自己的watcher
      this.deep = options.deep;
      this.cb = cb;
      this.value = this.lazy ? undefined : this.get(); // 存储 get返回值
    }
    // 订阅 dep，并通知 dep 收集 watcher
    addDep(dep) {
      // 一个组件 对应 多个属性 重复的属性不用记录，去重操作
      let id = dep.id;
      if (!this.depsId.has(id)) {
        this.deps.push(dep);
        this.depsId.add(id);
        dep.addSub(this); // watcher已经记住了dep，而且已经去重了，此时让 dep 也记住 watcher
      }
    }

    get() {
      pushTarget(this); // Dep.target 是一个静态属性
      // 执行vm._render时，去vm上取 name 和 age。vm._render -> vm.$options.render.call(vm) -> with(this){} -> _s(name) -> 就会去作用域链 即this 上取 name
      // JavaScript 查找某个未使用命名空间的变量时，会通过作用域链来查找，作用域链是跟执行代码的 context 或者包含这个变量的函数有关。'with'语句将某个对象添加到作用域链的顶部，如果在 statement 中有某个未使用命名空间的变量，跟作用域链中的某个属性同名，则这个变量将指向这个属性值
      let value = this.getter.call(this.vm); // 会去vm上取值  vm._update(vm._render) 取name 和age

      // 深度监听
      this.deep && JSON.stringify(value);
      popTarget(); // 渲染完毕后就清空，保证了只有在模版渲染阶段的取值操作才会进行依赖收集
      return value;
    }
    // 重新渲染
    update() {
      console.log('watcher-update');
      if (this.lazy) {
        // 计算属性依赖的值发生改变，触发 setter 通知 watcher 更新，将计算属性watcher 标识为脏值即可
        // 后面还会触发渲染watcher，会走 evaluate 重新读取返回值
        this.dirty = true;
      } else {
        queueWatcher(this); // 把当前的watcher 暂存起来，异步队列渲染
        // this.get(); // 重新渲染
      }
    }

    // queueWatcher 内部执行 run 方法
    run() {
      let oldValue = this.value;
      let newValue = this.value = this.get(); // 渲染的时候用的是最新的vm来渲染的，需要重新赋值啊！！！！！
      if (this.user) {
        this.cb.call(this.vm, newValue, oldValue);
      }
    }

    // 计算属性watcher为脏时，执行 evaluate，并将其标识为干净的
    evaluate() {
      this.value = this.get(); // 重新获取到用户函数的返回值
      this.dirty = false;
    }
    // 用于洋葱模型中计算属性watcher 订阅的dep去 depend收集上层watcher 即Dep.target（可能是计算属性watcher，也可能是渲染watcher)
    depend() {
      let i = this.deps.length;
      while (i--) {
        this.deps[i].depend();
      }
    }
  }

  /**
   * @name 虚拟DOM相关方法
   */

  // h()  _c() 创建元素的虚拟节点
  function createElementVNode(vm, tag, data, ...children) {
    if (data == null) {
      data = {};
    }
    let key = data.key;
    if (key) {
      delete data.key;
    }
    return vnode(vm, tag, key, data, children);
  }

  // _v() 创建文本虚拟节点
  function createTextVNode(vm, text) {
    return vnode(vm, undefined, undefined, undefined, undefined, text);
  }

  // VNode 和 AST一样吗？ AST做的是语法层面的转化，他描述的是语法本身 (可以描述 js css html)
  // 我们的VNode 是描述的dom元素，可以增加一些自定义属性
  function vnode(vm, tag, key, data, children, text) {
    return {
      vm,
      tag,
      key,
      data,
      children,
      text
      // ....
    };
  }

  /**
   * @name 初始化元素
   * @desc 在Vue原型上扩展 render 函数相关的方法， _c _s _v _update...
   * @desc 调用render方法产生虚拟DOM，即以 VNode节点作为基础的树
   * @desc 将vnode转化成真实dom 并 挂载页面
   * @todo patch 既有初始化元素的功能 ，又有更新元素的功能
   * @todo mountComponent 方法内实例化一个渲染 watcher，并立即执行其回调
   * @todo callHook 调用生命周期钩子函数
   */

  // 利用vnode创建真实元素
  function createElm(vnode) {
    let {
      tag,
      data,
      children,
      text
    } = vnode;
    if (typeof tag === 'string') {
      // 标签
      vnode.el = document.createElement(tag); // 这里将真实节点和虚拟节点对应起来，后续如果修改属性了
      patchProps(vnode.el, data);
      children.forEach(child => {
        vnode.el.appendChild(createElm(child));
      });
    } else {
      vnode.el = document.createTextNode(text);
    }
    return vnode.el;
  }
  // 对比属性打补丁
  function patchProps(el, props) {
    for (let key in props) {
      if (key === 'style') {
        // { color: 'red', "background": 'yellow' }
        for (let styleName in props.style) {
          el.style[styleName] = props.style[styleName];
        }
      } else {
        el.setAttribute(key, props[key]);
      }
    }
  }
  // patch既有初始化元素的功能 ，又有更新元素的功能
  function patch(oldVNode, vnode) {
    // 写的是初渲染流程
    const isRealElement = oldVNode.nodeType;
    if (isRealElement) {
      const elm = oldVNode; // 获取真实元素
      const parentElm = elm.parentNode; // 拿到父元素
      let newElm = createElm(vnode);
      console.log('利用vnode创建真实元素\n', newElm, parentElm);
      parentElm.insertBefore(newElm, elm.nextSibling);
      parentElm.removeChild(elm); // 删除老节点

      return newElm;
    }
  }

  // 在Vue原型上扩展 render 函数相关的方法， _c _s _v ...
  function initLifeCycle(Vue) {
    // _c('div',{},...children)
    // _c('div',{id:"app",style:{"color":"red"," background":"yellow"}},_v("hello"+_s(name)+"world"),_c('span',null))
    Vue.prototype._c = function () {
      return createElementVNode(this, ...arguments);
    };
    // _v(text)
    Vue.prototype._v = function () {
      return createTextVNode(this, ...arguments);
    };
    Vue.prototype._s = function (value) {
      if (typeof value !== 'object') return value;
      return JSON.stringify(value);
    };
    Vue.prototype._render = function () {
      // 当渲染的时候会去实例中取值，我们就可以将属性和视图绑定在一起
      const vm = this;
      return vm.$options.render.call(vm); // 通过ast语法转义后生成的 render方法
    };

    Vue.prototype._update = function (vnode) {
      // 将vnode转化成真实dom
      const vm = this;
      const el = vm.$el;
      // patch既有初始化元素的功能 ，又有更新元素的功能
      vm.$el = patch(el, vnode);
    };
  }

  // 初始化元素
  function mountComponent(vm, el) {
    // 这里的el 是通过querySelector获取的
    vm.$el = el;
    const updateComponent = () => {
      // vm._render 创建虚拟DOM
      // vm._update 把 VNode 渲染成真实的DOM
      vm._update(vm._render());
    };

    // true用于标识是一个渲染watcher
    const watcher = new Watcher(vm, updateComponent, true);
    console.log('watcher', watcher);
  }

  // vue核心流程
  // 1） 创造了响应式数据
  // 2） 将模板字符串 转换成 ast语法树
  // 3)  将ast语法树 转换成 指定格式的render函数字符串，利用模版引擎再次转换成 render函数，后续每次数据更新可以只执行render函数 (无需再次执行ast转化的过程)
  // 4） 利用render函数去创建 虚拟DOM（使用响应式数据）
  // 5） 根据生成的虚拟节点创造真实的DOM

  // 调用生命周期钩子函数
  function callHook(vm, hook) {
    const handlers = vm.$options[hook];
    if (handlers) {
      handlers.forEach(handler => handler.call(vm));
    }
  }

  /**
   * @name 重写数组7个可以改变自身的方法，切片编程
   * @todo 1. Vue 的响应式是通过 Object.defineProperty() 实现的，这个 api 没办法监听数组长度的变化，也就没办法监听数组的新增。
   * @todo 2. Vue 无法检测通过数组索引改变数组的操作，这不是 Object.defineProperty() api 的原因，而是尤大认为性能消耗与带来的用户体验不成正比。对数组进行响应式检测会带来很大的性能消耗，因为数组项可能会大，比如1000条、10000条。
   * @todo 3. defineProperty无法监听数组的新增，即无法触发set方法。可手动对新增内容进行观测 并 手动触发watcher更新 - ob.dep.notify()
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

      // 通知 watcher 更新渲染
      ob.dep.notify();
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
   * @split 依赖收集--------- 
   * @todo 8. 触发 getter 时双向依赖收集操作 dep.depend()
   * @todo 9. 触发 setter 时通知 watcher 更新 dep.notify()
   * @split $set原理---------
   * @todo 10. 给每个数组/对象都增加 dep 收集功能，这样就可以通过 xxx.__ob__.dep.notify() 手动触发 watcher 更新了 即 vm.$set 原理
   * @todo 11. 递归收集，数组的话需要递归处理，因为数组中的嵌套 数组/对象 无法走到 Object.defineProperty，所以说无法被劫持
   */
  class Observer {
    constructor(data) {
      // 给每个数组/对象都增加 dep 收集功能
      // 对于数组来说，[1, 2, [3, 4, 5], {a: 6}]，其成员中的数组和对象本身是没有被劫持过的
      // 对于对象来说，{list: [1, 2, 3], info:{a: 4, b: 5}}，其属性中的数组和对象本身虽然其实被劫持过了。但是必须引用改变，才可以触发setter，更新 watcher。在外部无法调用这个 dep 收集器的相关方法去更新 watcher
      // 如果想要在数组新增成员或者对象新增属性后，也可以更新 watcher，必须在给数组/对象本身增加 dep 收集器，这样就可以通过 xxx.__ob__.dep.notify() 手动触发 watcher 了
      this.dep = new Dep();

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
    // 如果不传入默认值，而是在getter、setter中访问 data[key]，则会出现栈溢出的现象   getter -> data.name -> getter -> data.name ->...无限循环
    walk(data) {
      Object.keys(data).forEach(key => defineReactive(data, key, data[key]));
    }

    // 观测数组
    observeArray(data) {
      data.forEach(item => observe(item));
    }
  }

  // 深层次嵌套会递归处理，递归多了性能就差  vue3-> proxy
  function dependArray(value) {
    for (let i = 0; i < value.length; i++) {
      let current = value[i];
      current.__ob__ && current.__ob__.dep.depend();
      if (Array.isArray(current)) {
        dependArray(current);
      }
    }
  }

  // 使用defineProperty API进行属性劫持
  function defineReactive(target, key, value) {
    // 深度属性劫持，对所有的数组/对象都进行属性劫持，childOb.dep 用来收集依赖的
    let childOb = observe(value);
    let dep = new Dep(); // 每一个属性都有一个 dep

    // Object.defineProperty只能劫持已经存在的属性，新增属性无法劫持 （vue里面会为此单独写一些语法糖  $set $delete）
    Object.defineProperty(target, key, {
      // 取值的时候 会执行get
      get() {
        // 保证了只有在模版渲染阶段的取值操作才会进行依赖收集
        if (Dep.target) {
          console.log('>>>>>get', key);
          dep.depend(); // 让当前的watcher 记住这个 dep；同时让这个属性的 dep 记住当前的 watcher
          if (childOb) {
            childOb.dep.depend(); // 让数组/对象本身也实现依赖收集，$set原理
            if (Array.isArray(value)) {
              // 数组的话需要递归处理，因为数组中的嵌套 数组/对象 无法走到 Object.defineProperty，所以说无法被劫持
              dependArray(value);
            }
          }
        }
        return value;
      },
      // 修改的时候 会执行set
      set(newValue) {
        if (newValue === value) return;

        // 修改属性之后重新观测，目的：新值为对象或数组的话，可以劫持其数据
        observe(newValue);
        value = newValue;

        // 通知 watcher 更新
        dep.notify();
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
   * @name Vue初始化状态（初始化数据、初始化计算属性）
   * @split 初始化数据---------
   * @todo 1. 对data进行劫持，并将data挂载到vm上 vm._data = data
   * @todo 2. 循环data，将vm._data用vm来代理
   * @split 初始化计算属性---------
   * @todo 1. 给每个计算属性都创建一个 watcher，并标识为 lazy，不会立即执行 get-fn，并将计算属性watcher 都保存到 vm上
   * @todo 2. 劫持计算属性getter/setter
   * @todo 3. 当访问计算属性时，如果为脏的，则重新获取值，如果为干净的，则取 watcher上的缓存值，还要让计算属性watcher订阅的dep，我们应该让当前计算属性watcher 订阅的dep，也去收集上一层的watcher 即 Dep.target（可能是计算属性watcher，也可能是渲染watcher)
   * @split 初始化监听器---------
   * @todo 1. key：需要观察的表达式；要兼容 字符串 or 函数
   * @todo 2. handler：回调函数；要兼容 数组 or （字符串、函数、对象）情况
   * @todo 3. 最终调用 vm.$watch 去创建一个监听器watch
   */

  // 初始化状态
  function initState(vm) {
    const opts = vm.$options; // 获取所有的选项

    // 初始化数据
    if (opts.data) {
      initData(vm);
    }

    // 初始化计算属性
    if (opts.computed) {
      initComputed(vm);
    }

    // 初始化监听器
    if (opts.watch) {
      initWatch(vm);
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

  // 初始化计算属性
  function initComputed(vm) {
    const computed = vm.$options.computed;
    const watchers = vm._computedWatchers = {}; // 将每个计算属性对应的watcher 都保存到 vm上
    for (let key in computed) {
      let userDef = computed[key];

      // 兼容不同写法 函数方式 和 对象getter/setter方式
      let fn = typeof userDef === 'function' ? userDef : userDef.get;

      // 给每个计算属性都创建一个 watcher，并标识为 lazy，不会立即执行 get-fn
      watchers[key] = new Watcher(vm, fn, {
        lazy: true
      });

      // 劫持计算属性getter/setter
      defineComputed(vm, key, userDef);
    }
  }

  // 劫持计算属性
  function defineComputed(target, key, userDef) {
    const setter = userDef.set || (() => {});
    Object.defineProperty(target, key, {
      get: createComputedGetter(key),
      set: setter
    });
  }

  // 劫持计算属性的访问/getter
  function createComputedGetter(key) {
    return function () {
      const watcher = this._computedWatchers[key]; // this就是 defineProperty 劫持的targer。获取到计算属性对应的watcher

      // 如果是脏的，就去执行用户传入的函数
      if (watcher.dirty) {
        watcher.evaluate(); // 求值后 dirty变为false，下次就不求值了，走缓存
      }

      // 当前计算属性watcher 出栈后，还有渲染watcher 或者其他计算属性watcher，我们应该让当前计算属性watcher 订阅的 dep，也去收集上一层的watcher 即Dep.target（可能是计算属性watcher，也可能是渲染watcher)
      // 注：计算属性根本不会收集依赖，但是会让自己的依赖属性去收集watcher
      if (Dep.target) {
        watcher.depend();
      }

      // 返回watcher上的值
      return watcher.value;
    };
  }

  // 初始化监听器
  function initWatch(vm) {
    let watch = vm.$options.watch;
    for (let key in watch) {
      const handler = watch[key]; // handler有可能是 (字符串 函数 对象) 或 数组
      if (Array.isArray(handler)) {
        for (let i = 0; i < handler.length; i++) {
          createWatcher(vm, key, handler[i]);
        }
      } else {
        createWatcher(vm, key, handler);
      }
    }
  }

  // 最终调用 vm.$watch 去创建一个监听器watch
  function createWatcher(vm, key, handler) {
    let options = {};
    // handler 有可能是 字符串  函数 对象
    if (typeof handler === 'string') {
      handler = vm[handler];
    }
    // 兼容对象
    else if (Object.prototype.toString.call(handler) === '[object Object]') {
      options = handler;
      handler = handler.handler;
    }
    return vm.$watch(key, handler, options);
  }

  /**
   * @name 工具类方法
   * @decs 重点关注下 策略模式 的应用，可以大大减少 if else 代码量
   */

  const strats = {};
  const LIFECYCLE = ['beforeCreate', 'created', 'beforeMount', 'mounted', 'beforeUpdate', 'updated', 'beforeDestroy', 'destroyed'];
  LIFECYCLE.forEach(hook => {
    strats[hook] = function (p, c) {
      // 第一次 { } { created: function(){} }   => { created: [fn] }
      // 第二次 { created: [fn] }  { created: function(){} } => { created: [fn,fn] }
      // 第三次 { created: [fn,fn] }  { } => { created: [fn,fn] }
      if (c) {
        if (p) {
          // 如果儿子有，父亲有
          return p.concat(c);
        } else {
          // 儿子有，父亲没有，则将儿子包装成数组
          return [c];
        }
      } else {
        return p; // 如果儿子没有，则用父亲即可
      }
    };
  });

  // 合并选项
  function mergeOptions(parent, child) {
    const options = {};
    // 循环老的options { }
    for (let key in parent) {
      mergeField(key);
    }
    // 循环新的options { created: function(){} }
    for (let key in child) {
      if (!parent.hasOwnProperty(key)) {
        mergeField(key);
      }
    }
    function mergeField(key) {
      // 策略模式 用策略模式减少if /else
      if (strats[key]) {
        options[key] = strats[key](parent[key], child[key]);
      } else {
        // 如果不在策略中则以儿子为主
        options[key] = child[key] || parent[key];
      }
    }
    return options;
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
      // mixin原理 将合并后的选项挂载到vm实例上    this.constructor.options  即 构造函数上的options = Vue.options
      vm.$options = mergeOptions(this.constructor.options, options);
      callHook(vm, 'beforeCreate'); // 访问不到 this.xxx

      // 初始化状态
      initState(vm);
      callHook(vm, 'created'); // 可以访问到 this.xxx

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
        if (ops.template && el) {
          template = ops.template;
        } else if (!ops.template && el) {
          template = el.outerHTML;
        }
        if (template && el) {
          // 这里需要对模板进行编译
          const render = compileToFunction(template);
          ops.render = render; // 最终会被编译成 h('xxx')
        }
      }

      mountComponent(vm, el); // 组件的挂载

      // script 标签引用的 vue.global.js 这个编译过程是在浏览器运行的
      // runtime是不包含模板编译的, 整个编译是打包的时候通过loader来转义.vue文件的, 用runtime的时候不能使用template
    };
  }

  /**
   * @name 全局API
   */
  function initGlobalAPI(Vue) {
    // 静态属性
    Vue.options = {};
    // 静态方法
    Vue.mixin = function (mixin) {
      // 将 全局的options 和 用户的选项 进行合并
      this.options = mergeOptions(this.options, mixin);
      return this;
    };
  }

  /**
   * @name 实现Vue构造函数
   */

  // 通过构造函数扩展方法
  function Vue(options) {
    this._init(options); // 默认就调用了init
  }

  initMixin(Vue); // 在Vue原型上扩展init方法  Vue.prototype._init  Vue.prototype.$mount
  initLifeCycle(Vue); // 在Vue原型上扩展 render 函数相关的方法   Vue.prototype._render   Vue.prototype._update

  initGlobalAPI(Vue); // 在Vue上扩展全局属性和方法 Vue.options Vue.mixin

  Vue.prototype.$nextTick = nextTick; // 把 nextTick 挂载到vue原型上，方便用户在实例上使用

  // 监听的值发生变化了，直接执行cb函数即可
  Vue.prototype.$watch = function (exprOrFn, cb, options = {}) {
    options.user = true;
    // exprOrFn 可能是 字符串firstname or 函数()=>vm.firstname
    const watcher = new Watcher(this, exprOrFn, options, cb);

    // 立即执行
    if (options.immediate) {
      cb.call(this, watcher.value, undefined);
    }
  };

  return Vue;

}));
//# sourceMappingURL=vue.js.map
