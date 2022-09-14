/*
 * @Author      : Mr.bin
 * @Date        : 2022-07-27 10:32:39
 * @LastEditTime: 2022-09-14 14:01:07
 * @Description : 路由
 */
import Vue from 'vue'
import VueRouter from 'vue-router'

Vue.use(VueRouter)

// 解决ElementUI导航栏中的vue-router在3.0版本以上重复点菜单报错问题
const originalPush = VueRouter.prototype.push
VueRouter.prototype.push = function push(location) {
  return originalPush.call(this, location).catch(err => err)
}

const routes = [
  /*
   * 前面加"/"表示绝对路径，不加"/"表示相对路径
   * 一般嵌套路由中的子路由不需要加"/"，它会在父路由后自动加上"/子路由"
   * 比如父 "/father"，子 "child"，要想访问子路由，跳转链接需要写成 "/father/child"
   */

  {
    path: '/',
    name: 'layout',
    component: () => import('@/layout'),
    redirect: '/home',
    children: [
      // 首页
      {
        path: 'home',
        name: 'home',
        component: () => import('@/views/home'),
        meta: ['首页']
      },
      // 用户
      {
        path: 'user',
        name: 'user',
        component: () => import('@/views/user'),
        meta: ['用户']
      },
      // 添加用户
      {
        path: 'user-add',
        name: 'user-add',
        component: () => import('@/views/user-add'),
        meta: ['添加用户']
      },
      // 用户信息修改
      {
        path: 'user-edit',
        name: 'user-edit',
        component: () => import('@/views/user-edit'),
        meta: ['用户信息修改']
      },
      // 设置医院名称
      {
        path: 'set-hospital',
        name: 'set-hospital',
        component: () => import('@/views/set/set-hospital'),
        meta: ['设置医院名称']
      },
      // 调零
      {
        path: 'set-zero',
        name: 'set-zero',
        component: () => import('@/views/set/set-zero'),
        meta: ['调零']
      },
      // 设置K
      {
        path: 'set-k',
        name: 'set-k',
        component: () => import('@/views/set/set-k'),
        meta: ['设置K']
      },
      // 开发者
      {
        path: 'set-developer',
        name: 'set-developer',
        component: () => import('@/views/set/set-developer'),
        meta: ['开发者']
      },

      /* 测试模块 */
      // 测试项目选择
      {
        path: 'test-select',
        name: 'test-select',
        component: () => import('@/views/test-mode'),
        meta: ['测试项目选择'],
        redirect: '/test-select/precision-weight-set',
        children: [
          // 精准负重测试
          {
            path: 'precision-weight-set',
            name: 'precision-weight-set',
            component: () => import('@/views/test-mode/precision-weight/set'),
            meta: ['精准负重测试']
          },
          // 站立稳定测试
          {
            path: 'standing-stability-set',
            name: 'standing-stability-set',
            component: () => import('@/views/test-mode/standing-stability/set'),
            meta: ['站立稳定测试']
          },
          // 站立平衡测试
          {
            path: 'standing-balance-set',
            name: 'standing-balance-set',
            component: () => import('@/views/test-mode/standing-balance/set'),
            meta: ['站立平衡测试']
          },
          // 静蹲测试
          {
            path: 'quiet-squat-down-set',
            name: 'quiet-squat-down-set',
            component: () => import('@/views/test-mode/quiet-squat-down/set'),
            meta: ['静蹲测试']
          },
          // 动态下蹲测试
          {
            path: 'dynamic-squat-set',
            name: 'dynamic-squat-set',
            component: () => import('@/views/test-mode/dynamic-squat/set'),
            meta: ['动态下蹲测试']
          }
        ]
      },
      // 精准负重测试-具体测量
      {
        path: 'precision-weight-measure',
        name: 'precision-weight-measure',
        component: () => import('@/views/test-mode/precision-weight/measure'),
        meta: ['精准负重测试-具体测量']
      },
      // 站立稳定测试-具体测量
      {
        path: 'standing-stability-measure',
        name: 'standing-stability-measure',
        component: () => import('@/views/test-mode/standing-stability/measure'),
        meta: ['站立稳定测试-具体测量']
      },
      // 站立平衡测试-具体测量
      {
        path: 'standing-balance-measure',
        name: 'standing-balance-measure',
        component: () => import('@/views/test-mode/standing-balance/measure'),
        meta: ['站立平衡测试-具体测量']
      },
      // 静蹲测试-具体测量
      {
        path: 'quiet-squat-down-measure',
        name: 'quiet-squat-down-measure',
        component: () => import('@/views/test-mode/quiet-squat-down/measure'),
        meta: ['静蹲测试-具体测量']
      },
      // 动态下蹲测试-具体测量
      {
        path: 'dynamic-squat-measure',
        name: 'dynamic-squat-measure',
        component: () => import('@/views/test-mode/dynamic-squat/measure'),
        meta: ['动态下蹲测试-具体测量']
      },

      /* 训练模块 */
      // 训练项目选择
      {
        path: 'train-select',
        name: 'train-select',
        component: () => import('@/views/train-mode'),
        meta: ['训练项目选择'],
        redirect: '/train-select/sit-stand-set',
        children: [
          // 坐站训练
          {
            path: 'sit-stand-set',
            name: 'sit-stand-set',
            component: () => import('@/views/train-mode/sit-stand/set'),
            meta: ['坐站训练']
          },
          // 精准负重训练
          {
            path: 'accurate-load-set',
            name: 'accurate-load-set',
            component: () => import('@/views/train-mode/accurate-load/set'),
            meta: ['精准负重训练']
          },
          // 重心转移训练
          {
            path: 'barycenter-transfer-set',
            name: 'barycenter-transfer-set',
            component: () =>
              import('@/views/train-mode/barycenter-transfer/set'),
            meta: ['重心转移训练']
          },
          // 下蹲动作训练
          {
            path: 'squat-set',
            name: 'squat-set',
            component: () => import('@/views/train-mode/squat/set'),
            meta: ['下蹲动作训练']
          }
        ]
      },
      // 坐站训练-具体测量
      {
        path: 'sit-stand-measure',
        name: 'sit-stand-measure',
        component: () => import('@/views/train-mode/sit-stand/measure'),
        meta: ['坐站训练-具体测量']
      },
      // 精准负重训练-具体测量
      {
        path: 'accurate-load-measure',
        name: 'accurate-load-measure',
        component: () => import('@/views/train-mode/accurate-load/measure'),
        meta: ['精准负重训练-具体测量']
      },
      // 重心转移训练-具体测量
      {
        path: 'barycenter-transfer-measure',
        name: 'barycenter-transfer-measure',
        component: () =>
          import('@/views/train-mode/barycenter-transfer/measure'),
        meta: ['重心转移训练-具体测量']
      },
      // 下蹲动作训练-具体测量
      {
        path: 'squat-measure',
        name: 'squat-measure',
        component: () => import('@/views/train-mode/squat/measure'),
        meta: ['下蹲动作训练-具体测量']
      },

      /* 数据记录 */
      // 测试
      {
        path: 'test-record',
        name: 'test-record',
        component: () => import('@/views/record/test'),
        meta: ['测试-数据记录'],
        redirect: '/test-record/precision-weight',
        children: [
          // 精准负重测试
          {
            path: 'precision-weight',
            name: 'precision-weight',
            component: () => import('@/views/record/test/precision-weight'),
            meta: ['精准负重测试']
          },
          // 站立稳定测试
          {
            path: 'standing-stability',
            name: 'standing-stability',
            component: () => import('@/views/record/test/standing-stability'),
            meta: ['站立稳定测试']
          },
          // 站立平衡测试
          {
            path: 'standing-balance',
            name: 'standing-balance',
            component: () => import('@/views/record/test/standing-balance'),
            meta: ['站立平衡测试']
          },
          // 静蹲测试
          {
            path: 'quiet-squat-down',
            name: 'quiet-squat-down',
            component: () => import('@/views/record/test/quiet-squat-down'),
            meta: ['静蹲测试']
          },
          // 动态下蹲测试
          {
            path: 'dynamic-squat',
            name: 'dynamic-squat',
            component: () => import('@/views/record/test/dynamic-squat'),
            meta: ['动态下蹲测试']
          }
        ]
      },
      // 训练
      {
        path: 'train-record',
        name: 'train-record',
        component: () => import('@/views/record/train'),
        meta: ['训练-数据记录'],
        redirect: '/train-record/sit-stand',
        children: [
          // 坐站训练
          {
            path: 'sit-stand',
            name: 'sit-stand',
            component: () => import('@/views/record/train/sit-stand'),
            meta: ['坐站训练']
          },
          // 精准负重训练
          {
            path: 'accurate-load',
            name: 'accurate-load',
            component: () => import('@/views/record/train/accurate-load'),
            meta: ['精准负重训练']
          },
          // 重心转移训练
          {
            path: 'barycenter-transfer',
            name: 'barycenter-transfer',
            component: () => import('@/views/record/train/barycenter-transfer'),
            meta: ['重心转移训练']
          },
          // 下蹲动作训练
          {
            path: 'squat',
            name: 'squat',
            component: () => import('@/views/record/train/squat'),
            meta: ['下蹲动作训练']
          }
        ]
      }
    ]
  },

  /* 测试报告 */
  // 精准负重测试-报告打印
  {
    path: '/precision-weight-print',
    name: 'precision-weight-print',
    component: () => import('@/views/test-mode/precision-weight/print'),
    meta: ['精准负重测试-报告打印']
  },
  // 通用测试-报告打印
  {
    path: '/test-common-print',
    name: 'test-common-print',
    component: () => import('@/views/test-mode/components/test-common-print'),
    meta: ['通用测试-报告打印']
  },
  // 测试通用长期趋势-报告打印
  {
    path: '/test-tendency-print',
    name: 'test-tendency-print',
    component: () => import('@/views/record/test/components/TendencyPrint'),
    meta: ['测试通用长期趋势-报告打印']
  },

  /* 训练报告 */
  // 坐站训练-报告打印
  {
    path: '/sit-stand-print',
    name: 'sit-stand-print',
    component: () => import('@/views/train-mode/sit-stand/print'),
    meta: ['坐站训练-报告打印']
  },
  // 精准负重训练-报告打印
  {
    path: '/accurate-load-print',
    name: 'accurate-load-print',
    component: () => import('@/views/train-mode/accurate-load/print'),
    meta: ['精准负重训练-报告打印']
  },
  // 重心转移训练-结果查看
  {
    path: '/barycenter-transfer-result',
    name: 'barycenter-transfer-result',
    component: () => import('@/views/train-mode/barycenter-transfer/result'),
    meta: ['重心转移训练-结果查看']
  },
  // 下蹲动作训练-报告打印
  {
    path: '/squat-print',
    name: 'squat-print',
    component: () => import('@/views/train-mode/squat/print'),
    meta: ['下蹲动作训练-报告打印']
  },
  // 训练通用长期趋势-报告打印
  {
    path: '/train-tendency-print',
    name: 'train-tendency-print',
    component: () => import('@/views/record/train/components/TendencyPrint'),
    meta: ['训练通用长期趋势-报告打印']
  },

  {
    path: '/refresh',
    name: 'refresh',
    component: () => import('@/views/refresh')
  },

  {
    path: '*',
    redirect: '/'
  }
]

const router = new VueRouter({
  routes,
  /* 自定义路由切换时页面如何滚动 */
  scrollBehavior(to, from, savedPosition) {
    return { x: 0, y: 0 } // 回到顶部
  }
})
export default router
