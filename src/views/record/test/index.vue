<!--
 * @Author      : Mr.bin
 * @Date        : 2022-09-12 15:12:37
 * @LastEditTime: 2022-09-14 11:30:23
 * @Description : 测试-数据记录
-->
<template>
  <div class="test-record">
    <div class="wrapper">
      <div class="btn">
        <el-button
          class="item"
          type="danger"
          round
          plain
          @click="handlePrecisionWeight"
          >精准负重测试</el-button
        >
        <el-button
          class="item"
          type="warning"
          round
          plain
          @click="handleStandingStability"
          >站立稳定测试</el-button
        >
        <el-button
          class="item"
          type="success"
          round
          plain
          @click="handleStandingBalance"
          >站立平衡测试</el-button
        >
        <el-button
          class="item"
          type="primary"
          round
          plain
          @click="handleQuietSquatDown"
          >静蹲测试</el-button
        >
        <el-button
          class="item"
          type="info"
          round
          plain
          @click="handleDynamicSquat"
          >动态下蹲测试</el-button
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
  name: 'test-record',

  methods: {
    /**
     * @description: 精准负重测试
     */
    handlePrecisionWeight() {
      this.$router.push({ path: '/test-record/precision-weight' })
    },

    /**
     * @description: 站立稳定测试
     */
    handleStandingStability() {
      this.$router.push({ path: '/test-record/standing-stability' })
    },

    /**
     * @description: 站立平衡测试
     */
    handleStandingBalance() {
      this.$router.push({ path: '/test-record/standing-balance' })
    },

    /**
     * @description: 静蹲测试
     */
    handleQuietSquatDown() {
      this.$router.push({ path: '/test-record/quiet-squat-down' })
    },

    /**
     * @description: 动态下蹲测试
     */
    handleDynamicSquat() {
      this.$router.push({ path: '/test-record/dynamic-squat' })
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

.test-record {
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
