import React, { useState, useEffect, useCallback } from 'react';
import { Typography, Spin, notification, Button, Tag, Tooltip, Segmented, Card, Space, Divider } from 'antd';
import { 
    LeftOutlined, 
    RightOutlined, 
    CalendarOutlined,
    DownloadOutlined,
    FilterOutlined,
    TeamOutlined,
    ClockCircleOutlined,
    HomeOutlined,
    ToolOutlined
} from '@ant-design/icons';
import { API_URL } from "config";
import { fetchPost } from "utils/fetch";
import dayjs from 'dayjs';
import 'dayjs/locale/pt';
import isoWeek from 'dayjs/plugin/isoWeek';

dayjs.extend(isoWeek);
dayjs.locale('pt');

const { Title, Text } = Typography;

export default function EscalaSimulacao() {
    const [loading, setLoading] = useState(false);
    const [escalasData, setEscalasData] = useState([]);
    const [currentMonth, setCurrentMonth] = useState(dayjs('2026-01-01')); // Começar em Janeiro 2026
    const [selectedEquipas, setSelectedEquipas] = useState(['A', 'B', 'C', 'D', 'E']);
    const [viewMode, setViewMode] = useState('geral'); // 'geral', 'armazem', 'producao'
    const [api, contextHolder] = notification.useNotification();

    // Mapeamento de cores dos turnos - mais suaves e profissionais
    const turnoColors = {
        'NOI': { bg: '#EFF6FF', border: '#BFDBFE', text: '#1E40AF', label: 'Noite'},
        'MAN': { bg: '#ECFDF5', border: '#A7F3D0', text: '#047857', label: 'Manhã'},
        'TAR': { bg: '#FEF3C7', border: '#FCD34D', text: '#D97706', label: 'Tarde'},
        'DSC': { bg: '#F9FAFB', border: '#E5E7EB', text: '#6B7280', label: 'Descanso' },
        'REF': { bg: '#FAF5FF', border: '#E9D5FF', text: '#7C3AED', label: 'Reforço' },
        'FER': { bg: '#FEE2E2', border: '#FECACA', text: '#DC2626', label: 'Feriado'}
    };

    const loadSimulacao = useCallback(async () => {
        setLoading(true);
        const start = currentMonth.startOf('month').format('YYYY-MM-DD');
        const end = currentMonth.endOf('month').format('YYYY-MM-DD');

        try {
            const response = await fetchPost({
                url: `${API_URL}/rponto/sqlp/`,
                withCredentials: true,
                parameters: {
                    method: "GetEscalasSimulacao",
                    data_inicio: start,
                    data_fim: end
                }
            });

            if (response.data && response.data.success) {
                setEscalasData(response.data.escalas);
                
                api.success({
                    message: 'Escalas carregadas',
                    description: `${response.data.total_dias} dias de ${currentMonth.format('MMMM YYYY')}`,
                    duration: 2,
                    placement: 'bottomRight'
                });
            } else {
                throw new Error(response.data?.error || 'Erro desconhecido');
            }
        } catch (e) {
            api.error({ 
                message: "Erro ao carregar escalas", 
                description: e.message,
                duration: 4,
                placement: 'topRight'
            });
        } finally {
            setLoading(false);
        }
    }, [currentMonth, api]);

    useEffect(() => { 
        loadSimulacao(); 
    }, [currentMonth]);

    const toggleEquipa = (equipa) => {
        if (selectedEquipas.includes(equipa)) {
            if (selectedEquipas.length === 1) {
                api.warning({ 
                    message: 'Atenção', 
                    description: 'Mantenha pelo menos uma equipa selecionada',
                    duration: 2,
                    placement: 'topRight'
                });
                return;
            }
            setSelectedEquipas(selectedEquipas.filter(e => e !== equipa));
        } else {
            setSelectedEquipas([...selectedEquipas, equipa].sort());
        }
    };

    const getFilteredEquipas = (dayData) => {
        if (!dayData) return { armazem: [], producao: [] };
        
        const armazem = dayData.equipas.filter(eq => 
            eq.esquema === 'Armazem' && 
            selectedEquipas.includes(eq.equipa) &&
            (viewMode === 'geral' || viewMode === 'armazem')
        );
        
        const producao = dayData.equipas.filter(eq => 
            eq.esquema === 'Laboracao_Continua' && 
            selectedEquipas.includes(eq.equipa) &&
            (viewMode === 'geral' || viewMode === 'producao')
        );
        
        return { armazem, producao };
    };

    const renderTurnoCard = (eq, tipo) => {
        const colors = turnoColors[eq.turno_sigla] || turnoColors['DSC'];
        
        return (
            <Tooltip 
                key={`${tipo}-${eq.equipa}`}
                title={
                    <div className="text-xs space-y-1">
                        <div className="font-bold text-white">
                            {colors.icon} Equipa {eq.equipa} - {colors.label}
                        </div>
                        {eq.hora_inicio && (
                            <div className="text-gray-200">
                                <ClockCircleOutlined className="mr-1" />
                                {eq.hora_inicio.substring(0, 5)} - {eq.hora_fim.substring(0, 5)}
                            </div>
                        )}
                        <div className="text-gray-300 text-[10px]">
                            {tipo === 'arm' ? 'Armazém' : 'Produção'}
                        </div>
                    </div>
                }
                placement="top"
                overlayClassName="custom-tooltip"
            >
                <div 
                    className="flex items-center justify-between px-2 py-1 rounded-md transition-all hover:shadow-md cursor-pointer"
                    style={{ 
                        backgroundColor: colors.bg,
                        borderLeft: `3px solid ${colors.border}`
                    }}
                >
                    <span className="text-xs font-bold" style={{ color: colors.text }}>
                        {eq.equipa}
                    </span>
                    <span className="text-xs font-extrabold" style={{ color: colors.text }}>
                        {eq.turno_sigla}
                    </span>
                </div>
            </Tooltip>
        );
    };

    const renderCalendarDays = () => {
        const startOfMonth = currentMonth.startOf('month');
        const daysInMonth = currentMonth.daysInMonth();
        const firstDayWeekday = startOfMonth.isoWeekday();
        const offset = firstDayWeekday - 1;

        const calendarBoxes = [];
        const today = dayjs().format('YYYY-MM-DD');
        
        // Dias do mês anterior (opacos)
        for (let i = offset - 1; i >= 0; i--) {
            const prevDay = startOfMonth.subtract(i + 1, 'day');
            calendarBoxes.push(
                <div key={`prev-${i}`} className="h-32 bg-gray-50 p-2 border border-gray-100 opacity-40">
                    <span className="text-xs text-gray-400">{prevDay.date()}</span>
                </div>
            );
        }

        // Dias do mês atual
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = startOfMonth.date(day).format('YYYY-MM-DD');
            const dayData = escalasData.find(d => d.data === dateStr);
            const isToday = today === dateStr;
            const isWeekend = startOfMonth.date(day).isoWeekday() >= 6;
            const isFeriado = dayData?.equipas.some(eq => eq.is_feriado);
            
            const { armazem, producao } = getFilteredEquipas(dayData);

            calendarBoxes.push(
                <div 
                    key={dateStr} 
                    className={`
                        h-32 p-2 border transition-all relative overflow-hidden
                        ${isToday ? 'ring-2 ring-indigo-500 bg-indigo-50' : 'bg-white'}
                        ${isFeriado ? 'bg-gradient-to-br from-pink-50 to-pink-100 border-pink-300' : 'border-gray-200'}
                        ${isWeekend && !isFeriado && !isToday ? 'bg-slate-50' : ''}
                        hover:shadow-lg hover:z-10
                    `}
                >
                    {/* Header do dia */}
                    <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-1">
                            {isToday ? (
                                <div className="flex items-center gap-1">
                                    <div className="w-6 h-6 bg-gradient-to-br from-indigo-600 to-indigo-700 text-white rounded-full flex items-center justify-center shadow-md">
                                        <span className="text-xs font-bold">{day}</span>
                                    </div>
                                    <span className="text-[8px] text-indigo-600 font-bold uppercase">Hoje</span>
                                </div>
                            ) : (
                                <span className={`text-sm font-bold ${isFeriado ? 'text-pink-600' : 'text-gray-700'}`}>
                                    {day}
                                </span>
                            )}
                        </div>
                        
                        {isFeriado && (
                            <span className="text-[8px] bg-pink-600 text-white px-1.5 py-0.5 rounded font-bold">
                                FERIADO
                            </span>
                        )}
                    </div>
                    
                    {/* Equipas */}
                    <div className="space-y-1 overflow-y-auto max-h-20">
                        {/* Armazém */}
                        {armazem.length > 0 && (
                            <div className="space-y-0.5">
                                {viewMode === 'geral' && (
                                    <div className="flex items-center gap-1 mb-0.5">
                                        <HomeOutlined className="text-[8px] text-amber-600" />
                                        <span className="text-[8px] font-bold text-amber-700 uppercase">Arm</span>
                                    </div>
                                )}
                                {armazem.map(eq => renderTurnoCard(eq, 'arm'))}
                            </div>
                        )}
                        
                        {/* Produção */}
                        {producao.length > 0 && (
                            <div className="space-y-0.5">
                                {viewMode === 'geral' && armazem.length > 0 && (
                                    <div className="flex items-center gap-1 mb-0.5 mt-1">
                                        <ToolOutlined className="text-[8px] text-blue-600" />
                                        <span className="text-[8px] font-bold text-blue-700 uppercase">Prod</span>
                                    </div>
                                )}
                                {producao.map(eq => renderTurnoCard(eq, 'prod'))}
                            </div>
                        )}
                    </div>
                </div>
            );
        }

        // Dias do próximo mês
        const totalCells = calendarBoxes.length;
        const remainingCells = Math.ceil(totalCells / 7) * 7 - totalCells;
        for (let i = 1; i <= remainingCells; i++) {
            calendarBoxes.push(
                <div key={`next-${i}`} className="h-32 bg-gray-50 p-2 border border-gray-100 opacity-40">
                    <span className="text-xs text-gray-400">{i}</span>
                </div>
            );
        }
        
        return calendarBoxes;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
            {contextHolder}
            
            <div className="max-w-[1920px] mx-auto">
                {/* Header Moderno */}
                <Card className="mb-6 shadow-lg border-0">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                        {/* Título e Info */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-lg">
                                    <CalendarOutlined className="text-white text-2xl" />
                                </div>
                                <div>
                                    <Title level={2} className="!mb-0 !text-slate-800">
                                        {currentMonth.format('MMMM YYYY').toUpperCase()}
                                    </Title>
                                    <Text className="text-sm text-gray-500">
                                        Gestão de Escalas e Turnos
                                    </Text>
                                </div>
                            </div>
                            
                            {/* Filtros de Vista */}
                            <div className="flex flex-wrap items-center gap-3">
                                <Text className="text-xs font-bold text-slate-600 uppercase">Vista:</Text>
                                <Segmented
                                    options={[
                                        { label: 'Geral', value: 'geral', icon: <TeamOutlined /> },
                                        { label: 'Armazém', value: 'armazem', icon: <HomeOutlined /> },
                                        { label: 'Produção', value: 'producao', icon: <ToolOutlined /> }
                                    ]}
                                    value={viewMode}
                                    onChange={setViewMode}
                                    size="middle"
                                />
                                
                                <Divider type="vertical" className="h-8" />
                                
                                <Text className="text-xs font-bold text-slate-600 uppercase">Equipas:</Text>
                                <Space wrap size={[4, 4]}>
                                    {['A', 'B', 'C', 'D', 'E'].map(eq => (
                                        <Tag.CheckableTag
                                            key={eq}
                                            checked={selectedEquipas.includes(eq)}
                                            onChange={() => toggleEquipa(eq)}
                                            className={`
                                                !text-sm !font-bold !px-3 !py-1 !rounded-lg !border-2 transition-all
                                                ${selectedEquipas.includes(eq) 
                                                    ? '!bg-indigo-600 !text-white !border-indigo-600 shadow-md' 
                                                    : '!bg-white !text-slate-600 !border-slate-300 hover:!border-indigo-400'
                                                }
                                            `}
                                        >
                                            {eq}
                                        </Tag.CheckableTag>
                                    ))}
                                </Space>
                            </div>
                        </div>
                        
                        {/* Controlos de Navegação */}
                        <div className="flex flex-col gap-3">
                            <Button.Group size="large">
                                <Button 
                                    icon={<LeftOutlined />} 
                                    onClick={() => setCurrentMonth(currentMonth.subtract(1, 'month'))}
                                >
                                    Anterior
                                </Button>
                                <Button 
                                    type="primary"
                                    onClick={() => setCurrentMonth(dayjs())}
                                    className="bg-gradient-to-r from-indigo-600 to-indigo-700 border-0 min-w-[120px]"
                                >
                                    Mês Atual
                                </Button>
                                <Button 
                                    icon={<RightOutlined />} 
                                    onClick={() => setCurrentMonth(currentMonth.add(1, 'month'))}
                                    iconPosition="end"
                                >
                                    Próximo
                                </Button>
                            </Button.Group>
                            
                            <Button 
                                size="large"
                                icon={<DownloadOutlined />}
                                className="border-2 border-green-600 text-green-600 hover:!bg-green-50 hover:!border-green-700 font-bold"
                            >
                                Exportar Excel
                            </Button>
                        </div>
                    </div>
                </Card>

                {/* Calendário Principal */}
                <Spin spinning={loading} tip="A carregar escalas..." size="large">
                    <Card className="shadow-xl border-0">
                        {/* Cabeçalho dos dias */}
                        <div className="grid grid-cols-7 border-b-2 border-slate-200 mb-2">
                            {['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'].map((day, idx) => (
                                <div 
                                    key={day} 
                                    className={`py-3 text-center ${idx >= 5 ? 'bg-slate-50' : ''}`}
                                >
                                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                        {day}
                                    </span>
                                </div>
                            ))}
                        </div>
                        
                        {/* Grid do Calendário */}
                        <div className="grid grid-cols-7 gap-px bg-slate-200 rounded-lg overflow-hidden">
                            {renderCalendarDays()}
                        </div>
                    </Card>
                </Spin>

                {/* Legenda Compacta */}
                <Card className="mt-6 shadow-lg border-0">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <Text className="text-sm font-bold text-slate-700 uppercase">Legenda:</Text>
                        <Space wrap size={[12, 12]}>
                            {Object.entries(turnoColors).map(([key, val]) => (
                                <div key={key} className="flex items-center gap-2">
                                    <div 
                                        className="w-4 h-4 rounded shadow-sm"
                                        style={{ backgroundColor: val.bg, border: `2px solid ${val.border}` }}
                                    />
                                    <span className="text-xs font-semibold" style={{ color: val.text }}>
                                        {val.icon} {val.label}
                                    </span>
                                </div>
                            ))}
                        </Space>
                    </div>
                </Card>
            </div>
        </div>
    );
}