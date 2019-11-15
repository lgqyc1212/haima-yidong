// 提供一个配置好的axios请求的函数（调用接口）
import axios from 'axios'
import JSONBIGINT from 'json-bigint'
import store from '@/store'
import router from '@/router'

// 创建一个新的axios实例：解决两种不同配置，创建多个axios来给多个不同的配置
const instance = axios.create({
  // 基准值
  baseURL: 'http://ttapi.research.itcast.cn/',
  // 转换响应数据格式
  // 解决最大安全值
  transformResponse: [(data) => {
    // data 是原生的数据格式
    try {
      return JSONBIGINT.parse(data) // 用json-bigint转换格式
    } catch (e) {
      return data
    }
  }]
})

// 请求拦截器  追加token到请求头
instance.interceptors.request.use(config => {
  // 拦截成功
  // 获取token (vuex中的state中的user中的token)
  if (store.state.user.token) {
    // 追加token
    config.headers.Authorization = `Bearer${store.state.user.token}`
  }
  return config
}, err => Promise.reject(err))

// 响应拦截器 获取有效数据  token的延长有效期 TODO
instance.interceptors.request.use(res => {
  // 响应数据的剥离
  // 原始的res是什么格式就返回什么格式
  // 剥离无效数据 有效数据 res.data.data
  // 注意：有时候不叫data  有时候连相应主题都没有
  try {
    return res.data.data
  } catch (e) {
    return res
  }
}, async err => {
  // 如果请求失败走这个函数
  // 1. 判断是否是401 状态码
  // 2.如果是 判断是不是登录
  // 2.1 如果没登陆 拦截到登录页面 （登录完了需要回跳）
  // 2.2 已经登陆了 token失效
  // 3. 发刷新 token的请求
  // 3.1 刷新成功  更新vuex和本地token
  // 3.2 把之前失败的请求继续发送出去
  // 3.3 刷新失败 拦截到登录页面（登录完了需要跳回）
  if (err.response && err.response.status === 401) {
    // 跳转登录的地址 使用router获取当前访问路径 （vue组件 this.$route.path)
    const loginConfig = { path: '/login', query: { redirectUrl: router.currentRoute.path } }
    // 用户信息
    const user = store.state.user
    // 没登陆 （严谨代码）
    if (!user || !user.token || !user.refresh_token) {
      return router.push(loginConfig)
    }
    try {
      // 发刷新token的请求
      // 注意： 不是使用instance，已经拥有了一些配置，刷新请求不能使用这些配置
      const { data: { data } } = await axios({
        url: 'http://ttapi.research.itcast.cn/app/v1_0/authorizations',
        method: 'put',
        headers: {
          Authorization: `Bearer ${user.refresh_token}` // 合并refresh_token
        }
      })
      // res是响应对象  res.data.data.token 返回的token
      // 更新vuex和本地token  使用 mutations中的setUser即可
      store.commit('setUser', {
        token: data.token,
        refresh_token: user.refresh_token
      })
      // err函数中 返回一个promise(axios请求) 执行当前的promise
      // 继续发送之前失败的请求，instance({之前失败的请求配置})
      // 请求失败的请求配置参数 err.config
      return instance(err.config)
    } catch (e) {
      // 刷新token失败
      store.commit('delUser')
      return router.push(loginConfig)
    }
  }
  return Promise.reject(err)
})

// 调用接口 （接口地址，请求方法，参数）
export default (url, method, data) => {
  // params 选项是 git参数
  // data 选项是 其他请求方式的传参
  instance({
    url,
    method,
    // js表达式运行的结果必须是字符串 （params | data）
    // 严谨处理 get Get GET 都认为是get   使用toLowerCase先转换成小写的
    [method.toLowerCase() === 'get' ? 'params' : 'data']: data
  })
}
