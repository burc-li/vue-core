/** 实现暴露给用户API回调的异步更新 - nextTick */
let callbacks = [] // 存储 nextTick 回调
let waiting = false // 防抖

function flushCallbacks() {
  let cbs = callbacks.slice(0)
  waiting = false
  callbacks = []
  cbs.forEach(cb => cb()) // 按照顺序依次执行
}

// vue2中 nextTick 没有直接使用某个api 而是采用优雅降级的方式
// 内部先采用的是 promise(IE不兼容，微任务)  MutationObserver(H5的api，微任务)  setImmediate(IE专享，宏任务)  setTimeout（宏任务)
let timerFunc;
if (Promise) {
    timerFunc = () => {
        Promise.resolve().then(flushCallbacks)
    }
}else if(MutationObserver){
    let observer = new MutationObserver(flushCallbacks); // 这里传入的回调是异步执行的
    let textNode = document.createTextNode(1);
    observer.observe(textNode,{
        characterData:true
    });
    timerFunc = () => {
        textNode.textContent = 2;
    }
}else if(setImmediate){
    timerFunc = () => {
       setImmediate(flushCallbacks);
    }
}else{
    timerFunc = () => {
        setTimeout(flushCallbacks);
     }
}

export function nextTick(cb) {
  // 先内部还是先用户的？按照顺序依次执行
  callbacks.push(cb) // 维护 nextTick 中的 cakllback 方法
  if (!waiting) {
    timerFunc()
    waiting = true
  }
}