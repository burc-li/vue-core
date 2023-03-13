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

  let id$1 = 0;

  // 每个响应式属性有一个 dep 收集器（属性就是被观察者，watcher就是观察者），属性变化了会通知观察者来更新 -》 这就是我们的观察者模式
  // 需要给每个响应式属性增加一个 dep， 目的就是收集watcher，当响应式数据发生变化时，更新收集的所有 watcher

  // dep 和 watcher 是一个多对多的关系
  // 一个属性可以在多个组件中使用 （一个 dep 对应多个 watcher）
  // 一个组件中由多个属性组成 （一个 watcher 对应多个 dep）
  class Dep {
    constructor() {
      this.id = id$1++;
      this.subs = []; // 这里存放着当前属性对应的 watcher
    }
    // 让watcher记住 dep
    depend() {
      console.log('双向依赖收集');
      Dep.target.addDep(this);
    }
    // 给当前的 dep 添加 watcher
    addSub(watcher) {
      this.subs.push(watcher);
    }
    // 更新当前 dep 关联的所有 watcher
    notify() {
      this.subs.forEach(watcher => watcher.update());
    }
  }

  // 当前渲染的 watcher，静态变量，类似于全局变量，只有一份
  Dep.target = null;

  let id = 0;

  // 每个响应式属性有一个dep 收集器（属性就是被观察者，watcher就是观察者），属性变化了会通知观察者来更新 -》 这就是我们的观察者模式
  // 不同组件有不同的 watcher，目前我们只有一个渲染根实例的 watcher

  // 1. 当我们创建渲染 watcher 的时候，我们会把当前的渲染 watcher 放到 Dep.target 上
  // 2. 调用_render() 会取值，走到 get 上
  class Watcher {
    constructor(vm, fn) {
      this.id = id++;
      this.getter = fn;
      this.deps = []; // 用于后续我们实现计算属性，和一些清理工作
      this.depsId = new Set();
      this.get();
    }
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
      // debugger
      Dep.target = this; // Dep.target 是一个静态属性

      // 执行vm._render时，去vm上取 name 和 age。vm._render -> vm.$options.render.call(vm) -> with(this){} -> _s(name) -> 就会去作用域链 即this 上取 name
      // JavaScript 查找某个未使用命名空间的变量时，会通过作用域链来查找，作用域链是跟执行代码的 context 或者包含这个变量的函数有关。'with'语句将某个对象添加到作用域链的顶部，如果在 statement 中有某个未使用命名空间的变量，跟作用域链中的某个属性同名，则这个变量将指向这个属性值
      this.getter();
      Dep.target = null; // 渲染完毕后就清空，保证了只有在模版渲染阶段的取值操作才会进行依赖收集
    }
    // 重新渲染
    update() {
      console.log('watcher-update');
      this.get();
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
   * @desc patch既有初始化元素的功能 ，又有更新元素的功能
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
    // 如果不传入默认值，而是在getter、setter中访问 data[key]，则会出现栈溢出的现象   getter -> data.name -> getter -> data.name ->...无限循环
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
    let dep = new Dep(); // 每一个属性都有一个 dep

    // Object.defineProperty只能劫持已经存在的属性，新增属性无法劫持 （vue里面会为此单独写一些语法糖  $set $delete）
    Object.defineProperty(target, key, {
      // 取值的时候 会执行get
      get() {
        // 保证了只有在模版渲染阶段的取值操作才会进行依赖收集
        if (Dep.target) {
          dep.depend(); // 让当前的watcher 记住这个 dep；同时让这个属性的 dep 记住当前的 watcher
        }
        // console.log('get_v2')
        return value;
      },
      // 修改的时候 会执行set
      set(newValue) {
        // console.log('set_v2')
        if (newValue === value) return;

        // 修改属性之后重新观测，目的：新值为对象或数组的话，可以劫持其数据
        observe(newValue);
        value = newValue;

        // 通知更新
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
   * @name 实现Vue构造函数
   */

  // 通过构造函数扩展方法
  function Vue(options) {
    // options就是用户的选项
    this._init(options); // 默认就调用了init
  }

  initMixin(Vue); // 在Vue原型上扩展init方法
  initLifeCycle(Vue); // 在Vue原型上扩展 render 函数相关的方法

  return Vue;

}));
//# sourceMappingURL=vue.js.map
