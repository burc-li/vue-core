/**
 * @name 虚拟DOM相关方法
 */

// h()  _c() 创建元素的虚拟节点
export function createElementVNode(vm, tag, data, ...children) {
  if (data == null) {
    data = {}
  }
  let key = data.key
  if (key) {
    delete data.key
  }
  return vnode(vm, tag, key, data, children)
}

// _v() 创建文本虚拟节点
export function createTextVNode(vm, text) {
  return vnode(vm, undefined, undefined, undefined, undefined, text)
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
    text,
    // ....
  }
}
