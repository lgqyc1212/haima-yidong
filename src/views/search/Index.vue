<template>
  <div class="container">
    <van-nav-bar title="搜索中心" left-arrow @click-left="$router.back()" />
    <van-search v-model.trim="q" placeholder="请输入搜索关键词" shape="round" @search="onSearch" />
    <van-cell-group class="suggest-box" v-if="q">
      <van-cell icon="search" v-for="sug in suggestList" :key="sug">
        <p v-html="sug" @click="onSearch(sug.replace(`<span>${q}</span>`,q))"></p>
      </van-cell>
    </van-cell-group>
    <!-- 历史记录 -->
    <div class="history-box" v-else-if="historyList.length">
      <div class="head">
        <span>历史记录</span>
        <van-icon name="delete" @click="clearHistory()"></van-icon>
      </div>
      <van-cell-group>
        <van-cell v-for="key in historyList" :key="key">
          <a @click="toSearch(key)" class="word_btn">{{key}}</a>
          <van-icon @click="delHistory(key)" class="close_btn" slot="right-icon" name="cross" />
        </van-cell>
      </van-cell-group>
    </div>
  </div>
</template>

<script>
// 约定本地存储的key
// 约定本地存储的value '["",""]'
import suggest from '@/api/article'
const KEY = 'heima-yidong-history-key'
export default {
  name: 'search-index',
  data () {
    return {
      // 搜索关键字 v-model.trim 自动剔除两侧的空格
      q: '',
      historyList: JSON.parse(window.localStorage.getItem(KEY) || '[]'),
      suggestList: []
    }
  },
  watch: {
    q () {
      window.clearTimeout(this.timer)
      this.timer = window.setTimeout(async () => {
        if (!this.q) {
          this.suggestList = []
          return
        }
        const data = await suggest(this.q)
        this.suggestList = data.options.map(item =>
          item.toLowerCase().reqlace(this.q`<span>${this.q}</span>`))
      }, 200)
    }
  },
  methods: {
    onSearch (key) {
      // 触发条件: 按下回车键触发,移动端虚拟键盘中 的 搜索按钮
      // imput type='search' 这种类型的输入框在移动调用出来的虚拟键盘(搜索)
      if (!key.trim()) return false
      // 追加历史记录(排除重复的key)
      const set = new Set(this.historyList)
      set.add(key)
      this.historyList = [...set]
      // 保存在本地
      window.localStorage.setItem(KEY, JSON.stringify(this.historyList))
      // 跳转到搜索结果页面  传参关键字
      this.$router.push({ path: '/search/result', query: { p: key } })
    },
    // 跳转去搜索
    toSearch (key) {
      this.$router.push({ path: '/search/result', query: { p: key } })
    },
    // 删除历史
    delHistory (key) {
      const index = this.historyList.findIndex(item => item === key)
      this.historyList.splice(index, 1)
      // 本地存储
      window.localStorage.setItem(KEY, JSON.stringify(this.historyList))
    },
    // 清空历史
    clearHistory () {
      this.historyList = []
      window.localStorage.setItem(KEY, JSON.stringify(this.historyList))
    }
  }
}
</script>

<style scoped lang='less'>
.history-box {
  padding: 0 20px;
  .head {
    line-height: 36px;
    color: #999;
    .van-icon {
      font-size: 16px;
      float: right;
      margin-top: 10px;
    }
  }
  .van-cell {
    padding: 10px 0;
  }
  .word_btn {
    color: #3296fa;
  }
  .close_btn {
    margin-top: 5px;
    color: #999;
  }
}
.suggest-box {
  /deep/ .van-cell {
    padding: 10px 20px;
    color: #999;
    p {
      span {
        color: red;
      }
    }
  }
}
</style>
