// ------------- 为了方便观察前后的虚拟节点--测试的-----------------
import Vue from '../index'
import { compileToFunction } from '../compiler'
import { createElm, patch } from '../vdom/patch'

const renderMap = function () {
  // 1. 新老节点不相同（判断节点的tag和节点的key），直接用新节点替换老节点，无需比对
  // let render1 = compileToFunction(`<h1 key='a'>老节点</h1>`)
  // let render2 = compileToFunction(`<h1 key='b'>新节点</h1>`)

  // 2. 新老节点相同，且是标签，比较标签属性；然后比较孩子（文本孩子）
  let render1 = compileToFunction(`<h1 key="a" style="color: #de5e60; border: 1px solid #de5e60">老节点</h1>`)
  let render2 = compileToFunction(`<h1 key="a" style="background: #FDE6D3; border: 1px solid #de5e60">新节点</h1>`)

  return { render1, render2 }
}

export const diffDemo = function () {
  let render1 = renderMap().render1
  let vm1 = new Vue({ data: { name: 'burc' } })
  let prevVnode = render1.call(vm1)
  let el = createElm(prevVnode)
  document.body.appendChild(el)

  let render2 = renderMap().render2
  let vm2 = new Vue({ data: { name: 'burc' } })
  let nextVnode = render2.call(vm2)

  setTimeout(() => {
    patch(prevVnode, nextVnode)
  }, 1000)
}
