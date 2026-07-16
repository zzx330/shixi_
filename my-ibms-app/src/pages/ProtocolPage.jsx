import React, { useState, useEffect } from 'react';
import { fetchProtocols, createProtocol, updateProtocol, deleteProtocol, importProtocols } from '../services/protocolApi';
import {
  Card,
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  InputNumber,
  AutoComplete,
  Tag,
  message,
  Popconfirm,
  Upload,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  DeleteOutlined,
  EditOutlined,
  MinusCircleOutlined,
  CodeOutlined,
  UploadOutlined,
  DownloadOutlined,
} from '@ant-design/icons';

// 协议键名建议项
const PROTOCOL_KEY_OPTIONS = [
  { value: 'ip' },
  { value: 'port' },
  { value: 'shiftLeft' },
  { value: 'protocolType' },
  { value: 'removeFunCode' },
  { value: 'devicePort' },
  { value: 'localIpMaskLen' },
  { value: 'deviceNetworkAddr' },
  { value: 'rack' },
  { value: 'slot' },
];

export default function ProtocolPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [customProtocolNames, setCustomProtocolNames] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [showJsonMode, setShowJsonMode] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [form] = Form.useForm();

  // 初始加载数据（从 API 服务层获取）
  useEffect(() => {
    fetchProtocols().then((result) => {
      setData(result);
      // 从已有数据中提取协议名称
      const names = [...new Set(result.map((d) => d.name))];
      setCustomProtocolNames(names);
      setLoading(false);
    });
  }, []);

  const protocolNameOptions = customProtocolNames.map((n) => ({ value: n }));

  const convertValue = (v) => {
    if (v === 'true') return true;
    if (v === 'false') return false;
    if (v === '' || v === null || v === undefined) return v;
    if (!isNaN(Number(v)) && String(v).trim() !== '') return Number(v);
    return v;
  };

  // ==================== 导入导出 ====================

  // 导出当前数据为 JSON 文件下载
  const handleExport = () => {
    const exportData = data.map(({ key, ...rest }) => rest); // 去掉 key
    const jsonStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `协议配置_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    message.success('导出成功');
  };

  // 打开导入弹窗
  const handleOpenImport = () => {
    setImportText('');
    setImportModalOpen(true);
  };

  // 通过文件选择器导入
  const handleFileImport = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target.result);
        processImport(json);
      } catch {
        message.error('JSON 格式解析失败，请检查文件内容');
      }
    };
    reader.readAsText(file);
    return false; // 阻止 Upload 自动上传
  };

  // 通过文本框粘贴导入
  const handleTextImport = () => {
    if (!importText.trim()) {
      message.warning('请输入 JSON 数据');
      return;
    }
    try {
      const json = JSON.parse(importText);
      processImport(json);
    } catch {
      message.error('JSON 格式解析失败，请检查内容');
    }
  };

  // 核心导入逻辑：支持单个对象或对象数组
  const processImport = (json) => {
    const items = Array.isArray(json) ? json : [json];

    const newItems = [];
    let maxId = data.reduce((max, d) => Math.max(max, d.id), 0);

    for (const item of items) {
      // 必填字段检查
      if (!item.ip && !item.name) {
        message.warning(`第 ${newItems.length + 1} 条缺少 ip 或 name，已跳过`);
        continue;
      }
      maxId++;
      const config = item.config || {};
      // 如果没有 config，从 item 自身的其他字段自动提取（排除已知固定字段）
      const knownFields = ['id', 'ip', 'port', 'name', 'config'];
      const autoConfig = {};
      Object.entries(item).forEach(([k, v]) => {
        if (!knownFields.includes(k) && v !== undefined && v !== null) {
          autoConfig[k] = String(v);
        }
      });

      newItems.push({
        key: String(Date.now() + '_' + maxId),
        id: maxId,
        ip: item.ip || '',
        port: item.port || 0,
        name: item.name || '',
        config: { ...autoConfig, ...config },
      });
    }

    if (newItems.length === 0) {
      message.warning('没有有效数据可导入');
      return;
    }

    importProtocols(newItems).then(() => {
      setData([...data, ...newItems]);
      setImportModalOpen(false);
      setImportText('');
      message.success(`成功导入 ${newItems.length} 条协议`);
    });
  };

  // ==================== 表格列 ====================

  const getColumns = () => [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    { title: 'IP 地址', dataIndex: 'ip', key: 'ip', width: 150 },
    { title: '端口', dataIndex: 'port', key: 'port', width: 80 },
    { title: '协议名称', dataIndex: 'name', key: 'name', width: 130 },
    {
      title: (
        <Space>
          <span>协议配置</span>
          <Button
            type={showJsonMode ? 'primary' : 'default'}
            size="small"
            icon={<CodeOutlined />}
            onClick={() => setShowJsonMode(!showJsonMode)}
            style={{ fontSize: 12 }}
          >
            {showJsonMode ? '切换 Tag' : '切换 JSON'}
          </Button>
        </Space>
      ),
      dataIndex: 'config',
      key: 'config',
      render: (config) => {
        if (showJsonMode) {
          const configObj = {};
          Object.entries(config).forEach(([k, v]) => {
            configObj[k] = convertValue(v);
          });
          return (
            <pre style={{
              margin: 0, fontSize: 12, fontFamily: 'Consolas, Monaco, monospace',
              lineHeight: 1.5, color: '#333', whiteSpace: 'pre-wrap', wordBreak: 'break-all',
            }}>
              {JSON.stringify(configObj, null, 2)}
            </pre>
          );
        }
        return (
          <Space size={[4, 4]} wrap>
            {Object.entries(config).map(([k, v]) => (
              <Tag key={k} color="blue">{k}: {v}</Tag>
            ))}
          </Space>
        );
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
          <Popconfirm title="确定删除该协议？" onConfirm={() => handleDelete(record.key)}>
            <Button type="link" danger size="small" icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // ==================== CRUD ====================

  const filteredData = searchText
    ? data.filter((item) => {
        const s = searchText.toLowerCase();
        return (
          String(item.id).includes(s) || item.ip.toLowerCase().includes(s) ||
          String(item.port).includes(s) || item.name.toLowerCase().includes(s) ||
          JSON.stringify(item.config).toLowerCase().includes(s)
        );
      })
    : data;

  const handleAdd = () => {
    setEditingRecord(null);
    form.resetFields();
    form.setFieldsValue({ config: [{ key: '', value: '' }] });
    setIsModalOpen(true);
  };

  const handleEdit = (record) => {
    setEditingRecord(record);
    form.setFieldsValue({
      ip: record.ip,
      port: record.port,
      name: record.name,
      config: Object.entries(record.config).map(([k, v]) => ({ key: k, value: v })),
    });
    setIsModalOpen(true);
  };

  const handleDelete = (key) => {
    deleteProtocol(key).then(() => {
      setData(data.filter((item) => item.key !== key));
      message.success('协议已删除');
    });
  };

  const handleModalOk = () => {
    form.validateFields().then((values) => {
      const configObj = {};
      values.config.forEach(({ key, value }) => { if (key) configObj[key] = value; });

      if (!customProtocolNames.includes(values.name)) {
        Modal.confirm({
          title: '新协议名称',
          content: `"${values.name}" 不在常用协议列表中，是否将其加入常用协议列表？`,
          okText: '加入',
          cancelText: '暂不',
          onOk: () => setCustomProtocolNames([...customProtocolNames, values.name]),
        });
      }

      if (editingRecord) {
        updateProtocol(editingRecord.key, {
          ip: values.ip, port: values.port, name: values.name, config: configObj,
        }).then(() => {
          setData(data.map((item) =>
            item.key === editingRecord.key
              ? { ...item, ip: values.ip, port: values.port, name: values.name, config: configObj }
              : item
          ));
          message.success('协议已更新');
        });
      } else {
        const newId = Math.max(...data.map((d) => d.id), 0) + 1;
        const newProtocol = {
          key: String(Date.now()),
          id: newId,
          ip: values.ip,
          port: values.port,
          name: values.name,
          config: configObj,
        };
        createProtocol(newProtocol).then(() => {
          setData([...data, newProtocol]);
          message.success('协议已创建');
        });
      }
      setIsModalOpen(false);
    });
  };

  // ==================== 渲染 ====================

  return (
    <div>
      <Card
        title="通信协议管理"
        bordered={false}
        extra={
          <Space wrap>
            <Input
              placeholder="搜索任意属性..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
              style={{ width: 200 }}
            />
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              创建新协议
            </Button>
            <Upload
              accept=".json"
              showUploadList={false}
              beforeUpload={handleFileImport}
            >
              <Button icon={<UploadOutlined />}>导入 JSON</Button>
            </Upload>
            <Button icon={<DownloadOutlined />} onClick={handleExport}>
              导出 JSON
            </Button>
          </Space>
        }
      >
        <Table
          columns={getColumns()}
          dataSource={filteredData}
          loading={loading}
          pagination={{ pageSize: 10, showTotal: (t) => `共 ${t} 条` }}
          scroll={{ x: 700 }}
        />
      </Card>

      {/* 创建/编辑协议弹窗 */}
      <Modal
        title={editingRecord ? '编辑协议' : '创建新协议'}
        open={isModalOpen}
        onOk={handleModalOk}
        onCancel={() => setIsModalOpen(false)}
        width={600}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="ip" label="IP 地址" rules={[{ required: true, message: '请输入 IP 地址' }]}>
            <Input placeholder="例如: 192.168.1.100" />
          </Form.Item>
          <Form.Item name="port" label="端口" rules={[{ required: true, message: '请输入端口号' }]}>
            <InputNumber min={1} max={65535} style={{ width: '100%' }} placeholder="例如: 502" />
          </Form.Item>
          <Form.Item name="name" label="协议名称" rules={[{ required: true, message: '请输入或选择协议名称' }]}>
            <AutoComplete
              placeholder="请输入或选择协议名称"
              options={protocolNameOptions}
              filterOption={(inputValue, option) =>
                option.value.toLowerCase().includes(inputValue.toLowerCase())
              }
            />
          </Form.Item>
          <Form.Item label="协议配置 (Key-Value 键值对)">
            <Form.List name="config">
              {(fields, { add, remove }) => (
                <>
                  {fields.map(({ key, name, ...rest }) => (
                    <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                      <Form.Item {...rest} name={[name, 'key']} rules={[{ required: true, message: '请输入键名' }]} style={{ marginBottom: 0 }}>
                        <AutoComplete
                          placeholder="键名"
                          style={{ width: 200 }}
                          options={PROTOCOL_KEY_OPTIONS}
                          filterOption={(inputValue, option) =>
                            option.value.toLowerCase().includes(inputValue.toLowerCase())
                          }
                          allowClear
                        />
                      </Form.Item>
                      <Form.Item {...rest} name={[name, 'value']} rules={[{ required: true, message: '请输入键值' }]} style={{ marginBottom: 0 }}>
                        <Input placeholder="键值" style={{ width: 180 }} />
                      </Form.Item>
                      {fields.length > 1 && (
                        <MinusCircleOutlined onClick={() => remove(name)} style={{ color: '#ff4d4f', fontSize: 18 }} />
                      )}
                    </Space>
                  ))}
                  <Button type="dashed" onClick={() => add({ key: '', value: '' })} block>
                    + 添加键值对
                  </Button>
                </>
              )}
            </Form.List>
          </Form.Item>
        </Form>
      </Modal>

      {/* 文本粘贴导入弹窗（备选方案，Upload 已覆盖文件导入） */}
      <Modal
        title="批量导入协议 (粘贴 JSON)"
        open={importModalOpen}
        onOk={handleTextImport}
        onCancel={() => setImportModalOpen(false)}
        okText="导入"
        cancelText="取消"
        width={600}
      >
        <p style={{ color: '#888', marginBottom: 12 }}>
          支持格式：单个协议对象 <code>{'{}'}</code> 或协议数组 <code>{'[{}, {}]'}</code>
        </p>
        <Input.TextArea
          rows={12}
          value={importText}
          onChange={(e) => setImportText(e.target.value)}
          placeholder={`[
  {
    "ip": "192.168.1.88",
    "port": 502,
    "name": "Modbus TCP",
    "config": {
      "ip": "192.168.1.88",
      "port": "502",
      "protocolType": "tcp"
    }
  }
]`}
          style={{ fontFamily: 'Consolas, Monaco, monospace', fontSize: 13 }}
        />
      </Modal>
    </div>
  );
}
