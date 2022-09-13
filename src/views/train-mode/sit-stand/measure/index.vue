<!--
 * @Author      : Mr.bin
 * @Date        : 2022-08-16 14:18:25
 * @LastEditTime: 2022-08-17 10:32:20
 * @Description : 坐站训练-具体测量
-->
<template>
  <div class="sit-stand-measure">
    <div class="wrapper">
      <el-page-header
        class="page"
        title="返回上一页"
        content="坐站训练"
        @back="handleGoBack"
      ></el-page-header>

      <!-- 介绍说明 -->
      <div class="introduce">
        <div class="item">测试目的：可以通过座椅高低调整坐站训练难度</div>
        <div class="item">
          执行动作：进行坐站训练时，尽可能调整重心使滑块保持在绿色区域
        </div>
      </div>

      <!-- 重心偏移 -->
      <div class="center">
        <div class="center-l">
          <div>左<span class="unit">/kg</span></div>
          <div class="value">{{ leftWeight }}</div>
        </div>
        <div class="center-c">
          <div class="center-num">
            <div class="center-num-0">100%</div>
            <div class="center-num-50">50%</div>
            <div class="center-num-100">100%</div>
          </div>
          <div class="center-bg"></div>
          <el-slider
            class="center-core"
            v-model="core"
            :disabled="true"
            :show-tooltip="false"
          ></el-slider>
        </div>
        <div class="center-r">
          <div>右<span class="unit">/kg</span></div>
          <div class="value">{{ rightWeight }}</div>
        </div>
      </div>

      <!-- 倒计时 -->
      <div class="count-down">
        <div class="box">
          <el-image class="img" :src="timeBgSrc" fit="scale-down"></el-image>
          <div class="text">倒计时</div>
          <div class="value">{{ time }}</div>
        </div>
      </div>

      <!-- 按钮组 -->
      <div class="btn">
        <el-button
          type="primary"
          @click="handleStart"
          :disabled="isStart"
          class="item"
          >开始测量</el-button
        >
        <el-button
          type="success"
          @click="handlePrint"
          :disabled="!isPrint"
          class="item"
          >查看报告</el-button
        >
      </div>

      <!-- 膝盖内扣提醒 -->
      <div class="warn">
        <div class="text" v-show="this.innerBuckle ? true : false">
          <i class="el-icon-error"></i>
          请注意！膝关节已内扣！
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

import { analyzeTrainResult } from '@/utils/analyze-train-result.js'

export default {
  name: 'sit-stand-measure',

  data() {
    return {
      /* 路由传参 */
      time: JSON.parse(this.$route.query.time),
      routerName: JSON.parse(this.$route.query.routerName),

      /* 串口相关变量 */
      usbPort: null,
      parser: null,
      scmBaudRate: 115200, // 默认波特率115200

      timeBgSrc: require('@/assets/img/Test/Measure/倒计时背景.png'),

      /* 控制类 */
      isStart: false, // 开关是否禁止点击
      isPrint: false, // 是否查看报告
      innerBuckle: false, // 膝盖是否内扣

      /* 其他 */
      timeClock: null, // 计时器
      leftK: 0, // 左K
      rightK: 0, // 右K
      leftStandard: 0, // 左调零值
      rightStandard: 0, // 右调零值
      leftWeight: 0, // 左负重（kg），精确到0.1kg
      rightWeight: 0, // 右负重（kg），精确到0.1kg
      leftWeightArray: [], // 左负重数组
      rightWeightArray: [], // 右负重数组
      pdfTime: '',
      core: 50 // 重心偏移值
    }
  },

  created() {
    this.leftK = parseFloat(window.localStorage.getItem('leftK'))
    this.rightK = parseFloat(window.localStorage.getItem('rightK'))
    this.leftStandard = this.$store.state.zeroStandard.leftStandard
    this.rightStandard = this.$store.state.zeroStandard.rightStandard

    this.initSerialPort()
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
        path: this.routerName
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
              autoOpen: true // 是否自动开启串口
            })
            /* 调用 this.usbPort.open() 成功时触发（开启串口成功） */
            this.usbPort.on('open', () => {})
            /* 调用 this.usbPort.open() 失败时触发（开启串口失败） */
            this.usbPort.on('error', () => {
              this.$alert(
                `请重新连接USB线，然后点击"返回上一页"按钮，重新测试！`,
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

              /* 膝盖是否内扣警告 */
              const innerBuckleLeft = parseInt(data.slice(0, 1))
              const innerBuckleRight = parseInt(data.slice(1, 2))
              if (innerBuckleLeft === 1 && innerBuckleRight === 1) {
                this.innerBuckle = false
              } else {
                this.innerBuckle = true
              }

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
                if (this.leftWeight + this.rightWeight !== 0) {
                  this.core = parseInt(
                    (
                      (this.rightWeight /
                        (this.leftWeight + this.rightWeight)) *
                      100
                    ).toFixed(0)
                  )
                } else {
                  this.core = 50
                }

                if (this.isStart) {
                  this.leftWeightArray.push(this.leftWeight)
                  this.rightWeightArray.push(this.rightWeight)
                }
              }
            })
          } else {
            this.$getLogger('没有检测到USB连接')
            this.$alert(
              `请重新连接USB线，然后点击"返回上一页"按钮，重新测试！`,
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
            `${err}。请重新连接USB线，然后点击"返回上一页"按钮，重新测试！`,
            `初始化SerialPort.list失败`,
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
     * @description: 开始按钮
     */
    handleStart() {
      this.isStart = true
      this.isPrint = false
      this.time = JSON.parse(this.$route.query.time)
      this.leftWeightArray = []
      this.rightWeightArray = []
      this.core = 50

      this.timeClock = setInterval(() => {
        this.time -= 1
        if (this.time === 0) {
          this.saveData()
        }
      }, 1000)
    },

    /**
     * @description: 保存数据逻辑
     */
    saveData() {
      // 清除计时器
      if (this.timeClock) {
        clearInterval(this.timeClock)
      }

      // 计算某些值
      const res = {
        leftWeightArray: this.leftWeightArray,
        rightWeightArray: this.rightWeightArray
      }
      const pdfResult = analyzeTrainResult(res)
      this.pdfTime = this.$moment().format('YYYY-MM-DD HH:mm:ss')
      const hospital = window.localStorage.getItem('hospital')
      // 保存数据到数据库
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
          leftAverageWeight: pdfResult.leftAverageWeight,
          rightAverageWeight: pdfResult.rightAverageWeight,
          leftAverageWeightPercent: pdfResult.leftAverageWeightPercent,
          rightAverageWeightPercent: pdfResult.rightAverageWeightPercent,
          leftWeightPercentArray: pdfResult.leftWeightPercentArray,
          rightWeightPercentArray: pdfResult.rightWeightPercentArray,
          trainType: '坐站训练'
        })
        .then(() => {
          this.$message({
            message: '数据保存成功',
            type: 'success',
            duration: 2000
          })
        })
        .then(() => {
          this.isPrint = true
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
        })
    },

    /**
     * @description: 查看报告
     */
    handlePrint() {
      this.$router.push({
        path: '/sit-stand-print',
        query: {
          userId: JSON.stringify(this.$store.state.currentUserInfo.userId),
          pdfTime: JSON.stringify(this.pdfTime),
          routerName: JSON.stringify('/train-select/sit-stand-set')
        }
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.sit-stand-measure {
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
    @include flex(column, stretch, stretch);

    .page {
      position: absolute;
      top: 15px;
      left: 20px;
    }

    /* 介绍说明 */
    .introduce {
      margin-top: 60px;
      margin-left: 40px;
      @include flex(column, stretch, stretch);
      .item {
        font-size: 22px;
        margin-bottom: 5px;
      }
    }

    /* 重心偏移 */
    .center {
      flex: 1;
      @include flex(row, center, center);
      .center-l,
      .center-r {
        @include flex(column, center, center);
        width: 140px;
        font-size: 26px;
        .unit {
          font-size: 16px;
        }
        .value {
          margin-top: 10px;
          @include flex(row, center, center);
          width: 80px;
          padding: 4px;
          background-color: rgb(204, 204, 204);
          border-radius: 6px;
        }
      }
      .center-c {
        flex: 1;
        .center-num {
          @include flex(row, space-between, center);
          margin-bottom: 5px;
        }
        .center-bg {
          border-radius: 30px;
          float: left;
          width: 100%;
          height: 60px;
          background-image: linear-gradient(
            to right,
            rgba(255, 0, 0, 0.5),
            rgba(255, 0, 0, 0.5) 40%,
            rgba(255, 255, 0, 0.5) 40%,
            rgba(255, 255, 0, 0.5) 47.5%,
            rgba(0, 128, 0, 0.5) 47.5%,
            rgba(0, 128, 0, 0.5) 52.5%,
            rgba(255, 255, 0, 0.5) 52.5%,
            rgba(255, 255, 0, 0.5) 60%,
            rgba(255, 0, 0, 0.5) 60%,
            rgba(255, 0, 0, 0.5) 100%
          );
        }
        .center-core {
          padding-top: 10px;
          width: 100%;
          // 修改指针和背景的样式
          & /deep/ .el-slider__runway {
            background-color: #ffffff !important;
          }
          & /deep/ .el-slider__bar {
            background-color: #ffffff !important;
          }
          & /deep/ .el-slider__button {
            margin-top: 20px;
            border-width: 0 10px 60px;
            border-style: solid;
            border-color: transparent transparent rgb(0, 0, 0);
            border-radius: 20px;
            background-color: rgba(182, 182, 182, 0);
          }
        }
      }
    }

    /* 倒计时 */
    .count-down {
      @include flex(row, center, center);
      margin-bottom: 80px;
      .box {
        position: relative;
        @include flex(row, center, center);
        .img {
          width: 100%;
        }
        .text {
          position: absolute;
          top: 25px;
          font-size: 20px;
          color: #ffffff;
        }
        .value {
          position: absolute;
          top: 32%;
          font-size: 60px;
        }
      }
    }

    /* 按钮组 */
    .btn {
      margin-bottom: 20px;
      @include flex(row, center, center);
      .item {
        font-size: 34px;
        margin: 0 60px;
      }
    }

    .warn {
      position: absolute;
      top: 20%;
      left: 50%;
      transform: translate(-50%);
      .text {
        font-size: 38px;
        color: red;
      }
    }
  }
}
</style>
