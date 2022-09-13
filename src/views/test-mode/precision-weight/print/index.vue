<!--
 * @Author      : Mr.bin
 * @Date        : 2022-08-01 15:53:27
 * @LastEditTime: 2022-08-15 10:00:03
 * @Description : 精准负重测试-报告打印
-->
<template>
  <div
    class="precision-weight-print"
    v-loading.fullscreen.lock="fullscreenLoading"
  >
    <div class="top">
      <div class="title">精准负重测试报告</div>
      <div class="hospital">{{ testData.hospital }}</div>
      <el-image class="logo" :src="logoSrc" fit="scale-down"></el-image>
    </div>

    <div class="divider-one"></div>

    <div class="info">
      <div>姓名：{{ testData.userName }}</div>
      <div>性别：{{ testData.sex }}</div>
      <div>患侧：{{ testData.affectedSide }}</div>
      <div>测试时间：{{ testData.pdfTime }}</div>
    </div>

    <div class="divider-two"></div>

    <div class="bottom">
      <!-- 表格 -->
      <table class="table" border="2">
        <tr class="title" bgcolor="#E7E6E6" align="center">
          <td>患侧</td>
          <td>极限患侧负重(kg)</td>
          <td>测试时长(s)</td>
          <td>第一次(kg)</td>
          <td>第二次(kg)</td>
          <td>第三次(kg)</td>
        </tr>
        <tr class="value" align="center">
          <td>{{ this.$store.state.currentUserInfo.affectedSide }}</td>
          <td>{{ testData.ultimateLoad }}</td>
          <td>10</td>
          <td>{{ testData.dataArray[0] }}</td>
          <td>{{ testData.dataArray[1] }}</td>
          <td>{{ testData.dataArray[2] }}</td>
        </tr>
      </table>
    </div>

    <div class="btn-print btn">
      <el-button class="item" type="primary" @click="handlePrint"
        >打 印</el-button
      >
      <el-button class="item" type="danger" @click="handleGoBack"
        >返 回</el-button
      >
    </div>
  </div>
</template>

<script>
import { initDB } from '@/db/index.js'

export default {
  name: 'precision-weight-print',

  data() {
    return {
      /* 路由传参 */
      userId: JSON.parse(this.$route.query.userId),
      pdfTime: JSON.parse(this.$route.query.pdfTime),
      routerName: JSON.parse(this.$route.query.routerName),

      fullscreenLoading: false, // 全屏加载
      logoSrc: require('@/assets/img/Company_Logo/logo_1.png'), // 公司logo

      /* 数据源 */
      testData: {
        hospital: '',
        userName: '',
        sex: '',
        affectedSide: '',
        pdfTime: '',
        ultimateLoad: '',
        dataArray: []
      }
    }
  },

  created() {
    this.getTestData()
  },

  methods: {
    /**
     * @description: 获取对应 [ID、测试时间] 的测试报告源数据
     */
    getTestData() {
      this.fullscreenLoading = true
      const db = initDB()
      db.test_data
        .where({
          userId: this.userId,
          pdfTime: this.pdfTime
        })
        .toArray()
        .then(res => {
          this.testData = res[0]
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
              this.getTestData()
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
     * @description: 打印报告
     */
    handlePrint() {
      window.print()
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
/* 打印时触发的CSS */
@media print {
  @page {
    // size: portrait; // 纵向打印
    size: landscape; // 横向打印
  }
  .btn-print {
    display: none !important;
  }
}

.precision-weight-print {
  width: 100%;
  height: 100%;
  padding: 20px;
  @include flex(column, stretch, stretch);

  .top {
    @include flex(row, space-between, flex-end);
    .title {
      font-size: 40px;
    }
    .hospital {
      font-size: 24px;
    }
    .logo {
      width: 190px;
    }
  }

  .divider-one {
    margin-top: 12px;
    border: 1px solid rgb(204, 204, 204);
    width: 100%;
  }

  .info {
    @include flex(row, space-around, center);
    margin-top: 30px;
    font-size: 20px;
  }

  .divider-two {
    margin-top: 12px;
    border: 1px solid rgb(204, 204, 204);
    margin-left: 70px;
    margin-right: 70px;
  }

  .bottom {
    flex: 1;
    margin: 30px 0;
    .table {
      width: 100%;
      height: 100%;
      .title {
        height: 100px;
        font-size: 25px;
      }
      .value {
        font-size: 40px;
      }
    }
  }

  .btn {
    @include flex(row, center, center);
    margin: 10px 0;
    .item {
      width: 160px;
      font-size: 24px;
      margin: 0 40px;
    }
  }
}
</style>
