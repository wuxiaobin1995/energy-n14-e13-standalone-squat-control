<!--
 * @Author      : Mr.bin
 * @Date        : 2022-08-16 14:45:23
 * @LastEditTime: 2022-08-17 11:25:11
 * @Description : 坐站训练-报告打印
-->
<template>
  <div class="sit-stand-print" v-loading.fullscreen.lock="fullscreenLoading">
    <div class="top">
      <div class="left">
        <div class="title">{{ trainData.trainType }}报告</div>
        <div class="hospital">( {{ trainData.hospital }} )</div>
        <div class="info">
          <div class="item">姓名：{{ trainData.userName }}</div>
          <div class="item">性别：{{ trainData.sex }}</div>
          <div class="item">患侧：{{ trainData.affectedSide }}</div>
          <div class="item">训练时间：{{ trainData.pdfTime }}</div>
        </div>
      </div>
      <el-image class="logo" :src="logoSrc" fit="scale-down"></el-image>
    </div>

    <div class="divider"></div>

    <div class="main">
      <!-- 左半部分 -->
      <div class="left">
        <div class="left-top">
          <div class="num-text">双侧平均承重</div>
          <div class="num-show">
            <div class="left-weight">
              <div class="num-text">左</div>
              <div class="num-data">
                <div class="data">{{ trainData.leftAverageWeight }}</div>
                <div>kg</div>
              </div>
            </div>
            <div class="right-weight">
              <div class="num-text">右</div>
              <div class="num-data">
                <div class="data">{{ trainData.rightAverageWeight }}</div>
                <div>kg</div>
              </div>
            </div>
          </div>
        </div>
        <div class="left-bottom">
          <div class="num-text">平均重量分布百分比</div>
          <div class="num-show">
            <div class="left-percent">
              <div class="num-text">左</div>
              <div class="num-data">
                <div class="data">{{ trainData.leftAverageWeightPercent }}</div>
                <div>%</div>
              </div>
            </div>
            <div class="right-percent">
              <div class="num-text">右</div>
              <div class="num-data">
                <div class="data">
                  {{ trainData.rightAverageWeightPercent }}
                </div>
                <div>%</div>
              </div>
            </div>
          </div>
        </div>
        <div class="left-text">推荐值：平均重量分布百分比小于52.5%</div>
      </div>
      <!-- 右半部分 -->
      <div class="right">
        <div class="chart-wrapper">
          <div id="chart" :style="{ width: '100%', height: '100%' }" />
        </div>
        <div class="chart-text">
          <div class="green">
            <div class="percent">{{ greenPercent }} %</div>
            <div class="text">绿色区域时间占比</div>
          </div>
          <div class="yellow">
            <div class="percent">{{ yellowPercent }} %</div>
            <div class="text">黄色区域时间占比</div>
          </div>
          <div class="red">
            <div class="percent">{{ redPercent }} %</div>
            <div class="text">红色区域时间占比</div>
          </div>
          <div class="recommend-text">推荐值：绿色区域时间占比大于85%</div>
        </div>
      </div>
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
</template>

<script>
import { initDB } from '@/db/index.js'

export default {
  name: 'sit-stand-print',

  data() {
    return {
      /* 路由传参 */
      userId: JSON.parse(this.$route.query.userId),
      pdfTime: JSON.parse(this.$route.query.pdfTime),
      routerName: JSON.parse(this.$route.query.routerName),

      fullscreenLoading: false, // 全屏加载
      logoSrc: require('@/assets/img/Company_Logo/logo_1.png'), // 公司logo

      /* 图形相关 */
      greenArray: [],
      yellowArray: [],
      redArray: [],
      greenPercent: 0,
      yellowPercent: 0,
      redPercent: 0,
      myChart: null,
      option: {},

      /* 数据源 */
      trainData: {
        hospital: '',
        userName: '',
        sex: '',
        affectedSide: '',
        pdfTime: '',
        leftAverageWeight: '',
        leftAverageWeightPercent: '',
        leftWeightArray: '',
        rightAverageWeight: '',
        rightAverageWeightPercent: '',
        rightWeightArray: '',
        rightWeightPercentArray: '',
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
          // 计算绿、黄、红的占比
          for (
            let i = 0;
            i < this.trainData.rightWeightPercentArray.length;
            i++
          ) {
            if (
              47.5 <= this.trainData.rightWeightPercentArray[i] &&
              this.trainData.rightWeightPercentArray[i] <= 52.5
            ) {
              this.greenArray.push(this.trainData.rightWeightPercentArray[i])
            } else if (
              (40 <= this.trainData.rightWeightPercentArray[i] &&
                this.trainData.rightWeightPercentArray[i] < 47.5) ||
              (52.5 < this.trainData.rightWeightPercentArray[i] &&
                this.trainData.rightWeightPercentArray[i] <= 60)
            ) {
              this.yellowArray.push(this.trainData.rightWeightPercentArray[i])
            } else {
              this.redArray.push(this.trainData.rightWeightPercentArray[i])
            }
          }
          this.greenPercent = parseFloat(
            (
              (this.greenArray.length /
                this.trainData.rightWeightPercentArray.length) *
              100
            ).toFixed(1)
          )
          this.yellowPercent = parseFloat(
            (
              (this.yellowArray.length /
                this.trainData.rightWeightPercentArray.length) *
              100
            ).toFixed(1)
          )
          this.redPercent = parseFloat(
            (
              (this.redArray.length /
                this.trainData.rightWeightPercentArray.length) *
              100
            ).toFixed(1)
          )
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
          this.greenArray = []
          this.yellowArray = []
          this.redArray = []
        })
    },

    /**
     * @description: 渲染echarts图形
     */
    initChart() {
      // 用于固定的绿、黄、红直线
      const gl = []
      const gr = []
      const yl = []
      const yr = []
      const rl = []
      const rr = []
      for (let i = 0; i < this.trainData.rightWeightPercentArray.length; i++) {
        gl.push(47.5)
        gr.push(52.5)
        yl.push(40)
        yr.push(60)
        rl.push(0)
        rr.push(100)
      }

      this.myChart = this.$echarts.init(document.getElementById('chart'))
      this.option = {
        title: {
          text: '左                   重心移动曲线                   右',
          x: 'center',
          y: '20',
          textStyle: {
            fontSize: 22
          }
        },
        xAxis: [
          {
            type: 'value',
            position: 'top',
            min: 0,
            max: 100,
            splitLine: {
              show: false
            },
            axisTick: {
              show: false
            },
            axisLabel: {
              show: false
            }
          },
          {
            type: 'value',
            position: 'bottom'
          }
        ],
        yAxis: [
          {
            type: 'category',
            splitLine: {
              show: false
            },
            show: false,
            inverse: true
          }
        ],
        series: [
          {
            type: 'line',
            smooth: true,
            symbol: 'none',
            data: gl,
            lineStyle: {
              color: 'rgba(0, 255, 30, 0.3)'
            }
          },
          {
            type: 'line',
            smooth: true,
            symbol: 'none',
            data: gr,
            lineStyle: {
              color: 'rgba(0, 255, 30, 0.3)'
            }
          },
          {
            type: 'line',
            smooth: true,
            symbol: 'none',
            data: yl,
            lineStyle: {
              color: 'rgba(226, 151, 12, 0.3)'
            }
          },
          {
            type: 'line',
            smooth: true,
            symbol: 'none',
            data: yr,
            lineStyle: {
              color: 'rgba(226, 151, 12, 0.3)'
            }
          },
          {
            type: 'line',
            smooth: true,
            symbol: 'none',
            data: rl,
            lineStyle: {
              color: 'rgba(218, 10, 10, 0.3)'
            }
          },
          {
            type: 'line',
            smooth: true,
            symbol: 'none',
            data: rr,
            lineStyle: {
              color: 'rgba(218, 10, 10, 0.3)'
            }
          },
          {
            type: 'line',
            smooth: true,
            symbol: 'none',
            data: this.trainData.rightWeightPercentArray,
            lineStyle: {
              color: 'rgba(0, 0, 0, 1)'
            }
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
}

.sit-stand-print {
  width: 100%;
  height: 100%;
  padding: 10px;
  @include flex(column, stretch, stretch);

  .top {
    @include flex(row, space-between, center);
    .left {
      flex: 1;
      @include flex(column, center, stretch);
      .title {
        font-size: 40px;
      }
      .hospital {
        font-size: 30px;
      }
      .info {
        margin-top: 10px;
        font-size: 22px;
        @include flex(row, stretch, center);
        .item {
          margin-right: 30px;
        }
      }
    }
    .logo {
      width: 220px;
    }
  }

  .divider {
    margin-top: 12px;
    border: 1px solid rgb(204, 204, 204);
    width: 100%;
  }

  .main {
    flex: 1;
    @include flex(row, space-around, stretch);
    margin-top: 30px;
    /* 左半部分 */
    .left {
      margin-top: 20px;
      margin-left: 5px;
      .num-text {
        font-size: 22px;
      }
      .left-top,
      .left-bottom {
        @include flex(column, stretch, center);
        .num-show {
          width: 400px;
          @include flex(row, space-between, stretch);
          .left-weight,
          .right-weight,
          .left-percent,
          .right-percent {
            @include flex(column, stretch, center);
            margin-top: 20px;
            .num-data {
              @include flex(row, stretch, flex-end);
              margin-top: 10px;
              .data {
                border: 2px solid black;
                background-color: rgba(0, 0, 0, 0.05);
                width: 110px;
                height: 60px;
                border-radius: 10px;
                font-size: 30px;
                text-align: center;
                line-height: 60px;
                margin-right: 5px;
              }
            }
          }
        }
      }
      .left-bottom {
        margin-top: 50px;
      }
      .left-text {
        padding: 0 0 0 8px;
        margin-top: 60px;
        font-size: 20px;
      }
    }
    /* 右半部分 */
    .right {
      @include flex(row, stretch, stretch);
      .chart-wrapper {
        width: 500px;
        height: 500px;
      }
      .chart-text {
        width: 160px;
        height: 500px;
        @include flex(column, center, stretch);
        padding-left: 10px;
        font-size: 18px;
        .green {
          margin-bottom: 20px;
          .percent {
            background-color: rgba(0, 0, 0, 0.05);
            border: 2px solid black;
            padding-left: 18px;
            width: 60%;
          }
          .text {
            color: green;
          }
        }
        .yellow {
          margin-bottom: 20px;
          .percent {
            background-color: rgba(0, 0, 0, 0.05);
            border: 2px solid black;
            padding-left: 18px;
            width: 60%;
          }
          .text {
            color: orange;
          }
        }
        .red {
          .percent {
            background-color: rgba(0, 0, 0, 0.05);
            border: 2px solid black;
            padding-left: 18px;
            width: 60%;
          }
          .text {
            color: red;
          }
        }
        .recommend-text {
          margin-top: 50px;
        }
      }
    }
  }

  .btn {
    @include flex(row, center, center);
    margin: 10px 0;
    .item {
      width: 160px;
      font-size: 24px;
      margin: 0 40px;
    }
  }
}
</style>
