<!--
 * @Author      : Mr.bin
 * @Date        : 2022-09-14 11:30:18
 * @LastEditTime: 2022-09-14 14:09:06
 * @Description : 训练-数据记录
-->
<template>
  <div class="train-record">
    <div class="wrapper">
      <div class="btn">
        <el-button
          class="item"
          type="danger"
          round
          plain
          @click="handleSitStand"
          >坐站训练</el-button
        >
        <el-button
          class="item"
          type="warning"
          round
          plain
          @click="handleAccurateLoad"
          >精准负重训练</el-button
        >
        <el-button
          class="item"
          type="success"
          round
          plain
          @click="handleBarycenterTransfer"
          >重心转移训练</el-button
        >
        <el-button class="item" type="primary" round plain @click="handleSquat"
          >下蹲动作训练</el-button
        >
      </div>

      <div class="divider"></div>

      <transition mode="out-in">
        <router-view />
      </transition>
    </div>
  </div>
</template>

<script>
export default {
  name: 'train-record',

  methods: {
    /**
     * @description: 坐站训练
     */
    handleSitStand() {
      this.$router.push({ path: '/train-record/sit-stand' })
    },

    /**
     * @description: 精准负重训练
     */
    handleAccurateLoad() {
      this.$router.push({ path: '/train-record/accurate-load' })
    },

    /**
     * @description: 重心转移训练
     */
    handleBarycenterTransfer() {
      this.$router.push({ path: '/train-record/barycenter-transfer' })
    },

    /**
     * @description: 下蹲动作训练
     */
    handleSquat() {
      this.$router.push({ path: '/train-record/squat' })
    }
  }
}
</script>

<style lang="scss" scoped>
/* 路由过渡动效 */
.v-enter-active,
.v-leave-active {
  transition: opacity 0.2s;
}
.v-enter,
.v-leave-to {
  opacity: 0;
}

.train-record {
  width: 100%;
  height: 100%;
  @include flex(row, center, center);

  .wrapper {
    width: 96%;
    height: 96%;
    border-radius: 20px;
    background-color: #ffffff;
    box-shadow: 0 0 10px #929292;
    padding: 20px;

    .btn {
      @include flex(row, space-around, center);
      .item {
        width: 180px;
        font-size: 22px;
      }
    }

    .divider {
      margin-top: 20px;
      border: 1px solid rgb(204, 204, 204);
      width: 100%;
    }
  }
}
</style>
