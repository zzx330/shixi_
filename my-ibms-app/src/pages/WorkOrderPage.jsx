import React, { useState, useEffect } from 'react';
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
} from 'antd';
import { PlusOutlined, SearchOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { loadData, saveData } from '../services/storage';

const STORAGE_KEY = 'ibms_work_orders';

const DEFAULT_DATA = [
  { key: '1', id: 'WO-2026001', title: '2号楼空调机组例行维保', status: '处理中', type: '维修类', location: '2号楼A区', creator: '王工', description: '2号楼东侧大办公室空调制冷效果下降，室内温度升至28℃，需排查制冷系统。', parentOrderId: '', createTime: '2026-07-15 10:30' },
  { key: '2', id: 'WO-2026002', title: '配电柜定期巡检', status: '未处理', type: '定期巡检类', location: 'B2配电室', creator: '李工', description: '按月度计划对B2配电室所有配电柜进行例行巡检，检查接线端子、温度等。', parentOrderId: '', createTime: '2026-07-15 09:00' },
  { key: '3', id: 'WO-2026003', title: '冷却塔风扇异响排查', status: '已处理', type: '维修类', location: '顶层平台', creator: '赵工', description: '顶层平台冷却塔2号风扇运行时发出异常噪音，需排查轴承或叶片问题。', parentOrderId: 'WO-2026001', createTime: '2026-07-14 16:20' },
  { key: '4', id: 'WO-2026004', title: '消防水泵月度测试', status: '已处理', type: '定期巡检类', location: 'B2消防泵房', creator: '孙工', description: '对消防水泵进行月度启动测试，检查出水压力是否达标。', parentOrderId: '', createTime: '2026-07-14 14:00' },
];

export default function WorkOrderPage() {
  const [data, setData] = useState(() => loadData(STORAGE_KEY, DEFAULT_DATA));

  useEffect(() => { saveData(STORAGE_KEY, data); }, [data]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState(undefined);
  const [form] = Form.useForm();

  const statusColor = {
    '未处理': 'red',
    '处理中': 'orange',
    '已处理': 'green',
  };

  const columns = [
    { title: '编号', dataIndex: 'id', key: 'id', width: 120 },
    { title: '标题', dataIndex: 'title', key: 'title', width: 180 },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (s) => <Tag color={statusColor[s] || 'default'}>{s}</Tag>,
    },
    { title: '类型', dataIndex: 'type', key: 'type', width: 100 },
    { title: '位置', dataIndex: 'location', key: 'location', width: 110 },
    { title: '创建者', dataIndex: 'creator', key: 'creator', width: 70 },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      width: 250,
      ellipsis: true,
    },
    {
      title: '上级工单',
      dataIndex: 'parentOrderId',
      key: 'parentOrderId',
      width: 120,
      render: (v) => v || '-',
    },
    { title: '创建时间', dataIndex: 'createTime', key: 'createTime', width: 160 },
    {
      title: '操作',
      key: 'action',
      width: 180,
      fixed: 'right',
      render: (_, record) => (
        <Space size={0}>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)} style={{ padding: '4px 8px' }}>编辑</Button>
          <Popconfirm title="确定删除该工单？" onConfirm={() => handleDelete(record.key)}>
            <Button type="link" danger size="small" icon={<DeleteOutlined />} style={{ padding: '4px 8px' }}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const filteredData = data.filter((item) => {
    if (statusFilter && item.status !== statusFilter) return false;
    if (searchText) {
      const s = searchText.toLowerCase();
      return (
        item.id.toLowerCase().includes(s) ||
        item.title.toLowerCase().includes(s) ||
        item.type.toLowerCase().includes(s) ||
        item.location.toLowerCase().includes(s) ||
        item.creator.toLowerCase().includes(s) ||
        item.description.toLowerCase().includes(s) ||
        item.parentOrderId.toLowerCase().includes(s)
      );
    }
    return true;
  });

  const handleAdd = () => {
    setEditingRecord(null);
    form.resetFields();
    form.setFieldsValue({ status: '未处理' });
    setIsModalOpen(true);
  };

  const handleEdit = (record) => {
    setEditingRecord(record);
    form.setFieldsValue(record);
    setIsModalOpen(true);
  };

  const handleDelete = (key) => {
    setData(data.filter((item) => item.key !== key));
    message.success('工单已删除');
  };

  const handleModalOk = () => {
    form.validateFields().then((values) => {
      if (editingRecord) {
        setData(
          data.map((item) =>
            item.key === editingRecord.key
              ? { ...item, ...values }
              : item
          )
        );
        message.success('工单已更新');
      } else {
        const nextNum = data.length + 1;
        const newId = `WO-${new Date().getFullYear()}${String(nextNum).padStart(3, '0')}`;
        setData([
          ...data,
          {
            key: String(Date.now()),
            id: newId,
            ...values,
            createTime: new Date().toLocaleString('zh-CN', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
            }).replace(/\//g, '-'),
          },
        ]);
        message.success('工单已创建');
      }
      setIsModalOpen(false);
    });
  };

  return (
    <div>
      <Card
        title="工单管理"
        bordered={false}
        extra={
          <Space wrap>
            <Select
              placeholder="按状态筛选"
              allowClear
              style={{ width: 120 }}
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: '未处理', label: '未处理' },
                { value: '处理中', label: '处理中' },
                { value: '已处理', label: '已处理' },
              ]}
            />
            <Input
              placeholder="搜索工单..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
              style={{ width: 220 }}
            />
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              创建新工单
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={filteredData}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 1300 }}
        />
      </Card>

      <Modal
        title={editingRecord ? '编辑工单' : '创建新工单'}
        open={isModalOpen}
        onOk={handleModalOk}
        onCancel={() => setIsModalOpen(false)}
        width={640}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="title" label="标题" rules={[{ required: true, message: '请输入工单标题' }]}>
            <Input placeholder="例如: 2号楼空调机组例行维保" />
          </Form.Item>
          <Form.Item name="status" label="状态" rules={[{ required: true }]}>
            <Select
              options={[
                { value: '未处理', label: '未处理' },
                { value: '处理中', label: '处理中' },
                { value: '已处理', label: '已处理' },
              ]}
            />
          </Form.Item>
          <Form.Item name="type" label="类型" rules={[{ required: true, message: '请选择工单类型' }]}>
            <Select
              options={[
                { value: '维修类', label: '维修类' },
                { value: '定期巡检类', label: '定期巡检类' },
                { value: '安装类', label: '安装类' },
                { value: '咨询类', label: '咨询类' },
              ]}
            />
          </Form.Item>
          <Form.Item name="location" label="位置" rules={[{ required: true, message: '请输入位置' }]}>
            <Input placeholder="例如: 2号楼A区" />
          </Form.Item>
          <Form.Item name="creator" label="创建者" rules={[{ required: true, message: '请输入创建者' }]}>
            <Input placeholder="例如: 王工" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={3} placeholder="详细描述工单问题..." />
          </Form.Item>
          <Form.Item name="parentOrderId" label="上级工单编号">
            <Input placeholder="关联的上级工单编号（可选）" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
