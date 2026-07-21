import React, { useState } from 'react';
import dayjs from 'dayjs';
import { useAuth } from '../services/auth';
import {
  Card, Table, Button, Space, Modal, Form, Input, Select, DatePicker, Tag, message, Popconfirm,
  Drawer, Steps, Upload, Descriptions, Timeline, Typography,
} from 'antd';
import {
  PlusOutlined, SearchOutlined, DeleteOutlined, EditOutlined, EyeOutlined,
  SendOutlined, UploadOutlined, CameraOutlined, SwapOutlined,
  CheckCircleOutlined, RollbackOutlined, WarningOutlined,
} from '@ant-design/icons';
import { useLocalStorage } from '../utils/useLocalStorage';
import { STATUS_COLOR, ORDER_STATUS, ORDER_STEPS, ORDER_SOURCES } from '../utils/constants';
import { formatNow, formatTimeNow } from '../utils/helpers';

const { TextArea } = Input;
const { Text } = Typography;

const STORAGE_KEY = 'ibms_work_orders';

const DEFAULT_DATA = [
  { key: '1', id: 'WO-2026001', title: '2号楼空调机组异常停机', status: ORDER_STATUS.PROCESSING, type: '维修类',
    location: '2号楼A区', creator: '李丽 (客服专员)', assignee: '陈巡检-海淀区', priority: 'HIGH',
    source: ORDER_SOURCES.ALARM, alarmId: 'ALM-001',
    description: '2号楼东侧大办公室空调突然停机，室内温度升至28℃，影响员工正常办公。',
    createTime: '2026-07-20 08:30', deadline: '2026-07-20 18:00',
    comments: [
      { author: '系统', time: '08:30', type: 'system', content: '告警 ALM-001 触发，自动生成工单。' },
      { author: '李丽 (客服专员)', time: '08:35', type: 'assign', content: '已派单至陈巡检-海淀区，请尽快现场排查。' },
    ],
    photos: [], retestData: null,
  },
  { key: '2', id: 'WO-2026002', title: '配电柜定期巡检', status: ORDER_STATUS.PENDING, type: '定期巡检类',
    location: 'B2配电室', creator: '李丽 (客服专员)', assignee: '周巡检-朝阳区', priority: 'NORMAL',
    source: ORDER_SOURCES.CS,
    description: '按月度计划对B2配电室所有配电柜进行例行巡检，检查接线端子、温度等。',
    createTime: '2026-07-20 09:00', deadline: '2026-07-21 18:00',
    comments: [],
    photos: [], retestData: null,
  },
  { key: '3', id: 'WO-2026003', title: '冷却塔风扇异响排查', status: ORDER_STATUS.VERIFYING, type: '维修类',
    location: '顶层平台', creator: '李丽 (客服专员)', assignee: '陈巡检-海淀区', priority: 'HIGH',
    source: ORDER_SOURCES.INSPECTOR,
    description: '巡检现场巡查发现顶层平台冷却塔2号风扇运行时发出异常噪音，需排查轴承或叶片问题。',
    createTime: '2026-07-19 16:20', deadline: '2026-07-20 18:00',
    comments: [
      { author: '陈巡检-海淀区', time: '17:00', type: 'report', content: '现场检查发现2号风扇轴承磨损严重，已更换新轴承，运行测试正常。请验收。' },
    ],
    photos: ['风机轴承更换前.jpg', '新轴承安装后.jpg'],
    retestData: { temperature: '42.3', vibration: '2.1', result: '正常' },
  },
  { key: '4', id: 'WO-2026004', title: '消防水泵月度测试', status: ORDER_STATUS.CLOSED, type: '定期巡检类',
    location: 'B2消防泵房', creator: '李丽 (客服专员)', assignee: '周巡检-朝阳区', priority: 'NORMAL',
    source: ORDER_SOURCES.CS,
    description: '对消防水泵进行月度启动测试，检查出水压力是否达标。',
    createTime: '2026-07-18 14:00', deadline: '2026-07-19 18:00',
    comments: [
      { author: '周巡检-朝阳区', time: '15:30', type: 'report', content: '消防水泵启动正常，出水压力0.8MPa，符合标准。' },
      { author: '李丽 (客服专员)', time: '16:00', type: 'verify', content: '验收通过，工单关闭归档。' },
    ],
    photos: ['水泵测试记录.jpg'],
    retestData: { pressure: '0.8', flow: '45', result: '合格' },
  },
];

export default function WorkOrderPage() {
  const { user } = useAuth();
  const isCS = user.role === 'CS';
  const isInspector = user.role === 'INSPECTOR';
  const isLeader = user.role === 'LEADER';
  const isReadOnly = isLeader;
  const isAdmin = user.role === 'ADMIN' || user.role === 'ENGINEER';

  const [data, setData] = useLocalStorage(STORAGE_KEY, DEFAULT_DATA);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState(undefined);
  const [descModalOpen, setDescModalOpen] = useState(false);
  const [descContent, setDescContent] = useState({ title: '', desc: '' });
  const [form] = Form.useForm();

  // 工单详情抽屉
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerRecord, setDrawerRecord] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [transferForm] = Form.useForm();
  const [photoList, setPhotoList] = useState([]);

  const statusColor = STATUS_COLOR;
  const priorityColor = { HIGH: 'red', NORMAL: 'orange', LOW: 'default' };
  const priorityText = { HIGH: '高', NORMAL: '中', LOW: '低' };

  // 获取当前步骤索引
  const getStepCurrent = (status) => {
    const map = { [ORDER_STATUS.PENDING]: 0, [ORDER_STATUS.PROCESSING]: 1, [ORDER_STATUS.VERIFYING]: 2, [ORDER_STATUS.CLOSED]: 3 };
    return map[status] !== undefined ? map[status] : 0;
  };

  // 更新工单并记录评论
  const updateOrder = (order, updates, comment) => {
    const updated = {
      ...order,
      ...updates,
      comments: [...(order.comments || []), comment].filter(Boolean),
    };
    setData(data.map(item => item.key === order.key ? updated : item));
    setDrawerRecord(updated);
    return updated;
  };

  // ========== 状态流转操作 ==========

  // INSPECTOR：接单
  const handleAccept = () => {
    const order = drawerRecord;
    updateOrder(order, { status: ORDER_STATUS.PROCESSING }, {
      author: user.realname, time: formatTimeNow(), type: 'status',
      content: '✅ 已接单，开始现场处置。',
    });
    message.success('已接单，工单进入处理中状态');
  };

  // INSPECTOR：处置完毕，申请验收
  const handleComplete = () => {
    const order = drawerRecord;
    updateOrder(order, { status: ORDER_STATUS.VERIFYING }, {
      author: user.realname, time: formatTimeNow(), type: 'status',
      content: '✅ 现场处置完毕，已上传照片和复测数据，申请CS验收。',
    });
    message.success('已申请验收');
  };

  // CS：验收通过，关闭工单
  const handleVerify = () => {
    const order = drawerRecord;
    updateOrder(order, { status: ORDER_STATUS.CLOSED, deadline: formatNow() }, {
      author: user.realname, time: formatTimeNow(), type: 'verify',
      content: '✅ 验收通过，工单已关闭归档。',
    });
    message.success('验收通过，工单已关闭');
  };

  // CS：验收不通过，退回重处理
  const handleReject = () => {
    Modal.confirm({
      title: '退回重处理',
      content: (
        <div>
          <p>确定将此工单退回至「处理中」状态？</p>
          <Input.TextArea id="reject-reason" rows={3} placeholder="请输入退回原因..." />
        </div>
      ),
      okText: '确认退回',
      onOk: () => {
        const reason = document.getElementById('reject-reason')?.value || '未填写原因';
        const order = drawerRecord;
        updateOrder(order, { status: ORDER_STATUS.PROCESSING }, {
          author: user.realname, time: formatTimeNow(), type: 'reject',
          content: `❌ 验收不合格，退回重处理。原因：${reason}`,
        });
        message.warning('工单已退回重处理');
      },
    });
  };

  // INSPECTOR：申请转派
  const handleTransferRequest = () => {
    transferForm.resetFields();
    setTransferModalOpen(true);
  };

  const doTransfer = () => {
    transferForm.validateFields().then(values => {
      const order = drawerRecord;
      updateOrder(order, { assignee: values.newAssignee, status: ORDER_STATUS.PENDING }, {
        author: user.realname, time: formatTimeNow(), type: 'transfer',
        content: `🔄 申请转派至 ${values.newAssignee}。原因：${values.reason}`,
      });
      setTransferModalOpen(false);
      message.success('转派成功，工单已重新进入待接单状态');
    });
  };

  // ========== 评论与附件 ==========

  const submitComment = () => {
    if (!commentText.trim() || !drawerRecord) return;
    updateOrder(drawerRecord, {}, {
      author: user.realname, time: formatTimeNow(), type: 'comment',
      content: commentText.trim(),
    });
    setCommentText('');
  };

  const handlePhotoUpload = (file) => {
    setPhotoList(prev => [...prev, file.name]);
    message.success(`照片 ${file.name} 已上传`);
    return false;
  };

  // ========== CS：创建工单 ==========

  const handleAdd = () => {
    setEditingRecord(null);
    form.resetFields();
    form.setFieldsValue({ status: ORDER_STATUS.PENDING, priority: 'NORMAL', source: ORDER_SOURCES.CS });
    setIsModalOpen(true);
  };

  const handleEdit = (record) => {
    setEditingRecord(record);
    // 时间字段是字符串，需要转为 dayjs 对象供 DatePicker 使用
    form.setFieldsValue({
      ...record,
      createTime: record.createTime ? dayjs(record.createTime) : null,
      deadline: record.deadline ? dayjs(record.deadline) : null,
    });
    setIsModalOpen(true);
  };

  const handleDelete = (key) => {
    setData(data.filter(item => item.key !== key));
    message.success('工单已删除');
  };

  const handleModalOk = () => {
    form.validateFields().then(values => {
      // 处理 DatePicker 的值：转为字符串
      const formatDate = (v) => v ? (typeof v === 'string' ? v : v.format('YYYY-MM-DD HH:mm')) : '';
      const formatted = {
        ...values,
        createTime: formatDate(values.createTime),
        deadline: formatDate(values.deadline),
      };
      if (editingRecord) {
        setData(data.map(item => item.key === editingRecord.key ? { ...item, ...formatted } : item));
        message.success('工单已更新');
      } else {
        const nextNum = data.length + 1;
        const newId = `WO-${new Date().getFullYear()}${String(nextNum).padStart(3, '0')}`;
        setData([...data, {
          key: String(Date.now()), id: newId, ...formatted,
          comments: [{ author: user.realname, time: formatTimeNow(), type: 'create', content: `工单创建，来源：${formatted.source}。` }],
          photos: [], retestData: null,
          createTime: formatNow(),
        }]);
        message.success('工单已创建');
      }
      setIsModalOpen(false);
    });
  };

  // 打开详情抽屉
  const openDrawer = (record) => {
    setDrawerRecord(data.find(d => d.key === record.key) || record);
    setCommentText('');
    setPhotoList(record.photos || []);
    setDrawerOpen(true);
  };

  // ========== 表格列定义 ==========

  const filteredData = data
    .filter(item => {
      if (isInspector && item.assignee !== user.realname) return false;
      return true;
    })
    .filter(item => {
      if (statusFilter && item.status !== statusFilter) return false;
      if (searchText) {
        const s = searchText.toLowerCase();
        return ['id', 'title', 'type', 'location', 'creator', 'assignee', 'description'].some(k =>
          (item[k] || '').toLowerCase().includes(s)
        );
      }
      return true;
    });

  const columns = [
    { title: '编号', dataIndex: 'id', key: 'id', width: 120 },
    { title: '标题', dataIndex: 'title', key: 'title', width: 200, ellipsis: true },
    { title: '状态', dataIndex: 'status', key: 'status', width: 80, render: s => <Tag color={statusColor[s] || 'default'}>{s}</Tag> },
    { title: '优先级', dataIndex: 'priority', key: 'priority', width: 70, render: p => <Tag color={priorityColor[p]}>{priorityText[p]}</Tag> },
    { title: '类型', dataIndex: 'type', key: 'type', width: 100 },
    { title: '位置', dataIndex: 'location', key: 'location', width: 110 },
    { title: '指派人', dataIndex: 'assignee', key: 'assignee', width: 130 },
    {
      title: '来源', dataIndex: 'source', key: 'source', width: 110,
      render: s => <Tag color={s === ORDER_SOURCES.ALARM ? 'red' : s === ORDER_SOURCES.INSPECTOR ? 'blue' : 'default'}>{s}</Tag>,
    },
    {
      title: '描述', dataIndex: 'description', key: 'description', width: 200, ellipsis: { showTitle: false },
      render: (text, record) => (
        <span style={{ cursor: 'pointer', color: '#1890ff' }} onClick={() => { setDescContent({ title: record.title, desc: text }); setDescModalOpen(true); }}>{text}</span>
      ),
    },
    { title: '创建时间', dataIndex: 'createTime', key: 'createTime', width: 150 },
    {
      title: '操作', key: 'action', width: isReadOnly ? 100 : 260, align: 'center', fixed: isReadOnly ? undefined : 'right',
      render: isReadOnly
        ? (_, record) => <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => openDrawer(record)}>查看</Button>
        : (_, record) => (
            <Space size={0}>
              <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => openDrawer(record)} style={{ padding: '4px 6px' }}>详情</Button>
              <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)} style={{ padding: '4px 6px' }}>编辑</Button>
              <Popconfirm title="确定删除？" onConfirm={() => handleDelete(record.key)}>
                <Button type="link" danger size="small" icon={<DeleteOutlined />} style={{ padding: '4px 6px' }}>删除</Button>
              </Popconfirm>
            </Space>
          ),
    },
  ];

  // ========== 渲染 ==========

  return (
    <div>
      <Card title={isInspector ? '我的工单 (现场巡检专属)' : '工单全生命周期管理'} bordered={false}
        extra={
          <Space wrap>
            <Select placeholder="状态筛选" allowClear style={{ width: 120 }} value={statusFilter} onChange={setStatusFilter}
              options={Object.values(ORDER_STATUS).map(s => ({ value: s, label: s }))} />
            <Input placeholder="搜索..." prefix={<SearchOutlined />} value={searchText}
              onChange={e => setSearchText(e.target.value)} allowClear style={{ width: 200 }} />
            {!isReadOnly && !isInspector && (
              <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>创建工单</Button>
            )}
          </Space>
        }>
        <Table columns={columns} dataSource={filteredData} pagination={{ pageSize: 10, showTotal: t => `共 ${t} 条` }} scroll={{ x: 1450 }} />
      </Card>

      {/* 创建/编辑工单弹窗 */}
      <Modal title={editingRecord ? '编辑工单' : '创建新工单'} open={isModalOpen} onOk={handleModalOk}
        onCancel={() => setIsModalOpen(false)} width={640} destroyOnClose>
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="title" label="标题" rules={[{ required: true }]}><Input placeholder="工单标题" /></Form.Item>
          <Form.Item name="source" label="来源" rules={[{ required: true }]}>
            <Select options={Object.entries(ORDER_SOURCES).map(([k, v]) => ({ value: v, label: v }))} />
          </Form.Item>
          <Form.Item name="status" label="状态"><Select options={Object.values(ORDER_STATUS).map(s => ({ value: s, label: s }))} /></Form.Item>
          <Form.Item name="type" label="类型"><Select options={[{ value: '维修类', label: '维修类' }, { value: '定期巡检类', label: '定期巡检类' }, { value: '安装类', label: '安装类' }, { value: '咨询类', label: '咨询类' }]} /></Form.Item>
          <Form.Item name="priority" label="优先级"><Select options={[{ value: 'HIGH', label: '高' }, { value: 'NORMAL', label: '中' }, { value: 'LOW', label: '低' }]} /></Form.Item>
          <Form.Item name="assignee" label="指派人">
            <Select placeholder="选择现场巡检员" options={
              (() => {
                try {
                  const users = JSON.parse(localStorage.getItem('ibms_users') || '[]');
                  return users.filter(u => u.role === 'INSPECTOR' && u.active).map(u => ({ value: u.realname, label: u.realname }));
                } catch { return []; }
              })()
            } />
          </Form.Item>
          <Form.Item name="location" label="位置" rules={[{ required: true }]}><Input placeholder="例如: 2号楼A区" /></Form.Item>
          <Form.Item name="creator" label="创建者"><Input placeholder="创建者姓名" /></Form.Item>
          <Form.Item name="description" label="描述"><TextArea rows={3} placeholder="详细描述..." /></Form.Item>
          <Form.Item name="createTime" label="创建时间">
            <DatePicker showTime format="YYYY-MM-DD HH:mm" placeholder="选择创建时间" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="deadline" label="截止时间">
            <DatePicker showTime format="YYYY-MM-DD HH:mm" placeholder="选择截止时间" style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>

      {/* 描述弹窗 */}
      <Modal title={descContent.title} open={descModalOpen} onCancel={() => setDescModalOpen(false)}
        footer={<Button onClick={() => setDescModalOpen(false)}>关闭</Button>} width={560}>
        <p style={{ fontSize: 15, lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{descContent.desc}</p>
      </Modal>

      {/* ========== 工单详情抽屉 ========== */}
      <Drawer title="工单全生命周期追踪" open={drawerOpen} onClose={() => setDrawerOpen(false)} width={560}>
        {drawerRecord && (
          <>
            {/* 状态流转步骤条 */}
            <Steps current={getStepCurrent(drawerRecord.status)} size="small" style={{ marginBottom: 24 }}
              items={ORDER_STEPS.map((s, i) => ({
                title: s.title, description: s.description,
                status: i <= getStepCurrent(drawerRecord.status) ? (i === getStepCurrent(drawerRecord.status) ? 'process' : 'finish') : 'wait',
              }))}
            />

            {/* 基本信息 */}
            <Descriptions bordered size="small" column={2} style={{ marginBottom: 16 }}>
              <Descriptions.Item label="编号">{drawerRecord.id}</Descriptions.Item>
              <Descriptions.Item label="状态"><Tag color={statusColor[drawerRecord.status]}>{drawerRecord.status}</Tag></Descriptions.Item>
              <Descriptions.Item label="优先级"><Tag color={priorityColor[drawerRecord.priority]}>{priorityText[drawerRecord.priority]}</Tag></Descriptions.Item>
              <Descriptions.Item label="来源"><Tag>{drawerRecord.source}</Tag></Descriptions.Item>
              <Descriptions.Item label="类型">{drawerRecord.type}</Descriptions.Item>
              <Descriptions.Item label="位置">{drawerRecord.location}</Descriptions.Item>
              <Descriptions.Item label="创建者">{drawerRecord.creator}</Descriptions.Item>
              <Descriptions.Item label="指派人">{drawerRecord.assignee}</Descriptions.Item>
              <Descriptions.Item label="创建时间" span={2}>{drawerRecord.createTime}</Descriptions.Item>
              <Descriptions.Item label="截止时间" span={2}>
                <Text type={new Date(drawerRecord.deadline) < new Date() && drawerRecord.status !== ORDER_STATUS.CLOSED ? 'danger' : undefined}>
                  {drawerRecord.deadline} {new Date(drawerRecord.deadline) < new Date() && drawerRecord.status !== ORDER_STATUS.CLOSED && <WarningOutlined style={{ color: '#ff4d4f' }} />}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="描述" span={2}>{drawerRecord.description}</Descriptions.Item>
            </Descriptions>

            {/* 复测数据 */}
            {drawerRecord.retestData && (
              <Card title="复测数据" size="small" style={{ marginBottom: 16 }}>
                {Object.entries(drawerRecord.retestData).map(([k, v]) => (
                  <Tag key={k} style={{ marginBottom: 4 }}>{k}: {v}</Tag>
                ))}
              </Card>
            )}

            {/* 照片附件 */}
            {photoList.length > 0 && (
              <Card title="现场照片" size="small" style={{ marginBottom: 16 }}>
                <Space wrap>
                  {photoList.map((p, i) => (
                    <Tag key={i} icon={<CameraOutlined />} color="blue">{p}</Tag>
                  ))}
                </Space>
              </Card>
            )}

            {/* ========== 角色操作面板 ========== */}
            {!isReadOnly && (
              <Card title="操作面板" size="small" style={{ marginBottom: 16 }}>
                <Space wrap>
                  {/* INSPECTOR：待接单 → 接单 */}
                  {isInspector && drawerRecord.status === ORDER_STATUS.PENDING && drawerRecord.assignee === user.realname && (
                    <Button type="primary" icon={<CheckCircleOutlined />} onClick={handleAccept}>确认接单</Button>
                  )}
                  {/* INSPECTOR：处理中 → 处置完毕 */}
                  {isInspector && drawerRecord.status === ORDER_STATUS.PROCESSING && drawerRecord.assignee === user.realname && (
                    <>
                      <Button type="primary" icon={<CheckCircleOutlined />} onClick={handleComplete}>处置完毕，申请验收</Button>
                      <Button icon={<SwapOutlined />} onClick={handleTransferRequest}>申请转派</Button>
                    </>
                  )}
                  {/* INSPECTOR：上传照片 */}
                  {(isInspector || isAdmin) && drawerRecord.status === ORDER_STATUS.PROCESSING && (
                    <Upload showUploadList={false} beforeUpload={handlePhotoUpload} accept="image/*">
                      <Button icon={<UploadOutlined />}>上传现场照片</Button>
                    </Upload>
                  )}
                  {/* CS：待验收 → 验收通过 / 退回 */}
                  {(isCS || isAdmin) && drawerRecord.status === ORDER_STATUS.VERIFYING && (
                    <>
                      <Button type="primary" icon={<CheckCircleOutlined />} onClick={handleVerify}>验收通过，关闭工单</Button>
                      <Button danger icon={<RollbackOutlined />} onClick={handleReject}>验收不通过，退回重处理</Button>
                    </>
                  )}
                  {/* ADMIN/CS 可手动推进状态 */}
                  {(isAdmin) && drawerRecord.status === ORDER_STATUS.PENDING && (
                    <Button type="primary" ghost onClick={handleAccept}>强制接单</Button>
                  )}
                  {(isAdmin) && drawerRecord.status === ORDER_STATUS.PROCESSING && (
                    <Button type="primary" ghost onClick={handleComplete}>强制完成</Button>
                  )}
                </Space>
              </Card>
            )}

            {/* 协同评论流 */}
            <Card title="协同工作流实时评论" size="small">
              <Timeline
                style={{ maxHeight: 250, overflow: 'auto', marginBottom: 12 }}
                items={(drawerRecord.comments || []).map((c, i) => ({
                  color: c.type === 'verify' ? 'green' : c.type === 'reject' ? 'red' : c.type === 'transfer' ? 'orange' : 'blue',
                  children: (
                    <div key={i} style={{ background: '#f9fafb', padding: '8px 12px', borderRadius: 4 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <Text strong>{c.author}</Text>
                        <Text type="secondary" style={{ fontSize: 11 }}>{c.time}</Text>
                      </div>
                      <Text style={{ fontSize: 13 }}>{c.content}</Text>
                    </div>
                  ),
                }))}
              />
              {!isReadOnly && (
                <>
                  <Space.Compact style={{ width: '100%' }}>
                    <TextArea rows={2} value={commentText} onChange={e => setCommentText(e.target.value)} placeholder="发表评论..." />
                  </Space.Compact>
                  <Button type="primary" icon={<SendOutlined />} onClick={submitComment} style={{ marginTop: 8 }} block>
                    提交评论
                  </Button>
                </>
              )}
            </Card>
          </>
        )}
      </Drawer>

      {/* 转派弹窗 */}
      <Modal title="申请转派工单" open={transferModalOpen} onOk={doTransfer}
        onCancel={() => setTransferModalOpen(false)} destroyOnClose>
        <Form form={transferForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="newAssignee" label="转派至" rules={[{ required: true }]}>
            <Select placeholder="选择巡检员" options={[
              { value: '陈巡检-海淀区', label: '陈巡检-海淀区' },
              { value: '周巡检-朝阳区', label: '周巡检-朝阳区' },
            ]} />
          </Form.Item>
          <Form.Item name="reason" label="转派原因" rules={[{ required: true }]}>
            <TextArea rows={3} placeholder="请说明转派原因..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
