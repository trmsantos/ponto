import React, { useState, useEffect, useCallback } from 'react';
import { Typography, Spin, notification, Button, Tag, Tooltip, Badge } from 'antd';
import { 
    LeftOutlined, 
    RightOutlined, 
    CalendarOutlined,
    DownloadOutlined,
    FilterOutlined,
    CheckCircleOutlined
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
    const [currentMonth, setCurrentMonth] = useState(dayjs());
    const [availableEquipas, setAvailableEquipas] = useState([]);
    const [selectedEquipas, setSelectedEquipas] = useState([]);
    const [showLegend, setShowLegend] = useState(true);
    const [api, contextHolder] = notification.useNotification();

    // Mapeamento de cores dos turnos
    const turnoColors = {
        'NOI': { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', dot: 'bg-blue-500' },
        'MAN': { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', dot: 'bg-green-500' },
        'TAR': { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', dot: 'bg-orange-500' },
        'DSC': { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-500', dot: 'bg-gray-400' },
        'REF': { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', dot: 'bg-purple-500' },
        'FER': { bg: 'bg-pink-50', border: 'border-pink-200', text: 'text-pink-700', dot: 'bg-pink-500' },
        'GER': { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', dot: 'bg-amber-500' }
    };

    const getTurnoStyle = (sigla) => turnoColors[sigla] || turnoColors['DSC'];

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
                
                // Extrair equipas únicas
                const equipasSet = new Set();
                response.data.escalas.forEach(dia => {
                    dia.equipas.forEach(eq => equipasSet.add(eq.equipa));
                });
                
                const sortedEquipas = Array.from(equipasSet).sort();
                setAvailableEquipas(sortedEquipas);
                
                // Selecionar todas na primeira carga
                if (selectedEquipas.length === 0) {
                    setSelectedEquipas(sortedEquipas);
                }

                api.success({
                    message: 'Escalas carregadas',
                    description: `${response.data.total_dias} dias carregados com sucesso`,
                    duration: 2
                });
            } else {
                throw new Error(response.data?.error || 'Erro desconhecido');
            }
        } catch (e) {
            api.error({ 
                message: "Erro ao carregar escalas", 
                description: e.message,
                duration: 4
            });
        } finally {
            setLoading(false);
        }
    }, [currentMonth, api, selectedEquipas.length]);

    useEffect(() => { 
        loadSimulacao(); 
    }, [currentMonth]);

    const toggleEquipa = (equipa) => {
        if (selectedEquipas.includes(equipa)) {
            if (selectedEquipas.length === 1) {
                api.warning({ message: 'Mantenha pelo menos uma equipa selecionada', duration: 2 });
                return;
            }
            setSelectedEquipas(selectedEquipas.filter(e => e !== equipa));
        } else {
            setSelectedEquipas([...selectedEquipas, equipa].sort());
        }
    };

    const toggleAllEquipas = () => {
        if (selectedEquipas.length === availableEquipas.length) {
            setSelectedEquipas([availableEquipas[0]]);
        } else {
            setSelectedEquipas(availableEquipas);
        }
    };

    const renderCalendarDays = () => {
        const startOfMonth = currentMonth.startOf('month');
        const endOfMonth = currentMonth.endOf('month');
        const daysInMonth = currentMonth.daysInMonth();
        
        // ISO: Segunda = 1, Domingo = 7
        const firstDayWeekday = startOfMonth.isoWeekday(); // 1-7
        const offset = firstDayWeekday - 1; // Quantos dias vazios antes do dia 1

        const calendarBoxes = [];
        const today = dayjs().format('YYYY-MM-DD');
        
        // Dias do mês anterior (cinza)
        for (let i = offset - 1; i >= 0; i--) {
            const prevDay = startOfMonth.subtract(i + 1, 'day');
            calendarBoxes.push(
                <div key={`prev-${i}`} className="min-h-[140px] bg-gradient-to-br from-gray-50 to-gray-100 p-3 border border-gray-100 rounded-lg opacity-40">
                    <span className="text-xs text-gray-400 font-medium">{prevDay.date()}</span>
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

            calendarBoxes.push(
                <div 
                    key={dateStr} 
                    className={`
                        min-h-[140px] p-3 border rounded-lg transition-all duration-200 
                        hover:shadow-lg hover:scale-[1.02] cursor-pointer
                        ${isToday ? 'ring-2 ring-indigo-500 shadow-md bg-gradient-to-br from-indigo-50 to-white' : 'bg-white border-gray-200'}
                        ${isFeriado ? 'bg-gradient-to-br from-pink-50 to-white border-pink-200' : ''}
                        ${isWeekend && !isFeriado ? 'bg-gradient-to-br from-slate-50 to-white' : ''}
                    `}
                >
                    {/* Cabeçalho do dia */}
                    <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                            {isToday ? (
                                <div className="flex items-center gap-1.5">
                                    <div className="w-7 h-7 bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-full flex items-center justify-center shadow-sm">
                                        <span className="text-xs font-bold">{day}</span>
                                    </div>
                                    <Badge status="processing" />
                                </div>
                            ) : (
                                <span className={`text-sm font-semibold ${isFeriado ? 'text-pink-600' : 'text-gray-700'}`}>
                                    {day}
                                </span>
                            )}
                        </div>
                        
                        {isFeriado && (
                            <Tooltip title={dayData.equipas.find(eq => eq.nome_feriado)?.nome_feriado}>
                                <Tag color="pink" className="text-[9px] px-1.5 py-0">Feriado</Tag>
                            </Tooltip>
                        )}
                    </div>
                    
                    {/* Turnos das equipas */}
                    <div className="flex flex-col gap-1.5">
                        {dayData && selectedEquipas.map(equipaLetra => {
                            const equipaData = dayData.equipas.find(eq => eq.equipa === equipaLetra);
                            if (!equipaData) return null;
                            
                            const style = getTurnoStyle(equipaData.turno_sigla);
                            
                            return (
                                <Tooltip 
                                    key={equipaLetra}
                                    title={
                                        <div className="text-xs">
                                            <div className="font-bold mb-1">{equipaData.turno_nome}</div>
                                            {equipaData.hora_inicio && (
                                                <div className="text-gray-300">
                                                    {equipaData.hora_inicio} - {equipaData.hora_fim}
                                                </div>
                                            )}
                                            <div className="text-gray-400 mt-1 text-[10px]">
                                                {equipaData.esquema.replace('_', ' ')}
                                            </div>
                                        </div>
                                    }
                                    placement="right"
                                >
                                    <div className={`
                                        flex items-center justify-between gap-2 px-2 py-1.5 rounded-md border
                                        ${style.bg} ${style.border} transition-all hover:shadow-sm
                                    `}>
                                        <div className="flex items-center gap-1.5">
                                            <div className={`w-1.5 h-1.5 rounded-full ${style.dot}`}></div>
                                            <span className="text-[10px] font-bold text-gray-600">{equipaLetra}</span>
                                        </div>
                                        <span className={`text-[11px] font-extrabold ${style.text}`}>
                                            {equipaData.turno_sigla}
                                        </span>
                                    </div>
                                </Tooltip>
                            );
                        })}
                    </div>
                </div>
            );
        }

        // Dias do próximo mês (cinza)
        const totalCells = calendarBoxes.length;
        const remainingCells = Math.ceil(totalCells / 7) * 7 - totalCells;
        for (let i = 1; i <= remainingCells; i++) {
            calendarBoxes.push(
                <div key={`next-${i}`} className="min-h-[140px] bg-gradient-to-br from-gray-50 to-gray-100 p-3 border border-gray-100 rounded-lg opacity-40">
                    <span className="text-xs text-gray-400 font-medium">{i}</span>
                </div>
            );
        }
        
        return calendarBoxes;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 lg:p-8">
            {contextHolder}
            
            <div className="max-w-[1800px] mx-auto">
                {/* Header Card */}
                <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 mb-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                        {/* Título e Filtros */}
                        <div className="flex flex-col gap-4 flex-1">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
                                    <CalendarOutlined className="text-white text-lg" />
                                </div>
                                <div>
                                    <Title level={3} className="!mb-0 !text-slate-800 capitalize">
                                        {currentMonth.format('MMMM YYYY')}
                                    </Title>
                                    <Text className="text-xs text-gray-500">
                                        Calendário de Escalas • {selectedEquipas.length} equipas selecionadas
                                    </Text>
                                </div>
                            </div>
                            
                            {/* Filtro de Equipas */}
                            <div className="flex flex-wrap items-center gap-2 p-4 bg-slate-50 rounded-xl border border-slate-200">
                                <div className="flex items-center gap-2">
                                    <FilterOutlined className="text-slate-400" />
                                    <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Equipas:</span>
                                </div>
                                
                                <Button
                                    size="small"
                                    type={selectedEquipas.length === availableEquipas.length ? "primary" : "default"}
                                    onClick={toggleAllEquipas}
                                    icon={<CheckCircleOutlined />}
                                    className="rounded-lg h-8"
                                >
                                    {selectedEquipas.length === availableEquipas.length ? 'Desmarcar Todas' : 'Todas'}
                                </Button>
                                
                                <div className="h-6 w-px bg-slate-300"></div>
                                
                                {availableEquipas.map(eq => (
                                    <Tag.CheckableTag
                                        key={eq}
                                        checked={selectedEquipas.includes(eq)}
                                        onChange={() => toggleEquipa(eq)}
                                        className={`
                                            !border-2 !text-xs !font-bold !px-3 !py-1 !rounded-lg transition-all
                                            ${selectedEquipas.includes(eq) 
                                                ? '!bg-gradient-to-r from-indigo-500 to-indigo-600 !text-white !border-indigo-600 shadow-md' 
                                                : '!bg-white !text-slate-600 !border-slate-300 hover:!border-indigo-400'
                                            }
                                        `}
                                    >
                                        {eq}
                                    </Tag.CheckableTag>
                                ))}
                            </div>
                        </div>
                        
                        {/* Controlos de Navegação */}
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-2">
                                <Button.Group>
                                    <Button 
                                        icon={<LeftOutlined />} 
                                        onClick={() => setCurrentMonth(currentMonth.subtract(1, 'month'))}
                                        className="h-10"
                                    />
                                    <Button 
                                        type="primary"
                                        onClick={() => setCurrentMonth(dayjs())}
                                        className="bg-gradient-to-r from-indigo-500 to-indigo-600 h-10 px-6 font-bold"
                                    >
                                        Hoje
                                    </Button>
                                    <Button 
                                        icon={<RightOutlined />} 
                                        onClick={() => setCurrentMonth(currentMonth.add(1, 'month'))}
                                        className="h-10"
                                    />
                                </Button.Group>
                            </div>
                            
                            <Button 
                                type="default"
                                icon={<DownloadOutlined />}
                                className="h-10 rounded-lg border-2 border-green-500 text-green-600 hover:!bg-green-50 hover:!border-green-600 font-bold"
                            >
                                Exportar Excel
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Calendário */}
                <Spin spinning={loading} tip="A carregar escalas..." size="large">
                    <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
                        {/* Cabeçalho dos dias da semana */}
                        <div className="grid grid-cols-7 bg-gradient-to-r from-slate-100 via-slate-50 to-slate-100 border-b-2 border-slate-200">
                            {['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'].map((day, idx) => (
                                <div 
                                    key={day} 
                                    className={`
                                        py-4 text-center border-r last:border-r-0 border-slate-200
                                        ${idx >= 5 ? 'bg-slate-100' : ''}
                                    `}
                                >
                                    <span className="text-[11px] font-black text-slate-600 uppercase tracking-widest">
                                        {day}
                                    </span>
                                </div>
                            ))}
                        </div>
                        
                        {/* Grid do Calendário */}
                        <div className="grid grid-cols-7 gap-2 p-2 bg-slate-50">
                            {renderCalendarDays()}
                        </div>
                    </div>
                </Spin>

                {/* Legenda */}
                {showLegend && (
                    <div className="mt-6 bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <Text className="text-sm font-bold text-slate-700 uppercase tracking-wider">Legenda de Turnos</Text>
                            <Button size="small" type="text" onClick={() => setShowLegend(false)}>Ocultar</Button>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                            {[
                                { s: 'MAN', l: 'Manhã', h: '08:00 - 16:00' },
                                { s: 'TAR', l: 'Tarde', h: '16:00 - 00:00' },
                                { s: 'NOI', l: 'Noite', h: '00:00 - 08:00' },
                                { s: 'DSC', l: 'Descanso', h: 'Folga' },
                                { s: 'REF', l: 'Reforço', h: 'Variável' },
                                { s: 'FER', l: 'Feriado', h: 'Não laborado' }
                            ].map(item => {
                                const style = getTurnoStyle(item.s);
                                return (
                                    <div key={item.s} className={`flex flex-col gap-2 p-3 rounded-xl border-2 ${style.border} ${style.bg}`}>
                                        <div className="flex items-center gap-2">
                                            <div className={`w-3 h-3 rounded-full ${style.dot} shadow-sm`}></div>
                                            <span className={`text-sm font-extrabold ${style.text}`}>{item.s}</span>
                                        </div>
                                        <div>
                                            <div className="text-xs font-bold text-slate-700">{item.l}</div>
                                            <div className="text-[10px] text-slate-500">{item.h}</div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
                
                {!showLegend && (
                    <div className="mt-4 text-center">
                        <Button size="small" type="link" onClick={() => setShowLegend(true)}>
                            Mostrar Legenda
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}