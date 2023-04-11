/**
 * @name patch比对 - 核心就是diff算法
 * @desc diff算法是一个平级比较的过程，父亲和父亲比对，儿子和儿子比对
 * @todo 1、新老节点不相同（判断节点的tag和节点的key），直接用新节点替换老节点，无需比对
 * @todo 2、两个节点是同一个节点 (判断节点的tag和节点的key) ，比较两个节点的属性是否有差异（复用老的节点，将差异的属性更新）
 * @todo 3、节点比较完毕后，,需要比较两个节点的儿子
 * @todo 3.1、新节点有孩子，老节点没有孩子，挂载
 * @todo 3.2、老节点有孩子，新节点没有孩子，删除
 * @todo 3.3、新老节点都有孩子 - diff核心算法
 */
import { isSameVnode } from './index'

// 利用vnode创建真实元素
export function createElm(vnode) {
  let { tag, data, children, text } = vnode
  if (typeof tag === 'string') {
    // 标签
    vnode.el = document.createElement(tag) // 这里将真实节点和虚拟节点对应起来，后续如果修改属性了
    patchProps(vnode.el, {}, data)
    children.forEach(child => {
      vnode.el.appendChild(createElm(child))
    })
  } else {
    // 文本
    vnode.el = document.createTextNode(text)
  }
  return vnode.el
}

// 对比属性打补丁
export function patchProps(el, oldProps = {}, props = {}) {
  // 老的属性中有，新的没有  要删除老的
  let oldStyles = oldProps.style || {}
  let newStyles = props.style || {}

  for (let key in oldStyles) {
    // 老的样式中有，新的没有，则删除
    if (!newStyles[key]) {
      el.style[key] = ''
    }
  }
  for (let key in oldProps) {
    // 老的属性中有，新的没有，则删除
    if (!props[key]) {
      el.removeAttribute(key)
    }
  }

  for (let key in props) {
    if (key === 'style') {
      // { color: 'red', "background": 'yellow' }
      for (let styleName in props.style) {
        el.style[styleName] = props.style[styleName]
      }
    } else {
      el.setAttribute(key, props[key])
    }
  }
}

// patch既有初始化元素的功能 ，又有更新元素的功能
export function patch(oldVNode, vnode) {
  // 写的是初渲染流程
  const isRealElement = oldVNode.nodeType
  if (isRealElement) {
    const elm = oldVNode // 获取真实元素
    const parentElm = elm.parentNode // 拿到父元素
    let newElm = createElm(vnode)
    console.log('利用vnode创建真实元素\n', newElm, parentElm)

    parentElm.insertBefore(newElm, elm.nextSibling)
    parentElm.removeChild(elm) // 删除老节点

    return newElm
  } else {
    // diff 算法
    return patchVnode(oldVNode, vnode)
  }
}

function patchVnode(oldVNode, vnode) {
  // 1. 新老节点不相同（判断节点的tag和节点的key），直接用新节点替换老节点，无需比对
  if (!isSameVnode(oldVNode, vnode)) {
    let el = createElm(vnode)
    oldVNode.el.parentNode.replaceChild(el, oldVNode.el)
    return el
  }
  let el = (vnode.el = oldVNode.el)

  // 2. 新老节点相同，且是文本 (判断节点的tag和节点的key)，比较文本内容
  if (!oldVNode.tag) {
    if (oldVNode.text !== vnode.text) {
      el.textContent = vnode.text // 用新的文本覆盖掉老的
    }
  }

  // 3. 新老节点相同，且是标签 (判断节点的tag和节点的key)
  // 3.1 比较标签属性
  patchProps(el, oldVNode.data, vnode.data)

  let oldChildren = oldVNode.children || []
  let newChildren = vnode.children || []
  // 3.2 比较两个节点的儿子
  // 3.2.1 新老节点都有儿子
  if (oldChildren.length > 0 && newChildren.length > 0) {
    // diff算法核心！！！
    updateChildren(el, oldChildren, newChildren)
  }
  // 3.2.2 新节点有儿子，老节点没有儿子，挂载
  else if (newChildren.length > 0) {
    mountChildren(el, newChildren)
  }
  // 3.2.3 老节点有儿子，新节点没有儿子，删除
  else if (oldChildren.length > 0) {
    el.innerHTML = ''
  }
}

// 挂载孩子
function mountChildren(el, newChildren) {
  for (let i = 0; i < newChildren.length; i++) {
    let child = newChildren[i]
    el.appendChild(createElm(child))
  }
}

// diff - 核心
function updateChildren(el, oldChildren, newChildren) {
  let oldStartIndex = 0
  let newStartIndex = 0
  let oldEndIndex = oldChildren.length - 1
  let newEndIndex = newChildren.length - 1

  let oldStartVnode = oldChildren[0]
  let newStartVnode = newChildren[0]

  let oldEndVnode = oldChildren[oldEndIndex]
  let newEndVnode = newChildren[newEndIndex]

  while (oldStartIndex <= oldEndIndex && newStartIndex <= newEndIndex) {
    if (isSameVnode(oldStartVnode, newStartVnode)) {
      patchVnode(oldStartVnode, newStartVnode) // 如果是相同节点 则递归比较子节点
      oldStartVnode = oldChildren[++oldStartIndex]
      newStartVnode = newChildren[++newStartIndex]
    }
  }
}
