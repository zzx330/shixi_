/**
 * 全局常量
 */

// 工单状态流转定义
export const ORDER_STATUS = {
  PENDING: '未处理',       // 初始状态，等待接单
  PROCESSING: '处理中',    // 巡检已接单，正在现场处置
  VERIFYING: '待验收',     // 巡检处置完毕，等待CS验收
  CLOSED: '已处理',        // CS验收通过，工单归档
};

// 工单状态颜色映射
export const STATUS_COLOR = {
  '未处理': 'red',
  '处理中': 'gold',
  '待验收': 'orange',
  '已处理': 'green',
};

// 工单状态步骤
export const ORDER_STEPS = [
  { title: '未处理', description: '等待接单' },
  { title: '处理中', description: '现场处置' },
  { title: '待验收', description: 'CS审核' },
  { title: '已处理', description: '工单归档' },
];

// 工单来源
export const ORDER_SOURCES = {
  ALARM: '告警自动生成',
  INSPECTOR: '巡检现场上报',
  CS: '客服手动创建',
};

// 告警等级颜色映射
export const ALARM_LEVEL_COLOR = { 1: 'red', 2: 'orange', 3: 'gold', 4: 'blue', 5: 'default' };
export const ALARM_LEVEL_TEXT = { 1: '一级(紧急)', 2: '二级(严重)', 3: '三级(一般)', 4: '四级(提示)', 5: '五级(信息)' };
export const ALARM_LEVEL_SHORT = { 1: '一级', 2: '二级', 3: '三级', 4: '四级', 5: '五级' };
