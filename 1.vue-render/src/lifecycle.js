import { createElementVNode, createTextVNode } from './vdom'

/**
 * @name attrs
 * @returns
 */

function createElm(vnode) {
  let { tag, data, children, text } = vnode
  if (typeof tag === 'string') {
    // 标签
    vnode.el = document.createElement(tag) // 这里将真实节点和虚拟节点对应起来，后续如果修改属性了
    patchProps(vnode.el, data)
    children.forEach(child => {
      vnode.el.appendChild(createElm(child))
    })
  } else {
    vnode.el = document.createTextNode(text)
  }
  return vnode.el
}
function patchProps(el, props) {
  for (let key in props) {
    if (key === 'style') {
      // { color: 'red', "background": 'yellow' }
      for (let styleName in props.style) {
        console.log(styleName, props.style[styleName])
        el.style[styleName] = props.style[styleName]
      }
    } else {
      el.setAttribute(key, props[key])
    }
  }
}
function patch(oldVNode, vnode) {
  // 写的是初渲染流程
  const isRealElement = oldVNode.nodeType
  if (isRealElement) {
    const elm = oldVNode // 获取真实元素
    const parentElm = elm.parentNode // 拿到父元素
    let newElm = createElm(vnode)
    console.log('利用vnode创建真实元素', newElm)

    parentElm.insertBefore(newElm, elm.nextSibling)
    parentElm.removeChild(elm) // 删除老节点

    return newElm
  } else {
    // diff算法
  }
}

export function initLifeCycle(Vue) {
  Vue.prototype._update = function (vnode) {
    // 将vnode转化成真实dom
    const vm = this
    const el = vm.$el
    // patch既有初始化元素的功能 ，又有更新元素的功能
    vm.$el = patch(el, vnode)
  }

  // _c('div',{},...children)
  // _c('div',{id:"app",style:{"color":"red"," background":"yellow"}},_v("hello"+_s(name)+"world"),_c('span',null))
  Vue.prototype._c = function () {
    return createElementVNode(this, ...arguments)
  }
  // _v(text)
  Vue.prototype._v = function () {
    return createTextVNode(this, ...arguments)
  }
  Vue.prototype._s = function (value) {
    if (typeof value !== 'object') return value
    return JSON.stringify(value)
  }
  Vue.prototype._render = function () {
    // 当渲染的时候会去实例中取值，我们就可以将属性和视图绑定在一起
    const vm = this
    return vm.$options.render.call(vm) // 通过ast语法转义后生成的 render方法
  }
}

export function mountComponent(vm, el) {
  // 这里的el 是通过querySelector获取的
  vm.$el = el

  // 1.调用render方法产生虚拟节点，即虚拟DOM
  const vnode = vm._render() // 内部调用 vm.$options.render()
  console.log('虚拟节点vnode', vnode)

  // 2.根据虚拟DOM产生真实DOM
  vm._update(vnode)

  // 3.插入到el元素中
}

// vue核心流程
// 1） 创造了响应式数据
// 2） 将模板字符串 转换成 ast语法树
// 3)  将ast语法树 转换成 指定格式的render函数字符串，利用模版引擎再次转换成 render函数，后续每次数据更新可以只执行render函数 (无需再次执行ast转化的过程)
// 4） 利用render函数去创建 虚拟DOM（使用响应式数据）
// 5） 根据生成的虚拟节点创造真实的DOM
