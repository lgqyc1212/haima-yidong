// 提供一个配置好的axios请求的函数（调用接口）
import axios from 'axios'
import JSONBIGINT from 'json-bigint'
import store from '@/store'

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
  //  不饿里无效数据 有效数据 res.data.data
  // 注意：有时候不叫data  有时候连相应主题都没有
  try {
    return res.data.data
  } catch (e) {
    return res
  }
}, err => Promise.reject(err))

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
