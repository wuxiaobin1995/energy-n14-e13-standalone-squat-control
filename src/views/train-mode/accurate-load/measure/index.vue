<!--
 * @Author      : Mr.bin
 * @Date        : 2022-08-16 14:18:25
 * @LastEditTime: 2023-05-19 11:04:37
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

      <!-- 介绍说明 -->
      <div class="introduce">
        <div class="item">
          执行动作：身体重量转移到患肢，将重心逐渐移动到绿色区域内
        </div>
      </div>

      <!-- 超出极限警告 -->
      <div class="warn" v-show="isWarnShow">警告，患侧负重超出安全值！</div>

      <!-- 重心偏移 -->
      <div class="center">
        <div class="center-l">
          <div>左<span class="unit">/kg</span></div>
          <div class="value">{{ leftWeight }}</div>
        </div>
        <div class="center-c">
          <div class="center-num">
            <div class="center-num-l">
              {{
                this.$store.state.currentUserInfo.affectedSide === '左'
                  ? '100%'
                  : '0%'
              }}
            </div>
            <div class="center-num-r">
              {{
                this.$store.state.currentUserInfo.affectedSide === '左'
                  ? '0%'
                  : '100%'
              }}
            </div>
          </div>
          <div class="center-bg" :style="colorObj"></div>
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

      <!-- 参数 -->
      <div class="set">
        <!-- 患侧 -->
        <div class="item">
          <el-image class="img" :src="timeBgSrc" fit="scale-down"></el-image>
          <div class="text">患侧</div>
          <div class="value">
            {{ this.$store.state.currentUserInfo.affectedSide }}
          </div>
        </div>

        <!-- 倒计时 -->
        <div class="item">
          <el-image class="img" :src="timeBgSrc" fit="scale-down"></el-image>
          <div class="text">倒计时</div>
          <div class="value">{{ countDown }}</div>
        </div>

        <!-- 患侧极限负重 -->
        <div class="item">
          <el-image class="img" :src="timeBgSrc" fit="scale-down"></el-image>
          <div class="text">负重%</div>
          <div class="value">{{ ultimateLoad }}</div>
        </div>
      </div>

      <!-- 按钮组 -->
      <div class="btn">
        <el-button
          class="item"
          type="success"
          :disabled="isStart"
          @click="handleStart"
          >开始训练</el-button
        >
        <el-button
          class="item"
          type="primary"
          :disabled="!isPrint"
          @click="handlePrint"
          >查看报告</el-button
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

export default {
  name: 'accurate-load-measure',

  data() {
    return {
      /* 路由传参 */
      ultimateLoad: JSON.parse(this.$route.query.ultimateLoad), // 患侧极限负重（%）
      time: parseInt(JSON.parse(this.$route.query.time)), // 训练时长（s）
      routerName: JSON.parse(this.$route.query.routerName),

      timeBgSrc: require('@/assets/img/Test/Measure/倒计时背景.png'), // 倒计时背景

      /* 按钮禁用控制 */
      isStart: false,
      isPrint: false,
      isWarnShow: false,

      /* 串口相关变量 */
      usbPort: null,
      parser: null,
      scmBaudRate: 115200, // 默认波特率115200

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

      core: 50, // 重心偏移值
      colorObj: {
        'background-image': `linear-gradient(
          to right,
          rgba(255, 255, 0, 0.5),
          rgba(255, 255, 0, 0.5) 47.5%,
          rgba(0, 128, 0, 0.5) 47.5%,
          rgba(0, 128, 0, 0.5) 52.5%,
          rgba(255, 255, 0, 0.5) 52.5%,
          rgba(255, 255, 0, 0.5) 100%
        )`
      },

      record: 0, // 训练完成度（%）
      pdfTime: ''
    }
  },

  created() {
    this.leftK = parseFloat(window.localStorage.getItem('leftK'))
    this.rightK = parseFloat(window.localStorage.getItem('rightK'))
    this.leftStandard = this.$store.state.zeroStandard.leftStandard
    this.rightStandard = this.$store.state.zeroStandard.rightStandard

    this.initColor()
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
        path: '/train-select/accurate-load-set'
      })
    },

    /**
     * @description: 颜色块初始化
     */
    initColor() {
      if (this.$store.state.currentUserInfo.affectedSide === '右') {
        this.colorObj = {
          'background-image': `linear-gradient(
            to right,
            rgba(255, 255, 0, 0.5),
            rgba(255, 255, 0, 0.5) ${this.ultimateLoad - 2.5}%,
            rgba(0, 128, 0, 0.5) ${this.ultimateLoad - 2.5}%,
            rgba(0, 128, 0, 0.5) ${this.ultimateLoad + 2.5}%,
            rgba(255, 255, 0, 0.5) ${this.ultimateLoad + 2.5}%,
            rgba(255, 255, 0, 0.5) 100%
          )`
        }
      } else {
        this.colorObj = {
          'background-image': `linear-gradient(
            to right,
            rgba(255, 255, 0, 0.5),
            rgba(255, 255, 0, 0.5) ${100 - this.ultimateLoad - 2.5}%,
            rgba(0, 128, 0, 0.5) ${100 - this.ultimateLoad - 2.5}%,
            rgba(0, 128, 0, 0.5) ${100 - this.ultimateLoad + 2.5}%,
            rgba(255, 255, 0, 0.5) ${100 - this.ultimateLoad + 2.5}%,
            rgba(255, 255, 0, 0.5) 100%
          )`
        }
      }
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
                  if (this.$store.state.currentUserInfo.affectedSide === '左') {
                    this.core =
                      this.leftWeight <= 100 ? 100 - this.leftWeight : 0
                  } else {
                    this.core = this.rightWeight <= 100 ? this.rightWeight : 100
                  }

                  // if (this.leftWeight + this.rightWeight !== 0) {
                  //   this.core = parseInt(
                  //     (
                  //       (this.rightWeight /
                  //         (this.leftWeight + this.rightWeight)) *
                  //       100
                  //     ).toFixed(0)
                  //   )
                  // } else {
                  //   this.core = 50
                  // }

                  /* 数据插入数组中 */
                  if (this.isStart) {
                    this.leftWeightArray.push(this.leftWeight)
                    this.rightWeightArray.push(this.rightWeight)

                    /* 极限超出提示 */
                    if (
                      this.$store.state.currentUserInfo.affectedSide === '左'
                    ) {
                      if (this.leftWeight > this.ultimateLoad + 2.5) {
                        this.isWarnShow = true
                      } else {
                        this.isWarnShow = false
                      }
                    } else {
                      if (this.rightWeight > this.ultimateLoad + 2.5) {
                        this.isWarnShow = true
                      } else {
                        this.isWarnShow = false
                      }
                    }
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
     * @description: 开始测量按钮
     */
    handleStart() {
      this.leftWeightArray = []
      this.rightWeightArray = []
      this.countDown = this.time
      this.isStart = true
      this.isPrint = false

      this.timeClock = setInterval(() => {
        this.countDown -= 1
        if (this.countDown === 0) {
          this.saveData()
        }
      }, 1000)
    },

    /**
     * @description: 保存数据逻辑
     */
    saveData() {
      this.isStart = false

      this.countDown = this.time
      // 清除计时器
      if (this.timeClock) {
        clearInterval(this.timeClock)
      }

      // 计算完成度
      for (let i = 0; i < this.leftWeightArray.length; i++) {
        this.upArr.push(parseFloat((this.ultimateLoad + 2.5).toFixed(1)))
        this.ultimateLoadArr.push(this.ultimateLoad)
        this.downArr.push(parseFloat((this.ultimateLoad - 2.5).toFixed(1)))
      }

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
        ? parseInt(
            ((yesArr.length / this.leftWeightArray.length) * 100).toFixed(0)
          )
        : 0

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
            `请点击"返回上一页"按钮，然后重新训练！`,
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
    @include flex(column, stretch, stretch);

    .page {
      position: absolute;
      top: 15px;
      left: 30px;
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

    /* 超出极限警告 */
    .warn {
      @include flex(row, center, center);
      color: red;
      font-size: 20px;
      font-weight: 700;
      margin-top: 10px;
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

    /* 参数 */
    .set {
      @include flex(row, space-around, center);
      margin-bottom: 60px;
      .item {
        position: relative;
        @include flex(column, center, center);
        transform: scale(0.8);
        .img {
          transform: scale(1.3);
        }
        .text {
          position: absolute;
          top: 3%;
          left: 50%;
          transform: translateX(-50%);
          color: #ffffff;
          font-size: 20px;
        }
        .value {
          position: absolute;
          color: #ffffff;
          font-size: 80px;
        }
      }
    }

    /* 按钮组 */
    .btn {
      margin-bottom: 30px;
      @include flex(row, center, center);
      .item {
        font-size: 34px;
        margin: 0 60px;
      }
    }
  }
}
</style>
