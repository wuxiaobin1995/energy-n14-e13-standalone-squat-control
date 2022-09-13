<!--
 * @Author      : Mr.bin
 * @Date        : 2022-08-16 14:18:25
 * @LastEditTime: 2022-09-11 14:57:48
 * @Description : 重心转移训练-具体测量
-->
<template>
  <div class="barycenter-transfer-measure">
    <div class="wrapper">
      <el-page-header
        class="page"
        title="返回上一页"
        content="重心转移训练"
        @back="handleGoBack"
      ></el-page-header>

      <!-- 介绍说明 -->
      <div class="introduce">
        <div class="item">
          测试目的：作为深感觉训练重要一环，加强对于重心的控制
        </div>
        <div class="item">
          执行动作：选取任意一点作为初始位置，将重心逐渐移动到绿色区域内，保持2-3秒后，回到初始位置，重复动作3-5次。训练完毕后，回到初始位置，点击“开始”，凭感觉达到目标负重
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
          >开 始</el-button
        >
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
  name: 'barycenter-transfer-measure',

  data() {
    return {
      /* 路由传参 */
      time: JSON.parse(this.$route.query.time),
      target: JSON.parse(this.$route.query.target),
      routerName: JSON.parse(this.$route.query.routerName),

      /* 串口相关变量 */
      usbPort: null,
      parser: null,
      scmBaudRate: 115200, // 默认波特率115200

      timeBgSrc: require('@/assets/img/Test/Measure/倒计时背景.png'),

      /* 控制类 */
      isStart: false, // 开关是否禁止点击

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
      core: 50, // 重心偏移值
      lastCore: 50, // 最终的重心偏移值
      trainResult: false // 最终结果（true或false）
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
      this.time = JSON.parse(this.$route.query.time)
      this.leftWeightArray = []
      this.rightWeightArray = []
      this.core = 50
      this.lastCore = 50

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

      /* 根据左右患侧来做变换 */
      if (this.$store.state.currentUserInfo.affectedSide === '右') {
        this.lastCore = this.core
      } else {
        this.lastCore = 100 - this.core
      }
      /* 计算是否达标 */
      if (
        this.target - 2.5 <= this.lastCore &&
        this.lastCore <= this.target + 2.5
      ) {
        this.trainResult = true
      } else {
        this.trainResult = false
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
          lastCore: this.lastCore,
          target: this.target,
          trainResult: this.trainResult,
          leftWeightArray: this.leftWeightArray,
          rightWeightArray: this.rightWeightArray,
          leftAverageWeight: pdfResult.leftAverageWeight,
          rightAverageWeight: pdfResult.rightAverageWeight,
          leftAverageWeightPercent: pdfResult.leftAverageWeightPercent,
          rightAverageWeightPercent: pdfResult.rightAverageWeightPercent,
          leftWeightPercentArray: pdfResult.leftWeightPercentArray,
          rightWeightPercentArray: pdfResult.rightWeightPercentArray,
          trainType: '重心转移训练'
        })
        .then(() => {
          this.$message({
            message: '数据保存成功',
            type: 'success',
            duration: 2000
          })
        })
        .then(() => {
          this.handlePrint()
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
     * @description: 查看结果
     */
    handlePrint() {
      this.$router.push({
        path: '/barycenter-transfer-result',
        query: {
          userId: JSON.stringify(this.$store.state.currentUserInfo.userId),
          pdfTime: JSON.stringify(this.pdfTime),
          routerName: JSON.stringify('/train-select/barycenter-transfer-set')
        }
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.barycenter-transfer-measure {
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

    /* 倒计时 */
    .count-down {
      flex: 1;
      @include flex(row, center, center);
      .box {
        position: relative;
        @include flex(row, center, center);
        .img {
          transform: scale(2, 2);
        }
        .text {
          position: absolute;
          top: -15%;
          font-size: 30px;
          color: #ffffff;
        }
        .value {
          position: absolute;
          top: 8%;
          font-size: 130px;
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
  }
}
</style>
