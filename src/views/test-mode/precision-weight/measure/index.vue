<!--
 * @Author      : Mr.bin
 * @Date        : 2022-08-01 14:52:43
 * @LastEditTime: 2022-09-11 14:41:44
 * @Description : 精准负重测试-具体测量
-->
<template>
  <div class="precision-weight-measure">
    <div class="wrapper">
      <el-page-header
        class="page"
        title="返回上一页"
        content="精准负重测试"
        @back="handleGoBack"
      ></el-page-header>

      <div class="left">
        <!-- 图形 -->
        <div class="chart">
          <div id="chart" :style="{ width: '100%', height: '100%' }"></div>
        </div>
        <!-- 按钮 -->
        <div class="btn">
          <el-button
            class="item"
            type="success"
            round
            icon="el-icon-video-play"
            :disabled="testValueArray.length === 3 || isStart ? true : false"
            @click="handleStart"
            >开始测量</el-button
          >
        </div>
      </div>

      <div class="divider"></div>

      <div class="right">
        <!-- 倒计时 -->
        <div class="time">
          <el-image class="img" :src="timeBgSrc" fit="scale-down"></el-image>
          <div class="text">倒计时</div>
          <div class="value">{{ time }}</div>
        </div>

        <!-- 测量结果 -->
        <div class="result">
          <el-image :src="testValueSrc" fit="scale-down"></el-image>
          <div class="title">测量数值</div>
          <div class="item1">
            <el-input class="value" v-model="testValueArray[0]" disabled>
              <template slot="prepend">1</template>
            </el-input>
          </div>
          <div class="item2">
            <el-input class="value" v-model="testValueArray[1]" disabled>
              <template slot="prepend">2</template>
            </el-input>
          </div>
          <div class="item3">
            <el-input class="value" v-model="testValueArray[2]" disabled>
              <template slot="prepend">3</template>
            </el-input>
          </div>
          <el-button
            class="confirm-btn"
            type="success"
            round
            icon="el-icon-check"
            :disabled="testValueArray.length === 3 ? false : true"
            @click="handleFinish"
            >{{
              testValueArray.length === 3 ? '查看报告' : 'Loading'
            }}</el-button
          >
        </div>

        <!-- 其他按钮组 -->
        <div class="btn">
          <el-button
            class="item"
            type="danger"
            round
            icon="el-icon-circle-close"
            :disabled="!isStart"
            @click="handleOver"
            >结束测量</el-button
          >
          <el-button
            class="item"
            type="warning"
            round
            icon="el-icon-refresh-right"
            :disabled="!isRestart"
            @click="handleRestart"
            >重新测量</el-button
          >
          <el-button
            class="item"
            type="primary"
            round
            icon="el-icon-loading"
            @click="handleRefresh"
            >刷 新</el-button
          >
        </div>
      </div>
    </div>
  </div>
</template>

<script>
/* 串口通信库 */
import SerialPort from 'serialport'
import Readline from '@serialport/parser-readline'

/* 数据库 */
import { initDB } from '@/db/index.js'

export default {
  name: 'precision-weight-measure',

  data() {
    return {
      timeBgSrc: require('@/assets/img/Test/Measure/倒计时背景.png'), // 倒计时背景
      testValueSrc: require('@/assets/img/Test/Measure/测量数值背景.png'), // 测量数值背景

      /* 按钮禁用控制 */
      isStart: false,
      isRestart: false,

      /* 串口相关变量 */
      usbPort: null,
      parser: null,
      scmBaudRate: 115200, // 默认波特率115200

      /* 图形相关变量 */
      myChart: null,
      option: {},
      xData: [], // 横坐标数组

      /* 其他 */
      leftK: 0, // 左K
      rightK: 0, // 右K
      leftStandard: 0, // 左调零值
      rightStandard: 0, // 右调零值
      timeClock: null, // 计时器
      time: 10, // 倒计时10秒
      leftWeight: 0, // 左负重（kg），精确到0.1kg
      rightWeight: 0, // 右负重（kg），精确到0.1kg
      leftWeightArray: [], // 左负重数组
      rightWeightArray: [], // 右负重数组

      /* 结果相关 */
      testValueArray: [], // 该项目测量值数组
      testResult: null // 该项目最终测量结果（取三次的最大值），kg
    }
  },

  created() {
    this.leftK = parseFloat(window.localStorage.getItem('leftK'))
    this.rightK = parseFloat(window.localStorage.getItem('rightK'))
    this.leftStandard = this.$store.state.zeroStandard.leftStandard
    this.rightStandard = this.$store.state.zeroStandard.rightStandard

    this.initSerialPort()
  },
  mounted() {
    this.initChart()
    // 监听父容器的宽高变化，目的是实现echarts图形自适应父容器的宽高变化
    window.addEventListener('resize', this.resizeCharts)
  },
  beforeDestroy() {
    // 清除计时器
    if (this.timeClock) {
      clearInterval(this.timeClock)
    }
    // 关闭串口
    if (this.usbPort) {
      if (this.usbPort.isOpen) {
        this.usbPort.close()
      }
    }
    // 注销echarts图形自适应监听事件
    window.removeEventListener('resize', this.resizeCharts)
  },

  methods: {
    /**
     * @description: 回到上一页
     */
    handleGoBack() {
      this.$router.push({
        path: '/test-select/precision-weight-set'
      })
    },

    /**
     * @description: 初始化串口对象
     */
    initSerialPort() {
      SerialPort.list()
        .then(ports => {
          /* 遍历设备的USB串口，目标设备需安装驱动 */
          let comPath = ''
          for (const port of ports) {
            if (/^USB/.test(port.pnpId)) {
              comPath = port.path
              break
            }
          }

          /* 验证USB有没有连接到电脑，但不能验证有无数据发送给上位机 */
          if (comPath) {
            /**
             * @description: 创建串口实例
             * @param {String} comPath 串行端口的系统路径。例如：在Mac、Linux上的/dev/tty.XXX或Windows上的COM1
             * @param {Object} 配置项
             */
            this.usbPort = new SerialPort(comPath, {
              baudRate: this.scmBaudRate, // 默认波特率115200
              autoOpen: false // 是否自动开启串口
            })
            /* 调用 this.usbPort.open() 成功时触发（开启串口成功） */
            this.usbPort.on('open', () => {})
            /* 调用 this.usbPort.open() 失败时触发（开启串口失败） */
            this.usbPort.on('error', () => {
              if (this.timeClock) {
                clearInterval(this.timeClock)
              }
              this.time = 10

              this.$alert(
                `请重新连接USB线，然后点击"刷新页面"按钮！`,
                '串口开启失败',
                {
                  type: 'error',
                  showClose: false,
                  center: true,
                  confirmButtonText: '刷新页面',
                  callback: () => {
                    this.handleRefresh()
                  }
                }
              )
            })

            this.parser = this.usbPort.pipe(new Readline({ delimiter: '\n' }))
            this.parser.on('data', data => {
              // console.log(data) // {String} 00326740032826，前两位是限位开关量（0或1）

              /* 计算左、右负重 */
              this.leftWeight = parseFloat(
                (
                  (parseInt(data.slice(2, 7)) - this.leftStandard) /
                  -this.leftK
                ).toFixed(1)
              )
              this.rightWeight = parseFloat(
                (
                  (parseInt(data.slice(9, 14)) - this.rightStandard) /
                  -this.rightK
                ).toFixed(1)
              )
              if (this.leftWeight < 0) {
                this.leftWeight = 0
              }
              if (this.rightWeight < 0) {
                this.rightWeight = 0
              }

              /* 数据校验 */
              if (!isNaN(this.leftWeight) && !isNaN(this.rightWeight)) {
                /* 过滤掉突变值 */
                if (this.leftWeight <= 500 && this.rightWeight <= 500) {
                  /* 数据插入数组中 */
                  this.leftWeightArray.push(this.leftWeight)
                  this.rightWeightArray.push(this.rightWeight)

                  /* 实时渲染图形 */
                  if (this.$store.state.currentUserInfo.affectedSide === '左') {
                    this.option.series[0].data = this.leftWeightArray
                  } else {
                    this.option.series[0].data = this.rightWeightArray
                  }
                  this.myChart.setOption(this.option)
                }
              }
            })
          } else {
            this.$getLogger('没有检测到USB连接')
            this.$confirm(
              `请重新连接USB线，然后点击"刷新页面"按钮！`,
              '没有检测到USB连接',
              {
                type: 'error',
                showClose: false,
                closeOnClickModal: false,
                closeOnPressEscape: false,
                center: true,
                confirmButtonText: '刷新页面',
                cancelButtonText: '返回上一页'
              }
            )
              .then(() => {
                this.handleRefresh()
              })
              .catch(() => {
                this.handleGoBack()
              })
          }
        })
        .catch(err => {
          this.$getLogger(err)
          this.$confirm(
            `${err}。请重新连接USB线，然后点击"刷新页面"按钮！`,
            `初始化SerialPort.list失败`,
            {
              type: 'error',
              showClose: false,
              closeOnClickModal: false,
              closeOnPressEscape: false,
              center: true,
              confirmButtonText: '刷新页面',
              cancelButtonText: '返回上一页'
            }
          )
            .then(() => {
              this.handleRefresh()
            })
            .catch(() => {
              this.handleGoBack()
            })
        })
    },

    /**
     * @description: 图形初始化
     */
    initChart() {
      // 计算横坐标数组
      this.xData = []
      for (let i = 0; i < 100; i++) {
        this.xData.push(parseFloat((i * 0.1).toFixed(1)))
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
          name: '单位：kg',
          min: 0
          // max: 500
        },
        tooltip: {
          trigger: 'axis',
          formatter: '{c} kg'
        },
        series: [
          {
            data: [' '],
            type: 'line',
            areaStyle: {
              color: 'rgba(174, 217, 206, 1)'
            },
            lineStyle: {
              color: 'rgba(43, 151, 122, 1)'
            },
            markPoint: {
              data: [
                {
                  type: 'max'
                }
              ],
              symbol: 'pin'
            },
            smooth: true,
            showSymbol: false
          }
        ],
        animation: false
      }

      this.myChart.setOption(this.option)
    },

    /**
     * @description: 重新刷新画布（即重新获取父容器宽高），目的是实现echarts图形自适应父容器的宽高变化
     */
    resizeCharts() {
      if (this.myChart) {
        this.myChart.resize()
      }
    },

    /**
     * @description: 开始测量按钮
     */
    handleStart() {
      this.leftWeightArray = [0] // 此处保证第一个值是0，为了应付医院
      this.rightWeightArray = [0] // 此处保证第一个值是0，为了应付医院
      this.time = 10
      this.isStart = true
      this.isRestart = false

      if (this.usbPort) {
        if (!this.usbPort.isOpen) {
          this.usbPort.open()
        }
      }

      this.timeClock = setInterval(() => {
        this.time -= 1
        if (this.time === 0) {
          this.handleOver()
        }
      }, 1000)
    },

    /**
     * @description: 结束该次测量按钮
     */
    handleOver() {
      if (this.usbPort) {
        if (this.usbPort.isOpen) {
          this.usbPort.close()

          if (this.timeClock) {
            clearInterval(this.timeClock)
          }
          this.time = 10

          if (this.testValueArray.length <= 2) {
            if (this.$store.state.currentUserInfo.affectedSide === '左') {
              this.testValueArray.push(Math.max(...this.leftWeightArray))
            } else if (
              this.$store.state.currentUserInfo.affectedSide === '右'
            ) {
              this.testValueArray.push(Math.max(...this.rightWeightArray))
            }
          }

          this.isStart = false
          this.isRestart = true
        }
      }
    },

    /**
     * @description: 重新该次测量按钮
     */
    handleRestart() {
      this.isRestart = false
      if (this.testValueArray.length > 0) {
        this.testValueArray.pop()
        // 图形的数值清空一下
        this.option.series[0].data = [' ']
        this.myChart.setOption(this.option)
      }
    },

    /**
     * @description: 完成按钮
     */
    handleFinish() {
      /* 取数组中的最大值 */
      this.testResult = Math.max(...this.testValueArray)

      /* 只有不为NaN和不为零，才算完成本项测试 */
      if (isNaN(this.testResult)) {
        this.$confirm(
          `最终计算结果为${this.testResult}，请检查测量数值是否有误，然后点击“重新测量”按钮。`,
          '提示',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            showCancelButton: false,
            type: 'warning',
            center: true
          }
        )
          .then(() => {})
          .catch(() => {})
      } else if (this.testResult === 0) {
        this.$confirm(
          `最终计算结果为0，请检查测量数值是否有误，然后点击“重新测量”按钮。`,
          '提示',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            showCancelButton: false,
            type: 'warning',
            center: true
          }
        )
          .then(() => {})
          .catch(() => {})
      } else {
        /* 保存数据 */
        const pdfTime = this.$moment().format('YYYY-MM-DD HH:mm:ss')
        const hospital = window.localStorage.getItem('hospital')
        const db = initDB()
        db.test_data
          .add({
            hospital: hospital,
            userId: this.$store.state.currentUserInfo.userId,
            userName: this.$store.state.currentUserInfo.userName,
            sex: this.$store.state.currentUserInfo.sex,
            affectedSide: this.$store.state.currentUserInfo.affectedSide,
            height: this.$store.state.currentUserInfo.height,
            weight: this.$store.state.currentUserInfo.weight,
            birthday: this.$store.state.currentUserInfo.birthday,
            pdfTime: pdfTime,
            dataArray: this.testValueArray,
            ultimateLoad: this.testResult, // 极限负重
            testType: '精准负重测试'
          })
          .then(() => {
            const db = initDB()
            db.user
              .update(this.$store.state.currentUserInfo.userId, {
                ultimateLoad: this.testResult
              })
              .then(() => {
                const oldCurrentUserInfo = JSON.parse(
                  JSON.stringify(this.$store.state.currentUserInfo)
                )
                this.$store.dispatch('changeCurrentUserInfo', {
                  userId: oldCurrentUserInfo.userId,
                  userName: oldCurrentUserInfo.userName,
                  sex: oldCurrentUserInfo.sex,
                  affectedSide: oldCurrentUserInfo.affectedSide,
                  height: oldCurrentUserInfo.height,
                  weight: oldCurrentUserInfo.weight,
                  birthday: oldCurrentUserInfo.birthday,
                  remarks: oldCurrentUserInfo.remarks,
                  lastLoginTime: oldCurrentUserInfo.lastLoginTime,
                  ultimateLoad: this.testResult
                })
              })
          })
          .then(() => {
            // 前往报告页面
            this.$router.push({
              path: '/precision-weight-print',
              query: {
                userId: JSON.stringify(
                  this.$store.state.currentUserInfo.userId
                ),
                pdfTime: JSON.stringify(pdfTime),
                routerName: JSON.stringify('/test-select/precision-weight-set')
              }
            })
          })
          .catch(() => {
            this.$alert(
              `请点击"返回上一页"按钮，然后重新测试！`,
              '数据保存失败',
              {
                type: 'error',
                showClose: false,
                center: true,
                confirmButtonText: '返回上一页',
                callback: () => {
                  this.handleGoBack()
                }
              }
            )
          })
      }
    },

    /**
     * @description: 刷新页面按钮
     */
    handleRefresh() {
      this.$router.push({
        path: '/refresh',
        query: {
          routerName: JSON.stringify('/precision-weight-measure'),
          duration: JSON.stringify(300)
        }
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.precision-weight-measure {
  width: 100%;
  height: 100%;
  @include flex(row, center, center);

  .wrapper {
    width: 96%;
    height: 96%;
    border-radius: 20px;
    background-color: #ffffff;
    box-shadow: 0 0 10px #929292;
    position: relative;
    @include flex(row, stretch, stretch);

    .page {
      position: absolute;
      top: 15px;
      left: 30px;
    }

    .left {
      padding: 45px 5px 10px 5px;
      flex: 1;
      @include flex(column, stretch, stretch);
      .chart {
        flex: 1;
      }
      .btn {
        margin-bottom: 16px;
        @include flex(row, center, center);
        .item {
          font-size: 30px;
        }
      }
    }

    .divider {
      border: 1px solid #e0e0e0;
    }

    .right {
      width: 20%;
      @include flex(column, stretch, center);
      // 倒计时
      .time {
        position: relative;
        @include flex(column, center, center);
        transform: scale(0.8);
        .img {
          transform: scale(1.2);
        }
        .text {
          position: absolute;
          top: 6%;
          left: 50%;
          transform: translateX(-50%);
          color: #ffffff;
          font-size: 20px;
        }
        .value {
          position: absolute;
          color: #ffffff;
          font-size: 94px;
        }
      }
      // 测量结果
      .result {
        position: relative;
        @include flex(column, stretch, center);
        .title {
          position: absolute;
          top: 6%;
          color: #ffffff;
          font-size: 28px;
        }
        .item1 {
          position: absolute;
          @include flex(row, center, center);
          top: 22%;
        }
        .item2 {
          position: absolute;
          @include flex(row, center, center);
          top: 40%;
        }
        .item3 {
          position: absolute;
          @include flex(row, center, center);
          top: 58%;
        }
        .value {
          width: 70%;
          font-weight: 700;
          font-size: 22px;
        }
        .confirm-btn {
          position: absolute;
          @include flex(row, center, center);
          top: 75%;
          color: #000000;
          font-weight: 700;
        }
      }
      // 其他按钮组
      .btn {
        width: 80%;
        @include flex(column, center, stretch);
        .item {
          margin: 5px 0;
        }
      }
    }
  }
}
</style>
