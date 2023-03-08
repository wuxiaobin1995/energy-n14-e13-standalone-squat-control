<!--
 * @Author      : Mr.bin
 * @Date        : 2022-08-16 14:17:15
 * @LastEditTime: 2023-03-08 10:42:42
 * @Description : 精准负重训练-参数设置
-->
<template>
  <div class="accurate-load-set">
    <!-- 语音播放 -->
    <audio ref="audio" controls="controls" hidden :src="audioSrc" />

    <!-- 介绍说明 -->
    <div class="introduce">
      <div class="item">
        执行动作：身体重量转移到患肢，将运动轨迹保持在红色曲线范围内
      </div>
    </div>

    <!-- 参考曲线 -->
    <div class="curve">
      <el-image class="img" :src="curveSrc" fit="scale-down"></el-image>
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
        <div class="text">患侧极限负重(kg)</div>
        <el-input-number
          class="num"
          v-model="ultimateLoad"
          :min="0"
          :max="500"
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

export default {
  name: 'accurate-load-set',

  data() {
    return {
      bgSrc: require('@/assets/img/Test/Select/背景图1.png'),
      curveSrc: require('@/assets/img/Train/曲线参考图.png'),

      /* 语音相关 */
      audioOpen: this.$store.state.voiceSwitch,
      audioSrc: path.join(__static, `narrate/mandarin/7-精准负重训练.mp3`),

      ultimateLoad: this.$store.state.currentUserInfo.ultimateLoad, // 患侧极限负重（kg）
      time: 10, // 训练时长（s）
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
        }
      ]
    }
  },

  mounted() {
    if (this.audioOpen === true) {
      setTimeout(() => {
        this.$refs.audio.currentTime = 0
        this.$refs.audio.play()
      }, 500)
    }
  },

  methods: {
    /**
     * @description: 开始训练
     */
    handleStart() {
      this.$router.push({
        path: '/accurate-load-measure',
        query: {
          ultimateLoad: JSON.stringify(this.ultimateLoad),
          time: JSON.stringify(this.time),
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

  /* 参考曲线 */
  .curve {
    flex: 1;
    width: 100%;
    @include flex(row, center, center);
    .img {
      width: 55%;
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
