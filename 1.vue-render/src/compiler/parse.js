/**
 * @name attrs
 * @returns
 */

const ncname = `[a-zA-Z_][\\-\\.0-9_a-zA-Z]*`
const qnameCapture = `((?:${ncname}\\:)?${ncname})`

// 匹配的是 <xxx  第一个分组就是开始标签的名字
const startTagOpen = new RegExp(`^<${qnameCapture}`)

// 匹配的是 </xxxx>  第一个分组就是结束标签的名字
const endTag = new RegExp(`^<\\/${qnameCapture}[^>]*>`)

// 分组1: 属性的key 分组2: =  分组3/分组4/分组5: value值
const attribute = /^\s*([^\s"'<>\/=]+)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/ // 匹配属性

const startTagClose = /^\s*(\/?)>/ // 匹配开始标签的结束 > 或 />  <div id = 'app' >  <br/>

/**
 * @name 对模板进行编译处理
 * @desc 循环遍历html字符串，利用正则表达式对其进行匹配【开始标签、属性、开始标签的闭合标签、文本、结束标签】，
 * @desc 利用 start chars end 方法去处理开始标签、文本、结束标签
 * @desc 利用栈型结构，构造一颗AST语法树，匹配到开始标签就入栈，匹配到结束标签就出栈
 */
// 对模板进行编译处理
export function parseHTML(html) {
  const ELEMENT_TYPE = 1 // 元素类型
  const TEXT_TYPE = 3 // 文本类型
  const stack = [] // 用于存放元素的栈
  let currentParent // 指向的是栈中的最后一个
  let root

  // 最终需要转化成一颗抽象语法树
  function createASTElement(tag, attrs) {
    return {
      tag, // 标签名
      type: ELEMENT_TYPE, // 类型
      attrs, // 属性
      parent: null,
      children: [],
    }
  }

  // 处理开始标签，利用栈型结构 来构造一颗树
  function start(tag, attrs) {
    let node = createASTElement(tag, attrs) // 创造一个 ast节点
    if (!root) {
      root = node // 如果root为空，则当前是树的根节点
    }
    if (currentParent) {
      node.parent = currentParent // 只赋予了parent属性
      currentParent.children.push(node) // 还需要让父亲记住自己
    }
    stack.push(node)
    currentParent = node // currentParent为栈中的最后一个
  }

  // 处理文本
  function chars(text) {
    text = text.replace(/\s/g, '')
    // 文本直接放到当前指向的节点中
    if (text) {
      currentParent.children.push({
        type: TEXT_TYPE,
        text,
        parent: currentParent,
      })
    }
  }

  // 处理结束标签
  function end(tag) {
    stack.pop() // 弹出栈中最后一个ast节点\
    currentParent = stack[stack.length - 1]
  }

  // 剔除 template 已匹配的内容
  function advance(n) {
    html = html.substring(n)
  }

  // 解析开始标签
  function parseStartTag() {
    const start = html.match(startTagOpen)
    if (start) {
      const match = {
        tagName: start[1], // 标签名
        attrs: [],
      }
      advance(start[0].length)

      let attr, end
      // 如果不是开始标签的结束 就一直匹配下去
      while (!(end = html.match(startTagClose)) && (attr = html.match(attribute))) {
        advance(attr[0].length)
        match.attrs.push({ name: attr[1], value: attr[3] || attr[4] || attr[5] || true })
      }

      // 如果不是开始标签的结束
      if (end) {
        advance(end[0].length)
      }
      return match
    }
    return false
  }

  while (html) {
    // 如果textEnd = 0 说明是一个开始标签或者结束标签
    // 如果textEnd > 0 说明就是文本的结束位置
    let textEnd = html.indexOf('<')
    if (textEnd == 0) {
      // 开始标签的解析結果，包括 标签名 和 属性
      const startTagMatch = parseStartTag()

      if (startTagMatch) {
        start(startTagMatch.tagName, startTagMatch.attrs)
        continue
      }

      // 匹配结束标签
      let endTagMatch = html.match(endTag)
      if (endTagMatch) {
        advance(endTagMatch[0].length)
        end(endTagMatch[1])
        continue
      }
    }
    if (textEnd > 0) {
      let text = html.substring(0, textEnd) // 截取文本内容
      if (text) {
        chars(text)
        advance(text.length)
      }
    }
  }

  return root
}
