import React, { useState, useEffect, useCallback } from 'react';
import { Typography, Spin, notification, Button, Tag } from 'antd';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import { API_URL } from "config";
import { fetchPost } from "utils/fetch";
import dayjs from 'dayjs';
import 'dayjs/locale/pt';

dayjs.locale('pt');
const { Title } = Typography;

export default function EscalaSimulacao() {
    const [loading, setLoading] = useState(false);
    const [dataMap, setDataMap] = useState({});
    const [currentMonth, setCurrentMonth] = useState(dayjs('2026-01-01'));
    // Agora as equipas disponíveis são detectadas automaticamente pela API
    const [availableEquipas, setAvailableEquipas] = useState([]); 
    const [selectedEquipas, setSelectedEquipas] = useState([]);
    const [api, contextHolder] = notification.useNotification();

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

            // Ajustado para os nomes de colunas que o SQL devolve: "Data", "Equipa", "Turno"
            if (response.data && !response.data.error) {
                const mapped = {};
                const equipasSet = new Set();

                response.data.forEach(item => {
                    if (!mapped[item.Data]) mapped[item.Data] = {};
                    mapped[item.Data][item.Equipa] = item.Turno;
                    equipasSet.add(item.Equipa);
                });

                const sortedEquipas = Array.from(equipasSet).sort();
                setDataMap(mapped);
                setAvailableEquipas(sortedEquipas);
                
                // Se for a primeira carga, seleciona todas as equipas
                if (selectedEquipas.length === 0) {
                    setSelectedEquipas(sortedEquipas);
                }
            } else {
                api.error({ message: "Erro SQL", description: response.data?.title });
            }
        } catch (e) {
            api.error({ message: "Erro de Rede", description: e.message });
        } finally {
            setLoading(false);
        }
    }, [currentMonth, api, selectedEquipas.length]);

    useEffect(() => { loadSimulacao(); }, [loadSimulacao]);

    const toggleEquipa = (equipa) => {
        if (selectedEquipas.includes(equipa)) {
            if (selectedEquipas.length === 1) return;
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

    const getTurnoColor = (sigla) => {
        switch (sigla) {
            case 'NOI': return 'text-blue-600';
            case 'DSC': return 'text-red-600';
            case 'MAN': return 'text-green-600';
            case 'TAR': return 'text-orange-600';
            case 'FER': return 'text-purple-600 font-bold';
            case 'GER': return 'text-amber-600';
            case 'R':   return 'text-gray-500';
            default:    return 'text-gray-400';
        }
    };

    const renderCalendarDays = () => {
        const startOfMonth = currentMonth.startOf('month');
        const daysInMonth = currentMonth.daysInMonth();
        const firstDayWeekday = startOfMonth.day();
        const offset = firstDayWeekday === 0 ? 6 : firstDayWeekday - 1;

        const calendarBoxes = [];
        
        for (let i = offset - 1; i >= 0; i--) {
            const prevDay = startOfMonth.subtract(i + 1, 'day');
            calendarBoxes.push(
                <div key={`prev-${i}`} className="min-h-[120px] bg-gray-50 p-2 border-r border-b border-gray-200">
                    <span className="text-xs text-gray-400">{prevDay.date()}</span>
                </div>
            );
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = startOfMonth.date(day).format('YYYY-MM-DD');
            const dayData = dataMap[dateStr] || {};
            const isToday = dayjs().format('YYYY-MM-DD') === dateStr;

            calendarBoxes.push(
                <div key={dateStr} className="min-h-[120px] bg-white p-2 border-r border-b border-gray-200 hover:bg-slate-50 transition-colors">
                    <div className="flex justify-between items-start mb-1">
                        <span className={`text-xs font-semibold ${isToday ? 'w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center' : 'text-gray-500'}`}>
                            {day}
                        </span>
                    </div>
                    
                    <div className="flex flex-col gap-0.5">
                        {selectedEquipas.map(eq => {
                            const turno = dayData[eq];
                            if (!turno) return null;
                            
                            return (
                                <div key={eq} className="text-[10px] leading-tight flex justify-between border-b border-gray-50 pb-0.5">
                                    <span className="text-gray-400 font-medium truncate mr-1">{eq}</span>
                                    <span className={`font-bold ${getTurnoColor(turno)}`}>{turno}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            );
        }

        const totalCells = calendarBoxes.length;
        const remainingCells = Math.ceil(totalCells / 7) * 7 - totalCells;
        for (let i = 1; i <= remainingCells; i++) {
            calendarBoxes.push(
                <div key={`next-${i}`} className="min-h-[120px] bg-gray-50 p-2 border-r border-b border-gray-200">
                    <span className="text-xs text-gray-400">{i}</span>
                </div>
            );
        }
        return calendarBoxes;
    };

    return (
        <div className="min-h-screen bg-slate-50 p-4 lg:p-8">
            {contextHolder}
            
            <div className="max-w-[1600px] mx-auto bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div className="flex flex-col gap-4">
                        <Title level={3} className="!mb-0 !text-slate-800 capitalize">
                            {currentMonth.format('MMMM YYYY')}
                        </Title>
                        
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[11px] uppercase tracking-wider text-gray-400 font-bold">Equipas</span>
                            <Button
                                size="small"
                                type={selectedEquipas.length === availableEquipas.length ? "primary" : "default"}
                                onClick={toggleAllEquipas}
                                className="text-[11px] rounded-md h-7"
                            >
                                Todas
                            </Button>
                            {availableEquipas.map(eq => (
                                <Tag.CheckableTag
                                    key={eq}
                                    checked={selectedEquipas.includes(eq)}
                                    onChange={() => toggleEquipa(eq)}
                                    className={`border border-gray-200 !text-[11px] ${selectedEquipas.includes(eq) ? 'bg-indigo-600 text-white' : 'bg-white'}`}
                                >
                                    {eq}
                                </Tag.CheckableTag>
                            ))}
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <div className="flex items-center bg-gray-100 rounded-lg p-1">
                            <Button type="text" icon={<LeftOutlined />} onClick={() => setCurrentMonth(currentMonth.subtract(1, 'month'))} />
                            <Button type="text" className="font-bold px-4" onClick={() => setCurrentMonth(dayjs())}>Hoje</Button>
                            <Button type="text" icon={<RightOutlined />} onClick={() => setCurrentMonth(currentMonth.add(1, 'month'))} />
                        </div>
                        <Button type="primary" className="bg-indigo-600 hover:bg-indigo-700 h-9 rounded-lg">Exportar Excel</Button>
                    </div>
                </div>

                <Spin spinning={loading} tip="A atualizar escala...">
                    <div className="rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                        <div className="grid grid-cols-7 bg-slate-50 border-b border-gray-200">
                            {['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'].map(day => (
                                <div key={day} className="py-3 text-center border-r last:border-r-0 border-gray-200">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{day}</span>
                                </div>
                            ))}
                        </div>
                        <div className="grid grid-cols-7 bg-gray-200 gap-[1px]">
                            {renderCalendarDays()}
                        </div>
                    </div>
                </Spin>

                {/* Legenda Dinâmica */}
                <div className="mt-8 flex flex-wrap justify-center gap-x-8 gap-y-3 p-4 bg-slate-50 rounded-xl border border-dashed border-gray-300">
                    {[
                        { s: 'MAN', c: 'bg-green-600', l: 'Manhã' },
                        { s: 'TAR', c: 'bg-orange-600', l: 'Tarde' },
                        { s: 'NOI', c: 'bg-blue-600', l: 'Noite' },
                        { s: 'DSC', c: 'bg-red-600', l: 'Folga' },
                        { s: 'FER', c: 'bg-purple-600', l: 'Férias/Feriado' },
                        { s: 'GER', c: 'bg-amber-600', l: 'Geral (Armazém)' }
                    ].map(item => (
                        <div key={item.s} className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${item.c}`}></div>
                            <span className="text-[11px] font-bold text-slate-600">{item.s}</span>
                            <span className="text-[11px] text-slate-400">{item.l}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}