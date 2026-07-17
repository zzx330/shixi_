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
  Select,
  InputNumber,
  Tag,
  message,
  Popconfirm,
} from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { loadData, saveData } from '../services/storage';
import { useAuth } from '../services/auth';



const STORAGE_KEY_RULES = 'ibms_alarm_rules';
const STORAGE_KEY_ACTIVE = 'ibms_alarm_active';
const STORAGE_KEY_ENDED = 'ibms_alarm_ended';

const DEFAULT_RULES = [
  { key: '1', id: 1, ruleName: '环境温度过高告警', registerId: 1, activateRule: '>= 30', resetRule: '<= 25', level: 2, createTime: '2026-06-01 08:00' },
  { key: '2', id: 2, ruleName: '设备离线告警', registerId: 2, activateRule: '= false', resetRule: '= true', level: 1, createTime: '2026-06-01 08:00' },
  { key: '3', id: 3, ruleName: '电流过载告警', registerId: 3, activateRule: '>= 200', resetRule: '<= 180', level: 3, createTime: '2026-06-02 10:30' },
  { key: '4', id: 4, ruleName: '水泵出口压力低告警', registerId: 5, activateRule: '<= 0.1', resetRule: '>= 0.3', level: 2, createTime: '2026-06-03 14:00' },
];

const DEFAULT_ACTIVE = [
  { key: '1', id: 'ALM-001', ruleName: '电流过载告警', registerId: 3, registerName: '配电柜电流A相', currentValue: '228.6', threshold: '>= 200', level: 3, startTime: '2026-07-15 14:30', status: '告警中' },
  { key: '2', id: 'ALM-002', ruleName: '设备离线告警', registerId: 4, registerName: '冷却塔风扇启停控制', currentValue: 'false', threshold: '= false', level: 1, startTime: '2026-07-15 12:15', status: '告警中' },
];

const DEFAULT_ENDED = [
  { key: '1', id: 'ALM-000', ruleName: '环境温度过高告警', registerName: '一层大厅环境温度', currentValue: '31.8', threshold: '>= 30', level: 2, startTime: '2026-07-15 08:30', endTime: '2026-07-15 09:45' },
  { key: '2', id: 'ALM-000b', ruleName: '水泵出口压力低告警', registerName: '消防水泵出口压力', currentValue: '0.07', threshold: '<= 0.1', level: 2, startTime: '2026-07-14 22:00', endTime: '2026-07-14 23:30' },
];

// ==================== 告警规则配置 Tab ====================
function AlarmRuleTab({ rules, setRules }) {
  const { user } = useAuth();
  const isReadOnly = user.role === 'LEADER';
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [form] = Form.useForm();

  const levelColor = { 1: 'red', 2: 'orange', 3: 'gold', 4: 'blue', 5: 'default' };
  const levelText = { 1: '一级(紧急)', 2: '二级(严重)', 3: '三级(一般)', 4: '四级(提示)', 5: '五级(信息)' };

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 50 },
    { title: '规则名', dataIndex: 'ruleName', key: 'ruleName', width: 150 },
    { title: '关联寄存器编号', dataIndex: 'registerId', key: 'registerId', width: 120 },
    { title: '激活规则', dataIndex: 'activateRule', key: 'activateRule', width: 110, render: (v) => <Tag color="red">{v}</Tag> },
    { title: '重置规则', dataIndex: 'resetRule', key: 'resetRule', width: 110, render: (v) => <Tag color="green">{v}</Tag> },
    { title: '告警等级', dataIndex: 'level', key: 'level', width: 120, render: (l) => <Tag color={levelColor[l]}>{levelText[l]}</Tag> },
    { title: '创建时间', dataIndex: 'createTime', key: 'createTime', width: 160 },
    ...(isReadOnly ? [] : [{
      title: '操作', key: 'action', width: 200, align: 'center',
      render: (_, record) => (
        <Space size={0}>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)} style={{ padding: '4px 8px' }}>编辑</Button>
          <Popconfirm title="确定删除该规则？" onConfirm={() => handleDelete(record.key)}>
            <Button type="link" danger size="small" icon={<DeleteOutlined />} style={{ padding: '4px 8px' }}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    }]),
  ];

  const handleAdd = () => { setEditingRecord(null); form.resetFields(); setIsModalOpen(true); };
  const handleEdit = (record) => { setEditingRecord(record); form.setFieldsValue(record); setIsModalOpen(true); };
  const handleDelete = (key) => { setRules(rules.filter((item) => item.key !== key)); message.success('规则已删除'); };

  const handleModalOk = () => {
    form.validateFields().then((values) => {
      if (editingRecord) {
        setRules(rules.map((item) => (item.key === editingRecord.key ? { ...item, ...values } : item)));
        message.success('规则已更新');
      } else {
        const newId = Math.max(...rules.map((d) => d.id), 0) + 1;
        setRules([...rules, { key: String(Date.now()), id: newId, ...values, createTime: new Date().toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).replace(/\//g, '-') }]);
        message.success('规则已创建');
      }
      setIsModalOpen(false);
    });
  };

  return (
    <div>
      <Card bordered={false} extra={!isReadOnly && <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>创建新规则</Button>}>
        <Table columns={columns} dataSource={rules} pagination={false} />
      </Card>
      <Modal title={editingRecord ? '编辑告警规则' : '创建新告警规则'} open={isModalOpen} onOk={handleModalOk} onCancel={() => setIsModalOpen(false)} destroyOnClose>
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="ruleName" label="规则名" rules={[{ required: true, message: '请输入规则名' }]}><Input placeholder="例如: 环境温度过高告警" /></Form.Item>
          <Form.Item name="registerId" label="关联寄存器编号" rules={[{ required: true }]}><InputNumber min={1} style={{ width: '100%' }} placeholder="关联的寄存器 ID" /></Form.Item>
          <Form.Item name="activateRule" label="激活规则" rules={[{ required: true, message: '请输入激活条件' }]}><Input placeholder="例如: >= 30" /></Form.Item>
          <Form.Item name="resetRule" label="重置规则" rules={[{ required: true, message: '请输入重置条件' }]}><Input placeholder="例如: <= 25" /></Form.Item>
          <Form.Item name="level" label="告警等级" rules={[{ required: true }]}>
            <Select options={[
              { value: 1, label: '一级 (紧急)' }, { value: 2, label: '二级 (严重)' }, { value: 3, label: '三级 (一般)' },
              { value: 4, label: '四级 (提示)' }, { value: 5, label: '五级 (信息)' },
            ]} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

// ==================== 正在告警事件 Tab ====================
function ActiveAlarmTab({ activeAlarms, setActiveAlarms, setEndedAlarms }) {
  const levelColor = { 1: 'red', 2: 'orange', 3: 'gold', 4: 'blue', 5: 'default' };
  const levelText = { 1: '一级', 2: '二级', 3: '三级', 4: '四级', 5: '五级' };

  const confirmAlarm = (record) => {
    // 加入已结束列表
    const endedRecord = {
      ...record,
      key: 'ended_' + String(Date.now()),
      endTime: new Date().toLocaleString('zh-CN', {
        year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
      }).replace(/\//g, '-'),
    };
    delete endedRecord.status;

    // 询问是否创建关联工单
    Modal.confirm({
      title: '告警已确认',
      content: `告警「${record.ruleName}」已消除。是否需要针对此项告警创建一张工单进行闭环处置？`,
      okText: '创建工单',
      cancelText: '仅消警',
      onOk: () => {
        // 创建关联工单
        const workOrders = loadData('ibms_work_orders', []);
        const nextNum = workOrders.length + 1;
        const newWO = {
          key: String(Date.now()),
          id: `WO-${new Date().getFullYear()}${String(nextNum).padStart(3, '0')}`,
          title: `告警处置：${record.ruleName}`,
          status: '未处理',
          type: '维修类',
          location: record.registerName,
          creator: '运维工程师',
          description: `针对告警 [${record.id}] ${record.ruleName}（当前值：${record.currentValue}，触发条件：${record.threshold}）的闭环处置工单。`,
          parentOrderId: '',
          createTime: new Date().toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).replace(/\//g, '-'),
          comments: [{ author: '系统', time: new Date().toLocaleTimeString().slice(0, 5), content: `由于触发告警[${record.id}] 自动生成派发该工单。` }],
        };
        saveData('ibms_work_orders', [...workOrders, newWO]);
        message.success('告警已消除，关联工单已自动创建');
      },
      onCancel: () => {
        message.success('告警已确认并结束');
      },
    });

    // 从活跃列表移除
    setActiveAlarms(activeAlarms.filter((a) => a.key !== record.key));
    setEndedAlarms((prev) => [endedRecord, ...prev]);
  };

  const columns = [
    { title: '告警编号', dataIndex: 'id', key: 'id', width: 100 },
    { title: '规则名', dataIndex: 'ruleName', key: 'ruleName', width: 140 },
    { title: '寄存器', dataIndex: 'registerName', key: 'registerName', width: 150 },
    { title: '当前值', dataIndex: 'currentValue', key: 'currentValue', width: 100, render: (v) => <span style={{ fontWeight: 'bold', color: '#ff4d4f' }}>{v}</span> },
    { title: '触发条件', dataIndex: 'threshold', key: 'threshold', width: 100, render: (v) => <Tag color="red">{v}</Tag> },
    { title: '等级', dataIndex: 'level', key: 'level', width: 70, render: (l) => <Tag color={levelColor[l]}>{levelText[l]}</Tag> },
    { title: '开始时间', dataIndex: 'startTime', key: 'startTime', width: 160 },
    { title: '状态', dataIndex: 'status', key: 'status', width: 80, render: (s) => <Tag color="red">{s}</Tag> },
    {
      title: '操作', key: 'action', width: 120, align: 'center',
      render: (_, record) => (
        <Button type="primary" size="small" icon={<CheckCircleOutlined />} onClick={() => confirmAlarm(record)}>确认告警</Button>
      ),
    },
  ];

  return (
    <Card bordered={false}>
      <Table columns={columns} dataSource={activeAlarms} pagination={false} />
    </Card>
  );
}

// ==================== 已结束告警事件 Tab ====================
function EndedAlarmTab({ endedAlarms }) {
  const levelColor = { 1: 'red', 2: 'orange', 3: 'gold', 4: 'blue', 5: 'default' };
  const levelText = { 1: '一级', 2: '二级', 3: '三级', 4: '四级', 5: '五级' };

  const columns = [
    { title: '告警编号', dataIndex: 'id', key: 'id', width: 100 },
    { title: '规则名', dataIndex: 'ruleName', key: 'ruleName', width: 140 },
    { title: '寄存器', dataIndex: 'registerName', key: 'registerName', width: 150 },
    { title: '触发值', dataIndex: 'currentValue', key: 'currentValue', width: 80 },
    { title: '触发条件', dataIndex: 'threshold', key: 'threshold', width: 100, render: (v) => <Tag>{v}</Tag> },
    { title: '等级', dataIndex: 'level', key: 'level', width: 70, render: (l) => <Tag color={levelColor[l]}>{levelText[l]}</Tag> },
    { title: '开始时间', dataIndex: 'startTime', key: 'startTime', width: 160 },
    { title: '结束时间', dataIndex: 'endTime', key: 'endTime', width: 160 },
    { title: '状态', key: 'status', width: 80, render: () => <Tag color="green">已结束</Tag> },
  ];

  return (
    <Card bordered={false}>
      <Table columns={columns} dataSource={endedAlarms} pagination={false} />
    </Card>
  );
}

// ==================== 主组件 ====================
export default function AlarmPage() {
  const [rules, setRules] = useState(() => loadData(STORAGE_KEY_RULES, DEFAULT_RULES));
  const [activeAlarms, setActiveAlarms] = useState(() => loadData(STORAGE_KEY_ACTIVE, DEFAULT_ACTIVE));
  const [endedAlarms, setEndedAlarms] = useState(() => loadData(STORAGE_KEY_ENDED, DEFAULT_ENDED));

  useEffect(() => { saveData(STORAGE_KEY_RULES, rules); }, [rules]);
  useEffect(() => { saveData(STORAGE_KEY_ACTIVE, activeAlarms); }, [activeAlarms]);
  useEffect(() => { saveData(STORAGE_KEY_ENDED, endedAlarms); }, [endedAlarms]);

  const tabItems = [
    { key: 'rule', label: '告警规则配置', children: <AlarmRuleTab rules={rules} setRules={setRules} /> },
    { key: 'active', label: '正在告警事件', children: <ActiveAlarmTab activeAlarms={activeAlarms} setActiveAlarms={setActiveAlarms} setEndedAlarms={setEndedAlarms} /> },
    { key: 'ended', label: '已结束告警事件', children: <EndedAlarmTab endedAlarms={endedAlarms} /> },
  ];

  return (
    <div>
      <h2 style={{ marginBottom: 16 }}>告警管理</h2>
      <Tabs defaultActiveKey="active" items={tabItems} />
    </div>
  );
}
