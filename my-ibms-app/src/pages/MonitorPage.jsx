import React, { useState, useEffect } from 'react';
import {
  Card,
  Tabs,
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  InputNumber,
  Switch,
  Select,
  Tag,
  message,
  Popconfirm,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  DeleteOutlined,
  EditOutlined,
} from '@ant-design/icons';
import { loadData, saveData } from '../services/storage';
import { useAuth } from '../services/auth';

const STORAGE_KEY_GROUPS = 'ibms_monitor_groups';

const DEFAULT_GROUPS = [
  { key: '1', groupName: '环境温度监听组A', registerIds: [1, 5], ruleId: 1, interval: 5000, lastMonitorTime: '2026-07-15 15:00:00', maxCache: 10000, isMonitoring: true },
  { key: '2', groupName: '设备运行状态监听组', registerIds: [2, 4], ruleId: 2, interval: 10000, lastMonitorTime: '2026-07-15 14:55:00', maxCache: 5000, isMonitoring: true },
  { key: '3', groupName: '配电监测组', registerIds: [3], ruleId: 3, interval: 2000, lastMonitorTime: '2026-07-15 15:00:30', maxCache: 20000, isMonitoring: false },
];

// ==================== 监听组配置 Tab ====================
function MonitorGroupTab() {
  const { user } = useAuth();
  const isReadOnly = user.role === 'LEADER';
  const [data, setData] = useState(() => loadData(STORAGE_KEY_GROUPS, DEFAULT_GROUPS));

  useEffect(() => { saveData(STORAGE_KEY_GROUPS, data); }, [data]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [form] = Form.useForm();
  const [deleteForm] = Form.useForm();

  const columns = [
    { title: '监听组名', dataIndex: 'groupName', key: 'groupName', width: 140 },
    {
      title: '关联寄存器编号',
      dataIndex: 'registerIds',
      key: 'registerIds',
      width: 150,
      render: (ids) => (
        <Space size={[4, 4]} wrap>
          {ids.map((id) => (
            <Tag key={id} color="blue">{id}</Tag>
          ))}
        </Space>
      ),
    },
    { title: '关联规则编号', dataIndex: 'ruleId', key: 'ruleId', width: 130 },
    {
      title: '监听间隔 (ms)',
      dataIndex: 'interval',
      key: 'interval',
      width: 120,
      render: (v) => `${v} ms`,
    },
    { title: '上次监听时间', dataIndex: 'lastMonitorTime', key: 'lastMonitorTime', width: 170 },
    { title: '最大缓存数', dataIndex: 'maxCache', key: 'maxCache', width: 120 },
    {
      title: '是否监听',
      dataIndex: 'isMonitoring',
      key: 'isMonitoring',
      width: 90,
      render: (val, record) => (
        <Switch
          checked={val}
          onChange={(checked) => {
            setData(data.map((item) => (item.key === record.key ? { ...item, isMonitoring: checked } : item)));
            message.success(checked ? '监听已开启' : '监听已关闭');
          }}
        />
      ),
    },
    ...(isReadOnly ? [] : [{
      title: '操作',
      key: 'action',
      width: 200,
      align: 'center',
      fixed: 'right',
      render: (_, record) => (
        <Space size={0}>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)} style={{ padding: '4px 8px' }}>编辑</Button>
          <Popconfirm title="确定删除该监听组？" onConfirm={() => handleDelete(record.key)}>
            <Button type="link" danger size="small" icon={<DeleteOutlined />} style={{ padding: '4px 8px' }}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    }]),
  ];

  const filteredData = searchText
    ? data.filter((item) => {
        const s = searchText.toLowerCase();
        return (
          item.groupName.toLowerCase().includes(s) ||
          item.registerIds.some((id) => String(id).includes(s)) ||
          String(item.ruleId).includes(s)
        );
      })
    : data;

  const handleAdd = () => {
    setEditingRecord(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleEdit = (record) => {
    setEditingRecord(record);
    form.setFieldsValue(record);
    setIsModalOpen(true);
  };

  const handleDelete = (key) => {
    setData(data.filter((item) => item.key !== key));
    message.success('监听组已删除');
  };

  const handleModalOk = () => {
    form.validateFields().then((values) => {
      if (editingRecord) {
        setData(
          data.map((item) =>
            item.key === editingRecord.key ? { ...item, ...values, lastMonitorTime: item.lastMonitorTime } : item
          )
        );
        message.success('监听组已更新');
      } else {
        setData([
          ...data,
          {
            key: String(Date.now()),
            ...values,
            lastMonitorTime: '-',
            isMonitoring: true,
          },
        ]);
        message.success('监听组已创建');
      }
      setIsModalOpen(false);
    });
  };

  const handleDeleteGroup = () => {
    deleteForm.validateFields().then((values) => {
      const name = values.groupName;
      const target = data.find((item) => item.groupName === name);
      if (target) {
        setData(data.filter((item) => item.groupName !== name));
        message.success(`监听组 "${name}" 已删除`);
        setIsDeleteModalOpen(false);
        deleteForm.resetFields();
      } else {
        message.error('未找到该监听组');
      }
    });
  };

  return (
    <div>
      <Card
        bordered={false}
        extra={
          <Space wrap>
            <Input
              placeholder="搜索监听组..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
              style={{ width: 200 }}
            />
            {!isReadOnly && (
              <>
                <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
                  创建监听组
                </Button>
                <Button danger icon={<DeleteOutlined />} onClick={() => setIsDeleteModalOpen(true)}>
                  删除监听组
                </Button>
              </>
            )}
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={filteredData}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 1000 }}
        />
      </Card>

      {/* 创建/编辑监听组弹窗 */}
      <Modal
        title={editingRecord ? '编辑监听组' : '创建监听组'}
        open={isModalOpen}
        onOk={handleModalOk}
        onCancel={() => setIsModalOpen(false)}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="groupName" label="监听组名" rules={[{ required: true, message: '请输入监听组名' }]}>
            <Input placeholder="例如: 环境温度监听组A" />
          </Form.Item>
          <Form.Item name="registerIds" label="寄存器编号组" rules={[{ required: true, message: '请选择寄存器' }]}>
            <Select mode="multiple" placeholder="选择关联的寄存器编号" options={[
              { value: 1, label: '1 - 一层大厅环境温度' },
              { value: 2, label: '2 - 冷水机组运行状态' },
              { value: 3, label: '3 - 配电柜电流A相' },
              { value: 4, label: '4 - 冷却塔风扇启停控制' },
              { value: 5, label: '5 - 消防水泵出口压力' },
            ]} />
          </Form.Item>
          <Form.Item name="ruleId" label="关联规则编号">
            <InputNumber min={1} style={{ width: '100%' }} placeholder="关联的告警规则 ID" />
          </Form.Item>
          <Form.Item name="interval" label="监听间隔 (毫秒)" rules={[{ required: true, message: '请输入监听间隔' }]}>
            <InputNumber min={100} step={100} style={{ width: '100%' }} placeholder="例如: 5000" />
          </Form.Item>
          <Form.Item name="maxCache" label="最大缓存数">
            <InputNumber min={100} style={{ width: '100%' }} placeholder="例如: 10000" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 按名称删除监听组弹窗 */}
      <Modal
        title="删除监听组"
        open={isDeleteModalOpen}
        onOk={handleDeleteGroup}
        onCancel={() => { setIsDeleteModalOpen(false); deleteForm.resetFields(); }}
        destroyOnClose
      >
        <Form form={deleteForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="groupName" label="输入要删除的监听组名" rules={[{ required: true, message: '请输入监听组名' }]}>
            <Input placeholder="请输入监听组名" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

// ==================== 监听记录 Tab ====================
function MonitorRecordTab() {
  const records = [
    { key: '1', groupName: '环境温度监听组A', registerId: 1, value: '24.5', sampleTime: '2026-07-15 15:00:00' },
    { key: '2', groupName: '环境温度监听组A', registerId: 5, value: '0.42', sampleTime: '2026-07-15 15:00:00' },
    { key: '3', groupName: '设备运行状态监听组', registerId: 2, value: 'true', sampleTime: '2026-07-15 14:55:00' },
    { key: '4', groupName: '设备运行状态监听组', registerId: 4, value: 'false', sampleTime: '2026-07-15 14:55:00' },
    { key: '5', groupName: '配电监测组', registerId: 3, value: '156.23', sampleTime: '2026-07-15 15:00:30' },
    { key: '6', groupName: '环境温度监听组A', registerId: 1, value: '24.3', sampleTime: '2026-07-15 14:55:00' },
    { key: '7', groupName: '环境温度监听组A', registerId: 5, value: '0.41', sampleTime: '2026-07-15 14:55:00' },
  ];

  const [filters, setFilters] = useState({ groupName: undefined, registerId: undefined });

  const filtered = records.filter((r) => {
    if (filters.groupName && r.groupName !== filters.groupName) return false;
    if (filters.registerId && r.registerId !== filters.registerId) return false;
    return true;
  });

  const columns = [
    {
      title: '监听组名',
      dataIndex: 'groupName',
      key: 'groupName',
      width: 150,
      render: (v) => <Tag color="purple">{v}</Tag>,
    },
    { title: '寄存器编号', dataIndex: 'registerId', key: 'registerId', width: 110 },
    {
      title: '数值',
      dataIndex: 'value',
      key: 'value',
      width: 100,
      render: (v) => <span style={{ fontWeight: 'bold', color: '#1890ff' }}>{v}</span>,
    },
    { title: '采样时间', dataIndex: 'sampleTime', key: 'sampleTime', width: 180 },
  ];

  const groupNames = [...new Set(records.map((r) => r.groupName))];
  const registerIds = [...new Set(records.map((r) => r.registerId))];

  return (
    <Card bordered={false}>
      <Space style={{ marginBottom: 16 }} wrap>
        <Select
          placeholder="按监听组筛选"
          allowClear
          style={{ width: 160 }}
          value={filters.groupName}
          onChange={(v) => setFilters({ ...filters, groupName: v })}
          options={groupNames.map((n) => ({ value: n, label: n }))}
        />
        <Select
          placeholder="按寄存器编号筛选"
          allowClear
          style={{ width: 160 }}
          value={filters.registerId}
          onChange={(v) => setFilters({ ...filters, registerId: v })}
          options={registerIds.map((id) => ({ value: id, label: `寄存器 ${id}` }))}
        />
      </Space>
      <Table columns={columns} dataSource={filtered} pagination={{ pageSize: 10 }} />
    </Card>
  );
}

// ==================== 主组件 ====================
export default function MonitorPage() {
  const tabItems = [
    { key: 'group', label: '监听组配置', children: <MonitorGroupTab /> },
    { key: 'record', label: '监听记录', children: <MonitorRecordTab /> },
  ];

  return (
    <div>
      <h2 style={{ marginBottom: 16 }}>监听管理</h2>
      <Tabs defaultActiveKey="group" items={tabItems} />
    </div>
  );
}
