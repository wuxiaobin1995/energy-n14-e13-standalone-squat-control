<!--
 * @Author      : Mr.bin
 * @Date        : 2022-07-28 14:00:00
 * @LastEditTime: 2023-06-26 11:00:36
 * @Description : 开发者
-->
<template>
  <div class="set-developer">
    <div class="wrapper">
      <el-page-header
        class="page"
        title="返回首页"
        content="开发者（单机版）"
        @back="handleToHome"
      ></el-page-header>

      <div class="btn">
        <el-button class="item" type="success" round @click="handleOpenDev"
          >打开控制台</el-button
        >
      </div>

      <!-- 免责声明 -->
      <div class="disclaimer">
        <el-input class="item" placeholder="请输入终端用户名称" v-model="name">
          <template slot="prepend">终端用户名称：</template>
        </el-input>
        <el-input class="item" placeholder="请输入设备编号" v-model="deviceId">
          <template slot="prepend">设备编号：</template>
        </el-input>
        <el-button class="item" type="primary" @click="handleSetDisclaimer"
          >确 定</el-button
        >
      </div>
    </div>
  </div>
</template>

<script>
/* 用于打开控制台 */
import { remote } from 'electron'

export default {
  name: 'set-developer',

  data() {
    return {
      name: '',
      deviceId: ''
    }
  },

  created() {
    this.name = window.localStorage.getItem('disclaimer_name')
    this.deviceId = window.localStorage.getItem('disclaimer_device_id')
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
     * @description: 打开控制台
     */
    handleOpenDev() {
      try {
        remote.getCurrentWebContents().openDevTools()
      } catch (err) {
        this.$message({
          type: 'error',
          message: `打开控制台失败：${err}`
        })
      }
    },

    /**
     * @description: 设置免责声明
     */
    handleSetDisclaimer() {
      window.localStorage.setItem('disclaimer_name', this.name)
      window.localStorage.setItem('disclaimer_device_id', this.deviceId)

      this.$message({
        type: 'success',
        message: `设置免责声明成功！`,
        duration: 3000
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.set-developer {
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

    .btn {
      @include flex(column, center, center);
      .item {
        font-size: 28px;
      }
    }

    .disclaimer {
      width: 50%;
      margin-top: 50px;
      border: 2px solid rgb(133, 130, 130);
      border-radius: 20px;
      padding: 20px 20px 0 20px;
      @include flex(column, stretch, stretch);
      .item {
        margin-bottom: 30px;
      }
    }
  }
}
</style>
