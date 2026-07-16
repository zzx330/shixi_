import React, { useEffect, useRef } from 'react';
import { Row, Col, Card, Statistic, Table, Tag } from 'antd';
import {
  ApiOutlined,
  AimOutlined,
  SoundOutlined,
  AlertOutlined,
  ArrowUpOutlined,
} from '@ant-design/icons';

// 简易折线图组件（纯 SVG 实现，不依赖额外库）
function SimpleLineChart({ data1, data2, labels, title }) {
  const width = 500;
  const height = 260;
  const padding = { top: 20, right: 20, bottom: 40, left: 50 };

  const allValues = [...data1, ...data2];
  const maxVal = Math.max(...allValues, 10);
  const minVal = 0;
  const range = maxVal - minVal || 1;

  const xStep =
    (width - padding.left - padding.right) / (labels.length - 1 || 1);

  const scaleY = (v) =>
    padding.top + (1 - (v - minVal) / range) * (height - padding.top - padding.bottom);
  const scaleX = (i) => padding.left + i * xStep;

  const polyline1 = data1
    .map((v, i) => `${i === 0 ? 'M' : 'L'}${scaleX(i)},${scaleY(v)}`)
    .join(' ');
  const polyline2 = data2
    .map((v, i) => `${i === 0 ? 'M' : 'L'}${scaleX(i)},${scaleY(v)}`)
    .join(' ');

  const yTicks = 5;
  const yGrid = Array.from({ length: yTicks }, (_, i) => {
    const val = minVal + (range / (yTicks - 1)) * i;
    return { val: Math.round(val), y: scaleY(val) };
  });

  return (
    <Card title={title} bordered={false} style={{ height: '100%' }}>
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', maxWidth: 500 }}>
        {/* Y轴网格线 */}
        {yGrid.map((t, i) => (
          <g key={i}>
            <line
              x1={padding.left}
              y1={t.y}
              x2={width - padding.right}
              y2={t.y}
              stroke="#f0f0f0"
              strokeWidth={1}
            />
            <text x={padding.left - 8} y={t.y + 4} textAnchor="end" fontSize={11} fill="#999">
              {t.val}
            </text>
          </g>
        ))}
        {/* X轴标签 */}
        {labels.map((l, i) => (
          <text
            key={i}
            x={scaleX(i)}
            y={height - 10}
            textAnchor="middle"
            fontSize={11}
            fill="#999"
          >
            {l}
          </text>
        ))}
        {/* 折线1 - 监听记录 */}
        <path d={polyline1} fill="none" stroke="#1890ff" strokeWidth={2} />
        {data1.map((v, i) => (
          <circle key={'c1-' + i} cx={scaleX(i)} cy={scaleY(v)} r={3} fill="#1890ff" />
        ))}
        {/* 折线2 - 告警记录 */}
        <path d={polyline2} fill="none" stroke="#ff4d4f" strokeWidth={2} />
        {data2.map((v, i) => (
          <circle key={'c2-' + i} cx={scaleX(i)} cy={scaleY(v)} r={3} fill="#ff4d4f" />
        ))}
        {/* 图例 */}
        <rect x={width - 170} y={8} width={10} height={10} fill="#1890ff" rx={2} />
        <text x={width - 155} y={17} fontSize={11} fill="#333">监听记录数</text>
        <rect x={width - 90} y={8} width={10} height={10} fill="#ff4d4f" rx={2} />
        <text x={width - 75} y={17} fontSize={11} fill="#333">告警记录数</text>
      </svg>
    </Card>
  );
}

export default function HomePage() {
  // 模拟数据（已脱敏）
  const stats = {
    protocolCount: 8,
    totalPoints: 186,
    activePoints: 165,
    activeAlarms: 3,
  };

  // 最近7天趋势数据
  const chartLabels = ['7/9', '7/10', '7/11', '7/12', '7/13', '7/14', '7/15'];
  const listenData = [78, 92, 105, 113, 128, 136, 142];
  const alarmData = [2, 4, 1, 5, 3, 4, 3];

  // 最近工单
  const recentOrders = [
    { key: '1', id: 'WO-2026001', title: '2号楼空调机组例行维保', status: '处理中', type: '维修类', location: '2号楼A区', creator: '王工', time: '2026-07-15 10:30' },
    { key: '2', id: 'WO-2026002', title: '配电柜定期巡检', status: '未处理', type: '定期巡检类', location: 'B2配电室', creator: '李工', time: '2026-07-15 09:00' },
    { key: '3', id: 'WO-2026003', title: '冷却塔风扇异响排查', status: '已处理', type: '维修类', location: '顶层平台', creator: '赵工', time: '2026-07-14 16:20' },
    { key: '4', id: 'WO-2026004', title: '消防水泵月度测试', status: '已处理', type: '定期巡检类', location: 'B2消防泵房', creator: '孙工', time: '2026-07-14 14:00' },
    { key: '5', id: 'WO-2026005', title: '新风系统滤网更换', status: '未处理', type: '维修类', location: '3号楼机房', creator: '刘工', time: '2026-07-14 11:00' },
    { key: '6', id: 'WO-2026006', title: '电梯年检保养', status: '已处理', type: '定期巡检类', location: '全楼层', creator: '陈工', time: '2026-07-13 15:30' },
  ];

  const statusColor = { '未处理': 'red', '处理中': 'orange', '已处理': 'green' };

  const orderColumns = [
    { title: '标题', dataIndex: 'title', key: 'title', width: 200, ellipsis: true },
    { title: '编号', dataIndex: 'id', key: 'id', width: 110 },
    { title: '状态', dataIndex: 'status', key: 'status', width: 70, render: (s) => <Tag color={statusColor[s] || 'default'}>{s}</Tag> },
    { title: '类型', dataIndex: 'type', key: 'type', width: 85 },
    { title: '位置', dataIndex: 'location', key: 'location', width: 90 },
    { title: '创建者', dataIndex: 'creator', key: 'creator', width: 55 },
    { title: '时间', dataIndex: 'time', key: 'time', width: 140 },
  ];

  return (
    <div>
      {/* 上方四大统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card bordered={false} hoverable>
            <Statistic
              title="接入协议数"
              value={stats.protocolCount}
              prefix={<ApiOutlined />}
              suffix="个"
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card bordered={false} hoverable>
            <Statistic
              title="点位总数 (物理+逻辑)"
              value={stats.totalPoints}
              prefix={<AimOutlined />}
              suffix="个"
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card bordered={false} hoverable>
            <Statistic
              title="活跃监听点位"
              value={stats.activePoints}
              prefix={<SoundOutlined />}
              suffix={`/ ${stats.totalPoints}`}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card bordered={false} hoverable>
            <Statistic
              title="当前告警数"
              value={stats.activeAlarms}
              prefix={<AlertOutlined />}
              suffix="条"
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 下方：折线图 + 工单列表 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <SimpleLineChart
            title="监听记录与告警记录趋势 (近7天)"
            data1={listenData}
            data2={alarmData}
            labels={chartLabels}
          />
        </Col>
        <Col xs={24} lg={12}>
          <Card title="最近事件工单" bordered={false} style={{ height: '100%' }}>
            <Table
              columns={orderColumns}
              dataSource={recentOrders}
              pagination={false}
              size="small"
              scroll={{ x: 750, y: 230 }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
