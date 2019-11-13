import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'

// 基准值的创建
import 'amfe-flexible'

import Vant from 'vant'
import 'vant/lib/index.css'

import '@/styles/index.less'

Vue.use(Vant)

Vue.config.productionTip = false

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')
