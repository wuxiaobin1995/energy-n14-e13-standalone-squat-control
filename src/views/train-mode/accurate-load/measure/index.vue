<!--
 * @Author      : Mr.bin
 * @Date        : 2022-08-16 14:18:25
 * @LastEditTime: 2022-09-12 10:21:07
 * @Description : 精准负重训练-具体测量
-->
<template>
  <div class="accurate-load-measure">
    <div class="wrapper">
      <el-page-header
        class="page"
        title="返回上一页"
        content="精准负重训练"
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
            :disabled="isStart"
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
          <div class="value">{{ countDown }}</div>
        </div>
        <!-- 患侧极限负重 -->
        <div class="ultimateLoad">
          <el-image class="img" :src="timeBgSrc" fit="scale-down"></el-image>
          <div class="text">极限负重</div>
          <div class="value">{{ ultimateLoad }}</div>
        </div>
        <!-- 其他按钮组 -->
        <div class="btn">
          <el-button
            class="item"
            type="primary"
            round
            icon="el-icon-check"
            :disabled="!isPrint"
            @click="handlePrint"
            >查看报告</el-button
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
  name: 'accurate-load-measure',

  data() {
    return {
      /* 路由传参 */
      ultimateLoad: JSON.parse(this.$route.query.ultimateLoad), // 患侧极限负重（kg）
      time: parseInt(JSON.parse(this.$route.query.time)), // 训练时长（s）
      routerName: JSON.parse(this.$route.query.routerName),

      timeBgSrc: require('@/assets/img/Test/Measure/倒计时背景.png'), // 倒计时背景

      /* 按钮禁用控制 */
      isStart: false,
      isPrint: false,

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
      countDown: parseInt(JSON.parse(this.$route.query.time)), // 倒计时
      leftWeight: 0, // 左负重（kg），精确到0.1kg
      rightWeight: 0, // 右负重（kg），精确到0.1kg
      leftWeightArray: [], // 左负重数组
      rightWeightArray: [], // 右负重数组
      upArr: [], // 上限极限曲线数组
      ultimateLoadArr: [], // 极限曲线数组
      downArr: [], // 下限极限曲线数组
      pdfTime: '',
      record: 0 // 训练完成度（%）
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
  },

  methods: {
    /**
     * @description: 回到上一页
     */
    handleGoBack() {
      this.$router.push({
        path: '/train-select/accurate-load-set'
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
              this.countDown = this.time

              this.$alert(
                `请重新连接USB线，然后点击"返回上一页"按钮！`,
                '串口开启失败',
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

                  if (
                    this.leftWeightArray.length ===
                    parseInt((this.time * 10).toFixed(0))
                  ) {
                    this.saveData()
                  }
                }
              }
            })
          } else {
            this.$getLogger('没有检测到USB连接')
            this.$alert(
              `请重新连接USB线，然后点击"返回上一页"按钮！`,
              '没有检测到USB连接',
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
          }
        })
        .catch(err => {
          this.$getLogger(err)
          this.$alert(
            `${err}。请重新连接USB线，然后点击"返回上一页"按钮！`,
            '初始化SerialPort.list失败',
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
    },

    /**
     * @description: 图形初始化
     */
    initChart() {
      // 计算横坐标数组
      for (let i = 0; i < parseInt((this.time * 10).toFixed(0)); i++) {
        this.xData.push(parseFloat((i * 0.1).toFixed(1)))
        this.upArr.push(parseFloat((this.ultimateLoad + 2.5).toFixed(1)))
        this.ultimateLoadArr.push(this.ultimateLoad)
        this.downArr.push(parseFloat((this.ultimateLoad - 2.5).toFixed(1)))
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
        series: [
          {
            data: [],
            type: 'line',
            lineStyle: {
              color: 'black'
            },
            smooth: true,
            showSymbol: false
          },
          {
            data: this.upArr,
            type: 'line',
            lineStyle: {
              color: 'red'
            },
            smooth: false,
            showSymbol: false
          },
          {
            data: this.ultimateLoadArr,
            type: 'line',
            lineStyle: {
              color: 'rgba(0, 255, 0, 0.2)'
            },
            smooth: false,
            showSymbol: false
          },
          {
            data: this.downArr,
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
     * @description: 开始测量按钮
     */
    handleStart() {
      this.leftWeightArray = []
      this.rightWeightArray = []
      this.countDown = this.time
      this.isStart = true
      this.isPrint = false

      if (this.usbPort) {
        if (!this.usbPort.isOpen) {
          this.usbPort.open()
        }
      }

      this.timeClock = setInterval(() => {
        this.countDown -= 1
      }, 1000)
    },

    /**
     * @description: 保存数据逻辑
     */
    saveData() {
      // 关闭串口
      if (this.usbPort) {
        if (this.usbPort.isOpen) {
          this.usbPort.close()
        }
      }

      this.countDown = this.time
      // 清除计时器
      if (this.timeClock) {
        clearInterval(this.timeClock)
      }

      // 计算某些值
      const yesArr = []
      for (let i = 0; i < this.leftWeightArray.length; i++) {
        if (this.$store.state.currentUserInfo.affectedSide === '左') {
          if (
            this.leftWeightArray[i] >= this.downArr[i] &&
            this.leftWeightArray[i] <= this.upArr[i]
          ) {
            yesArr.push(1)
          }
        } else {
          if (
            this.rightWeightArray[i] >= this.downArr[i] &&
            this.rightWeightArray[i] <= this.upArr[i]
          ) {
            yesArr.push(1)
          }
        }
      }
      this.record = parseInt(
        ((yesArr.length / this.leftWeightArray.length) * 100).toFixed(0)
      )

      this.pdfTime = this.$moment().format('YYYY-MM-DD HH:mm:ss')
      const hospital = window.localStorage.getItem('hospital')
      const db = initDB()
      db.train_data
        .add({
          hospital: hospital,
          userId: this.$store.state.currentUserInfo.userId,
          userName: this.$store.state.currentUserInfo.userName,
          sex: this.$store.state.currentUserInfo.sex,
          affectedSide: this.$store.state.currentUserInfo.affectedSide,
          height: this.$store.state.currentUserInfo.height,
          weight: this.$store.state.currentUserInfo.weight,
          birthday: this.$store.state.currentUserInfo.birthday,
          pdfTime: this.pdfTime,
          leftWeightArray: this.leftWeightArray,
          rightWeightArray: this.rightWeightArray,
          upArr: this.upArr,
          ultimateLoadArr: this.ultimateLoadArr,
          downArr: this.downArr,
          ultimateLoad: this.ultimateLoad,
          time: this.time,
          record: this.record,
          trainType: '精准负重训练'
        })
        .then(() => {
          this.$message({
            message: '数据保存成功',
            type: 'success',
            duration: 500
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
        .finally(() => {
          this.isStart = false
          this.isPrint = true
        })
    },

    /**
     * @description: 查看报告
     */
    handlePrint() {
      this.$router.push({
        path: '/accurate-load-print',
        query: {
          userId: JSON.stringify(this.$store.state.currentUserInfo.userId),
          pdfTime: JSON.stringify(this.pdfTime),
          routerName: JSON.stringify('/train-select/accurate-load-set')
        }
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.accurate-load-measure {
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
      // 患侧极限负重
      .ultimateLoad {
        flex: 1;
        position: relative;
        @include flex(column, center, center);
        transform: scale(0.8);
        .img {
          transform: scale(1.2);
        }
        .text {
          position: absolute;
          top: 31%;
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
      // 其他按钮组
      .btn {
        width: 80%;
        margin-bottom: 50px;
        @include flex(column, center, stretch);
        .item {
          margin: 5px 0;
        }
      }
    }
  }
}
</style>
