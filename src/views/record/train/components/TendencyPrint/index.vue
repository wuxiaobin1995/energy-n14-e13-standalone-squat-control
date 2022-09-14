<!--
 * @Author      : Mr.bin
 * @Date        : 2022-09-14 10:04:12
 * @LastEditTime: 2022-09-14 15:39:34
 * @Description : 训练通用长期趋势-报告打印
-->
<template>
  <div
    class="train-tendency-print"
    v-loading.fullscreen.lock="fullscreenLoading"
  >
    <!-- 顶部 -->
    <div class="top">
      <div class="text">{{ type }}</div>
      <el-image class="logo" :src="logoSrc" fit="scale-down"></el-image>
    </div>

    <!-- 绘图区 -->
    <div class="main">
      <div id="chart" :style="{ width: '100%', height: '100%' }" />
    </div>

    <!-- 按钮组 -->
    <div class="btn btn-print">
      <el-button type="primary" class="item" @click="handlePrint"
        >打 印</el-button
      >
      <el-button type="info" class="item" @click="handleGoBack"
        >返 回</el-button
      >
    </div>
  </div>
</template>

<script>
import { initDB } from '@/db/index.js'

export default {
  name: 'train-tendency-print',

  data() {
    return {
      /* 路由传参 */
      userId: JSON.parse(this.$route.query.userId),
      routerName: JSON.parse(this.$route.query.routerName),
      type: JSON.parse(this.$route.query.type),

      fullscreenLoading: true, // // 加载动画
      logoSrc: require('@/assets/img/Company_Logo/logo_1.png'), // 公司logo

      /* 图形相关 */
      myChart: null,
      option: {},

      trainData: [] // 数据源
    }
  },

  created() {
    this.getData()
  },

  methods: {
    /**
     * @description: 根据userId、type复合查询该次的数据
     */
    getData() {
      this.fullscreenLoading = true
      const db = initDB()
      db.train_data
        .where({
          userId: this.userId,
          trainType: this.type
        })
        .toArray()
        .then(res => {
          this.trainData = res
        })
        .then(() => {
          // 绘图
          this.initChart()
        })
        .catch(err => {
          this.$confirm(
            `${err}。获取ID为 [${this.userId}] 的用户数据失败，请重试！`,
            '提示',
            {
              type: 'warning',
              center: true,
              showClose: false,
              closeOnClickModal: false,
              closeOnPressEscape: false,
              confirmButtonText: '重 试',
              cancelButtonText: '返 回'
            }
          )
            .then(() => {
              this.getData()
            })
            .catch(() => {
              this.handleGoBack()
            })
        })
        .finally(() => {
          this.fullscreenLoading = false
        })
    },

    /**
     * @description: 图形渲染
     */
    initChart() {
      const leftAverageWeightPercentArr = []
      const rightAverageWeightPercentArr = []
      const xDate = []
      const middle = []
      for (let i = 0; i < this.trainData.length; i++) {
        const item = this.trainData[i]

        leftAverageWeightPercentArr.push(item.leftAverageWeightPercent)
        rightAverageWeightPercentArr.push(item.rightAverageWeightPercent)
        xDate.push(item.pdfTime)
        middle.push(50)
      }

      this.myChart = this.$echarts.init(document.getElementById('chart'))
      this.option = {
        title: {
          text: `长期趋势报告`,
          subtext: '平均重量分布百分比%'
        },
        xAxis: [
          {
            type: 'category',
            data: xDate,
            boundaryGap: false
          }
        ],
        yAxis: [
          {
            type: 'value',
            min: 0,
            max: 100,
            splitLine: {
              show: false
            }
          }
        ],
        color: ['rgba(0, 255, 0, 0.8)', 'rgba(0, 0, 255, 0.8)'],
        legend: {
          icon: 'rect',
          top: '42%',
          right: 0,
          orient: 'vertical',
          itemWidth: 60,
          itemHeight: 28,
          itemGap: 30
        },
        series: [
          {
            type: 'line',
            smooth: true,
            symbol: 'none',
            data: middle,
            lineStyle: {
              color: 'rgba(255, 0, 0, 0.5)'
            }
          },
          {
            type: 'line',
            name: '左侧',
            smooth: true,
            symbol: 'none',
            data: leftAverageWeightPercentArr,
            lineStyle: {
              color: 'rgba(0, 0, 255, 0.8)'
            }
          },
          {
            type: 'line',
            name: '右侧',
            smooth: true,
            symbol: 'none',
            data: rightAverageWeightPercentArr,
            lineStyle: {
              color: 'rgba(0, 255, 0, 0.8)'
            }
          }
        ],
        animation: false
      }

      this.myChart.setOption(this.option)
    },

    /**
     * @description: 打印报告按钮
     */
    handlePrint() {
      window.print()
    },

    /**
     * @description: 返回
     */
    handleGoBack() {
      this.$router.push({
        path: this.routerName
      })
    }
  }
}
</script>

<style lang="scss" scoped>
/* 打印时触发的CSS */
@media print {
  @page {
    // size: portrait; // 纵向打印
    size: landscape; // 横向打印
  }
  .btn-print {
    display: none !important;
  }
}

.train-tendency-print {
  width: 100%;
  height: 100%;
  padding: 10px;
  @include flex(column, stretch, stretch);

  /* 顶部 */
  .top {
    margin-bottom: 20px;
    @include flex(row, space-between, center);
    .text {
      font-size: 46px;
      color: green;
    }
    .logo {
      width: 250px;
    }
  }

  /* 绘图区 */
  .main {
    flex: 1;
  }

  /* 按钮组 */
  .btn {
    margin: 5px 0 20px 0;
    @include flex(row, center, center);
    .item {
      font-size: 30px;
      margin: 0 50px;
    }
  }
}
</style>
