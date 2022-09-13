/*
 * @Author      : Mr.bin
 * @Date        : 2022-07-28 10:28:30
 * @LastEditTime: 2022-07-28 10:29:49
 * @Description : Dexie
 */
import Dexie from 'dexie'

export function initDB() {
  const db = new Dexie('Energy_N14_E13_Standalone_Squat_Control') // 与项目名保持一致
  db.version(1).stores({
    user: 'userId,userName',
    test_data: '++,userId,pdfTime,testType,[userId+pdfTime],[userId+testType]',
    train_data:
      '++,userId,pdfTime,trainType,[userId+pdfTime],[userId+trainType]'
  })
  return db
}
