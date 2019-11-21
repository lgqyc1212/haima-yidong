import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'

// 基准值的创建
import 'amfe-flexible'
// 导入 vant 移动端组件库
import Vant, { Lazyload } from 'vant'
import 'vant/lib/index.less'

import '@/styles/index.less'

// 自己的插件
import plugin from '@/utils/plugin'
Vue.use(plugin)

Vue.use(Vant)
Vue.use(Lazyload)

Vue.config.productionTip = false

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')
