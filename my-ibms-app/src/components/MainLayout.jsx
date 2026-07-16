import React from 'react';
import { Layout, Menu } from 'antd';
import {
  HomeOutlined,
  ApiOutlined,
  AimOutlined,
  SoundOutlined,
  FileTextOutlined,
  AlertOutlined,
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';

const { Header, Sider, Content } = Layout;

export default function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { key: '/', icon: <HomeOutlined />, label: '主页' },
    { key: '/protocol', icon: <ApiOutlined />, label: '通信协议' },
    { key: '/measure-point', icon: <AimOutlined />, label: '测点管理' },
    { key: '/monitor', icon: <SoundOutlined />, label: '监听管理' },
    { key: '/work-order', icon: <FileTextOutlined />, label: '工单管理' },
    { key: '/alarm', icon: <AlertOutlined />, label: '告警管理' },
  ];

  // 根据路径匹配选中的菜单项
  const selectedKey = '/' + (location.pathname.split('/')[1] || '');

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
            boxShadow: '0 1px 4px rgba(0,21,41,.08)',
          }}
        >
          IBMS 智能建筑管理系统 · 工业控制平台
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
