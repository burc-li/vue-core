// ------------- 为了方便观察前后的虚拟节点--测试的-----------------
import Vue from '../index'
import {
  compileToFunction
} from '../compiler'
import {
  createElm,
  patch
} from '../vdom/patch'

const renderMap = function () {
  // 1. 新旧节点不相同（判断节点的tag和节点的key），直接用新节点替换旧节点，无需比对
  // let render1 = compileToFunction(`<h1 key='a'>旧节点</h1>`)
  // let render2 = compileToFunction(`<h1 key='b'>新节点</h1>`)

  // 2. 新旧节点相同，且是标签，比较标签属性；然后比较两个节点的孩子
  // 旧节点没孩子，新节点有孩子，挂载
  // let render1 = compileToFunction(`<h1 key="a" style="color: #de5e60; border: 1px solid #de5e60; height: 85px"></h1>`)
  // let render2 = compileToFunction(
  //   `<h1 key="a" style="background: #FDE6D3; border: 1px solid #de5e60; height: 85px"><li>1</li><li>2</li></h1>`,
  // )

  // 3. 新旧节点相同，且是标签，比较标签属性；然后比较两个节点的孩子
  // 旧节点没孩子，新节点有孩子，删除
  // let render1 = compileToFunction(`<h1 key="a" style="color: #de5e60; border: 1px solid #de5e60; height: 85px"><li>1</li><li>2</li></h1>`)
  // let render2 = compileToFunction(
  //   `<h1 key="a" style="background: #FDE6D3; border: 1px solid #de5e60; height: 85px"></h1>`,
  // )

  // 4. 新旧节点相同，且是标签，比较标签属性；然后比较两个节点的孩子
  // 新旧节点都有孩子，（此时孩子是文本），更新文本内容
  // let render1 = compileToFunction(`<h1 key="a" style="color: #de5e60; border: 1px solid #de5e60">旧节点</h1>`)
  // let render2 = compileToFunction(`<h1 key="a" style="background: #FDE6D3; border: 1px solid #de5e60">新节点</h1>`)

  // 5. 新旧节点相同，且是标签，比较标签属性；然后比较两个节点的孩子，新旧节点都有孩子
  // 5.1 双端比较_1 - 旧孩子的头 比对 新孩子的头 - 同序列尾部挂载
  // a b c d
  // a b c d e f
  // let render1 = compileToFunction(`<ul style="color: #de5e60; border: 1px solid #de5e60">
  //     <li key="a">a</li>
  //     <li key="b">b</li>
  //     <li key="c">c</li>
  //     <li key="d">d</li>
  //   </ul>`,
  // )
  // let render2 = compileToFunction(`<ul style="background: #FDE6D3; border: 1px solid #de5e60">
  //     <li key="a">a</li>
  //     <li key="b">b</li>
  //     <li key="c">c</li>
  //     <li key="d">d</li>
  //     <li key="e">e</li>
  //     <li key="f">f</li>
  //   </ul>`)

  // 5.2 双端比较_1 - 旧孩子的头 比对 新孩子的头 - 同序列尾部卸载
  // a b c d e f
  // a b c d
  // let render1 = compileToFunction(`<ul style="color: #de5e60; border: 1px solid #de5e60">
  //     <li key="a">a</li>
  //     <li key="b">b</li>
  //     <li key="c">c</li>
  //     <li key="d">d</li>
  //     <li key="e">e</li>
  //     <li key="f">f</li>
  //   </ul>`,
  // )
  // let render2 = compileToFunction(`<ul style="background: #FDE6D3; border: 1px solid #de5e60">
  //     <li key="a">a</li>
  //     <li key="b">b</li>
  //     <li key="c">c</li>
  //     <li key="d">d</li>
  //   </ul>`)

  // 5.3 双端比较_2 - 旧孩子的尾 比对 新孩子的尾 - 同序列头部挂载
  //     a b c d
  // e f a b c d
  // let render1 = compileToFunction(`<ul style="color: #de5e60; border: 1px solid #de5e60">
  //     <li key="a">a</li>
  //     <li key="b">b</li>
  //     <li key="c">c</li>
  //     <li key="d">d</li>
  //   </ul>`,
  // )
  // let render2 = compileToFunction(`<ul style="background: #FDE6D3; border: 1px solid #de5e60">
  //     <li key="e">e</li>
  //     <li key="f">f</li>
  //     <li key="a">a</li>
  //     <li key="b">b</li>
  //     <li key="c">c</li>
  //     <li key="d">d</li>
  //   </ul>`)


  // 5.4 双端比较_2 - 旧孩子的尾 比对 新孩子的尾 - 同序列头部卸载
  // e f a b c d
  //     a b c d
  // let render1 = compileToFunction(`<ul style="color: #de5e60; border: 1px solid #de5e60">
  //     <li key="e">e</li>
  //     <li key="f">f</li>
  //     <li key="a">a</li>
  //     <li key="b">b</li>
  //     <li key="c">c</li>
  //     <li key="d">d</li>
  //   </ul>`,
  // )
  // let render2 = compileToFunction(`<ul style="background: #FDE6D3; border: 1px solid #de5e60">
  //     <li key="a">a</li>
  //     <li key="b">b</li>
  //     <li key="c">c</li>
  //     <li key="d">d</li>
  //   </ul>`)

  // 5.5 双端比较_3 - 旧孩子的头 比对 新孩子的尾
  // a b c d e
  // c d e b a
  // let render1 = compileToFunction(`<ul style="color: #de5e60; border: 1px solid #de5e60">
  //     <li key="a">a</li>
  //     <li key="b">b</li>
  //     <li key="c">c</li>
  //     <li key="d">d</li>
  //     <li key="e">e</li>
  //   </ul>`,
  // )
  // let render2 = compileToFunction(`<ul style="background: #FDE6D3; border: 1px solid #de5e60">
  //     <li key="c">c</li>
  //     <li key="d">d</li>
  //     <li key="e">e</li>
  //     <li key="b">b</li>
  //     <li key="a">a</li>
  //   </ul>`)

  // 5.6 双端比较_4 - 旧孩子的尾 比对 新孩子的头
  // a b c d e
  // e a b c d
  // let render1 = compileToFunction(`<ul style="color: #de5e60; border: 1px solid #de5e60">
  //     <li key="a">a</li>
  //     <li key="b">b</li>
  //     <li key="c">c</li>
  //     <li key="d">d</li>
  //     <li key="e">e</li>
  //   </ul>`,
  // )
  // let render2 = compileToFunction(`<ul style="background: #FDE6D3; border: 1px solid #de5e60">
  //     <li key="e">e</li>
  //     <li key="a">a</li>
  //     <li key="b">b</li>
  //     <li key="c">c</li>
  //     <li key="d">d</li>
  //   </ul>`)

  // 5.7 双端比较_3 or 双端比较_4 - 倒序
  // a b c d e
  // e d c b a
  // let render1 = compileToFunction(`<ul style="color: #de5e60; border: 1px solid #de5e60">
  //     <li key="a">a</li>
  //     <li key="b">b</li>
  //     <li key="c">c</li>
  //     <li key="d">d</li>
  //     <li key="e">e</li>
  //   </ul>`,
  // )
  // let render2 = compileToFunction(`<ul style="background: #FDE6D3; border: 1px solid #de5e60">
  //     <li key="e">e</li>
  //     <li key="d">d</li>
  //     <li key="c">c</li>
  //     <li key="b">b</li>
  //     <li key="a">a</li>
  //   </ul>`)

  // 5.8 乱序比对
  // a b c d e
  // e d c b a
  // let render1 = compileToFunction(`<ul style="color: #de5e60; border: 1px solid #de5e60">
  //     <li key="a">a</li>
  //     <li key="b">b</li>
  //     <li key="c">c</li>
  //     <li key="d">d</li>
  //     <li key="e">e</li>
  //   </ul>`,
  // )
  // let render2 = compileToFunction(`<ul style="background: #FDE6D3; border: 1px solid #de5e60">
  //     <li key="e">e</li>
  //     <li key="d">d</li>
  //     <li key="c">c</li>
  //     <li key="b">b</li>
  //     <li key="a">a</li>
  //   </ul>`)






  return {
    render1,
    render2
  }
}

export const diffDemo = function () {
  let render1 = renderMap().render1
  let vm1 = new Vue({
    data: {
      name: 'burc'
    }
  })
  let prevVnode = render1.call(vm1)
  let el = createElm(prevVnode)
  document.body.appendChild(el)

  let render2 = renderMap().render2
  let vm2 = new Vue({
    data: {
      name: 'burc'
    }
  })
  let nextVnode = render2.call(vm2)

  setTimeout(() => {
    patch(prevVnode, nextVnode)
  }, 1000)
}