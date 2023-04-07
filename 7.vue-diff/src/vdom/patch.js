// 利用vnode创建真实元素
export function createElm(vnode) {
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

// 对比属性打补丁
export function patchProps(el, props) {
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
    // diff算法
  }
}