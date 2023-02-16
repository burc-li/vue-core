// rollup默认可以导出一个对象 作为打包的配置文件

import babel from 'rollup-plugin-babel'
// 用 "node 解析算法" 来定位模块  import a from './answer'，在 @rollup/plugin-node-resolve 插件的帮助下，才能成功命中：'./answer/index.js' 文件
import resolve from '@rollup/plugin-node-resolve'

export default {
  input: './src/index.js', // 入口
  output: {
    file: './dist/vue.js', // 出口
    name: 'Vue', // global.Vue
    format: 'umd', // esm es6模块  commonjs模块  iife自执行函数  umd （commonjs amd）
    sourcemap: true, // 希望可以调试源代码
  },
  plugins: [
    babel({
      exclude: 'node_modules/**', // 排除node_modules所有文件
    }),
    resolve(),
  ],
}
// 为什么vue2 只能支持ie9以上  Object.defineProperty不支持低版本的
// proxy是 es6的 也没有替代方案
