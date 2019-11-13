import Vue from 'vue'
import Vuex from 'vuex'
import * as auth from '@/utils/auth'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    // 用户信息 (token refresh_token)
    user: auth.getUser()
  },
  mutations: {
    // 存储用户信息 user 传参必须是对象
    setUser (state, user) {
      // 修改了 vuex的state，如果刷新了页面重新获取本地数据，会丢失之前存储state
      // 所以： 同时修改本地的用户信息
      // 更新state的状态
      state.user = user
      // 更新本地存储
      auth.setUser(user)
    },
    // 清除数据
    delUser (state) {
      // 更新state数据
      state.user = {}
      // 更新本地存储
      auth.delUser()
    }
  },
  actions: {
  }
})
