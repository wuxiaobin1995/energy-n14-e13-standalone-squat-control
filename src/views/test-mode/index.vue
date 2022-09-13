<!--
 * @Author      : Mr.bin
 * @Date        : 2022-07-28 15:58:43
 * @LastEditTime: 2022-09-12 15:57:30
 * @Description : 测试-项目选择
-->
<template>
  <div class="test-select">
    <div class="btn">
      <el-button
        class="item"
        :class="[isActivePrecisionWeight]"
        :icon="
          isActivePrecisionWeight === 'btn__active'
            ? 'el-icon-circle-check'
            : ''
        "
        type="danger"
        round
        @click="handlePrecisionWeight"
        >精准负重测试</el-button
      >
      <el-button
        class="item"
        :class="[isActiveStandingStability]"
        :icon="
          isActiveStandingStability === 'btn__active'
            ? 'el-icon-circle-check'
            : ''
        "
        type="warning"
        round
        @click="handleStandingStability"
        >站立稳定测试</el-button
      >
      <el-button
        class="item"
        :class="[isActiveStandingBalance]"
        :icon="
          isActiveStandingBalance === 'btn__active'
            ? 'el-icon-circle-check'
            : ''
        "
        type="success"
        round
        @click="handleStandingBalance"
        >站立平衡测试</el-button
      >
      <el-button
        class="item"
        :class="[isActiveQuietSquatDown]"
        :icon="
          isActiveQuietSquatDown === 'btn__active' ? 'el-icon-circle-check' : ''
        "
        type="primary"
        round
        @click="handleQuietSquatDown"
        >静蹲测试</el-button
      >
      <el-button
        class="item"
        :class="[isActiveDynamicSquat]"
        :icon="
          isActiveDynamicSquat === 'btn__active' ? 'el-icon-circle-check' : ''
        "
        type="info"
        round
        @click="handleDynamicSquat"
        >动态下蹲测试</el-button
      >
    </div>

    <div class="wrapper">
      <transition mode="out-in">
        <router-view />
      </transition>
    </div>
  </div>
</template>

<script>
export default {
  name: 'test-select',

  data() {
    return {
      /* 动态css */
      isActivePrecisionWeight: '',
      isActiveStandingStability: '',
      isActiveStandingBalance: '',
      isActiveQuietSquatDown: '',
      isActiveDynamicSquat: ''
    }
  },

  watch: {
    '$route.path': {
      handler(newVal, oldval) {
        if (newVal === '/test-select/precision-weight-set') {
          this.isActivePrecisionWeight = 'btn__active'
        } else {
          this.isActivePrecisionWeight = ''
        }
        if (newVal === '/test-select/standing-stability-set') {
          this.isActiveStandingStability = 'btn__active'
        } else {
          this.isActiveStandingStability = ''
        }
        if (newVal === '/test-select/standing-balance-set') {
          this.isActiveStandingBalance = 'btn__active'
        } else {
          this.isActiveStandingBalance = ''
        }
        if (newVal === '/test-select/quiet-squat-down-set') {
          this.isActiveQuietSquatDown = 'btn__active'
        } else {
          this.isActiveQuietSquatDown = ''
        }
        if (newVal === '/test-select/dynamic-squat-set') {
          this.isActiveDynamicSquat = 'btn__active'
        } else {
          this.isActiveDynamicSquat = ''
        }
      },
      immediate: true
    }
  },

  methods: {
    /**
     * @description: 精准负重测试
     */
    handlePrecisionWeight() {
      this.$router.push({ path: '/test-select/precision-weight-set' })
    },

    /**
     * @description: 站立稳定测试
     */
    handleStandingStability() {
      this.$router.push({ path: '/test-select/standing-stability-set' })
    },

    /**
     * @description: 站立平衡测试
     */
    handleStandingBalance() {
      this.$router.push({ path: '/test-select/standing-balance-set' })
    },

    /**
     * @description: 静蹲测试
     */
    handleQuietSquatDown() {
      this.$router.push({ path: '/test-select/quiet-squat-down-set' })
    },

    /**
     * @description: 动态下蹲测试
     */
    handleDynamicSquat() {
      this.$router.push({ path: '/test-select/dynamic-squat-set' })
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

.test-select {
  width: 100%;
  height: 100%;
  position: relative;
  @include flex(row, center, center);

  .btn {
    position: absolute;
    left: -16px;
    top: 0;
    margin-top: 13px;
    @include flex(column, stretch, stretch);
    .item {
      margin: 6px 0;
      width: 180px;
      font-size: 22px;
    }
    .btn__active {
      width: 230px;
    }
  }

  .wrapper {
    width: 96%;
    height: 96%;
    border-radius: 20px;
    background-color: #ffffff;
    box-shadow: 0 0 10px #929292;
    padding: 20px 20px 20px 198px;
  }
}
</style>
