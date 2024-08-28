<!--
 * @Author      : Mr.bin
 * @Date        : 2023-02-07 14:36:30
 * @LastEditTime: 2024-08-28 10:51:41
 * @Description : 游戏
-->
<template>
  <div class="game">
    <div class="wrapper">
      <el-page-header
        class="page"
        title="返回首页"
        content="游戏"
        @back="handleToHome"
      ></el-page-header>

      <div class="info">
        说明：点击开始游戏后，会自动调起游戏程序，请耐心等待！
      </div>

      <div class="btn">
        <el-button
          class="item"
          type="success"
          :loading="loading"
          @click="handlePlay"
          >开始游戏</el-button
        >
        <el-button class="item" type="info" @click="handleRefresh"
          >刷新页面</el-button
        >
      </div>
    </div>
  </div>
</template>

<script>
/* 串口通信库 */
import SerialPort from 'serialport'

import fs from 'fs'

import { ipcRenderer } from 'electron'

export default {
  name: 'game',

  data() {
    return {
      loading: false, // 按钮加载动画
      comPath: '' // 比如COM6
    }
  },

  created() {
    this.initSerialPort()
  },

  methods: {
    /**
     * @description: 回到首页
     */
    handleToHome() {
      this.$router.push({
        path: '/home'
      })
    },

    /**
     * @description: 初始化串口对象
     */
    initSerialPort() {
      SerialPort.list()
        .then(ports => {
          /* 遍历设备的USB串口，目标设备需安装驱动 */
          this.comPath = ''
          for (const port of ports) {
            if (/^USB/.test(port.pnpId)) {
              this.comPath = port.path
              break
            }
          }

          /* 验证USB有没有连接到电脑 */
          if (this.comPath) {
            this.$notify({
              title: '通知',
              message: `连接到串口：${this.comPath}`,
              type: 'success',
              position: 'bottom-right',
              duration: 3000
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
                this.handleToHome()
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
              this.handleToHome()
            })
        })
    },

    /**
     * @description: 开始游戏按钮
     */
    handlePlay() {
      this.loading = true

      const data = JSON.stringify({
        type: 'standalone', // [单机：standalone]或者[网络：network]
        com: this.comPath,
        devices_name: '单机版无设备编号', // 设备编号（网络版才有）
        user_name: this.$store.state.currentUserInfo.userName,
        devices_sort: 'squat-control', // 下蹲
        exe_path:
          'C:/Program Files/energy-n14-e13-standalone-squat-control/下蹲控制反馈训练软件-单机版.exe' // 自己程序的绝对路径
      })

      /* 使用fs库写文件 */
      const dirPath = `C:/game_data.json` // 测试用D盘，打包记得改回C盘
      fs.writeFile(dirPath, data, { flag: 'w+' }, async err => {
        if (err) {
          this.$message({
            message: `写game_data.txt操作失败：${err}`,
            type: 'error',
            duration: 5000
          })
          this.loading = false
          return err
        } else {
          this.$message({
            message: `写game_data.txt成功，正在启动游戏......`,
            type: 'success',
            duration: 2500
          })

          /* 调起游戏操作 */
          const exec = require('child_process').exec
          exec(
            `C:/Chicken-CrazyPark/Chicken-CrazyPark.exe`,
            (error, stdout, stderr) => {
              if (error != null) {
                this.$message({
                  message: `调起游戏操作失败：${JSON.stringify(error)}`,
                  type: 'error',
                  duration: 10000
                })
              }
            }
          )

          /* 关闭自身软件 */
          setTimeout(() => {
            this.loading = false
            ipcRenderer.send('close')
          }, 1000)
        }
      })
    },

    /**
     * @description: 刷新页面
     */
    handleRefresh() {
      this.$router.push({
        path: '/refresh',
        query: {
          routerName: JSON.stringify('/game'),
          duration: JSON.stringify(300)
        }
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.game {
  width: 100%;
  height: 100%;
  @include flex(row, center, center);

  .wrapper {
    width: 86%;
    height: 90%;
    border-radius: 34px;
    background-color: #ffffff;
    box-shadow: 0 0 10px #929292;
    padding: 40px;
    @include flex(column, center, center);
    position: relative;

    .page {
      position: absolute;
      top: 20px;
      left: 30px;
    }

    .info {
      color: red;
      font-size: 30px;
      margin-bottom: 40px;
    }

    .btn {
      @include flex(column, stretch, center);
      .item {
        margin: 50px 0;
        font-size: 28px;
      }
    }
  }
}
</style>
