import React, { useState } from 'react';
import {
  Card, Table, Button, Space, Modal, Form, Input, Select, Tag, message, Popconfirm, Switch,
} from 'antd';
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { getUsers, updateUsers, ROLE_MAP } from '../services/auth';

export default function UserManagePage() {
  const [users, setUsers] = useState(getUsers());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [form] = Form.useForm();

  const roleColor = { ADMIN: 'red', LEADER: 'blue', CS: 'orange', INSPECTOR: 'green', ENGINEER: 'purple' };

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
    { title: '登录账号', dataIndex: 'username', key: 'username', width: 130 },
    { title: '姓名', dataIndex: 'realname', key: 'realname', width: 160 },
    {
      title: '所属角色', dataIndex: 'role', key: 'role', width: 140,
      render: (r) => <Tag color={roleColor[r] || 'default'}>{ROLE_MAP[r] || r}</Tag>,
    },
    {
      title: '状态', dataIndex: 'active', key: 'active', width: 80,
      render: (active, record) => (
        <Switch
          checked={active}
          disabled={record.username === 'admin'}
          onChange={(val) => toggleStatus(record.id, val)}
        />
      ),
    },
    {
      title: '操作', key: 'action', width: 200, align: 'center',
      render: (_, record) => (
        <Space size={0}>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)} style={{ padding: '4px 8px' }}>编辑</Button>
          <Popconfirm title="确定删除该用户？" onConfirm={() => handleDelete(record.id)}
            disabled={record.username === 'admin'}>
            <Button type="link" danger size="small" icon={<DeleteOutlined />}
              disabled={record.username === 'admin'}
              style={{ padding: '4px 8px' }}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const filtered = users.filter(u => {
    if (roleFilter && u.role !== roleFilter) return false;
    if (searchText) {
      const s = searchText.toLowerCase();
      return u.username.toLowerCase().includes(s) || u.realname.toLowerCase().includes(s);
    }
    return true;
  });

  const handleAdd = () => { setEditingUser(null); form.resetFields(); setIsModalOpen(true); };
  const handleEdit = (record) => { setEditingUser(record); form.setFieldsValue(record); setIsModalOpen(true); };

  const handleDelete = (id) => {
    const newUsers = users.filter(u => u.id !== id);
    setUsers(newUsers);
    updateUsers(newUsers);
    message.success('用户已删除');
  };

  const toggleStatus = (id, val) => {
    const newUsers = users.map(u => u.id === id ? { ...u, active: val } : u);
    setUsers(newUsers);
    updateUsers(newUsers);
    message.success(val ? '用户已启用' : '用户已禁用');
  };

  const handleModalOk = () => {
    form.validateFields().then((values) => {
      let newUsers;
      if (editingUser) {
        newUsers = users.map(u =>
          u.id === editingUser.id ? { ...u, realname: values.realname, password: values.password, role: values.role } : u
        );
        message.success('用户已更新');
      } else {
        if (users.some(u => u.username === values.username)) {
          message.error('该用户名已存在');
          return;
        }
        const newId = Math.max(...users.map(u => u.id), 1000) + 1;
        newUsers = [...users, { id: newId, username: values.username, realname: values.realname, role: values.role, active: true, password: values.password }];
        message.success('用户已创建');
      }
      setUsers(newUsers);
      updateUsers(newUsers);
      setIsModalOpen(false);
    });
  };

  return (
    <div>
      <Card
        title="用户管理"
        bordered={false}
        extra={
          <Space wrap>
            <Select placeholder="角色筛选" allowClear style={{ width: 130 }} value={roleFilter || undefined}
              onChange={v => setRoleFilter(v || '')}
              options={Object.entries(ROLE_MAP).map(([k, v]) => ({ value: k, label: v }))} />
            <Input placeholder="搜索用户..." prefix={<SearchOutlined />} value={searchText}
              onChange={e => setSearchText(e.target.value)} allowClear style={{ width: 200 }} />
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>新增用户</Button>
          </Space>
        }>
        <Table columns={columns} dataSource={filtered} pagination={{ pageSize: 10 }} rowKey="id" />
      </Card>

      <Modal title={editingUser ? '编辑用户' : '新增用户'} open={isModalOpen} onOk={handleModalOk}
        onCancel={() => setIsModalOpen(false)} destroyOnClose>
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="username" label="登录账号" rules={[{ required: true }]}>
            <Input placeholder="例如：zhangzx" disabled={!!editingUser} />
          </Form.Item>
          <Form.Item name="realname" label="真实姓名" rules={[{ required: true }]}>
            <Input placeholder="例如：张折喜" />
          </Form.Item>
          <Form.Item name="password" label="密码" rules={[{ required: true }]}>
            <Input.Password placeholder="不少于6位" />
          </Form.Item>
          <Form.Item name="role" label="角色" rules={[{ required: true }]}>
            <Select options={Object.entries(ROLE_MAP).map(([k, v]) => ({ value: k, label: v }))} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
