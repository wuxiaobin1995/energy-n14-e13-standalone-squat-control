<!--
 * @Author      : Mr.bin
 * @Date        : 2022-09-12 15:12:37
 * @LastEditTime: 2022-09-12 15:59:22
 * @Description : 测试-数据记录
-->
<template>
  <div class="test-record">
    <div class="btn">
      <el-button class="item" type="danger" round @click="handlePrecisionWeight"
        >精准负重测试</el-button
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
  name: 'test-record',

  methods: {
    /**
     * @description: 精准负重测试
     */
    handlePrecisionWeight() {
      this.$router.push({ path: '/test-record/precision-weight' })
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
  @include flex(column, stretch, stretch);

  .btn {
    @include flex(row, space-around, center);
    .item {
      // margin: 6px 0;
      width: 180px;
      font-size: 22px;
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
