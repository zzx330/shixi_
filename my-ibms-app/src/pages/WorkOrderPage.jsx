import React, { useState, useEffect } from 'react';
import { useAuth } from '../services/auth';
import {
  Card,
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  Tag,
  message,
  Popconfirm,
  Drawer,
  Steps,
  List,
} from 'antd';
import { PlusOutlined, SearchOutlined, DeleteOutlined, EditOutlined, EyeOutlined, SendOutlined } from '@ant-design/icons';
import { loadData, saveData } from '../services/storage';

const STORAGE_KEY = 'ibms_work_orders';

const DEFAULT_DATA = [
  { key: '1', id: 'WO-2026001', title: '2号楼空调机组例行维保', status: '未处理', type: '维修类', location: '2号楼A区', creator: '王工', description: '2号楼东侧大办公室空调制冷效果下降，室内温度升至28℃，需排查制冷系统。', parentOrderId: '', createTime: '2026-07-15 10:30', comments: [] },
  { key: '2', id: 'WO-2026002', title: '配电柜定期巡检', status: '处理中', type: '定期巡检类', location: 'B2配电室', creator: '李工', description: '按月度计划对B2配电室所有配电柜进行例行巡检，检查接线端子、温度等。', parentOrderId: '', createTime: '2026-07-15 09:00', comments: [] },
  { key: '3', id: 'WO-2026003', title: '冷却塔风扇异响排查', status: '已处理', type: '维修类', location: '顶层平台', creator: '赵工', description: '顶层平台冷却塔2号风扇运行时发出异常噪音，需排查轴承或叶片问题。', parentOrderId: 'WO-2026001', createTime: '2026-07-14 16:20', comments: [] },
  { key: '4', id: 'WO-2026004', title: '消防水泵月度测试', status: '已处理', type: '定期巡检类', location: 'B2消防泵房', creator: '孙工', description: '对消防水泵进行月度启动测试，检查出水压力是否达标。', parentOrderId: '', createTime: '2026-07-14 14:00', comments: [] },
];

const statusSteps = [
  { title: '未处理', description: '待接单' },
  { title: '处理中', description: '正在处置' },
  { title: '已处理', description: '待验收' },
];

export default function WorkOrderPage() {
  const { user } = useAuth();
  const isInspector = user.role === 'INSPECTOR';
  const [data, setData] = useState(() => loadData(STORAGE_KEY, DEFAULT_DATA));

  useEffect(() => { saveData(STORAGE_KEY, data); }, [data]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState(undefined);
  const [descModalOpen, setDescModalOpen] = useState(false);
  const [descContent, setDescContent] = useState({ title: '', desc: '' });
  const [form] = Form.useForm();

  // 协作评论抽屉
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerRecord, setDrawerRecord] = useState(null);
  const [commentText, setCommentText] = useState('');

  const statusColor = { '未处理': 'red', '处理中': 'orange', '已处理': 'green' };

  // 打开协作详情抽屉
  const openDrawer = (record) => {
    setDrawerRecord(record);
    setCommentText('');
    setDrawerOpen(true);
  };

  // 获取当前工单在 steps 中的索引
  const getStepCurrent = (status) => {
    const map = { '未处理': 0, '处理中': 1, '已处理': 2 };
    return map[status] !== undefined ? map[status] : 0;
  };

  // 工单状态流转
  const changeStatus = (newStatus, logText) => {
    if (!drawerRecord) return;
    const updated = {
      ...drawerRecord,
      status: newStatus,
      comments: [
        ...(drawerRecord.comments || []),
        { author: '运维工程师', time: new Date().toLocaleTimeString().slice(0, 5), content: logText },
      ],
    };
    setData(data.map(item => item.key === drawerRecord.key ? updated : item));
    setDrawerRecord(updated);
    message.success(`工单状态已更新为「${newStatus}」`);
  };

  // 提交评论
  const submitComment = () => {
    if (!commentText.trim() || !drawerRecord) return;
    const updated = {
      ...drawerRecord,
      comments: [
        ...(drawerRecord.comments || []),
        { author: '运维工程师', time: new Date().toLocaleTimeString().slice(0, 5), content: commentText.trim() },
      ],
    };
    setData(data.map(item => item.key === drawerRecord.key ? updated : item));
    setDrawerRecord(updated);
    setCommentText('');
    message.success('评论已提交');
  };

  const columns = [
    { title: '编号', dataIndex: 'id', key: 'id', width: 120 },
    { title: '标题', dataIndex: 'title', key: 'title', width: 180 },
    { title: '状态', dataIndex: 'status', key: 'status', width: 80, render: (s) => <Tag color={statusColor[s] || 'default'}>{s}</Tag> },
    { title: '类型', dataIndex: 'type', key: 'type', width: 100 },
    { title: '位置', dataIndex: 'location', key: 'location', width: 110 },
    { title: '创建者', dataIndex: 'creator', key: 'creator', width: 80 },
    {
      title: '描述', dataIndex: 'description', key: 'description', width: 250, ellipsis: { showTitle: false },
      render: (text, record) => (
        <span style={{ cursor: 'pointer', color: '#1890ff' }} onClick={() => { setDescContent({ title: record.title, desc: text }); setDescModalOpen(true); }}>{text}</span>
      ),
    },
    { title: '上级工单', dataIndex: 'parentOrderId', key: 'parentOrderId', width: 120, render: (v) => v || '-' },
    { title: '创建时间', dataIndex: 'createTime', key: 'createTime', width: 160 },
    {
      title: '操作', key: 'action', width: 260, align: 'center', fixed: 'right',
      render: (_, record) => (
        <Space size={0}>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => openDrawer(record)} style={{ padding: '4px 8px' }}>详情</Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)} style={{ padding: '4px 8px' }}>编辑</Button>
          <Popconfirm title="确定删除该工单？" onConfirm={() => handleDelete(record.key)}>
            <Button type="link" danger size="small" icon={<DeleteOutlined />} style={{ padding: '4px 8px' }}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // INSPECTOR 只看指派给自己的工单
  const filteredData = data
    .filter((item) => {
      if (isInspector && item.assignee !== user.realname) return false;
      return true;
    })
    .filter((item) => {
      if (statusFilter && item.status !== statusFilter) return false;
      if (searchText) {
        const s = searchText.toLowerCase();
        return item.id.toLowerCase().includes(s) || item.title.toLowerCase().includes(s) || item.type.toLowerCase().includes(s) || item.location.toLowerCase().includes(s) || item.creator.toLowerCase().includes(s) || item.description.toLowerCase().includes(s) || item.parentOrderId.toLowerCase().includes(s);
      }
    return true;
  });

  const handleAdd = () => { setEditingRecord(null); form.resetFields(); form.setFieldsValue({ status: '未处理' }); setIsModalOpen(true); };
  const handleEdit = (record) => { setEditingRecord(record); form.setFieldsValue(record); setIsModalOpen(true); };
  const handleDelete = (key) => { setData(data.filter((item) => item.key !== key)); message.success('工单已删除'); };

  const handleModalOk = () => {
    form.validateFields().then((values) => {
      if (editingRecord) {
        setData(data.map(item => item.key === editingRecord.key ? { ...item, ...values } : item));
        message.success('工单已更新');
      } else {
        const nextNum = data.length + 1;
        const newId = `WO-${new Date().getFullYear()}${String(nextNum).padStart(3, '0')}`;
        setData([...data, { key: String(Date.now()), id: newId, ...values, comments: [], createTime: new Date().toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).replace(/\//g, '-') }]);
        message.success('工单已创建');
      }
      setIsModalOpen(false);
    });
  };

  return (
    <div>
      <Card title="工单管理" bordered={false}
        extra={
          <Space wrap>
            <Select placeholder="按状态筛选" allowClear style={{ width: 120 }} value={statusFilter} onChange={setStatusFilter}
              options={[{ value: '未处理', label: '未处理' }, { value: '处理中', label: '处理中' }, { value: '已处理', label: '已处理' }]} />
            <Input placeholder="搜索工单..." prefix={<SearchOutlined />} value={searchText} onChange={(e) => setSearchText(e.target.value)} allowClear style={{ width: 220 }} />
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>创建新工单</Button>
          </Space>
        }>
        <Table columns={columns} dataSource={filteredData} pagination={{ pageSize: 10 }} scroll={{ x: 1400 }} />
      </Card>

      {/* 创建/编辑工单弹窗 */}
      <Modal title={editingRecord ? '编辑工单' : '创建新工单'} open={isModalOpen} onOk={handleModalOk} onCancel={() => setIsModalOpen(false)} width={640} destroyOnClose>
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="title" label="标题" rules={[{ required: true, message: '请输入工单标题' }]}><Input placeholder="例如: 2号楼空调机组例行维保" /></Form.Item>
          <Form.Item name="status" label="状态" rules={[{ required: true }]}><Select options={[{ value: '未处理', label: '未处理' }, { value: '处理中', label: '处理中' }, { value: '已处理', label: '已处理' }]} /></Form.Item>
          <Form.Item name="type" label="类型" rules={[{ required: true }]}><Select options={[{ value: '维修类', label: '维修类' }, { value: '定期巡检类', label: '定期巡检类' }, { value: '安装类', label: '安装类' }, { value: '咨询类', label: '咨询类' }]} /></Form.Item>
          <Form.Item name="location" label="位置" rules={[{ required: true }]}><Input placeholder="例如: 2号楼A区" /></Form.Item>
          <Form.Item name="creator" label="创建者" rules={[{ required: true }]}><Input placeholder="例如: 王工" /></Form.Item>
          <Form.Item name="description" label="描述"><Input.TextArea rows={3} placeholder="详细描述工单问题..." /></Form.Item>
          <Form.Item name="parentOrderId" label="上级工单编号"><Input placeholder="关联的上级工单编号（可选）" /></Form.Item>
        </Form>
      </Modal>

      {/* 描述查看弹窗 */}
      <Modal title={descContent.title} open={descModalOpen} onCancel={() => setDescModalOpen(false)} footer={<Button onClick={() => setDescModalOpen(false)}>关闭</Button>} width={560}>
        <p style={{ fontSize: 15, lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{descContent.desc}</p>
      </Modal>

      {/* 工单详情与协作评论抽屉 */}
      <Drawer
        title="工单全流程追踪"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={500}
        footer={
          <Space>
            <Button onClick={() => setDrawerOpen(false)}>关闭</Button>
          </Space>
        }
      >
        {drawerRecord && (
          <>
            {/* 状态流转步骤条 */}
            <Steps
              current={getStepCurrent(drawerRecord.status)}
              size="small"
              style={{ marginBottom: 24 }}
              items={statusSteps.map(s => ({
                title: s.title,
                description: s.description,
              }))}
            />

            {/* 工单信息 */}
            <Card size="small" style={{ marginBottom: 16 }}>
              <p><strong>工单编号：</strong>{drawerRecord.id}</p>
              <p><strong>标题：</strong>{drawerRecord.title}</p>
              <p><strong>位置：</strong>{drawerRecord.location}</p>
              <p><strong>创建者：</strong>{drawerRecord.creator}</p>
              <p><strong>描述：</strong>{drawerRecord.description}</p>
              <p><strong>当前状态：</strong><Tag color={statusColor[drawerRecord.status]}>{drawerRecord.status}</Tag></p>
            </Card>

            {/* 状态控制按钮 */}
            <div style={{ marginBottom: 20 }}>
              <Space>
                {drawerRecord.status === '未处理' && (
                  <Button type="primary" onClick={() => changeStatus('处理中', '🔄 工单已接单，开始处理。')}>确认接单并处理</Button>
                )}
                {drawerRecord.status === '处理中' && (
                  <Button type="primary" onClick={() => changeStatus('已处理', '✅ 现场处置完毕，申请验收。')}>处置完毕 (申请验收)</Button>
                )}
                {drawerRecord.status === '已处理' && (
                  <span style={{ color: '#52c41a', fontSize: 13 }}>✔ 该工单已完成全部流程</span>
                )}
              </Space>
            </div>

            {/* 协同评论流 */}
            <Card title="协同工作流实时评论" size="small">
              <List
                dataSource={drawerRecord.comments || []}
                locale={{ emptyText: '暂无评论' }}
                style={{ maxHeight: 250, overflow: 'auto', marginBottom: 12 }}
                renderItem={(c, i) => (
                  <List.Item key={i} style={{ flexDirection: 'column', alignItems: 'flex-start', padding: '8px 12px', background: '#f9fafb', borderRadius: 4, marginBottom: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: 4 }}>
                      <span style={{ fontWeight: 'bold', fontSize: 13 }}>{c.author}</span>
                      <span style={{ fontSize: 11, color: '#999' }}>{c.time}</span>
                    </div>
                    <div style={{ fontSize: 13, color: '#333' }}>{c.content}</div>
                  </List.Item>
                )}
              />
              <Space.Compact style={{ width: '100%' }}>
                <Input.TextArea
                  rows={2}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="发表评论，反馈现场处置进度..."
                  style={{ flex: 1 }}
                />
              </Space.Compact>
              <Button type="primary" icon={<SendOutlined />} onClick={submitComment} style={{ marginTop: 8 }} block>
                提交日志评论
              </Button>
            </Card>
          </>
        )}
      </Drawer>
    </div>
  );
}
