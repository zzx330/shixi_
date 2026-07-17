/**
 * 通用工具函数
 */

// 智能转换 value：数字保持数字，布尔保持布尔
export function convertValue(v) {
  if (v === 'true') return true;
  if (v === 'false') return false;
  if (v === '' || v === null || v === undefined) return v;
  if (!isNaN(Number(v)) && String(v).trim() !== '') return Number(v);
  return v;
}

// 格式化当前时间为 yyyy-MM-dd HH:mm
export function formatNow() {
  return new Date().toLocaleString('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  }).replace(/\//g, '-');
}

// 格式化当前时间为 HH:mm
export function formatTimeNow() {
  return new Date().toLocaleTimeString().slice(0, 5);
}
