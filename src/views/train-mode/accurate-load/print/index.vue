<!--
 * @Author      : Mr.bin
 * @Date        : 2022-08-16 14:45:23
 * @LastEditTime: 2023-06-20 13:50:29
 * @Description : 精准负重训练-报告打印
-->
<template>
  <div
    class="accurate-load-print"
    v-loading.fullscreen.lock="fullscreenLoading"
  >
    <div class="title">
      <div class="text">精准负重训练报告</div>
      <el-image class="logo" :src="logoSrc" fit="scale-down"></el-image>
    </div>

    <div class="divider"></div>

    <div class="info">
      <div class="item">{{ trainData.hospital }}</div>
      <div class="item">姓名：{{ trainData.userName }}</div>
      <div class="item">性别：{{ trainData.sex }}</div>
      <div class="item">患侧：{{ trainData.affectedSide }}</div>
      <div class="item">训练时间：{{ trainData.pdfTime }}</div>
    </div>

    <div class="main main-print">
      <div class="chart">
        <div id="chart" :style="{ width: '100%', height: '100%' }"></div>
      </div>
      <div class="right">
        <div class="result result-print">
          <div class="item">训练时长：{{ trainData.time }}s</div>
          <div class="item">极限负重：{{ trainData.ultimateLoad }}%</div>
          <div class="item">完成度：{{ trainData.record }}%</div>
        </div>
        <div class="btn-print btn">
          <el-button class="item" type="primary" @click="handlePrint"
            >打 印</el-button
          >
          <el-button class="item" type="danger" @click="handleGoBack"
            >返 回</el-button
          >
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { initDB } from '@/db/index.js'

export default {
  name: 'accurate-load-print',

  data() {
    return {
      /* 路由传参 */
      userId: JSON.parse(this.$route.query.userId),
      pdfTime: JSON.parse(this.$route.query.pdfTime),
      routerName: JSON.parse(this.$route.query.routerName),

      fullscreenLoading: false, // 全屏加载
      logoSrc: require('@/assets/img/Company_Logo/logo_1.png'), // 公司logo

      /* 图形相关变量 */
      myChart: null,
      option: {},
      xData: [], // 横坐标数组

      /* 数据源 */
      trainData: {
        hospital: '',
        userName: '',
        sex: '',
        affectedSide: '',
        pdfTime: '',
        leftWeightArray: '',
        rightWeightArray: '',
        upArr: '',
        ultimateLoadArr: '',
        downArr: '',
        ultimateLoad: '',
        time: '',
        record: '',
        trainType: ''
      }
    }
  },

  created() {
    this.getTrainData()
  },

  methods: {
    /**
     * @description: 获取对应 [ID、训练时间] 的训练报告源数据
     */
    getTrainData() {
      this.fullscreenLoading = true
      const db = initDB()
      db.train_data
        .where({
          userId: this.userId,
          pdfTime: this.pdfTime
        })
        .toArray()
        .then(res => {
          this.trainData = res[0]
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
              this.getTrainData()
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
     * @description: 图形初始化
     */
    initChart() {
      // 计算横坐标数组
      for (let i = 0; i < this.trainData.leftWeightArray.length; i++) {
        this.xData.push(parseFloat((i * 0.1).toFixed(1)))
      }

      // 计算比值
      const resArr = []
      for (let i = 0; i < this.trainData.leftWeightArray.length; i++) {
        let core = 0
        if (this.$store.state.currentUserInfo.affectedSide === '左') {
          core = parseInt(
            (
              (this.trainData.leftWeightArray[i] /
                (this.trainData.leftWeightArray[i] +
                  this.trainData.rightWeightArray[i])) *
              100
            ).toFixed(0)
          )
        } else {
          core =
            100 -
            parseInt(
              (this.trainData.leftWeightArray[i] /
                (this.trainData.leftWeightArray[i] +
                  this.trainData.rightWeightArray[i])) *
                100
            )
        }

        if (!core) {
          core = 50
        }
        resArr.push(core)
      }

      this.myChart = this.$echarts.init(document.getElementById('chart'))
      this.option = {
        title: {
          text: `(患侧)${this.$store.state.currentUserInfo.affectedSide}腿压力曲线`,
          left: 'center',
          textStyle: {
            fontSize: 26
          }
        },
        xAxis: {
          type: 'category',
          name: '单位：秒',
          data: this.xData,
          axisTick: {
            alignWithLabel: true
          }
        },
        yAxis: {
          type: 'value',
          name: '单位：%',
          min: 0
          // max: 500
        },
        series: [
          {
            data: resArr,
            type: 'line',
            lineStyle: {
              color: 'black',
              type: 'dashed' //设置网格线类型 dotted：虚线   solid:实线
            },
            smooth: true,
            showSymbol: false
          },
          {
            data: this.trainData.upArr,
            type: 'line',
            lineStyle: {
              color: 'red'
            },
            smooth: false,
            showSymbol: false
          },
          {
            data: this.trainData.ultimateLoadArr,
            type: 'line',
            lineStyle: {
              color: 'rgba(0, 255, 0, 1)'
            },
            smooth: false,
            showSymbol: false
          },
          {
            data: this.trainData.downArr,
            type: 'line',
            lineStyle: {
              color: 'red'
            },
            smooth: false,
            showSymbol: false
          }
        ],
        animation: false
      }

      this.myChart.setOption(this.option)
    },

    /**
     * @description: 打印报告
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
  .result-print {
    width: 260px !important;
  }
  .main-print {
    margin-top: 50px !important;
  }
}

.accurate-load-print {
  width: 100%;
  height: 100%;
  padding: 10px;
  @include flex(column, stretch, stretch);

  .title {
    @include flex(row, space-between, center);
    .text {
      font-size: 40px;
    }
    .logo {
      width: 220px;
    }
  }

  .divider {
    margin-top: 5px;
    border: 1px solid rgb(204, 204, 204);
    width: 100%;
  }

  .info {
    margin-top: 5px;
    font-size: 20px;
    @include flex(row, space-between, center);
    .item {
      margin-right: 30px;
    }
  }

  .main {
    margin-top: 20px;
    flex: 1;
    @include flex(row, stretch, stretch);
    .chart {
      flex: 1;
    }
    .right {
      width: 260px;
      @include flex(column, stretch, stretch);
      .result {
        flex: 1;
        margin-top: 185px;
        .item {
          font-size: 30px;
          margin-top: 20px;
        }
      }
      .btn {
        @include flex(column, stretch, stretch);
        .item {
          margin: 10px 0;
          width: 100%;
          font-size: 24px;
        }
      }
    }
  }
}
</style>
