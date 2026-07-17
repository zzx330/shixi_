/**
 * 全局常量
 */

// 工单状态颜色映射
export const STATUS_COLOR = {
  '未处理': 'red',
  '处理中': 'orange',
  '已处理': 'green',
  '已关闭': 'default',
};

// 告警等级颜色映射
export const ALARM_LEVEL_COLOR = { 1: 'red', 2: 'orange', 3: 'gold', 4: 'blue', 5: 'default' };
export const ALARM_LEVEL_TEXT = { 1: '一级(紧急)', 2: '二级(严重)', 3: '三级(一般)', 4: '四级(提示)', 5: '五级(信息)' };
export const ALARM_LEVEL_SHORT = { 1: '一级', 2: '二级', 3: '三级', 4: '四级', 5: '五级' };
