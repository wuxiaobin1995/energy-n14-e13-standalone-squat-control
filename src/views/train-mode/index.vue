<!--
 * @Author      : Mr.bin
 * @Date        : 2022-08-16 14:00:06
 * @LastEditTime: 2023-03-10 16:49:25
 * @Description : 训练-项目选择
-->
<template>
  <div class="train-select">
    <div class="btn">
      <el-button
        class="item"
        :class="[isActiveSitStand]"
        :icon="isActiveSitStand === 'btn__active' ? 'el-icon-circle-check' : ''"
        type="danger"
        round
        @click="handleSitStand"
        >坐站训练</el-button
      >
      <el-button
        class="item"
        :class="[isActiveAccurateLoad]"
        :icon="
          isActiveAccurateLoad === 'btn__active' ? 'el-icon-circle-check' : ''
        "
        type="warning"
        round
        @click="handleAccurateLoad"
        >精准负重训练</el-button
      >
      <el-button
        class="item"
        :class="[isActiveBarycenterTransfer]"
        :icon="
          isActiveBarycenterTransfer === 'btn__active'
            ? 'el-icon-circle-check'
            : ''
        "
        type="success"
        round
        @click="handleBarycenterTransfer"
        >重心转移训练</el-button
      >
      <el-button
        class="item"
        :class="[isActiveSquat]"
        :icon="isActiveSquat === 'btn__active' ? 'el-icon-circle-check' : ''"
        type="primary"
        round
        @click="handleSquat"
        >下蹲动作训练</el-button
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
  name: 'train-select',

  data() {
    return {
      /* 动态css */
      isActiveSitStand: '',
      isActiveAccurateLoad: '',
      isActiveBarycenterTransfer: '',
      isActiveSquat: ''
    }
  },

  watch: {
    '$route.path': {
      handler(newVal, oldval) {
        if (newVal === '/train-select/sit-stand-set') {
          this.isActiveSitStand = 'btn__active'
        } else {
          this.isActiveSitStand = ''
        }
        if (newVal === '/train-select/accurate-load-set') {
          this.isActiveAccurateLoad = 'btn__active'
        } else {
          this.isActiveAccurateLoad = ''
        }
        if (newVal === '/train-select/barycenter-transfer-set') {
          this.isActiveBarycenterTransfer = 'btn__active'
        } else {
          this.isActiveBarycenterTransfer = ''
        }
        if (newVal === '/train-select/squat-set') {
          this.isActiveSquat = 'btn__active'
        } else {
          this.isActiveSquat = ''
        }
      },
      immediate: true
    }
  },

  methods: {
    /**
     * @description: 坐站训练
     */
    handleSitStand() {
      this.$router.push({ path: '/train-select/sit-stand-set' })
    },

    /**
     * @description: 精准负重训练
     */
    handleAccurateLoad() {
      if (this.$store.state.currentUserInfo.ultimateLoad === '') {
        this.$confirm(
          `系统检测到您从来没有做过精准负重测试，请先进行精准负重测试！`,
          '提示',
          {
            type: 'warning',
            showClose: false,
            closeOnClickModal: false,
            closeOnPressEscape: false,
            center: true,
            confirmButtonText: '确 定',
            cancelButtonText: '取 消'
          }
        )
          .then(() => {
            this.$router.push({
              path: '/test-select'
            })
          })
          .catch(() => {})
      } else {
        this.$router.push({ path: '/train-select/accurate-load-set' })
      }
    },

    /**
     * @description: 重心转移训练
     */
    handleBarycenterTransfer() {
      this.$router.push({ path: '/train-select/barycenter-transfer-set' })
    },

    /**
     * @description: 下蹲动作训练
     */
    handleSquat() {
      this.$router.push({ path: '/train-select/squat-set' })
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

.train-select {
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
