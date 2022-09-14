<!--
 * @Author      : Mr.bin
 * @Date        : 2022-08-17 10:16:28
 * @LastEditTime: 2022-09-14 14:45:50
 * @Description : 重心转移训练-结果查看
-->
<template>
  <div
    class="barycenter-transfer-result"
    v-loading.fullscreen.lock="fullscreenLoading"
  >
    <div class="wrapper">
      <!-- 训练结果 -->
      <div class="result">
        <div class="text">{{ trainData.trainType }}结果：</div>
        <div v-if="this.trainData.trainResult">
          <i class="el-icon-success icon-success"></i>
        </div>
        <div v-else><i class="el-icon-remove icon-fail"></i></div>
        <div class="text">
          {{
            trainData.trainResult
              ? '你很棒，达到当前训练目标！'
              : '很可惜，请再接再厉！'
          }}
        </div>
      </div>

      <!-- 重心偏移 -->
      <div class="center">
        <div class="center-l">
          <div>左<span class="unit">/kg</span></div>
          <div class="value">NULL</div>
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
            v-model="trainData.lastCore"
            :disabled="true"
            :show-tooltip="false"
          ></el-slider>
        </div>
        <div class="center-r">
          <div>右<span class="unit">/kg</span></div>
          <div class="value">NULL</div>
        </div>
      </div>

      <!-- 参数显示 -->
      <div class="set">
        <div class="item">
          <el-image class="img" :src="bgSrc" fit="scale-down"></el-image>
          <div class="text">患侧</div>
          <div class="value">
            {{ this.$store.state.currentUserInfo.affectedSide }}
          </div>
        </div>
        <!-- 目标负重比例 -->
        <div class="item">
          <el-image class="img" :src="bgSrc" fit="scale-down"></el-image>
          <div class="text">目标负重比例(%)</div>
          <div class="value">{{ trainData.target }}</div>
        </div>
      </div>

      <!-- 按钮组 -->
      <div class="btn">
        <el-button type="danger" @click="handleGoBack" class="item"
          >返 回</el-button
        >
      </div>
    </div>
  </div>
</template>

<script>
import { initDB } from '@/db/index.js'

export default {
  name: 'barycenter-transfer-result',

  data() {
    return {
      /* 路由传参 */
      userId: JSON.parse(this.$route.query.userId),
      pdfTime: JSON.parse(this.$route.query.pdfTime),
      routerName: JSON.parse(this.$route.query.routerName),

      fullscreenLoading: false, // 全屏加载
      bgSrc: require('@/assets/img/Test/Select/背景图1.png'),

      /* 数据源 */
      trainData: {
        lastCore: 50,
        target: 50,
        trainResult: '',
        trainType: ''
      },

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
    this.getTrainData()
  },

  methods: {
    /**
     * @description: 获取对应 [ID、训练时间] 的训练报告源数据
     */
    getTrainData() {
      this.fullscreenLoading = true
      const db = initDB()
      db.train_data
        .where({
          userId: this.userId,
          pdfTime: this.pdfTime
        })
        .toArray()
        .then(res => {
          this.trainData = res[0]
        })
        .then(() => {
          if (this.$store.state.currentUserInfo.affectedSide === '左') {
            this.trainData.lastCore = 100 - parseInt(this.trainData.lastCore)
          }
        })
        .then(() => {
          this.renderColor()
        })
        .catch(err => {
          this.$confirm(
            `${err}。获取ID为 [${this.userId}] 的用户数据失败，请重试！`,
            '提示',
            {
              type: 'warning',
              center: true,
              showClose: false,
              closeOnClickModal: false,
              closeOnPressEscape: false,
              confirmButtonText: '重 试',
              cancelButtonText: '返 回'
            }
          )
            .then(() => {
              this.getTrainData()
            })
            .catch(() => {
              this.handleGoBack()
            })
        })
        .finally(() => {
          this.fullscreenLoading = false
        })
    },

    /**
     * @description: 颜色块初始化
     */
    renderColor() {
      if (this.$store.state.currentUserInfo.affectedSide === '右') {
        this.colorObj = {
          'background-image': `linear-gradient(
            to right,
            rgba(255, 255, 0, 0.5),
            rgba(255, 255, 0, 0.5) ${this.trainData.target - 2.5}%,
            rgba(0, 128, 0, 0.5) ${this.trainData.target - 2.5}%,
            rgba(0, 128, 0, 0.5) ${this.trainData.target + 2.5}%,
            rgba(255, 255, 0, 0.5) ${this.trainData.target + 2.5}%,
            rgba(255, 255, 0, 0.5) 100%
          )`
        }
      } else {
        this.colorObj = {
          'background-image': `linear-gradient(
            to right,
            rgba(255, 255, 0, 0.5),
            rgba(255, 255, 0, 0.5) ${100 - this.trainData.target - 2.5}%,
            rgba(0, 128, 0, 0.5) ${100 - this.trainData.target - 2.5}%,
            rgba(0, 128, 0, 0.5) ${100 - this.trainData.target + 2.5}%,
            rgba(255, 255, 0, 0.5) ${100 - this.trainData.target + 2.5}%,
            rgba(255, 255, 0, 0.5) 100%
          )`
        }
      }
    },

    /**
     * @description: 返回
     */
    handleGoBack() {
      this.$router.push({
        path: this.routerName
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.barycenter-transfer-result {
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

    /* 结果 */
    .result {
      margin-top: 60px;
      @include flex(row, center, center);
      .icon-success {
        font-size: 60px;
        margin-right: 10px;
        color: green;
      }
      .icon-fail {
        font-size: 60px;
        margin-right: 10px;
        color: red;
      }
      .text {
        font-size: 46px;
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
      margin-bottom: 100px;
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
        }
      }
    }

    /* 按钮组 */
    .btn {
      margin-bottom: 20px;
      @include flex(row, center, center);
      .item {
        font-size: 34px;
        margin: 0 60px;
      }
    }
  }
}
</style>
