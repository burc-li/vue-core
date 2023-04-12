/**
 * @name patch比对 - 核心就是diff算法
 * @desc diff算法是一个平级比较的过程，父亲和父亲比对，儿子和儿子比对
 * @todo 1、新旧节点不相同（判断节点的tag和节点的key），直接用新节点替换旧节点，无需比对
 * @todo 2、两个节点是同一个节点 (判断节点的tag和节点的key) ，比较两个节点的属性是否有差异（复用旧的节点，将差异的属性更新）
 * @todo 3、节点比较完毕后，,需要比较两个节点的儿子
 * @todo 3.1、新节点有孩子，旧节点没有孩子，挂载
 * @todo 3.2、旧节点有孩子，新节点没有孩子，删除
 * @todo 3.3、新旧节点都有孩子 - diff核心算法
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
  // 旧的属性中有，新的没有  要删除旧的
  let oldStyles = oldProps.style || {}
  let newStyles = props.style || {}

  for (let key in oldStyles) {
    // 旧的样式中有，新的没有，则删除
    if (!newStyles[key]) {
      el.style[key] = ''
    }
  }
  for (let key in oldProps) {
    // 旧的属性中有，新的没有，则删除
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
    parentElm.removeChild(elm) // 删除旧节点

    return newElm
  } else {
    // diff 算法
    return patchVnode(oldVNode, vnode)
  }
}

function patchVnode(oldVNode, vnode) {
  // 1. 新旧节点不相同（判断节点的tag和节点的key），直接用新节点替换旧节点，无需比对
  if (!isSameVnode(oldVNode, vnode)) {
    let el = createElm(vnode)
    oldVNode.el.parentNode.replaceChild(el, oldVNode.el)
    return el
  }
  let el = (vnode.el = oldVNode.el)

  // 2. 新旧节点相同，且是文本 (判断节点的tag和节点的key)，比较文本内容
  if (!oldVNode.tag) {
    if (oldVNode.text !== vnode.text) {
      el.textContent = vnode.text // 用新的文本覆盖掉旧的
    }
  }

  // 3. 新旧节点相同，且是标签 (判断节点的tag和节点的key)
  // 3.1 比较标签属性
  patchProps(el, oldVNode.data, vnode.data)

  let oldChildren = oldVNode.children || []
  let newChildren = vnode.children || []
  // 3.2 比较两个节点的儿子
  // 3.2.1 新旧节点都有儿子
  if (oldChildren.length > 0 && newChildren.length > 0) {
    // diff算法核心！！！
    updateChildren(el, oldChildren, newChildren)
  }
  // 3.2.2 新节点有儿子，旧节点没有儿子，挂载
  else if (newChildren.length > 0) {
    mountChildren(el, newChildren)
  }
  // 3.2.3 旧节点有儿子，新节点没有儿子，删除
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

  function makeIndexByKey(children) {
    let map = {}
    children.forEach((child, index) => {
      map[child.key] = index
    })
    return map
  }
  // 旧孩子映射表(key-index)，用于乱序比对
  let map = makeIndexByKey(oldChildren)

  // 双方有一方头指针大于尾部指针，则停止循环
  while (oldStartIndex <= oldEndIndex && newStartIndex <= newEndIndex) {
    if (!oldStartVnode) {
      oldStartVnode = oldChildren[++oldStartIndex]
      continue
    }
    if (!oldEndVnode) {
      oldEndVnode = oldChildren[--oldEndIndex]
      continue
    }

    // 双端比较_1 - 旧孩子的头 比对 新孩子的头；
    // 都从头部开始比对（对应场景：同序列尾部挂载-push、同序列尾部卸载-pop）
    if (isSameVnode(oldStartVnode, newStartVnode)) {
      patchVnode(oldStartVnode, newStartVnode) // 如果是相同节点，则打补丁，并递归比较子节点
      oldStartVnode = oldChildren[++oldStartIndex]
      newStartVnode = newChildren[++newStartIndex]
    }
    // 双端比较_2 - 旧孩子的尾 比对 新孩子的尾；
    // 都从尾部开始比对（对应场景：同序列头部挂载-unshift、同序列头部卸载-shift）
    else if (isSameVnode(oldEndVnode, newEndVnode)) {
      patchVnode(oldEndVnode, newEndVnode) // 如果是相同节点，则打补丁，并递归比较子节点
      oldEndVnode = oldChildren[--oldEndIndex]
      newEndVnode = newChildren[--newEndIndex]
    }
    // 双端比较_3 - 旧孩子的头 比对 新孩子的尾；
    // 旧孩子从头部开始，新孩子从尾部开始（对应场景：指针尽可能向内靠拢；极端场景-reverse）
    else if (isSameVnode(oldStartVnode, newEndVnode)) {
      patchVnode(oldStartVnode, newEndVnode)
      el.insertBefore(oldStartVnode.el, oldEndVnode.el.nextSibling) // 将 oldStartVnode 移动到 oldEndVnode的后面（把当前节点 移动到 旧列表尾指针指向的节点 后面）
      oldStartVnode = oldChildren[++oldStartIndex]
      newEndVnode = newChildren[--newEndIndex]
    }
    // 双端比较_4 - 旧孩子的尾 比对 新孩子的头；
    // 旧孩子从尾部开始，新孩子从头部开始（对应场景：指针尽可能向内靠拢；极端场景-reverse）
    else if (isSameVnode(oldEndVnode, newStartVnode)) {
      patchVnode(oldEndVnode, newStartVnode)
      el.insertBefore(oldEndVnode.el, oldStartVnode.el) // 将 oldEndVnode 移动到 oldStartVnode的前面（把当前节点 移动到 旧列表头指针指向的节点 前面）
      oldEndVnode = oldChildren[--oldEndIndex]
      newStartVnode = newChildren[++newStartIndex]
    }
    // 乱序比对
    // 根据旧的列表做一个映射关系，拿新的节点去找，找到则移动；找不到则添加；最后删除多余的旧节点
    else {
      let moveIndex = map[newStartVnode.key]
      // 找的到相同的老节点
      if (moveIndex !== undefined) {
        let moveVnode = oldChildren[moveIndex] // 复用旧的节点
        el.insertBefore(moveVnode.el, oldStartVnode.el) // 将 moveVnode 移动到 oldStartVnode的前面（把复用节点 移动到 旧列表头指针指向的节点 前面）
        oldChildren[moveIndex] = undefined // 表示这个旧节点已经被移动过了
        patchVnode(moveVnode, newStartVnode) // 比对属性和子节点
      } 
      // 找不到相同的老节点
      else {
        
        el.insertBefore(createElm(newStartVnode), oldStartVnode.el) // 将 创建的节点 移动到 oldStartVnode的前面（把创建的节点 移动到 旧列表头指针指向的节点 前面）
      }
      newStartVnode = newChildren[++newStartIndex]
    }
  }

  // 同序列尾部挂载，向后追加
  // a b c d
  // a b c d e f
  // 同序列头部挂载，向前追加
  //     a b c d
  // e f a b c d
  if (newStartIndex <= newEndIndex) {
    for (let i = newStartIndex; i <= newEndIndex; i++) {
      let childEl = createElm(newChildren[i])
      // 这里可能是向后追加 ，也可能是向前追加
      let anchor = newChildren[newEndIndex + 1] ? newChildren[newEndIndex + 1].el : null // 获取下一个元素
      // el.appendChild(childEl);
      el.insertBefore(childEl, anchor) // anchor为null的时候等同于 appendChild
    }
  }

  // 同序列尾部卸载，删除尾部多余的旧孩子
  // a b c d e f
  // a b c d
  // 同序列头部卸载，删除头部多余的旧孩子
  // e f a b c d
  //     a b c d
  if (oldStartIndex <= oldEndIndex) {
    for (let i = oldStartIndex; i <= oldEndIndex; i++) {
      if (oldChildren[i]) {
        let childEl = oldChildren[i].el
        el.removeChild(childEl)
      }
    }
  }
}
