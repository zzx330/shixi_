import React from 'react';
import { Row, Col, Card, Statistic, Table, Tag } from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { loadData } from '../services/storage';

export default function ReportPage() {
  const workOrders = loadData('ibms_work_orders', []);
  const protocols = loadData('ibms_protocols', []);
  const measurePoints = loadData('ibms_measure_points', []);
  const activeAlarms = loadData('ibms_alarm_active', []);
  const endedAlarms = loadData('ibms_alarm_ended', []);

  const totalOrders = workOrders.length;
  const doneOrders = workOrders.filter(o => o.status === '已处理').length;
  const doingOrders = workOrders.filter(o => o.status === '处理中').length;
  const todoOrders = workOrders.filter(o => o.status === '未处理').length;

  // 工单状态分布数据
  const statusData = [
    { key: '1', status: '未处理', count: todoOrders },
    { key: '2', status: '处理中', count: doingOrders },
    { key: '3', status: '已处理', count: doneOrders },
  ];

  // 最近工单
  const recentOrders = workOrders.slice(-5).reverse();

  const statusColor = { '未处理': 'red', '处理中': 'orange', '已处理': 'green' };

  const orderColumns = [
    { title: '编号', dataIndex: 'id', key: 'id', width: 120 },
    { title: '标题', dataIndex: 'title', key: 'title', width: 200, ellipsis: true },
    { title: '状态', dataIndex: 'status', key: 'status', width: 80, render: s => <Tag color={statusColor[s]}>{s}</Tag> },
    { title: '位置', dataIndex: 'location', key: 'location', width: 110 },
    { title: '创建者', dataIndex: 'creator', key: 'creator', width: 80 },
    { title: '时间', dataIndex: 'createTime', key: 'createTime', width: 150 },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, margin: 0 }}>数据统计分析中心 <span style={{ fontSize: 13, fontWeight: 'normal', color: '#888' }}>(决策层专属视图)</span></h1>
        <Button type="primary" onClick={() => {
          const data = { protocols: protocols.length, measurePoints: measurePoints.length, workOrders, activeAlarms: activeAlarms.length, endedAlarms: endedAlarms.length };
          const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
          const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
          a.download = `IBMS报表_${new Date().toISOString().slice(0,10)}.json`; a.click();
        }}>一键导出 (JSON)</Button>
      </div>

      {/* 数据指标卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card bordered={false}>
            <Statistic title="协议接入数" value={protocols.length} prefix={<CheckCircleOutlined />} valueStyle={{ color: '#1890ff' }} suffix="个" />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card bordered={false}>
            <Statistic title="测点总数" value={measurePoints.length} prefix={<CheckCircleOutlined />} valueStyle={{ color: '#52c41a' }} suffix="个" />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card bordered={false}>
            <Statistic title="活跃告警" value={activeAlarms.length} prefix={<CloseCircleOutlined />} valueStyle={{ color: '#ff4d4f' }} suffix="条" />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card bordered={false}>
            <Statistic title="工单总数" value={totalOrders} prefix={<FileTextOutlined />} valueStyle={{ color: '#722ed1' }} suffix="件" />
          </Card>
        </Col>
      </Row>

      {/* 工单状态分布 + 告警趋势模拟 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="工单状态分布" bordered={false}>
            <div style={{ padding: '10px 0' }}>
              {statusData.map(s => (
                <div key={s.key} style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span><Tag color={statusColor[s.status]}>{s.status}</Tag></span>
                    <span style={{ fontWeight: 'bold' }}>{s.count} 件</span>
                  </div>
                  <div style={{ background: '#f0f0f0', borderRadius: 4, height: 20, overflow: 'hidden' }}>
                    <div style={{
                      width: totalOrders ? `${(s.count / totalOrders) * 100}%` : '0%',
                      height: '100%',
                      background: statusColor[s.status] === 'red' ? '#ff4d4f' : statusColor[s.status] === 'orange' ? '#faad14' : '#52c41a',
                      borderRadius: 4,
                      transition: 'width 0.5s',
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="最近工单动态" bordered={false}>
            <Table columns={orderColumns} dataSource={recentOrders} pagination={false} size="small" scroll={{ x: 700 }} />
          </Card>
        </Col>
      </Row>
    </div>
  );
}

// 内联 Button 因为上面用到了
function Button({ type, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '8px 16px',
        borderRadius: 4,
        border: type === 'primary' ? 'none' : '1px solid #d9d9d9',
        background: type === 'primary' ? '#1890ff' : '#fff',
        color: type === 'primary' ? '#fff' : '#333',
        cursor: 'pointer',
        fontSize: 14,
      }}
    >
      {children}
    </button>
  );
}
