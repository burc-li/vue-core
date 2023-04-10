import Vue from '../index'
import { compileToFunction } from '../compiler'
import { createElm, patch } from '../vdom/patch'

// ------------- 为了方便观察前后的虚拟节点-- 测试的-----------------

export const diffDemo = function () {
  let render1 = compileToFunction(`<ul  a="1" style="color:blue">
  <li>a</li>
  <li>b</li>
  <li>c</li>
  <li>d</li>
</ul>`)
  let vm1 = new Vue({ data: { name: 'burc' } })
  let prevVnode = render1.call(vm1)
  let el = createElm(prevVnode)
  document.body.appendChild(el)


  let render2 = compileToFunction(`<ul  a="1"  style="color:red">
  <li>e</li>
  <li>m</li>
  <li>p</li>
  <li>q</li>
</ul>`)
  let vm2 = new Vue({ data: { name: 'burc' } })
  let nextVnode = render2.call(vm2)


  // 将新的节点替换掉老的，不是直接替换，而是比较两个节点的区别之后再替换 -->>> diff算法
  // diff算法是一个平级比较的过程，父亲和父亲比对，儿子和儿子比对
  setTimeout(() => {
    // let newEl = createElm(nextVnode)
    // el.parentNode.replaceChild(newEl, el)

    patch(prevVnode, nextVnode)
  }, 1000)
}
