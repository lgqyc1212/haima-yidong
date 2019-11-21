<template>
  <div class="container">
    <!-- swipeable 开启手势切换 -->
    <van-tabs :lazy-render="false" @change="changeChannel" swipeable v-model="activeIndex">
      <van-tab :key="item.id" v-for="item in channels" :title="item.name">
        <div class="scroll-wrapper" ref="scroll-wrapper" @scroll="remember($event)">
          <van-cell-group>
            <van-pull-refresh
              v-model="activeChannel.downLoading"
              @refresh="onRefresh"
              :success-text="refreshSuccessText"
            >
              <van-list
                v-model="activeChannel.upLoading"
                :finished="activeChannel.finished"
                finished-text="没有更多了"
                @load="onLoad"
              >
                <van-cell
                  v-for="article in activeChannel.articles"
                  :key="article.id"
                  :to="'/article/'+article.art_id"
                >
                  <div class="article_item">
                    <h3 class="van-ellipsis">{{article.title}}</h3>
                    <div class="img_box">
                      <van-image lazy-load class="w33" fit="cover" :src="article.cover.images[0]" />
                      <van-image lazy-load class="w33" fit="cover" :src="article.cover.images[1]" />
                      <van-image lazy-load class="w33" fit="cover" :src="article.cover.images[2]" />
                    </div>
                    <div class="info_box">
                      <span>{{article.aut_name}}</span>
                      <span>{{article.comm_count}} 评论</span>
                      <span>{{article.pubdate | relTime}}</span>
                      <span
                        class="close"
                        @click.stop="openMoreAction(article.art_id.toString())"
                        v-if="user.token"
                      >
                        <van-icon name="cross"></van-icon>
                      </span>
                    </div>
                  </div>
                </van-cell>
              </van-list>
            </van-pull-refresh>
          </van-cell-group>
        </div>
      </van-tab>
    </van-tabs>
    <span class="bar_btn" @click="openChannelEdit" slot="nav-right">
      <van-icon name="wap-nav" />
    </span>
    <!-- 使用组件： 更多操作 -->
    <more-action
     v-if="user.token"
     v-model="showMoreAction"
     :articleId="articleId"
     @on-success="removeArticle()"
     @on-report="removeArticle()"
     ></more-action>
     <!-- 使用组件：频道编辑 -->
    <channel-edit @on-drlete='changeChannel' v-model="showChannelEdit" :channels="channels" :activeIndex.sync="activeIndex" a.sync></channel-edit>
  </div>
</template>

<script>
import { getMyChannels } from '@/api/channel'
import { getArticles } from '@/api/article.js'
import { mapState } from 'vuex'
import MoreAction from './components/MoreAction'
import ChannelEdit from './components/ChannelEdit'
export default {
  name: 'home-index',
  components: { MoreAction, ChannelEdit },
  data () {
    return {
      // 上拉加载中
      // upLoading: false,
      // 是否全部加载完成
      // finished: false,
      // 文章列表
      // articles: [],
      // 是否正在下拉刷新中
      // downLoading: false,
      // 刷新成功的文案
      refreshSuccessText: null,
      // ----频道需要的数据-----
      channels: [],
      // 当前频道索引
      activeIndex: 0,
      // 显示更多操作
      showMoreAction: false,
      // 文章的id
      articleId: null,
      // 显示频道列表
      showChannelEdit: false
    }
  },
  //
  computed: {
    activeChannel () {
      return this.channels[this.activeIndex]
    },
    ...mapState(['user'])
  },
  watch: {
    user () {
      // 更新当前频道 (默认激活推荐)
      this.activeIndex = 0
      this.getMyChannels()
      this.onLoad()
    }
  },
  // 组件初始化
  created () {
    // 获取频道数据
    this.getMyChannels()
  },
  // 激活组件钩子 （组件缓存） 初始化组件会执行
  activated () {
    // 当前激活的频道的文章列表容器 scroll_weapper 滚动之前记录的位置
    // scroll_weapper 有几个频道就有几个容器  是一个数组[data,data,...]
    if (this.$refs['scroll-wrapper']) {
      const dom = this.$refs['scroll-wrapper'][this.activeIndex] // 当前的容器
      dom.scrollTop = this.activeChannel.scrollTop // 当前容器滚动的位置
    }
  },
  methods: {
    // 打开频道管理
    openChannelEdit () {
      this.showChannelEdit = true
    },
    // 删除文章
    removeArticle () {
      const articles = this.activeChannel.articles
      const index = articles.findIndex(item => item.art_id.toString() === this.articleId)
      articles.splice(index, 1)
    },
    // 打开更多操作对话框
    openMoreAction (id) {
      this.showMoreAction = true
      this.articleId = id
    },
    // 记录阅读位置：
    remember (e) {
      this.activeChannel.scrollTop = e.target.scrollTop
    },
    // 自动加载 切换频道
    changeChannel () {
      // 当前频道暂无文章数据 自己来加载数据
      if (!this.activeChannel.articles.length) {
        // 切换tab的时候回进行dom的重新绘制 需要等绘制完毕后定位
        this.activeChannel.upLoading = true
        this.onLoad()
      } else {
        // 根据当前频道记录位置进行滚动 (覆盖tab组件回滚到顶部的功能)
        // 我们滚动的操作一定需要在tab滚动事件之后执行才能覆盖掉它
        // 可以使用window.setTimeout(() => {}) 让它延长执行const dom = this.$refs['scrollWrapper'][this.activeIndex]dom.scrollTop = this.activeChannel.scrollTop

        this.$nextTick(() => {
          const dom = this.$refs['scroll-wrapper'][this.activeIndex] // 当前的容器
          dom.scrollTop = this.activeChannel.scrollTop // 当前容器滚动的位置
        })
      }
    },
    // 获取频道数据
    async getMyChannels () {
      const data = await getMyChannels()
      this.channels = [] // 清空tabs组件的缓存
      this.$nextTick(() => {
        // data.chennels 数据结构 [{id，name}，...]
        // 不满足页面的数据要求，转换成另外一种格式
        // map() 数组提供的函数，遍历当前数组，生成一个新的数据
        // 在遍历的时候回调函数的返回值 就是新数组中的每一项
        // 注意 在箭头函数 解析的时候不是对象，而实代码块
        // 写法 如果一定要直接返回对象 包裹小括号
        this.channels = data.channels.map(item => ({
          id: item.id,
          name: item.name,
          // 是否正在上拉加载中
          upLoading: false,
          // 是否正在下拉加载中
          downLoading: false,
          // 是否加载了所以数据
          finished: false,
          // 文章列表
          articles: [],
          // 获取数据的时间戳
          timestamp: Date.now(),
          // 记录阅读位置
          scrollTop: 0
        }))
      })
    },
    async onLoad () {
      // onLoad组件初始化默认数据对应的页面不够一屏，自动在加载一次加载
      // 触发上拉加载触发当前的函数（获取数据，进行列表渲染）
      // 模拟获取数据成功，模拟网路延时
      // window.setTimeout(() => {
      //   // 获取数据成功，模拟一个数据
      //   const data = []
      //   // 1-10  11-20
      //   for (
      //     let i = this.articles.length + 1;
      //     i <= this.articles.length + 10;
      //     i++
      //   ) {
      //     data.push(i)
      //   }
      //   // 获取文章列表ok
      //   this.articles.push(...data)
      //   // 结束上拉加载效果
      //   this.upLoading = false
      //   // 是否所以数据已经加载完毕 （模拟一下，数据超过50就完成加载完毕）
      //   if (this.articles.length >= 50) {
      //     this.finished = true
      //   }
      // }, 1000)

      // 获取传参 当前频道的ID
      // 获取文章列表 （组件初始化默认激活频道一定是：推荐
      const data = await getArticles(
        this.activeChannel.id,
        this.activeChannel.timestamp
      )
      // 把获取的数据累加到当前频道下的文章列表中
      this.activeChannel.articles.push(...data.results)
      // 结束上拉加载效果
      this.activeChannel.upLoading = false
      // 是否所有数据已经加载完毕
      if (!data.pre_timestamp) {
        // 已经没有更多数据了
        this.activeChannel.finished = true
      } else {
        // 把后端返回的时间戳 记录下来  下次请求需要使用
        this.activeChannel.timestamp = data.pre_timestamp
      }
    },
    async onRefresh () {
      // // onRefresh 在下拉后 松手后 触发的函数 （获取数据，替换，进行列表渲染）
      // // 获取数据 (获取到了数据，获取不到数据--->提示“暂无更新”,不需要替换列表)
      // window.setTimeout(() => {
      //   // 获取数据成功
      //   const data = [1, 2, 3, 4, 5, 6]
      //   // const data = []
      //   // 结束下拉刷新效果
      //   this.downLoading = false
      //   if (data.length) {
      //     console.log('ok')
      //     this.articles = data
      //     // 加载有数据的文案
      //     this.refreshSuccessText = '更新成功'
      //     // 防止看到 没有更多了 信息 （重新刷新列表，下一页应该是有数据的）
      //     this.finished = false
      //     // 防止数据不够一屏 再来一次上拉加载数据 onLoad
      //     this.onLoad()
      //   } else {
      //     // 加载没有数据的文案
      //     console.log('on')
      //     this.refreshSuccessText = '暂无更新'
      //   }
      // }, 1000)

      // await this.$sleep()
      this.activeChannel.timestamp = Date.now()
      const data = await getArticles(
        this.activeChannel.id,
        this.activeChannel.timestamp
      )
      // 结束下拉刷新效果
      this.activeChannel.downLoading = false
      // 判断是否有数据
      if (data.results.length) {
        this.activeChannel.articles = data.results
        // 加载有数据的文案
        this.refreshSuccessText = '更新成功'
        // 防止看到 没有更多了 信息 （重新刷新列表，下一页应该是有数据的）
        this.activeChannel.finished = false
        // 加上时间戳 加载下一页数据
        this.activeChannel.timestamp = data.pre_timestamp
        // 防止数据不够一屏 再来一次上拉加载数据 onLoad
        this.onLoad()
      } else {
        // 加载没有数据的文案
        this.refreshSuccessText = '暂无更新'
      }
    }
  }
}
</script>

<style scoped lang='less'>
.van-tabs {
  height: 100%;
  display: flex;
  flex-direction: column;
  /deep/ .van-tabs__wrap {
    height: 36px;
    padding-right: 36px;
    .van-tab {
      line-height: 36px;
    }
    .van-tabs__line {
      background-color: #3296fa;
      height: 2px;
    }
  }
  /deep/ .van-tabs__content {
    flex: 1;
    overflow: hidden;
  }
  /deep/ .van-tab__pane {
    height: 100%;
    .scroll-wrapper {
      height: 100%;
      overflow-y: auto;
    }
  }
}
.bar_btn {
  width: 36px;
  height: 35px;
  position: absolute;
  top: 0;
  right: 0;
  &::before {
    content: "";
    width: 100%;
    height: 100%;
    position: absolute;
    z-index: 999;
    box-shadow: 0 0 10px #999;
    transform: scale(1, 0.6);
  }
  .van-icon-wap-nav {
    width: 100%;
    height: 100%;
    background: #fff;
    text-align: center;
    line-height: 35px;
    position: relative;
    z-index: 1000;
    &::before {
      font-size: 20px;
    }
  }
}
.article_item {
  h3 {
    font-weight: normal;
    line-height: 2;
  }
  .img_box {
    display: flex;
    justify-content: space-between;
    .w33 {
      width: 33%;
      height: 90px;
    }
    .w100 {
      width: 100%;
      height: 180px;
    }
  }
  .info_box {
    color: #999;
    line-height: 2;
    position: relative;
    font-size: 12px;
    span {
      padding-right: 10px;
      &.close {
        border: 1px solid #ddd;
        border-radius: 2px;
        line-height: 15px;
        height: 12px;
        width: 16px;
        text-align: center;
        padding-right: 0;
        font-size: 8px;
        position: absolute;
        right: 0;
        top: 7px;
      }
    }
  }
}
</style>
