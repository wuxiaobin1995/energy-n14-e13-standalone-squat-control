/*
 * @Author      : Mr.bin
 * @Date        : 2022-12-05 11:06:14
 * @LastEditTime: 2022-12-05 21:15:20
 * @Description : 导出json文件方法
 */

const Tools = {
  /**
   * @description: 导出json
   * @param {String} fileName 文件保存名称，如 'energy_all_data_output.json'
   * @param {*} data json格式的数据
   */
  outputJson(fileName, data) {
    /* 创建隐藏的可下载链接 */
    let link = document.createElement('a')
    link.download = fileName // 设置下载的默认文件名
    link.style.display = 'none'
    /* 字符内容转变成blob地址 */
    let blob = new Blob([data]) // 创建 blob 对象
    link.href = URL.createObjectURL(blob) // 创建一个 URL 对象并传给 a 的 href
    /* 触发点击 */
    link.click()
  }
}

export default Tools
