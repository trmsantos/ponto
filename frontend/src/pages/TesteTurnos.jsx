import React, { useState, useEffect, useCallback } from 'react';
import { API_URL } from "config";
import { fetchPost } from "utils/fetch";
import { Table, Card, Tag, Spin, Alert, Typography } from "antd";

const { Title } = Typography;

export default function SimulacaoEscalas({ openNotification }) {
    const [loading, setLoading] = useState(false);
    const [dados, setDados] = useState([]);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetchPost({
                url: `${API_URL}/rponto/sqlp/`,
                withCredentials: true,
                parameters: { 
                    method: "GetEscalasSimulacao",
                    data_inicio: "2026-01-02", 
                    data_fim: "2026-01-25"
                }
            });

            if (response.data.status !== "error") {
                const grouped = response.data.reduce((acc, curr) => {
                    if (!acc[curr.data]) {
                        acc[curr.data] = { 
                            data: curr.data, 
                            dia_semana: curr.dia_semana 
                        };
                    }
                    acc[curr.data][curr.equipa] = curr.horario_real;
                    return acc;
                }, {});
                
                setDados(Object.values(grouped));
            } else {
                openNotification?.("error", 'top', "Erro", response.data.title);
            }
        } catch (e) {
            openNotification?.("error", 'top', "Erro de Conexão", e.message);
        } finally {
            setLoading(false);
        }
    }, [openNotification]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const getTagColor = (turno) => {
        switch (turno) {
            case 'MAN': return 'green';
            case 'TAR': return 'orange';
            case 'NOI': return 'blue';
            case 'DSC': return 'default';
            case 'GER': return 'purple';
            case 'R': return 'magenta';
            default: return 'volcano';
        }
    };

    const columns = [
        {
            title: 'Data',
            dataIndex: 'data',
            key: 'data',
            render: (text, record) => (
                <span><b>{text}</b> <small>({record.dia_semana})</small></span>
            ),
            fixed: 'left',
            width: 150
        },
        {
            title: 'Equipa A',
            dataIndex: 'A',
            key: 'A',
            align: 'center',
            render: (val) => <Tag color={getTagColor(val)}>{val}</Tag>
        },
        {
            title: 'Equipa B',
            dataIndex: 'B',
            key: 'B',
            align: 'center',
            render: (val) => <Tag color={getTagColor(val)}>{val}</Tag>
        },
        {
            title: 'Equipa C',
            dataIndex: 'C',
            key: 'C',
            align: 'center',
            render: (val) => <Tag color={getTagColor(val)}>{val}</Tag>
        },
        {
            title: 'Equipa D',
            dataIndex: 'D',
            key: 'D',
            align: 'center',
            render: (val) => <Tag color={getTagColor(val)}>{val}</Tag>
        },
        {
            title: 'Equipa E',
            dataIndex: 'E',
            key: 'E',
            align: 'center',
            render: (val) => <Tag color={getTagColor(val)}>{val}</Tag>
        }
    ];

    return (
        <div className="p-4 bg-gray-100 min-h-screen">
            <Card className="shadow-md rounded-lg">
                <div className="flex justify-between items-center mb-6">
                    <Title level={3}>Simulador de Escalas Laboração (Janeiro 2026)</Title>
                    <Tag color="blue">Ciclo de 5 Semanas</Tag>
                </div>

                <Alert 
                    message="Modo de Simulação" 
                    description="Estes dados são gerados matematicamente com base nas datas de âncora definidas na base de dados."
                    type="info" 
                    showIcon 
                    className="mb-4"
                />

                <Spin spinning={loading}>
                    <Table 
                        dataSource={dados} 
                        columns={columns} 
                        rowKey="data"
                        pagination={false}
                        bordered
                        size="small"
                        scroll={{ x: 800 }}
                    />
                </Spin>
            </Card>
        </div>
    );
};

