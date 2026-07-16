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
  InputNumber,
  message,
  Popconfirm,
  Tag,
} from 'antd';
import { PlusOutlined, SearchOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { loadData, saveData } from '../services/storage';

const STORAGE_KEY = 'ibms_measure_points';

const DEFAULT_DATA = [
  { key: '1', id: 1, registerName: '一层大厅环境温度', registerAddress: '40001', category: 'Modbus TCP', valueType: 'float', readWriteType: 'R/W', precision: 1, scaleFactor: 1.0, unit: '℃', protocolId: 1, location: '1层大厅' },
  { key: '2', id: 2, registerName: '冷水机组运行状态', registerAddress: '30001', category: 'BACnet/IP', valueType: 'boolean', readWriteType: 'R', precision: 0, scaleFactor: 1.0, unit: '-', protocolId: 2, location: 'B2冷冻机房' },
  { key: '3', id: 3, registerName: '配电柜电流A相', registerAddress: 'ns=2;s=Current.L1', category: 'OPC UA', valueType: 'float', readWriteType: 'R', precision: 2, scaleFactor: 0.01, unit: 'A', protocolId: 3, location: 'B2配电室' },
  { key: '4', id: 4, registerName: '冷却塔风扇启停控制', registerAddress: '00001', category: 'Modbus TCP', valueType: 'boolean', readWriteType: 'R/W', precision: 0, scaleFactor: 1.0, unit: '-', protocolId: 1, location: '顶层平台' },
  { key: '5', id: 5, registerName: '消防水泵出口压力', registerAddress: '40005', category: 'Modbus TCP', valueType: 'float', readWriteType: 'R', precision: 2, scaleFactor: 0.1, unit: 'MPa', protocolId: 1, location: 'B2消防泵房' },
];

export default function MeasurePointPage() {
  const [data, setData] = useState(() => loadData(STORAGE_KEY, DEFAULT_DATA));

  useEffect(() => { saveData(STORAGE_KEY, data); }, [data]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [categoryFilter, setCategoryFilter] = useState(undefined);
  const [form] = Form.useForm();

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 50 },
    { title: '寄存器名', dataIndex: 'registerName', key: 'registerName', width: 150 },
    { title: '寄存器地址', dataIndex: 'registerAddress', key: 'registerAddress', width: 150 },
    {
      title: '类别',
      dataIndex: 'category',
      key: 'category',
      width: 110,
      render: (c) => <Tag color="blue">{c}</Tag>,
    },
    { title: '值类型', dataIndex: 'valueType', key: 'valueType', width: 80 },
    { title: '读写类型', dataIndex: 'readWriteType', key: 'readWriteType', width: 90 },
    { title: '精度', dataIndex: 'precision', key: 'precision', width: 60 },
    { title: '比例系数', dataIndex: 'scaleFactor', key: 'scaleFactor', width: 90 },
    { title: '单位', dataIndex: 'unit', key: 'unit', width: 60 },
    { title: '协议编号', dataIndex: 'protocolId', key: 'protocolId', width: 90 },
    { title: '位置', dataIndex: 'location', key: 'location', width: 120 },
    {
      title: '操作',
      key: 'action',
      width: 200,
      align: 'center',
      fixed: 'right',
      render: (_, record) => (
        <Space size={0}>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)} style={{ padding: '4px 8px' }}>编辑</Button>
          <Popconfirm title="确定删除该测点？" onConfirm={() => handleDelete(record.key)}>
            <Button type="link" danger size="small" icon={<DeleteOutlined />} style={{ padding: '4px 8px' }}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // 筛选
  const filteredData = data.filter((item) => {
    if (categoryFilter && item.category !== categoryFilter) return false;
    if (searchText) {
      const s = searchText.toLowerCase();
      return (
        item.registerName.toLowerCase().includes(s) ||
        item.registerAddress.toLowerCase().includes(s) ||
        item.category.toLowerCase().includes(s) ||
        item.valueType.toLowerCase().includes(s) ||
        item.location.toLowerCase().includes(s) ||
        String(item.protocolId).includes(s)
      );
    }
    return true;
  });

  const categories = [...new Set(data.map((d) => d.category))];

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
    message.success('测点已删除');
  };

  const handleModalOk = () => {
    form.validateFields().then((values) => {
      if (editingRecord) {
        setData(
          data.map((item) =>
            item.key === editingRecord.key ? { ...item, ...values } : item
          )
        );
        message.success('测点已更新');
      } else {
        const newId = Math.max(...data.map((d) => d.id), 0) + 1;
        setData([...data, { key: String(Date.now()), id: newId, ...values }]);
        message.success('测点已创建');
      }
      setIsModalOpen(false);
    });
  };

  return (
    <div>
      <Card
        title="测点管理"
        bordered={false}
        extra={
          <Space wrap>
            <Select
              placeholder="按类别筛选"
              allowClear
              style={{ width: 150 }}
              value={categoryFilter}
              onChange={setCategoryFilter}
              options={categories.map((c) => ({ value: c, label: c }))}
            />
            <Input
              placeholder="搜索任意属性..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
              style={{ width: 220 }}
            />
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              创建新测点
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={filteredData}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 1100 }}
        />
      </Card>

      <Modal
        title={editingRecord ? '编辑测点' : '创建新测点'}
        open={isModalOpen}
        onOk={handleModalOk}
        onCancel={() => setIsModalOpen(false)}
        width={640}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="registerName"
            label="寄存器名"
            rules={[{ required: true, message: '请输入寄存器名' }]}
          >
            <Input placeholder="例如: 一层大厅环境温度" />
          </Form.Item>
          <Form.Item
            name="registerAddress"
            label="寄存器地址"
            rules={[{ required: true, message: '请输入寄存器地址' }]}
          >
            <Input placeholder="例如: 40001" />
          </Form.Item>
          <Form.Item
            name="category"
            label="类别"
            rules={[{ required: true, message: '请选择类别' }]}
          >
            <Select placeholder="选择协议类别" options={categories.map((c) => ({ value: c, label: c }))} />
          </Form.Item>
          <Form.Item
            name="valueType"
            label="值类型"
            rules={[{ required: true, message: '请选择值类型' }]}
          >
            <Select
              options={[
                { value: 'string', label: 'string' },
                { value: 'boolean', label: 'boolean' },
                { value: 'int', label: 'int' },
                { value: 'float', label: 'float' },
                { value: 'double', label: 'double' },
              ]}
            />
          </Form.Item>
          <Form.Item
            name="readWriteType"
            label="读写类型"
            rules={[{ required: true, message: '请选择读写类型' }]}
          >
            <Select options={[{ value: 'R', label: 'R (只读)' }, { value: 'W', label: 'W (只写)' }, { value: 'R/W', label: 'R/W (读写)' }]} />
          </Form.Item>
          <Form.Item name="precision" label="精度 (小数位数)">
            <InputNumber min={0} max={10} style={{ width: '100%' }} placeholder="例如: 2" />
          </Form.Item>
          <Form.Item name="scaleFactor" label="比例系数">
            <InputNumber min={0} step={0.01} style={{ width: '100%' }} placeholder="例如: 1.0" />
          </Form.Item>
          <Form.Item name="unit" label="单位">
            <Input placeholder="例如: ℃, kW, A" />
          </Form.Item>
          <Form.Item name="protocolId" label="协议编号">
            <InputNumber min={1} style={{ width: '100%' }} placeholder="关联的协议 ID" />
          </Form.Item>
          <Form.Item name="location" label="位置">
            <Input placeholder="例如: 1层大厅" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
