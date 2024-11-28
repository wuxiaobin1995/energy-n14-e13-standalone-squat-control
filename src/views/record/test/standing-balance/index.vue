<!--
 * @Author      : Mr.bin
 * @Date        : 2022-09-13 10:16:41
 * @LastEditTime: 2024-11-28 09:55:53
 * @Description : 站立平衡测试-数据记录
-->
<template>
  <div class="standing-balance">
    <!-- 顶部 -->
    <div class="top-wrapper">
      <!-- 标题 -->
      <el-page-header
        title="返回首页"
        content="站立平衡测试"
        @back="handleToHome"
      ></el-page-header>
      <!-- 日期筛选 -->
      <el-date-picker
        class="data-select"
        v-model="selectDateValue"
        type="daterange"
        :picker-options="pickerOptions"
        range-separator="——"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
        value-format="yyyy-MM-dd HH:mm:ss"
        :editable="false"
        :clearable="false"
        :unlink-panels="true"
        align="right"
        @change="changeData"
      >
      </el-date-picker>
    </div>

    <!-- 表格 -->
    <el-table
      :data="tableData"
      class="table-wrapper"
      style="width: 80%"
      height="100%"
      :default-sort="{ prop: 'pdfTime', order: 'descending' }"
      :stripe="true"
      :border="true"
      v-loading="loading"
      element-loading-text="拼命加载中"
      element-loading-spinner="el-icon-loading"
      element-loading-background="rgba(0, 0, 0, 0.8)"
    >
      <el-table-column type="index" width="50" align="center" />
      <el-table-column
        align="center"
        prop="pdfTime"
        label="测试时间"
        sortable
      />
      <el-table-column label="平均重量分布百分比" align="center">
        <el-table-column
          align="center"
          prop="leftAverageWeightPercent"
          label="左"
          width="100"
        />
        <el-table-column
          align="center"
          prop="rightAverageWeightPercent"
          label="右"
          width="100"
        />
      </el-table-column>
      <!-- 查看报告按钮 -->
      <el-table-column label="测试报告" width="260" align="center">
        <template slot-scope="scope">
          <el-button
            type="primary"
            plain
            icon="el-icon-search"
            @click="handlePrint(scope.$index, scope.row)"
            >查看报告</el-button
          >
        </template>
      </el-table-column>
      <!-- 删除按钮 -->
      <el-table-column label="删除操作" width="260" align="center">
        <template slot-scope="scope">
          <el-button
            type="danger"
            plain
            icon="el-icon-delete"
            @click="handleDelete(scope.$index, scope.row)"
            >删 除</el-button
          >
        </template>
      </el-table-column>
    </el-table>

    <!-- 长期趋势 -->
    <div class="btn">
      <el-button class="item" type="primary" @click="handleTendencyPrint"
        >长期趋势报告</el-button
      >
      <el-button class="item" type="danger" @click="handleRefresh"
        >刷新页面</el-button
      >
    </div>
  </div>
</template>

<script>
import { initDB } from '@/db/index.js'

export default {
  name: 'standing-balance',

  data() {
    return {
      tableData: [],
      loading: false, // 表格加载动画
      // 日期选择器的筛选值
      selectDateValue: [
        this.$moment().format('YYYY-MM-DD 00:00:00'),
        this.$moment().format('YYYY-MM-DD 23:59:59')
      ],
      /* 日期选择器快捷选项 */
      pickerOptions: {
        shortcuts: [
          {
            text: '今天',
            onClick(picker) {
              const start = new Date(new Date().setHours(0, 0, 0))
              const end = new Date(new Date().setHours(23, 59, 59))
              picker.$emit('pick', [start, end])
            }
          },
          {
            text: '昨天',
            onClick(picker) {
              const start = new Date(new Date().setHours(0, 0, 0))
              const end = new Date(new Date().setHours(23, 59, 59))
              start.setTime(start.getTime() - 3600 * 1000 * 24 * 1)
              end.setTime(end.getTime() - 3600 * 1000 * 24 * 1)
              picker.$emit('pick', [start, end])
            }
          },
          {
            text: '最近一周',
            onClick(picker) {
              const start = new Date(new Date().setHours(0, 0, 0))
              const end = new Date(new Date().setHours(23, 59, 59))
              start.setTime(start.getTime() - 3600 * 1000 * 24 * 7)
              picker.$emit('pick', [start, end])
            }
          },
          {
            text: '最近一个月',
            onClick(picker) {
              const start = new Date(new Date().setHours(0, 0, 0))
              const end = new Date(new Date().setHours(23, 59, 59))
              start.setTime(start.getTime() - 3600 * 1000 * 24 * 30)
              picker.$emit('pick', [start, end])
            }
          },
          {
            text: '最近三个月',
            onClick(picker) {
              const start = new Date(new Date().setHours(0, 0, 0))
              const end = new Date(new Date().setHours(23, 59, 59))
              start.setTime(start.getTime() - 3600 * 1000 * 24 * 90)
              picker.$emit('pick', [start, end])
            }
          },
          {
            text: '最近一年',
            onClick(picker) {
              const start = new Date(new Date().setHours(0, 0, 0))
              const end = new Date(new Date().setHours(23, 59, 59))
              start.setTime(start.getTime() - 3600 * 1000 * 24 * 360)
              picker.$emit('pick', [start, end])
            }
          },
          {
            text: '该用户所有数据',
            onClick(picker) {
              const start = new Date(new Date().setHours(0, 0, 0))
              const end = new Date(new Date().setHours(23, 59, 59))
              start.setTime(start.getTime() - 3600 * 1000 * 24 * 36000)
              picker.$emit('pick', [start, end])
            }
          }
        ]
      }
    }
  },

  created() {
    this.initData()
  },

  methods: {
    /**
     * @description: 返回首页
     */
    handleToHome() {
      this.$router.push({
        path: '/home'
      })
    },

    /**
     * @description: 表格数据初始化
     */
    initData() {
      const db = initDB()
      this.loading = true
      db.test_data
        .where({
          userId: this.$store.state.currentUserInfo.userId,
          testType: '站立平衡测试'
        })
        .toArray()
        .then(res => {
          this.tableData = res
        })
        .catch(err => {
          this.$confirm(`${err}。获取数据失败，请点击刷新按钮重试！`, '提示', {
            type: 'warning',
            center: true,
            showClose: false,
            closeOnClickModal: false,
            closeOnPressEscape: false,
            confirmButtonText: '刷 新',
            cancelButtonText: '返回首页'
          })
            .then(() => {
              this.handleRefresh()
            })
            .catch(() => {
              this.handleToHome()
            })
        })
        .finally(() => {
          this.loading = false
        })
    },

    /**
     * @description: 根据日期选择获取表格数据
     */
    getData() {
      const db = initDB()
      this.loading = true
      db.test_data
        .where(['userId', 'testType', 'pdfTime'])
        .between(
          [
            this.$store.state.currentUserInfo.userId,
            '站立平衡测试',
            this.selectDateValue[0]
          ],
          [
            this.$store.state.currentUserInfo.userId,
            '站立平衡测试',
            this.selectDateValue[1]
          ],
          true,
          true
        )
        .toArray()
        .then(res => {
          this.tableData = res
        })
        .catch(err => {
          this.$confirm(
            `${err}。根据日期获取数据失败，请点击刷新按钮重试！`,
            '提示',
            {
              type: 'warning',
              center: true,
              showClose: false,
              closeOnClickModal: false,
              closeOnPressEscape: false,
              confirmButtonText: '刷 新',
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
        .finally(() => {
          this.loading = false
        })
    },

    /**
     * @description: 用户确认选定的值时触发
     * @param {*} value 选择的日期数组
     */
    changeData(value) {
      this.selectDateValue = value
      this.getData()
    },

    /**
     * @description: 查看报告
     * @param {*} index
     * @param {*} row
     */
    handlePrint(index, row) {
      this.$router.push({
        path: '/test-common-print',
        query: {
          userId: JSON.stringify(row.userId),
          pdfTime: JSON.stringify(row.pdfTime),
          routerName: JSON.stringify('/test-record/standing-balance')
        }
      })
    },

    /**
     * @description: 删除按钮
     * @param {*} index
     * @param {*} row
     */
    handleDelete(index, row) {
      this.$prompt('该操作将"永久删除"该数据，请谨慎！', '提示', {
        type: 'warning',
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputPattern: /^energy$/,
        inputErrorMessage: '密码不正确',
        inputPlaceholder: '请输入删除密码' // 输入框的占位符
      })
        .then(() => {
          const db = initDB()
          db.test_data
            .where({
              userId: row.userId,
              pdfTime: row.pdfTime,
              testType: row.testType
            })
            .delete()
            .then(() => {
              this.$message({
                message: '删除成功',
                type: 'success',
                duration: 2000
              })
            })
            .then(() => {
              this.getData()
            })
            .catch(() => {
              this.$message({
                message: '删除失败',
                type: 'error',
                duration: 3000
              })
            })
        })
        .catch(() => {})
    },

    /**
     * @description: 长期趋势报告
     */
    handleTendencyPrint() {
      this.$router.push({
        path: '/test-tendency-print',
        query: {
          userId: JSON.stringify(this.$store.state.currentUserInfo.userId),
          routerName: JSON.stringify('/test-record/standing-balance'),
          type: JSON.stringify('站立平衡测试')
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
          routerName: JSON.stringify('/test-record/standing-balance'),
          duration: JSON.stringify(300)
        }
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.standing-balance {
  width: 100%;
  height: 90%;
  @include flex(column, stretch, center);

  /* 顶部 */
  .top-wrapper {
    width: 80%;
    margin: 10px 0;
    @include flex(row, space-between, center);
    // 标题
    .text {
      font-size: 32px;
      color: green;
    }
  }

  /* 表格 */
  .table-wrapper {
    flex: 1;
  }

  /* 长期趋势 */
  .btn {
    margin: 10px 0;
    .item {
      margin: 0 50px;
      font-size: 18px;
    }
  }
}
</style>
