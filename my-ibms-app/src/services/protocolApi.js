/**
 * 协议数据服务层
 * 
 * 当前使用 localStorage 作为存储后端。
 * 后续接入真实 API 时，只需修改本文件中的函数实现，
 * 页面组件无需任何改动。
 */

const STORAGE_KEY = 'ibms_protocols';

// 默认示例数据
const DEFAULT_DATA = [
  {
    key: '1', id: 1, ip: '10.88.1.10', port: 502,
    name: 'Modbus TCP',
    config: { ip: '10.88.1.10', port: '502', protocolType: 'TCP' },
  },
  {
    key: '2', id: 2, ip: '10.88.1.20', port: 47808,
    name: 'BACnet/IP',
    config: { devicePort: '47808', deviceNetworkAddr: '10.88.1.20', localIpMaskLen: '24' },
  },
  {
    key: '3', id: 3, ip: '10.88.2.50', port: 4840,
    name: 'OPC UA',
    config: { ip: '10.88.2.50', port: '4840', protocolType: 'UA' },
  },
];

// ============================================
// 本地存储实现（当前方案）
// ============================================

const loadLocal = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : DEFAULT_DATA;
  } catch { return DEFAULT_DATA; }
};

const saveLocal = (data) => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {}
};

// ============================================
// 对外暴露的 API（后续替换为 fetch/axios 即可）
// ============================================

/** 获取所有协议 */
export async function fetchProtocols() {
  // TODO: 替换为真实 API
  // const res = await fetch('/api/protocols');
  // return await res.json();
  return loadLocal();
}

/** 新增协议 */
export async function createProtocol(protocol) {
  // TODO: 替换为真实 API
  // const res = await fetch('/api/protocols', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(protocol),
  // });
  // return await res.json();
  const data = loadLocal();
  data.push(protocol);
  saveLocal(data);
  return protocol;
}

/** 更新协议 */
export async function updateProtocol(key, updates) {
  // TODO: 替换为真实 API
  // const res = await fetch(`/api/protocols/${key}`, {
  //   method: 'PUT',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(updates),
  // });
  // return await res.json();
  const data = loadLocal();
  const idx = data.findIndex((d) => d.key === key);
  if (idx !== -1) {
    data[idx] = { ...data[idx], ...updates };
    saveLocal(data);
  }
  return data[idx];
}

/** 删除协议 */
export async function deleteProtocol(key) {
  // TODO: 替换为真实 API
  // await fetch(`/api/protocols/${key}`, { method: 'DELETE' });
  const data = loadLocal().filter((d) => d.key !== key);
  saveLocal(data);
}

/** 批量导入协议 */
export async function importProtocols(protocols) {
  // TODO: 替换为真实 API
  // const res = await fetch('/api/protocols/batch', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(protocols),
  // });
  // return await res.json();
  const data = loadLocal();
  data.push(...protocols);
  saveLocal(data);
  return protocols;
}
