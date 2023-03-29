import { parseHTML } from './parse'

// 根据ast语法树的 attrs属性对象 生成相对应的属性字符串
function genProps(attrs) {
  let str = ''
  for (let i = 0; i < attrs.length; i++) {
    let attr = attrs[i]
    if (attr.name === 'style') {
      // color:red;background:red => {color:'red',background:red}
      let obj = {}
      // 可以使用 qs 库
      attr.value.split(';').forEach(item => {
        let [key, value] = item.split(':')
        obj[key.trim()] = value.trim()
      })
      attr.value = obj
    }
    str += `${attr.name}:${JSON.stringify(attr.value)},` // id:'app',class:'app-inner',
  }
  return `{${str.slice(0, -1)}}`
}

const defaultTagRE = /\{\{((?:.|\r?\n)+?)\}\}/g // 匹配到的内容就是我们表达式的变量，例如 {{ name }}
function gen(node) {
  if (node.type === 1) {
    // 元素
    return codegen(node)
  } else {
    // 文本
    let text = node.text
    if (!defaultTagRE.test(text)) {
      // _v('hello')
      return `_v(${JSON.stringify(text)})`
    } else {
      //_v( _s(name) + 'hello' + _s(age))
      let tokens = []
      let match
      defaultTagRE.lastIndex = 0
      let lastIndex = 0
      while ((match = defaultTagRE.exec(text))) {
        let index = match.index // 匹配项的第一个字符在字符串中的位置  {{name}} hello  {{age}} word
        if (index > lastIndex) {
          tokens.push(JSON.stringify(text.slice(lastIndex, index)))
        }
        tokens.push(`_s(${match[1].trim()})`)
        lastIndex = index + match[0].length
      }
      if (lastIndex < text.length) {
        tokens.push(JSON.stringify(text.slice(lastIndex)))
      }
      return `_v(${tokens.join('+')})`
    }
  }
}

// 根据ast语法树的 children对象 生成相对应的 children字符串
function genChildren(children) {
  return children.map(child => gen(child)).join(',')
}

/**
 * @name 代码生成
 * @desc 生成指定格式的render方法代码字符串，再利用模版引擎生成render函数
 * @desc 我们会在Vue原型上扩展 render 函数相关的方法， _c _s _v
 * @desc _c: 创建节点虚拟节点VNode    _v: 创建文本虚拟节点VNode   _s: 处理变量
 */
function codegen(ast) {
  let children = genChildren(ast.children)
  let code = `_c('${ast.tag}',${ast.attrs.length > 0 ? genProps(ast.attrs) : 'null'}${ast.children.length ? `,${children}` : ''})`

  return code
}

export function compileToFunction(template) {
  console.log('html模版字符串：\n', template)

  // 1.就是将 template 转化成 ast 语法树
  let ast = parseHTML(template)
  console.log('AST语法树：\n', ast)

  // 2.生成render方法代码字符串 (render方法执行后的返回的结果就是 虚拟DOM)
  let code = codegen(ast)
  console.log('代码串：\n', code)

  // 模板引擎的实现原理就是 with + new Function
  code = `with(this){return ${code}}`

  let render = new Function(code) // 根据代码生成render函数
  console.log('render：\n', render)

  return render
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