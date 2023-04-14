- Vue.component 作用就是收集全局的定义，id：definition 即Vue.options.components[组件名] = 包装成构造函数(定义)
- Vue.extend 返回一个子类 ，而且会在子类上缓存自己的选项 Sub.options   

为什么Vue的组件中的data不能是一个对象呢？
当我们多次 new Sub()，执行 this._init -> vm.$options = mergeOptions(this.constructor.options, options)
合并Sub.options.data 和 用户options.data时，如果 Sub.options.data是一个对象，会导致数据共享

```
function extend(选项){
  function Sub(){
    this._init() // 子组件的初始化
  }
  Sub.options = 选项
  return Sub
}

let Sub = Vue.extend({data:数据源})

new Sub()  mergeOptions(Sub.options, 用户options)  Sub.options.data 
new Sub()  mergeOptions(Sub.options, 用户options)  Sub.options.data
```


- 1. 创建子类构造函数Sub时，会将全局的组件和自己定义的局部组件进行合并 - mergeOptions(Vue.options, options)  ，使用组件时，会先查找局部组件再通过原型链查找全局组件 - Sub.options.components.__proto__ = Vue.options.components

- 2. 组件的渲染，会编译组件的模板变成render函数  -》 调用render方法生成虚拟DOM

- 3. createElementVnode，会根据tag类型来区分是标签or组件，如果是组件会创造组件的虚拟节点 （组件增加init初始化的钩子,增加componentOptions选项 {Ctor}） ，
     稍后创建组件的真实节点 我们只需要 new Ctor().$mount()

- 4. 在_update方法内部，我们调用patch方法去创建真实节点，并挂载到vm.$el上