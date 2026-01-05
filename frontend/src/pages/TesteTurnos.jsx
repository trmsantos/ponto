import React, { useState, useEffect, useCallback } from 'react';
import { Typography, Spin, notification, Button, Tag, Tooltip, Segmented, Card, Space, Divider, Badge } from 'antd';
import { 
    LeftOutlined, 
    RightOutlined, 
    CalendarOutlined,
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

export default function TurnosEquipas() {
    const [loading, setLoading] = useState(false);
    const [escalasData, setEscalasData] = useState([]);
    const [currentMonth, setCurrentMonth] = useState(dayjs('2026-01-01'));
    const [selectedEquipas, setSelectedEquipas] = useState(['A', 'B', 'C', 'D', 'E']);
    const [viewMode, setViewMode] = useState('geral');
    const [api, contextHolder] = notification. useNotification();

    // Cores dos turnos (sem emojis)
    const turnoConfig = {
        'NOI': { 
            bg: 'linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%)',
            bgLight: '#EFF6FF',
            border: '#3B82F6',
            text:  '#1E40AF',
            label: 'Noite',
            hours: '00:00 - 08:00'
        },
        'MAN': { 
            bg: 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
            bgLight: '#ECFDF5',
            border: '#10B981',
            text: '#047857',
            label: 'Manhã',
            hours: '08:00 - 16:00'
        },
        'TAR': { 
            bg: 'linear-gradient(135deg, #D97706 0%, #F59E0B 100%)',
            bgLight: '#FEF3C7',
            border: '#F59E0B',
            text: '#B45309',
            label: 'Tarde',
            hours:  '16:00 - 00:00'
        },
        'DSC': { 
            bg: 'linear-gradient(135deg, #6B7280 0%, #9CA3AF 100%)',
            bgLight: '#F3F4F6',
            border: '#D1D5DB',
            text: '#4B5563',
            label: 'Descanso',
            hours: null
        },
        'REF': { 
            bg: 'linear-gradient(135deg, #7C3AED 0%, #8B5CF6 100%)',
            bgLight: '#F5F3FF',
            border:  '#A78BFA',
            text: '#6D28D9',
            label: 'Reforço',
            hours: 'Variável'
        },
        'FER': { 
            bg: 'linear-gradient(135deg, #DC2626 0%, #EF4444 100%)',
            bgLight: '#FEF2F2',
            border:  '#F87171',
            text: '#B91C1C',
            label: 'Férias',
            hours: null
        }
    };

    // Cores das equipas
    const equipaColors = {
        'A': { bg: '#3B82F6', text: '#FFFFFF' },
        'B': { bg: '#10B981', text: '#FFFFFF' },
        'C': { bg: '#F59E0B', text: '#FFFFFF' },
        'D': { bg:  '#EF4444', text:  '#FFFFFF' },
        'E':  { bg: '#8B5CF6', text: '#FFFFFF' }
    };

    const loadTurnos = useCallback(async () => {
        setLoading(true);
        const start = currentMonth.startOf('month').format('YYYY-MM-DD');
        const end = currentMonth.endOf('month').format('YYYY-MM-DD');

        try {
            const response = await fetchPost({
                url: `${API_URL}/rponto/sqlp/`,
                withCredentials: true,
                parameters: {
                    method: "GetTurnosEquipas",
                    data_inicio: start,
                    data_fim: end
                }
            });

            if (response.data?. success) {
                setEscalasData(response.data. escalas);
                api.success({
                    message:  'Turnos carregados',
                    description: `${response.data.total_dias} dias de ${currentMonth.format('MMMM YYYY')}`,
                    duration: 2,
                    placement: 'bottomRight'
                });
            } else {
                throw new Error(response. data?.error || 'Erro desconhecido');
            }
        } catch (e) {
            api.error({ 
                message: "Erro ao carregar turnos", 
                description:  e.message,
                duration: 4,
                placement: 'topRight'
            });
        } finally {
            setLoading(false);
        }
    }, [currentMonth, api]);

    useEffect(() => { 
        loadTurnos(); 
    }, [currentMonth]);

    const toggleEquipa = (equipa) => {
        if (selectedEquipas.includes(equipa)) {
            if (selectedEquipas.length === 1) {
                api.warning({ 
                    message: 'Atenção', 
                    description: 'Selecione pelo menos uma equipa',
                    duration:  2
                });
                return;
            }
            setSelectedEquipas(selectedEquipas.filter(e => e !== equipa));
        } else {
            setSelectedEquipas([... selectedEquipas, equipa]. sort());
        }
    };

    const getFilteredEquipas = (dayData) => {
        if (! dayData) return { armazem: [], producao: [] };
        
        const armazem = dayData.equipas.filter(eq => 
            eq.esquema === 'Armazem' && 
            selectedEquipas.includes(eq.equipa) &&
            (viewMode === 'geral' || viewMode === 'armazem')
        );
        
        const producao = dayData.equipas. filter(eq => 
            eq.esquema === 'Laboracao_Continua' && 
            selectedEquipas.includes(eq. equipa) &&
            (viewMode === 'geral' || viewMode === 'producao')
        );
        
        return { armazem, producao };
    };

    // Agrupar equipas por turno
    const groupByTurno = (equipas) => {
        const grouped = {};
        equipas.forEach(eq => {
            if (!grouped[eq. turno_sigla]) {
                grouped[eq.turno_sigla] = [];
            }
            grouped[eq.turno_sigla].push(eq. equipa);
        });
        return grouped;
    };

    const renderTurnoGroup = (turnoSigla, equipas, tipo) => {
        const config = turnoConfig[turnoSigla] || turnoConfig['DSC'];
        
        return (
            <Tooltip
                key={`${tipo}-${turnoSigla}`}
                title={
                    <div className="p-1">
                        <div className="font-bold text-sm mb-1">
                            {config.label}
                        </div>
                        {config.hours && (
                            <div className="text-xs text-gray-200 mb-1">
                                <ClockCircleOutlined className="mr-1" />
                                {config. hours}
                            </div>
                        )}
                        <div className="text-xs">
                            Equipas: {equipas.join(', ')}
                        </div>
                    </div>
                }
                placement="top"
            >
                <div 
                    className="flex items-center gap-1 px-1. 5 sm:px-2 py-1 rounded-lg cursor-pointer transition-all hover:scale-105 hover:shadow-lg"
                    style={{ 
                        background: config.bg,
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}
                >
                    <span className="text-white text-[10px] sm:text-xs font-bold">
                        {turnoSigla}
                    </span>
                    <div className="flex -space-x-1">
                        {equipas.map(eq => (
                            <div
                                key={eq}
                                className="w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center text-[8px] sm:text-[10px] font-bold border-2 border-white shadow-sm"
                                style={{ 
                                    backgroundColor:  equipaColors[eq]?.bg || '#6B7280',
                                    color:  equipaColors[eq]?.text || '#FFFFFF'
                                }}
                            >
                                {eq}
                            </div>
                        ))}
                    </div>
                </div>
            </Tooltip>
        );
    };

    const renderCalendarDays = () => {
        const startOfMonth = currentMonth.startOf('month');
        const daysInMonth = currentMonth. daysInMonth();
        const firstDayWeekday = startOfMonth.isoWeekday();
        const offset = firstDayWeekday - 1;

        const calendarBoxes = [];
        const today = dayjs().format('YYYY-MM-DD');
        
        // Dias do mês anterior
        for (let i = offset - 1; i >= 0; i--) {
            const prevDay = startOfMonth.subtract(i + 1, 'day');
            calendarBoxes.push(
                <div key={`prev-${i}`} className="min-h-[120px] sm:min-h-[140px] bg-gray-50 p-1. 5 sm:p-2 border border-gray-100 opacity-50">
                    <span className="text-xs text-gray-300 font-medium">{prevDay.date()}</span>
                </div>
            );
        }

        // Dias do mês atual
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = startOfMonth.date(day).format('YYYY-MM-DD');
            const dayData = escalasData.find(d => d.data === dateStr);
            const isToday = today === dateStr;
            const isWeekend = startOfMonth.date(day).isoWeekday() >= 6;
            const isFeriado = dayData?. equipas?.some(eq => eq.is_feriado);
            const nomeFeriado = dayData?.equipas?.find(eq => eq. nome_feriado)?.nome_feriado;
            
            const { armazem, producao } = getFilteredEquipas(dayData);
            const armazemGrouped = groupByTurno(armazem);
            const producaoGrouped = groupByTurno(producao);

            calendarBoxes.push(
                <div 
                    key={dateStr} 
                    className={`
                        min-h-[120px] sm:min-h-[140px] p-1.5 sm:p-2 border transition-all relative group
                        ${isToday ? 'ring-2 ring-indigo-500 ring-offset-1 sm:ring-offset-2 bg-indigo-50' : 'bg-white'}
                        ${isFeriado ? 'bg-gradient-to-br from-red-50 to-orange-50 border-red-200' : 'border-gray-200'}
                        ${isWeekend && !isFeriado && ! isToday ? 'bg-slate-50' : ''}
                        hover:shadow-xl hover:z-10 hover:border-indigo-300
                    `}
                >
                    {/* Header do dia */}
                    <div className="flex justify-between items-start mb-1 sm:mb-2">
                        <div className="flex items-center gap-1 sm:gap-2">
                            {isToday ?  (
                                <Badge count="HOJE" size="small" style={{ backgroundColor: '#4F46E5', fontSize: '8px' }}>
                                    <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg">
                                        <span className="text-xs sm:text-sm font-bold">{day}</span>
                                    </div>
                                </Badge>
                            ) : (
                                <span className={`
                                    text-base sm:text-lg font-bold 
                                    ${isFeriado ? 'text-red-600' : isWeekend ? 'text-slate-500' : 'text-gray-800'}
                                `}>
                                    {day}
                                </span>
                            )}
                        </div>
                        
                        {isFeriado && (
                            <Tooltip title={nomeFeriado || 'Feriado'}>
                                <Tag color="red" className="! m-0 !text-[8px] sm:!text-[10px] ! px-1 sm:! px-1.5 font-bold cursor-help">
                                    FER
                                </Tag>
                            </Tooltip>
                        )}
                    </div>
                    
                    {/* Conteúdo - Turnos agrupados */}
                    <div className="space-y-1 sm:space-y-2">
                        {/* Armazém */}
                        {Object.keys(armazemGrouped).length > 0 && (
                            <div>
                                {viewMode === 'geral' && (
                                    <div className="flex items-center gap-1 mb-0.5 sm:mb-1">
                                        <HomeOutlined className="text-[8px] sm:text-[10px] text-amber-600" />
                                        <span className="text-[8px] sm:text-[10px] font-bold text-amber-700 uppercase tracking-wide">
                                            Arm
                                        </span>
                                    </div>
                                )}
                                <div className="flex flex-wrap gap-0.5 sm:gap-1">
                                    {Object.entries(armazemGrouped).map(([turno, eqs]) => 
                                        renderTurnoGroup(turno, eqs, 'arm')
                                    )}
                                </div>
                            </div>
                        )}
                        
                        {/* Produção */}
                        {Object.keys(producaoGrouped).length > 0 && (
                            <div>
                                {viewMode === 'geral' && Object.keys(armazemGrouped).length > 0 && (
                                    <Divider className="! my-1" />
                                )}
                                {viewMode === 'geral' && (
                                    <div className="flex items-center gap-1 mb-0.5 sm:mb-1">
                                        <ToolOutlined className="text-[8px] sm:text-[10px] text-blue-600" />
                                        <span className="text-[8px] sm: text-[10px] font-bold text-blue-700 uppercase tracking-wide">
                                            Prod
                                        </span>
                                    </div>
                                )}
                                <div className="flex flex-wrap gap-0.5 sm:gap-1">
                                    {Object.entries(producaoGrouped).map(([turno, eqs]) => 
                                        renderTurnoGroup(turno, eqs, 'prod')
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Sem dados */}
                        {Object.keys(armazemGrouped).length === 0 && Object.keys(producaoGrouped).length === 0 && (
                            <div className="text-center py-2 sm:py-4 text-gray-400">
                                <Text className="text-[10px] sm:text-xs">Sem turnos</Text>
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
                <div key={`next-${i}`} className="min-h-[120px] sm:min-h-[140px] bg-gray-50 p-1.5 sm:p-2 border border-gray-100 opacity-50">
                    <span className="text-xs text-gray-300 font-medium">{i}</span>
                </div>
            );
        }
        
        return calendarBoxes;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-indigo-50 p-2 sm:p-4 md:p-6">
            {contextHolder}
            
            <div className="max-w-[1920px] mx-auto space-y-3 sm:space-y-4">
                {/* Header Card */}
                <Card className="shadow-xl border-0 overflow-hidden" bodyStyle={{ padding: 0 }}>
                    {/* Barra de cor no topo */}
                    <div className="h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
                    
                    <div className="p-3 sm: p-4 md:p-6">
                        <div className="flex flex-col gap-3 sm:gap-4">
                            {/* Linha 1: Título e Navegação */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg">
                                        <CalendarOutlined className="text-white text-lg sm:text-xl" />
                                    </div>
                                    <div>
                                        <Title level={4} className="! mb-0 ! text-slate-800 capitalize ! text-lg sm:! text-xl md:!text-2xl">
                                            {currentMonth.format('MMMM YYYY')}
                                        </Title>
                                        <Text className="text-[10px] sm:text-xs text-gray-500">
                                            Gestão de Turnos por Equipa
                                        </Text>
                                    </div>
                                </div>
                                
                                {/* Navegação do mês */}
                                <div className="flex items-center gap-1">
                                    <Button 
                                        type="text"
                                        icon={<LeftOutlined />} 
                                        onClick={() => setCurrentMonth(currentMonth.subtract(1, 'month'))}
                                        className="hover:! bg-indigo-50"
                                        size="small"
                                    />
                                    <Button 
                                        type="primary"
                                        size="small"
                                        onClick={() => setCurrentMonth(dayjs())}
                                        className="! bg-indigo-500 hover:!bg-indigo-600 ! border-0 !shadow-md ! text-xs"
                                    >
                                        Hoje
                                    </Button>
                                    <Button 
                                        type="text"
                                        icon={<RightOutlined />} 
                                        onClick={() => setCurrentMonth(currentMonth. add(1, 'month'))}
                                        className="hover:!bg-indigo-50"
                                        size="small"
                                    />
                                </div>
                            </div>
                            
                            {/* Linha 2: Filtros */}
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 overflow-x-auto pb-1">
                                {/* Filtro de Vista */}
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <Text className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase">Vista: </Text>
                                    <Segmented
                                        options={[
                                            { label: 'Geral', value: 'geral' },
                                            { label: 'Armazém', value: 'armazem' },
                                            { label:  'Produção', value: 'producao' }
                                        ]}
                                        value={viewMode}
                                        onChange={setViewMode}
                                        size="small"
                                        className="! text-xs"
                                    />
                                </div>
                                
                                <Divider type="vertical" className="!h-6 hidden sm:block" />
                                
                                {/* Filtro de Equipas */}
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <Text className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase">Equipas:</Text>
                                    <Space size={2}>
                                        {['A', 'B', 'C', 'D', 'E'].map(eq => (
                                            <div
                                                key={eq}
                                                onClick={() => toggleEquipa(eq)}
                                                className={`
                                                    w-6 h-6 sm:w-8 sm:h-8 rounded-md sm:rounded-lg flex items-center justify-center 
                                                    text-xs sm: text-sm font-bold cursor-pointer transition-all
                                                    ${selectedEquipas.includes(eq) 
                                                        ? 'shadow-lg scale-105' 
                                                        : 'opacity-40 hover:opacity-70'
                                                    }
                                                `}
                                                style={{ 
                                                    backgroundColor:  selectedEquipas.includes(eq) 
                                                        ? equipaColors[eq]?.bg 
                                                        : '#E5E7EB',
                                                    color: selectedEquipas.includes(eq) 
                                                        ? equipaColors[eq]?. text 
                                                        : '#9CA3AF'
                                                }}
                                            >
                                                {eq}
                                            </div>
                                        ))}
                                    </Space>
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Calendário com scroll horizontal para resoluções baixas */}
                <Spin spinning={loading} tip="A carregar turnos..." size="large">
                    <Card className="shadow-xl border-0 overflow-hidden" bodyStyle={{ padding:  0 }}>
                        {/* Container com scroll horizontal */}
                        <div className="overflow-x-auto">
                            <div className="min-w-[700px]">
                                {/* Cabeçalho dos dias da semana */}
                                <div className="grid grid-cols-7 bg-gradient-to-r from-slate-700 to-slate-800 sticky top-0 z-10">
                                    {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map((day, idx) => (
                                        <div 
                                            key={day} 
                                            className={`
                                                py-2 sm:py-3 text-center
                                                ${idx >= 5 ? 'bg-slate-600/30' : ''}
                                            `}
                                        >
                                            <span className="text-[10px] sm:text-xs font-bold text-white uppercase tracking-wider">
                                                {day}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                                
                                {/* Grid do Calendário */}
                                <div className="grid grid-cols-7">
                                    {renderCalendarDays()}
                                </div>
                            </div>
                        </div>
                        
                        {/* Indicador de scroll (visível só em mobile) */}
                        <div className="sm:hidden bg-gradient-to-r from-transparent via-slate-200 to-transparent h-1" />
                        <div className="sm:hidden text-center py-2 text-[10px] text-slate-400">
                            ← Deslize para ver todos os dias →
                        </div>
                    </Card>
                </Spin>

                {/* Legenda - também responsiva */}
                <Card className="shadow-lg border-0" bodyStyle={{ padding:  '12px 16px' }}>
                    <div className="flex flex-col gap-3">
                        {/* Turnos */}
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                            <Text className="text-[10px] sm:text-xs font-bold text-slate-600 uppercase flex-shrink-0">
                                Turnos: 
                            </Text>
                            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                                {Object.entries(turnoConfig).map(([key, config]) => (
                                    <div key={key} className="flex items-center gap-1. 5">
                                        <div 
                                            className="w-5 h-5 sm:w-6 sm:h-6 rounded-md sm:rounded-lg flex items-center justify-center shadow-sm"
                                            style={{ background: config.bg }}
                                        >
                                            <span className="text-[8px] sm: text-[10px] text-white font-bold">{key}</span>
                                        </div>
                                        <span className="text-[10px] sm: text-xs text-gray-500">{config.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        
                        <Divider className="! my-1" />
                        
                        {/* Equipas */}
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                            <Text className="text-[10px] sm:text-xs font-bold text-slate-600 uppercase flex-shrink-0">
                                Equipas: 
                            </Text>
                            <div className="flex items-center gap-2">
                                {Object.entries(equipaColors).map(([eq, colors]) => (
                                    <div
                                        key={eq}
                                        className="w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold shadow-sm"
                                        style={{ backgroundColor: colors.bg, color: colors.text }}
                                    >
                                        {eq}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}