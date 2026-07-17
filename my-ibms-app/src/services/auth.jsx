import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

// 角色名称映射
export const ROLE_MAP = {
  ADMIN: '系统管理员',
  LEADER: '企业领导',
  CS: '客服专员',
  INSPECTOR: '现场巡检员',
  ENGINEER: '运维工程师',
};

// 角色菜单权限配置
export const ROLE_MENUS = {
  ADMIN: [
    { key: '/', icon: 'HomeOutlined', label: '主页' },
    { key: '/users', icon: 'UserOutlined', label: '用户管理' },
    { key: '/protocol', icon: 'ApiOutlined', label: '通信协议' },
    { key: '/measure-point', icon: 'AimOutlined', label: '测点管理' },
    { key: '/monitor', icon: 'SoundOutlined', label: '监听管理' },
    { key: '/work-order', icon: 'FileTextOutlined', label: '工单管理' },
    { key: '/alarm', icon: 'AlertOutlined', label: '告警管理' },
  ],
  ENGINEER: [
    { key: '/', icon: 'HomeOutlined', label: '主页' },
    { key: '/protocol', icon: 'ApiOutlined', label: '通信协议' },
    { key: '/measure-point', icon: 'AimOutlined', label: '测点管理' },
    { key: '/monitor', icon: 'SoundOutlined', label: '监听管理' },
    { key: '/work-order', icon: 'FileTextOutlined', label: '工单管理' },
    { key: '/alarm', icon: 'AlertOutlined', label: '告警管理' },
  ],
  LEADER: [
    { key: '/', icon: 'HomeOutlined', label: '主页' },
    { key: '/reports', icon: 'BarChartOutlined', label: '统计报表' },
    { key: '/alarm', icon: 'AlertOutlined', label: '告警管理' },
    { key: '/work-order', icon: 'FileTextOutlined', label: '工单管理' },
  ],
  CS: [
    { key: '/', icon: 'HomeOutlined', label: '主页' },
    { key: '/alarm', icon: 'AlertOutlined', label: '告警管理' },
    { key: '/work-order', icon: 'FileTextOutlined', label: '工单管理' },
  ],
  INSPECTOR: [
    { key: '/', icon: 'HomeOutlined', label: '主页' },
    { key: '/work-order', icon: 'FileTextOutlined', label: '我的工单' },
  ],
};

// 从 localStorage 读取用户列表（管理员可增删改）
const loadUsers = () => {
  try {
    const stored = localStorage.getItem('ibms_users');
    return stored ? JSON.parse(stored) : null;
  } catch { return null; }
};

const saveUsers = (users) => {
  localStorage.setItem('ibms_users', JSON.stringify(users));
};

// 默认用户数据
const DEFAULT_USERS = [
  { id: 1001, username: 'admin', realname: '张折喜', role: 'ADMIN', active: true, password: 'admin' },
  { id: 1002, username: 'boss', realname: '王总', role: 'LEADER', active: true, password: 'boss' },
  { id: 1003, username: 'kefu01', realname: '李丽 (客服专员)', role: 'CS', active: true, password: 'kefu' },
  { id: 1004, username: 'xj01', realname: '陈巡检-海淀区', role: 'INSPECTOR', active: true, password: 'xj' },
  { id: 1005, username: 'xj02', realname: '周巡检-朝阳区', role: 'INSPECTOR', active: true, password: 'xj' },
  { id: 1006, username: 'engineer', realname: '运维工程师', role: 'ENGINEER', active: true, password: 'engineer' },
];

// 初始化用户数据
if (!loadUsers()) {
  saveUsers(DEFAULT_USERS);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('ibms_auth_user');
    return stored ? JSON.parse(stored) : null;
  });

  const login = (username, password) => {
    const users = loadUsers() || DEFAULT_USERS;
    const found = users.find(u => u.username === username && u.password === password);
    if (!found) {
      return { success: false, message: '账号或密码错误' };
    }
    if (!found.active) {
      return { success: false, message: '该账号已被禁用，请联系管理员' };
    }
    const userInfo = { username: found.username, realname: found.realname, role: found.role, userId: found.id };
    setUser(userInfo);
    localStorage.setItem('ibms_auth_user', JSON.stringify(userInfo));
    return { success: true };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('ibms_auth_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

// 用户管理工具函数
export function getUsers() {
  return loadUsers() || DEFAULT_USERS;
}

export function updateUsers(users) {
  saveUsers(users);
}
