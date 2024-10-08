<!--
 * @Author      : Mr.bin
 * @Date        : 2022-08-16 14:17:15
 * @LastEditTime: 2023-06-09 10:10:28
 * @Description : 精准负重训练-参数设置
-->
<template>
  <div class="accurate-load-set">
    <!-- 语音播放 -->
    <audio ref="audio" controls="controls" hidden :src="audioSrc" />

    <!-- 介绍说明 -->
    <div class="introduce">
      <div class="item">
        执行动作：身体重量转移到患肢，将重心逐渐移动到绿色区域内
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

    <!-- 参数配置 -->
    <div class="set">
      <div class="item">
        <el-image class="img" :src="bgSrc" fit="scale-down"></el-image>
        <div class="text">患侧</div>
        <div class="value">
          {{ this.$store.state.currentUserInfo.affectedSide }}
        </div>
      </div>
      <!-- 患侧极限负重 -->
      <div class="item">
        <el-image class="img" :src="bgSrc" fit="scale-down"></el-image>
        <div class="text">患侧极限负重(%)</div>
        <el-input-number
          class="num"
          v-model="ultimateLoad"
          @change="handleChangeTarget"
          :min="0"
          :max="100"
          :precision="0"
        ></el-input-number>
      </div>
      <div class="item">
        <el-image class="img" :src="bgSrc" fit="scale-down"></el-image>
        <div class="text">默认时长(s)</div>
        <div class="value">
          <el-select class="select" v-model="time">
            <el-option
              v-for="item in options"
              :key="item.value"
              :value="item.value"
            >
            </el-option>
          </el-select>
        </div>
      </div>
    </div>

    <!-- 按钮组 -->
    <div class="btn">
      <el-button
        class="item"
        type="success"
        plain
        icon="el-icon-video-play"
        @click="handleStart"
        >开始训练</el-button
      >
      <el-button class="item" type="danger" plain @click="handleBack"
        >返回首页</el-button
      >
    </div>
  </div>
</template>

<script>
/* 路径模块 */
import path from 'path'

/* 串口通信库 */
import SerialPort from 'serialport'
import Readline from '@serialport/parser-readline'

export default {
  name: 'accurate-load-set',

  data() {
    return {
      /* 串口相关变量 */
      usbPort: null,
      parser: null,
      scmBaudRate: 115200, // 默认波特率115200

      bgSrc: require('@/assets/img/Test/Select/背景图1.png'),

      /* 语音相关 */
      audioOpen: this.$store.state.voiceSwitch,
      audioSrc: path.join(__static, `narrate/mandarin/7-精准负重训练.mp3`),

      /* 其他 */
      leftK: 0, // 左K
      rightK: 0, // 右K
      leftStandard: 0, // 左调零值
      rightStandard: 0, // 右调零值
      leftWeight: 0, // 左负重（kg），精确到0.1kg
      rightWeight: 0, // 右负重（kg），精确到0.1kg
      core: 50, // 重心偏移值
      ultimateLoad: 50,
      // ultimateLoad:
      //   this.$store.state.currentUserInfo.ultimateLoad <= 100
      //     ? this.$store.state.currentUserInfo.ultimateLoad
      //     : 100, // 患侧极限负重（%），注意这里是强行让kg用%替代，毕竟需求很奇葩
      time: 60, // 训练时长
      options: [
        {
          value: '10'
        },
        {
          value: '30'
        },
        {
          value: '60'
        },
        {
          value: '90'
        },
        {
          value: '120'
        },
        {
          value: '180'
        },
        {
          value: '300'
        }
      ],

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
      }
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
  mounted() {
    if (this.audioOpen === true) {
      setTimeout(() => {
        this.$refs.audio.currentTime = 0
        this.$refs.audio.play()
      }, 500)
    }
  },
  beforeDestroy() {
    // 关闭串口
    if (this.usbPort) {
      if (this.usbPort.isOpen) {
        this.usbPort.close()
      }
    }
  },

  methods: {
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
              this.$confirm(
                `请重新连接USB线，然后点击"刷新页面"按钮！`,
                '串口开启失败',
                {
                  type: 'error',
                  showClose: false,
                  closeOnClickModal: false,
                  closeOnPressEscape: false,
                  center: true,
                  confirmButtonText: '刷新页面',
                  cancelButtonText: '返回首页'
                }
              )
                .then(() => {
                  this.handleRefresh()
                })
                .catch(() => {
                  this.$router.push({
                    path: '/home'
                  })
                })
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
                // if (this.$store.state.currentUserInfo.affectedSide === '左') {
                //   this.core = this.leftWeight <= 100 ? 100 - this.leftWeight : 0
                // } else {
                //   this.core = this.rightWeight <= 100 ? this.rightWeight : 100
                // }

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
                cancelButtonText: '返回首页'
              }
            )
              .then(() => {
                this.handleRefresh()
              })
              .catch(() => {
                this.$router.push({
                  path: '/home'
                })
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
              cancelButtonText: '返回首页'
            }
          )
            .then(() => {
              this.handleRefresh()
            })
            .catch(() => {
              this.$router.push({
                path: '/home'
              })
            })
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
     * @description: 动态改变绿色块位置
     * @param {Number} value
     */
    handleChangeTarget(value) {
      this.ultimateLoad = value
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
     * @description: 开始训练
     */
    handleStart() {
      this.$router.push({
        path: '/accurate-load-measure',
        query: {
          time: JSON.stringify(this.time),
          ultimateLoad: JSON.stringify(this.ultimateLoad),
          routerName: JSON.stringify('/train-select/accurate-load-set')
        }
      })
    },

    /**
     * @description: 返回首页
     */
    handleBack() {
      this.$router.push({
        path: '/home'
      })
    },

    /**
     * @description: 刷新页面
     */
    handleRefresh() {
      this.$router.push({
        path: '/refresh',
        query: {
          routerName: JSON.stringify('/train-select/accurate-load-set'),
          duration: JSON.stringify(300)
        }
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.accurate-load-set {
  width: 100%;
  height: 100%;
  @include flex(column, stretch, stretch);

  /* 介绍说明 */
  .introduce {
    margin-top: 30px;
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

  /* 参数配置 */
  .set {
    @include flex(row, space-around, center);
    margin-bottom: 30px;
    .item {
      position: relative;
      @include flex(row, center, center);
      .img {
        width: 100%;
      }
      .text {
        position: absolute;
        top: 22px;
        font-size: 20px;
        color: #ffffff;
      }
      .value {
        position: absolute;
        top: 38%;
        font-size: 38px;
        @include flex(row, center, center);
        .select {
          margin-top: 10px;
          width: 74%;
        }
      }
      .num {
        position: absolute;
        top: 38%;
        font-size: 38px;
        margin-top: 10px;
        width: 74%;
      }
    }
  }

  /* 按钮组 */
  .btn {
    margin-bottom: 10px;
    @include flex(row, center, center);
    .item {
      margin: 0 50px;
      font-size: 34px;
    }
  }
}
</style>
