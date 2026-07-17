import React from 'react';
import { Layout, Menu, Button, Space, Tag } from 'antd';
import {
  HomeOutlined,
  ApiOutlined,
  AimOutlined,
  SoundOutlined,
  FileTextOutlined,
  AlertOutlined,
  LogoutOutlined,
  UserOutlined,
  BarChartOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth, ROLE_MENUS, ROLE_MAP } from '../services/auth';

const { Header, Sider, Content } = Layout;

// 图标映射
const ICON_MAP = {
  HomeOutlined: <HomeOutlined />,
  ApiOutlined: <ApiOutlined />,
  AimOutlined: <AimOutlined />,
  SoundOutlined: <SoundOutlined />,
  FileTextOutlined: <FileTextOutlined />,
  AlertOutlined: <AlertOutlined />,
  UserOutlined: <UserOutlined />,
  BarChartOutlined: <BarChartOutlined />,
  TeamOutlined: <TeamOutlined />,
};

export default function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  // 根据角色获取菜单
  const rawMenu = ROLE_MENUS[user.role] || ROLE_MENUS.ENGINEER;
  const menuItems = rawMenu.map(m => ({
    key: m.key,
    icon: ICON_MAP[m.icon] || <HomeOutlined />,
    label: m.label,
  }));

  const selectedKey = '/' + (location.pathname.split('/')[1] || '');

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider breakpoint="lg" collapsedWidth="0" width={220}>
        <div
          style={{
            height: 48,
            margin: 16,
            color: '#fff',
            textAlign: 'center',
            lineHeight: '48px',
            fontWeight: 'bold',
            fontSize: 18,
            borderBottom: '1px solid rgba(255,255,255,0.2)',
          }}
        >
          IBMS 工控管理系统
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey === '/' ? '/' : selectedKey]}
          onClick={(e) => navigate(e.key)}
          items={menuItems}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            background: '#fff',
            padding: '0 24px',
            fontSize: 16,
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 1px 4px rgba(0,21,41,.08)',
          }}
        >
          <span>IBMS 智能建筑管理系统 · 工业控制平台</span>
          <Space>
            <Tag color="blue" icon={<UserOutlined />}>
              {user.realname} ({ROLE_MAP[user.role] || user.role})
            </Tag>
            <Button
              type="text"
              danger
              icon={<LogoutOutlined />}
              onClick={handleLogout}
            >
              退出登录
            </Button>
          </Space>
        </Header>
        <Content
          style={{
            margin: 24,
            padding: 24,
            background: '#f0f2f5',
            minHeight: 280,
            overflowY: 'auto',
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
