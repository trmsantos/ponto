from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.views import APIView
from rest_framework.response import Response
from datetime import datetime, timedelta
import openpyxl
from openpyxl.styles import Font, Alignment
from django.http import HttpResponse


def exporta_excel_registos(request, registos, cols):
    registos_export = agrupar_picagens_por_turno(registos)

    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Picagens"

    headers = [v['title'] if isinstance(v, dict) else v for v in cols.values()]
    ws.append(headers)

    for cell in ws[1]:
        cell.font = Font(bold=True)
        cell.alignment = Alignment(horizontal='center')


    for row in registos_export:
        ws.append([row.get(k, '') for k in cols.keys()])

    response = HttpResponse(
        content=openpyxl.writer.excel.save_virtual_workbook(wb),
        content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )
    response['Content-Disposition'] = f'attachment; filename=registos_picagens.xlsx'
    return response

    
def agrupar_picagens_por_turno(registos):
    agrupados = []
    for registo in registos:
        picagens = []
        for i in range(1, 9):
            ss_key = f'ss_{i:02d}'
            ty_key = f'ty_{i:02d}'
            ss_val = registo.get(ss_key)
            ty_val = registo.get(ty_key)
            if ss_val:
                # string para datetime se for preciso
                dt_pic = ss_val if isinstance(ss_val, datetime) else datetime.strptime(ss_val, '%Y-%m-%d %H:%M:%S')
                picagens.append({'dt': dt_pic, 'tipo': (ty_val or '').strip(), 'ordem': i})
        if not picagens:
            agrupados.append(registo)
            continue

        picagens = sorted(picagens, key=lambda x: x['dt'])

        entrada = picagens[0]['dt']
        saida = picagens[-1]['dt'] if len(picagens) > 1 else None

        if len(picagens) > 1:
            if entrada.hour >= 23 and saida and 0 <= saida.hour < 8 and (saida - entrada) < timedelta(hours=12):
                data_turno = saida.date()  
            elif saida and 23 <= saida.hour <= 23 and entrada.hour >= 16 and (saida - entrada) < timedelta(hours=12):
                data_turno = entrada.date()  
            elif saida and saida.hour == 0 and entrada.hour >= 16 and (saida - entrada) < timedelta(hours=12):
                data_turno = entrada.date()
            else:
                data_turno = entrada.date()
        else:
            data_turno = entrada.date()

        registo['data_turno'] = data_turno.strftime('%Y-%m-%d')
        registo['hora_entrada'] = picagens[0]['dt'].strftime('%H:%M:%S')
        registo['hora_saida'] = picagens[-1]['dt'].strftime('%H:%M:%S') if len(picagens) > 1 else ''
        if len(picagens) > 1:
            entrada_dt = picagens[0]['dt']
            saida_dt = picagens[-1]['dt']
            if saida_dt < entrada_dt:
                saida_dt += timedelta(days=1)
            duracao = (saida_dt - entrada_dt).total_seconds() / 3600
            registo['duracao_turno'] = f"{duracao:.2f}h"
        else:
            registo['duracao_turno'] = ''
        agrupados.append(registo)
    return agrupados


