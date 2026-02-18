import base64
from operator import eq
from pyexpat import features
import re
from io import BytesIO
from typing import List
from wsgiref.util import FileWrapper
from rest_framework.generics import ListAPIView, RetrieveAPIView, CreateAPIView
from rest_framework.views import APIView
from django.http import Http404, request
from rest_framework.response import Response
from .decorators import jwt_required
from django.http.response import HttpResponse
from django.http import FileResponse
from django.contrib.auth.mixins import LoginRequiredMixin
from rest_framework import status
import mimetypes
import pytz
from datetime import datetime, timedelta, date
# import cups
import os, tempfile
import pickle
import glob
import pathlib
import random

from pyodbc import Cursor, Error, connect, lowercase
from django.http.response import JsonResponse
from rest_framework.decorators import api_view, authentication_classes, permission_classes, renderer_classes
from django.db import connections, transaction
from support.database import encloseColumn, Filters, DBSql, TypeDml, fetchall, Check
from support.myUtils import  ifNull

from rest_framework.renderers import JSONRenderer, MultiPartRenderer, BaseRenderer
from rest_framework.utils import encoders, json
from rest_framework.authentication import SessionAuthentication, BasicAuthentication
from rest_framework.permissions import IsAuthenticated
import collections
import hmac
import hashlib
import math
from django.core.files.storage import FileSystemStorage
from sistema.settings.appSettings import AppSettings
import time
import requests
import psycopg2
from api.exports import export
import face_recognition
from PIL import Image, ImageEnhance, ImageOps, ImageFilter
import openpyxl
from openpyxl.styles import Font, Alignment, PatternFill, Border, Side
from openpyxl.utils import get_column_letter
from openpyxl import load_workbook
import pandas as pd
import traceback
import threading
import shutil

connGatewayName = "postgres"
connMssqlName = "sqlserver"
connSage100cName = "sage100c"
dbsage100c = DBSql(connections[connSage100cName].alias)
dbgw = DBSql(connections[connGatewayName].alias)
db = DBSql(connections["default"].alias)
dbmssql = DBSql(connections[connMssqlName].alias)

fotos_base_path = '../fotos'
records_base_path = '../records'
records_invalid_base_path = '../records_invalid'
faces_base_path = 'faces'
cropped_faces_base_path = 'cropped_faces'
tolerance = 0.45
jitters = 1
model = 'large'


def filterMulti(data, parameters, forceWhere=True, overrideWhere=False, encloseColumns=True, logicOperator="and"):
    p = {}
    txt = ''
    _forceWhere = forceWhere
    _overrideWhere = overrideWhere
    hasFilters = False
    for mainKey, mainValue in parameters.items():
        if (hasFilters):
            _forceWhere = False
            _overrideWhere = logicOperator
        if data.get(mainKey) is not None:
            sp = {}
            for key in mainValue.get('keys'):
                table = f'{mainValue.get("table")}.' if (mainValue.get("table") and encloseColumns) else mainValue.get("table", '')
                field = f'{table}"{key}"' if encloseColumns else f'{table}{key}'
                sp[key] = {"value": data.get(mainKey).lower(), "field": f'lower({field})'}
            f = Filters(data)
            f.setParameters(sp, True)
            f.where(_forceWhere, _overrideWhere)
            f.auto()
            f.value('or')
            p = {**p, **f.parameters}
            txt = f'{txt}{f.text}'
            if (not hasFilters):
                hasFilters = f.hasFilters
    return {"hasFilters": hasFilters, "text": txt, "parameters": p}

def rangeP(data, key, field, fieldDiff=None,pName=None):
    ret = {}
    if data is None:
        return ret
    if isinstance(key, list):
        hasNone = False
        for i, v in enumerate(data):
            if v is not None:
                ret[f'{pName}{key[i]}_{i}'] = {"key": key[i], "value": v, "field": field}
            else:
                hasNone = True
        if hasNone == False and len(data)==2 and fieldDiff is not None:
            ret[f'{pName}{key[0]}_{key[1]}'] = {"key": key, "value": ">=0", "field": fieldDiff}
    else:    
        for i, v in enumerate(data):
            if v is not None:
                ret[f'{pName}{key}_{i}'] = {"key": key, "value": v, "field": field}
    return ret

def rangeP2(data, key, field1, field2, fieldDiff=None):
    ret = {}
    field=False
    if data is None:
        return ret
    if isinstance(key, list):
        hasNone = False
        for i, v in enumerate(data):
            if v is not None:
                ret[f'{key[i]}_{i}'] = {"key": key[i], "value": v, "field": field1 if field is False else field2}
            else:
                hasNone = True
        if hasNone == False and len(data)==2 and fieldDiff is not None:
            ret[f'{key[0]}_{key[1]}'] = {"key": key, "value": ">=0", "field": fieldDiff}
    else:    
        for i, v in enumerate(data):
            if v is not None:
                ret[f'{key}_{i}'] = {"key": key, "value": v, "field": field1 if field is False else field2}
    return ret

def get_client_ip(request):
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR',None)
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR',None)
        if not ip:
            ip = request.META.get('HTTP_X_REAL_IP', None)
    return ip


@api_view(['POST'])
@renderer_classes([JSONRenderer])
def Sql(request, format=None):
    ips_allowed = ["*","192.168.0.254"]
    #ip_address = request.META.get("HTTP_X_REAL_IP")
    if "*" not in ips_allowed and ip_address not in ips_allowed:
        return Response({"status": "error", "title": "Erro de acesso!"})
    if "parameters" in request.data and "method" in request.data["parameters"]:
        method=request.data["parameters"]["method"]
        func = globals()[method]
        response = func(request, format)
        return response
    return Response({})


@api_view(['POST'])
@renderer_classes([JSONRenderer])
@permission_classes([IsAuthenticated])
@jwt_required
def SqlProtected(request):
    if "parameters" in request.data and "method" in request.data["parameters"]:
        method=request.data["parameters"]["method"]
        func = globals()[method]
        response = func(request, format)
        return response
    return Response({})

@api_view(['GET'])
@renderer_classes([JSONRenderer])
def Sync(request, format=None):
    faces = loadFaces(faces_base_path,True)
    return Response({"status":"success","nums":faces.get("nums"),"matrix":faces.get("matrix")})

def EmployeesLookup(request, format=None):
    connection = connections[connMssqlName].cursor()
    f = Filters(request.data['filter'])
    f.setParameters({}, True)
    f.where()
    f.auto()
    f.value()

    fmulti = filterMulti(request.data['filter'], {
        'fmulti': {"keys": ['REFNUM_0', "FULLNAME"], "table": 'T.'}
    }, False, "and" if f.hasFilters else "where" ,False)
    parameters = {**f.parameters, **fmulti['parameters']}

    dql = dbmssql.dql(request.data, False)
    cols = f"""*"""
    dql.columns=encloseColumn(cols,False)
    dql.sort = " ORDER BY(SELECT NULL) " if not dql.sort else dql.sort #Obrigatório se PAGING em sqlserver
    sql = lambda p, c, s: (
        f"""  
            select * from (
            select DISTINCT e.REFNUM_0, NAM_0,SRN_0, CONCAT(SRN_0,' ',NAM_0) FULLNAME FROM x3peoplesql.PEOPLELTEK.EMPLOID e 
            JOIN x3peoplesql.PEOPLELTEK.EMPLOCTR c on c.REFNUM_0 = e.REFNUM_0 
            WHERE c.PROPRF_0 = 'STD' 
            ) T
            {f.text} {fmulti["text"]}
            {s(dql.sort)}
             {p(dql.paging)} {p(dql.limit)}
        """
    )
    if ("export" in request.data["parameters"]):
        dql.limit=f"""OFFSET 0 ROWS FETCH NEXT {request.data["parameters"]["limit"]} ROWS ONLY"""
        dql.paging=""
        return export(sql(lambda v:v,lambda v:v,lambda v:v), db_parameters=parameters, parameters=request.data["parameters"],conn_name=AppSettings.reportConn["sage"],dbi=dbmssql,conn=connection)
    try:
        response = dbmssql.executeList(sql, connection, parameters,[],None,f"""
            select * from (
            select DISTINCT e.REFNUM_0, NAM_0,SRN_0, CONCAT(SRN_0,' ',NAM_0) FULLNAME FROM x3peoplesql.PEOPLELTEK.EMPLOID e 
            JOIN x3peoplesql.PEOPLELTEK.EMPLOCTR c on c.REFNUM_0 = e.REFNUM_0 
            WHERE c.PROPRF_0 = 'STD' 
            ) T
            {f.text} {fmulti["text"]}
        """)
    except Exception as error:
        print(str(error))
        return Response({"status": "error", "title": str(error)})
    return Response(response)

#CHANGED
def loadFaces(path,sync=False):
    if os.path.isfile(os.path.join("faces.dictionary")) and sync==False:
        with open('faces.dictionary', 'rb') as faces_file:
            return pickle.load(faces_file)
    else:
        faces ={"nums": []}
        for filename in os.listdir(path):
            processedimage = preProcessImage(os.path.join(path, filename)).save(os.path.join(cropped_faces_base_path,filename),"JPEG")
            ki = face_recognition.load_image_file(os.path.join(cropped_faces_base_path,filename))
            #f = os.path.join(path, filename)
            #if os.path.isfile(f):
            #    ki = face_recognition.load_image_file(f)
            matrix=face_recognition.face_encodings(ki,None,jitters,model)
            if matrix and len(matrix)>0:
                faces.get("nums").append({"num":filename.split('_')[0],"t_stamp":datetime.today(),"file":filename,"matrix":matrix[0]})
        with open('faces.dictionary', 'wb') as faces_file:
            pickle.dump(faces, faces_file)
        return faces

def getBiggestFace(face_locations):
    max_size = 0
    max_location = None
    for location in face_locations:
        top, right, bottom, left = location
        size = (bottom - top) * (right - left)
        if size > max_size:
            max_size = size
            max_location = location
    return max_location

def preProcessImage(filepath,radius=None,brightness_factor=None):
    #f = os.path.join(faces_base_path, filename)
    if os.path.isfile(filepath):
        image = face_recognition.load_image_file(filepath)
        face_locations = face_recognition.face_locations(image)
        if face_locations and len(face_locations) > 0:
            top, right, bottom, left = getBiggestFace(face_locations)
            #top, right, bottom, left = face_locations[0]
            # Crop the face from the image
            face_image = Image.fromarray(image[top:bottom, left:right])
            gray_image = face_image.convert('L')
            equalized_image = ImageOps.equalize(gray_image)
            if radius is not None:
                equalized_image = equalized_image.filter(ImageFilter.GaussianBlur(radius))
            
            if (brightness_factor is None):
                return equalized_image.convert("RGB")
            else:
                #average_pixel = int(sum(list(blurred_image.getdata())) / len(list(blurred_image.getdata())))
                gamma_corrected_image = ImageEnhance.Brightness(equalized_image).enhance(1.5)
                return gamma_corrected_image.convert("RGB")
                
    

@api_view(['GET'])
@renderer_classes([JSONRenderer])
def SimulateRecordAdd(request, format=None):
    #for testes only to remove from here
    connection = connections[connMssqlName].cursor()
    num ="F00030"
    record = processRecord(num,datetime(2022, 1, 19, 23, 00,00)) #saveRecord("F00160",datetime(2023, 3, 3, 13, 44,00),None,{"type":"in","timestamp":datetime.today().strftime("%Y-%m-%d %H:%M:%S")})
    #reg = [{"id":242,"num":"F00030","dt":"2022-01-20","dts":"2022-01-20","nt":2,"ts_01":"2022-01-019 23:50:03","ss_01":"2022-01-019 23:50:03","ty_01":"in","ts_02":None,"ss_02":None,"ty_02":None,"ts_03":None,"ss_03":None,"ty_03":None,"ts_04":None,"ss_04":None,"ty_04":None,"ts_05":None,"ss_05":None,"ty_05":None,"ts_06":None,"ss_06":None,"ty_06":None,"ts_07":None,"ss_07":None,"ty_07":None,"ts_08":None,"ss_08":None,"ty_08":None,"status":1}]
    #n_records = 8
    #for n in reversed(range(8)):
    #    if reg[0].get(f"ss_{str(n+1).zfill(2)}") is None:
    #        n_records = n_records -1
    print(record)
    # if record.get("date_ref") is not None:
    #     f = Filters({"num": num,"dts": record.get("date_ref").strftime("%Y-%m-%d") })
    #     f.where()
    #     f.add(f'num = :num', True)
    #     f.add(f'dts = :dts', True)
    #     f.value("and")
    #     reg = dbmssql.executeSimpleList(lambda: (f'SELECT * from rponto.dbo.time_registration {f.text}'), connection, f.parameters)['rows']
        
    return Response({"record":record})

def processRecord(num, ts):
    connection = connections[connSage100cName].cursor()
    sql = f"""
        SELECT F1.NFUNC, F1.NOME, F1.DEPARTAMENTO, F1.CALENDARIO
        FROM TRIMTEK_1GEP.dbo.FUNC1 F1
        WHERE F1.NFUNC = '{num}' AND F1.DEMITIDO = 0
    """
    print(f"[DEBUG processRecord] Procurando num='{num}' (string interpolation) em FUNC1")
    try:
        connection.execute(sql)
        row = connection.fetchone()
        print("[DEBUG processRecord] Row:", row)
        if row:
            nfunc, nome, departamento, calendario = row
            return {
                "date_ref": ts.strftime("%Y-%m-%d"),
                "nfunc": nfunc,
                "nome": nome,
                "dep": departamento,
                "tp_hor": calendario
            }
        else:
            print(f"[DEBUG processRecord] NÃO ENCONTROU {num} em FUNC1!")
            return {
                "date_ref": ts.strftime("%Y-%m-%d"),
                "nfunc": None,
                "dep": None,
                "tp_hor": None
            }
    except Exception as error:
        print("[ERROR processRecord]:", error)
        return {
            "date_ref": ts.strftime("%Y-%m-%d"),
            "nfunc": None,
            "dep": None,
            "tp_hor": None
        }
    finally:
        connection.close()


def saveRecord(num, ts, hsh, data, ip):
    pln = processRecord(num, ts)
    connection = connections[connMssqlName].cursor()
    dep = pln.get("dep")
    tp_hor = pln.get("tp_hor")

    if hsh is None:
        f = Filters({"num": num, "dts": pln.get("date_ref")})
        f.where()
        f.add(f'num = :num', True)
        f.add(f'dts = :dts', True)
        f.value("and")
        reg = dbmssql.executeSimpleList(lambda: (f'SELECT * from rponto.dbo.time_registration {f.text}'), connection, f.parameters)['rows']
        if len(reg) == 0:
            dti = {
                "num": f.parameters["num"],
                "nt": 1,
                "hsh": hashlib.md5(f"""{f.parameters["num"]}-{ts.strftime("%Y-%m-%d")}""".encode('utf-8')).hexdigest(),
                "dts": pln.get("date_ref"),
                "dt": pln.get("date_ref"),
                f"ss_01": ts.strftime("%Y-%m-%d %H:%M:%S"),
                f"ts_01": data["timestamp"],
                f"ty_01": "in",
                f"auto_01": 1 if data.get("auto") else 0,
                f"source_01": ip,
                "dep": dep,
                "tp_hor": tp_hor
            }
            dml = dbmssql.dml(TypeDml.INSERT, dti, "rponto.dbo.time_registration", None, None, False)
            dbmssql.execute(dml.statement, connection, dml.parameters)
            return {"status": "success", "hsh": dti.get("hsh")}
        else:
            nt = reg[0].get("nt")
            if nt == 8:
                raise Exception("Atingiu o número máximo de registos! Por favor entre em contacto com os Recursos Humanos.")
            dti = {
                "nt": nt + 1,
                f"ss_{str(nt+1).zfill(2)}": ts.strftime("%Y-%m-%d %H:%M:%S"),
                f"ts_{str(nt+1).zfill(2)}": data["timestamp"],
                f"ty_{str(nt+1).zfill(2)}": "in" if reg[0].get(f"ty_{str(nt).zfill(2)}") == "out" else "out",
                f"auto_{str(nt+1).zfill(2)}": 1 if data.get("auto") else 0,
                f"source_{str(nt+1).zfill(2)}": ip,
                "dep": dep,
                "tp_hor": tp_hor
            }
            f = Filters({"num": num, "hsh": reg[0].get("hsh")})
            f.where()
            f.add(f'num = :num', True)
            f.add(f'hsh = :hsh', True)
            f.value("and")
            dml = dbmssql.dml(TypeDml.UPDATE, dti, "rponto.dbo.time_registration", f.parameters, None, False)
            dbmssql.execute(dml.statement, connection, dml.parameters)
            return {"status": "success", "hsh": reg[0].get("hsh")}
    else:
        f = Filters({"num": num, "hsh": hsh})
        f.where()
        f.add(f'num = :num', True)
        f.add(f'hsh = :hsh', True)
        f.value("and")
        reg = dbmssql.executeSimpleList(lambda: (f'SELECT * from rponto.dbo.time_registration {f.text}'), connection, f.parameters)['rows']
        if len(reg) > 0:
            nt = reg[0].get("nt")
            dti = {f"ty_{str(nt).zfill(2)}": data.get("type"), "dep": dep, "tp_hor": tp_hor}
            dml = dbmssql.dml(TypeDml.UPDATE, dti, "rponto.dbo.time_registration", f.parameters, None, False)
            dbmssql.execute(dml.statement, connection, dml.parameters)
            return {"status": "success"}



@api_view(['GET'])
@renderer_classes([JSONRenderer])
def PreProcessImages(request, format=None):
    faces ={}
    for filename in os.listdir(faces_base_path):
        image = preProcessImage(os.path.join(faces_base_path, filename))
        image.save(f"{cropped_faces_base_path}/{filename}")
    return Response({"status":"success"})

def getConfig():
    if os.path.isfile(os.path.join("config.json")):
        with open('config.json', 'rb') as config_file:
            return json.load(config_file)

#CHANGED
def addFace(path,img):
    faces = {"nums": []}
    if os.path.isfile(os.path.join("faces.dictionary")):
        with open('faces.dictionary', 'rb') as faces_file:
            faces = pickle.load(faces_file)
    f = os.path.join(path,img)
    if os.path.isfile(f):
        ki = face_recognition.load_image_file(f)
        faces.get("nums").append({"num":img.split('_')[0],"t_stamp":datetime.today(),"file":img,"matrix":face_recognition.face_encodings(ki,None,jitters,model)[0]})
        with open('faces.dictionary', 'wb') as faces_file:
            pickle.dump(faces, faces_file)
            return True
    return False

#CHANGED
def DelFace(request, format=None):
    filter = request.data['filter']
    if filter.get("num") and filter.get("file"):
        if os.path.isfile(os.path.join("faces.dictionary")):
            with open('faces.dictionary', 'rb') as faces_file:
                faces = pickle.load(faces_file)
                idx = next((index for (index, d) in enumerate(faces.get("nums")) if d["num"] == filter.get("num") and d["file"] == filter.get("file")), None)
                if idx is not None:
                    faces.get("nums").pop(idx)
                    with open('faces.dictionary', 'wb') as faces_file:
                        pickle.dump(faces, faces_file)
                    return Response({"status":"success"})
    return Response({"status":"error"})

def filePathByNum(path,num):
    for i in os.listdir(path):
        if os.path.isfile(os.path.join(path,i)) and i.startswith(num):
            return os.path.join("media",i)
    return None



def SetUser(request, format=None):
    print("ededededededede")
    # connection = connections[connMssqlName].cursor()  # NÃO usar connMssqlName para a FUNC1/SAGE!!
    data = request.data['parameters']
    filter = request.data['filter']
    portugal_timezone = pytz.timezone('Europe/Lisbon')
    current_time_with_dst = datetime.now(portugal_timezone)
    current_time_naive = current_time_with_dst.replace(tzinfo=None)
    ts = current_time_naive
    try:
        if "save" in data and data["save"]==True:
            num = filter["num"]
            func_info = processRecord(num, ts)
            if not func_info.get("nfunc"):
                return Response({"status": "error", "title": f"Funcionário {num} não encontrado na base FUNC1"})
            hsh = data.get("hsh") if data.get("hsh") is not None else None
            if hsh is None:
                if data.get("learn"):
                    fname = f"{num}_{int(datetime.timestamp(datetime.now()))}.jpg"
                    with open(f"{faces_base_path}/{fname}", "wb") as fh:
                        fh.write(base64.b64decode(data["snapshot"].replace('data:image/jpeg;base64,','')))
                    preProcessImage(f"{faces_base_path}/{fname}").save(os.path.join(cropped_faces_base_path, fname), "JPEG")
                    addFace(cropped_faces_base_path, fname)
                try:
                    os.makedirs(f"{records_base_path}/{ts.strftime('%Y%m%d')}")
                except FileExistsError:
                    pass
                try:
                    os.makedirs(f"{records_base_path}/{ts.strftime('%Y%m%d')}/{num}")
                except FileExistsError:
                    pass
                with open(f"{records_base_path}/{ts.strftime('%Y%m%d')}/{num}/{ts.strftime('%Y%m%d.%H%M%S')}.jpg", "wb") as fh:
                    fh.write(base64.b64decode(data["snapshot"].replace('data:image/jpeg;base64,','')))
            # Chama saveRecord tal como em AutoCapture!
            res = saveRecord(num, ts, hsh, data, get_client_ip(request))
            # ADICIONA SEMPRE "rows" com colaborador proveniente do SAGE/FUNC1
            sage100c_connection = connections[connSage100cName].cursor()
            func_sql = f"""
                SELECT F1.NFUNC, F1.NOME
                FROM TRIMTEK_1GEP.dbo.FUNC1 F1
                WHERE F1.NFUNC = '{num}' AND F1.DEMITIDO = 0
            """
            sage100c_connection.execute(func_sql)
            row = sage100c_connection.fetchone()
            if row:
                nfunc, nome = row
                rows = [{"NFUNC": nfunc, "NOME": nome}]
            else:
                rows = []
            return Response({**res, "rows": rows})

        else:
            existsInBd = True
            result = False
            unknown_encoding = []
            unknown_image = None
            filepath = filePathByNum(fotos_base_path, filter["num"])
            faces = loadFaces(faces_base_path)
            tmp = tempfile.NamedTemporaryFile(delete=False)
            try:
                tmp.write(base64.b64decode(data["snapshot"].replace('data:image/jpeg;base64,','')))
                ppi = preProcessImage(tmp.name)
                if ppi is not None:
                    ppi.save(tmp.name, "JPEG")
                    unknown_image = face_recognition.load_image_file(tmp)
                unknown_image = face_recognition.load_image_file(tmp)
            finally:
                tmp.close()
                os.unlink(tmp.name)
            if unknown_image is not None:
                unknown_encoding = face_recognition.face_encodings(unknown_image, None, jitters, model)
            if len(unknown_encoding)==0:
                saveSnapshot(records_invalid_base_path,data["snapshot"],ts,"no_face",filter["num"])
                return Response({"status": "error", "title": "Não foi reconhecida nenhuma face!"})
            unknown_encoding = unknown_encoding[0]

            valid_nums = []
            valid_filepaths = []
            valid_names = []

            try:
                result=False
                existsInBd=False
                for f in faces.get("nums"):
                    if f['num'] == filter["num"]:
                        existsInBd=True
                        results = face_recognition.compare_faces([f["matrix"]], unknown_encoding, tolerance)
                        if len(results) > 0 and True in results:
                            result = True
                            break
            except ValueError:
                existsInBd = False

            if result == False:
                saveSnapshot(records_invalid_base_path, data["snapshot"], ts, "not_identified", filter["num"])

                distances = face_recognition.face_distance([_f['matrix'] for _f in faces.get("nums")], unknown_encoding)
                items = []
                for idx, x in enumerate(distances):
                    if x <= tolerance:
                        items.append({"num": faces.get("nums")[idx].get("num"), "distance": x})
                items = sorted(items, key=lambda x: x["distance"])
                for idx, x in enumerate(items):
                    valid_nums.append(x.get("num"))
                    valid_filepaths.append(filePathByNum(fotos_base_path, x.get("num")))
                if len(valid_nums):
                    sql = lambda: (
                        f"""
                            SELECT F1.NFUNC, F1.NOME 
                            FROM TRIMTEK_1GEP.dbo.FUNC1 F1
                            WHERE F1.DEMITIDO = 0 AND F1.NFUNC IN ({','.join(f"'{w}'" for w in valid_nums)})
                            ORDER BY F1.NFUNC ASC
                        """
                    )
                    response = dbmssql.executeSimpleList(sql, connections[connSage100cName].cursor(), {})
                    if len(response["rows"]) > 0:
                        valid_names = response["rows"]
                if existsInBd == False:
                    added = False
                    fname = f"""{filter["num"]}_{int(datetime.timestamp(datetime.now()))}.jpg"""
                    with open(f"""{faces_base_path}/{fname}""", "wb") as fh:
                        fh.write(base64.b64decode(data["snapshot"].replace('data:image/jpeg;base64,','')))
                    preProcessImage(f"""{faces_base_path}/{fname}""").save(os.path.join(cropped_faces_base_path, fname), "JPEG")
                    added = addFace(cropped_faces_base_path, fname)
                    return Response({"status": "error", "title": f"""O colaborador indicado não existe no sistema! {"A recolha dos dados biométricos foi efetuada." if added else ""}"""})

            f = Filters(request.data['filter'])
            f.setParameters({
                "F1.NFUNC": {"value": lambda v: f"=={v.get('num')}", "field": lambda k, v: f'e.{k}'}
            }, True)
            f.where(False, "and")
            f.auto()
            f.value("and")
            parameters = {**f.parameters}
            dql = dbmssql.dql(request.data, False, False, [])
            if valid_nums:
                sql = lambda: (
                    f"""
                        SELECT F1.NFUNC, F1.NOME 
                        FROM TRIMTEK_1GEP.dbo.FUNC1 F1
                        WHERE F1.DEMITIDO = 0 AND F1.NFUNC IN ({','.join(f"'{w}'" for w in valid_nums)})
                        ORDER BY F1.NFUNC ASC
                    """
                )
                response = dbsage100c.executeSimpleList(sql, connections[connSage100cName].cursor(), {})
            else:
                response = {"rows": []}

            # Sempre buscar colaborador por número na base correta (SAGE):
            func_num = filter["num"]
            sage100c_connection = connections[connSage100cName].cursor()
            func_sql = f"""
                SELECT F1.NFUNC, F1.NOME
                FROM TRIMTEK_1GEP.dbo.FUNC1 F1
                WHERE F1.NFUNC = '{func_num}' AND F1.DEMITIDO = 0
            """
            sage100c_connection.execute(func_sql)
            row = sage100c_connection.fetchone()
            if row:
                nfunc, nome = row
                rows = [{"NFUNC": nfunc, "NOME": nome}]
            else:
                rows = []

            return Response({
                **response,
                "rows": rows,
                "result": result,
                "foto": filepath,
                "valid_nums": valid_nums,
                "valid_filepaths": valid_filepaths,
                "valid_names": valid_names,
                "config": getConfig(),
                "existsInBd": existsInBd
            })
    except Exception as error:
        print(error)
        return Response({"status": "error", "title": str(error)})



def saveSnapshot(basepath,snapshot,tstamp,suffix="",num=None):
    try:
        os.makedirs(f"""{basepath}/{tstamp.strftime("%Y%m%d")}""")
    except FileExistsError:
        pass
    if num is not None:
        try:
            os.makedirs(f"""{basepath}/{tstamp.strftime("%Y%m%d")}/{num}""")
        except FileExistsError:
            pass

    if num is None:
        pth=f"""{basepath}/{tstamp.strftime("%Y%m%d")}/{tstamp.strftime("%Y%m%d.%H%M%S")}.{suffix}.jpg"""
    else:
        pth=f"""{basepath}/{tstamp.strftime("%Y%m%d")}/{num}/{tstamp.strftime("%Y%m%d.%H%M%S")}.{suffix}.jpg"""

    with open(pth, "wb") as fh:
        fh.write(base64.b64decode(snapshot.replace('data:image/jpeg;base64,','')))


def AutoCapture(request, format=None):
    connection = connections[connMssqlName].cursor()
    data = request.data['parameters']
    filter = request.data['filter']
    ts = datetime.now()
    try:
        if "save" in data and data["save"] == True:
            num = filter["num"]
            # Vai buscar os dados atuais do colaborador (dep e tp_hor)
            func_info = processRecord(num, ts)
            if not func_info.get("nfunc"):
                return Response({"status": "error", "title": f"Funcionário {num} não encontrado na base FUNC1"})
            hsh = data.get("hsh") if data.get("hsh") is not None else None
            if hsh is None:
                try:
                    os.makedirs(f"{records_base_path}/{ts.strftime('%Y%m%d')}")
                except FileExistsError:
                    pass
                try:
                    os.makedirs(f"{records_base_path}/{ts.strftime('%Y%m%d')}/{num}")
                except FileExistsError:
                    pass
                with open(f"{records_base_path}/{ts.strftime('%Y%m%d')}/{num}/{ts.strftime('%Y%m%d.%H%M%S')}.jpg", "wb") as fh:
                    fh.write(base64.b64decode(data["snapshot"].replace('data:image/jpeg;base64,','')))
                    
            return Response(saveRecord(num, ts, hsh, data, get_client_ip(request)))

        # RECONHECIMENTO FACIAL (NÃO-SAVE)
        existsInBd = True
        result = False
        unknown_encoding = []
        unknown_image = None
        filepath = None
        faces = loadFaces(faces_base_path)
        tmp = tempfile.NamedTemporaryFile(delete=False)
        try:
            tmp.write(base64.b64decode(data["snapshot"].replace('data:image/jpeg;base64,','')))
            ppi = preProcessImage(tmp.name)
            if ppi is not None:
                ppi.save(tmp.name, "JPEG")
                unknown_image = face_recognition.load_image_file(tmp)
        finally:
            tmp.close()
            os.unlink(tmp.name)
        if unknown_image is not None:
            unknown_encoding = face_recognition.face_encodings(unknown_image, None, jitters, model)
        if len(unknown_encoding) == 0:
            saveSnapshot(records_invalid_base_path, data["snapshot"], ts, "no_face")
            return Response({"status": "error", "title": "Não foi reconhecida nenhuma face!"})
        unknown_encoding = unknown_encoding[0]

        valid_nums = []
        valid_filepaths = []
        valid_names = []
        valid_num = None

        distances = face_recognition.face_distance([_f['matrix'] for _f in faces.get("nums")], unknown_encoding)
        items = []
        for idx, x in enumerate(distances):
            if x <= tolerance:
                items.append({"num": faces.get("nums")[idx].get("num"), "distance": x})
        items = sorted(items, key=lambda x: x["distance"])
        for idx, x in enumerate(items):
            if idx == 0:
                result = True
                valid_num = x.get("num")
                request.data['filter']["num"] = x.get("num")
                filepath = filePathByNum(fotos_base_path, x.get("num"))
            else:
                if x.get("num") != valid_num:
                    valid_nums.append(x.get("num"))
                    valid_filepaths.append(filePathByNum(fotos_base_path, x.get("num")))

        response = {"rows": []}
        if len(valid_nums):
            sage100c_connection = connections[connSage100cName].cursor()
            sql = lambda: (
                f"SELECT F1.NFUNC, F1.NOME FROM TRIMTEK_1GEP.dbo.FUNC1 F1 WHERE F1.DEMITIDO = 0 AND F1.NFUNC = '{filter['num']}'"
            )
            response = dbsage100c.executeSimpleList(sql, sage100c_connection, {})
            if len(response["rows"]) > 0:
                valid_names = response["rows"]

        sage100c_connection = connections[connSage100cName].cursor()
        f = Filters(request.data['filter'])
        f.setParameters({
            "NFUNC": {"value": lambda v: f"=={v.get('num')}", "field": lambda k, v: f'F1.{k}'}
        }, True)
        f.where(False, "and")
        f.auto()
        f.value("and")
        parameters = {**f.parameters}
        dql = dbmssql.dql(request.data, False, False, [])
        sql = lambda: (
            f"""
                SELECT F1.NFUNC, F1.NOME 
                FROM TRIMTEK_1GEP.dbo.FUNC1 F1
                WHERE F1.DEMITIDO = 0 {f.text}
                ORDER BY F1.NFUNC ASC
                {dql.limit}
            """
        )
        print("DBG dbsage100c is:", dbsage100c)
        response = dbsage100c.executeSimpleList(sql, sage100c_connection, parameters)
        if result == False and request.data['filter'].get("num") is None:
            saveSnapshot(records_invalid_base_path, data["snapshot"], ts, "not_identified")
            return Response({"status": "error", "title": "O sistema não o(a) identificou!"})
        return Response({**response, "result": result, "num": request.data['filter'].get("num"), "foto": filepath,
                         "valid_nums": valid_nums, "valid_filepaths": valid_filepaths, "valid_names": valid_names,
                         "config": getConfig()})
    except Exception as error:
        print(error)
        return Response({"status": "error", "title": str(error)})



def BiometriasList(request, format=None):
    bios = []
    if os.path.isfile(os.path.join("faces.dictionary")):
        with open('faces.dictionary', 'rb') as faces_file:
            bios = pickle.load(faces_file).get("nums")
    return Response({"rows":bios})


def InvalidRecordsList(request, format=None):
    records = []
    dates = request.data.get("filter").get("fdata")
    num = request.data.get("filter").get("fnum")
    start_date = datetime.today()
    end_date = datetime.today()
    if (dates and len(dates)>0):
        if dates[0] is None and dates[1] is not None:
            start_date = datetime.strptime(dates[1].replace("<=",""), '%Y-%m-%d')
            end_date = start_date
        if dates[1] is None and dates[0] is not None:
            start_date = datetime.strptime(dates[0].replace(">=",""), '%Y-%m-%d')
            end_date = start_date
        if dates[0] is not None and dates[1] is not None:
            start_date = datetime.strptime(dates[0].replace(">=",""), '%Y-%m-%d')
            end_date = datetime.strptime(dates[1].replace("<=",""), '%Y-%m-%d')
    start_date=start_date.date()
    end_date=end_date.date()
    if (num is not None):
        num = f"""F{num.replace("F","").replace("f","").zfill(5)}"""
    for root, dirs, files in os.walk(records_invalid_base_path):
        for idx,file in enumerate(files):
            # Get the full path of the file
            creation_date = datetime.fromtimestamp(pathlib.Path(os.path.join(root, file)).stat().st_ctime)
            if creation_date.date()>=start_date and creation_date.date()<=end_date:
                fullpath = os.path.join(root, file).replace("\\","/")
                if num is not None:
                    print(fullpath)
                    if num in fullpath:
                        records.append({"k":f"f-{idx}-{random.randint(111111, 999999)}", "filename":fullpath,"tstamp":creation_date.strftime("%Y-%m-%d %H:%M:%S")})
                else:
                    records.append({"k":f"f-{idx}-{random.randint(111111, 999999)}", "filename":fullpath,"tstamp":creation_date.strftime("%Y-%m-%d %H:%M:%S")})
    return Response({"rows":records})

def UpdateRecords(request, format=None):
    values = request.data["parameters"].get("values")
    try:
        with transaction.atomic():
            with connections[connMssqlName].cursor() as cursor:                  
                dml = dbmssql.dml(TypeDml.UPDATE,{
                    "nt":values.get("nt"),
                    "ss_01":values.get("ss_01"),
                    "ts_01":values.get("ts_01"),
                    "ty_01":values.get("ty_01"),
                    "ss_02":values.get("ss_02"),
                    "ts_02":values.get("ts_02"),
                    "ty_02":values.get("ty_02"),
                    "ts_03":values.get("ts_03"),
                    "ss_03":values.get("ss_03"),
                    "ty_03":values.get("ty_03"),
                    "ts_04":values.get("ts_04"),
                    "ss_04":values.get("ss_04"),
                    "ty_04":values.get("ty_04"),
                    "ts_05":values.get("ts_05"),
                    "ss_05":values.get("ss_05"),
                    "ty_05":values.get("ty_05"),
                    "ts_06":values.get("ts_06"),
                    "ss_06":values.get("ss_06"),
                    "ty_06":values.get("ty_06"),
                    "ts_07":values.get("ts_07"),
                    "ss_07":values.get("ss_07"),
                    "ty_07":values.get("ty_07"),
                    "ts_08":values.get("ts_08"),
                    "ss_08":values.get("ss_08"),
                    "ty_08":values.get("ty_08"),
                    "edited":1
                    }, "rponto.dbo.time_registration",{"id":f'=={values.get("id")}'},None,False)
                dbmssql.execute(dml.statement, cursor, dml.parameters)
        return Response({"status": "success", "title":f"""Registo atualizado com sucesso!"""})
    except Error as error:
        return Response({"status": "error", "title": str(error)})



def RegistosRH(request, format=None):
    print("RegistosRH")
    
    connection_rponto = connections[connMssqlName].cursor()
    connection_sage = connections[connSage100cName].cursor()
    
    try:
        # Handle filters manually
        filter_data = request.data.get('filter', {})
        fnum_value = filter_data.get('fnum')
        fdata_value = filter_data.get('fdata')
        fnome_value = filter_data.get('fnome', '').lower()
        
        print(f" DEBUG filter_data: {filter_data}")
        print(f" DEBUG fdata_value: {fdata_value}")
        print(f"DEBUG fdata_value type: {type(fdata_value)}")
        
        where_clause = ""
        parameters = {}
        
        if fnum_value:
            where_clause = "WHERE TR.num LIKE %(fnum)s"
            parameters['fnum'] = fnum_value
        
                # CORREÇÃO: Processar corretamente o array de datas
        if fdata_value:
            print(f" Processando fdata_value: {fdata_value}")
            
            # Se for um dicionário com 'formatted' (formato atual)
            if isinstance(fdata_value, dict) and 'formatted' in fdata_value:
                formatted = fdata_value['formatted']
                if isinstance(formatted, dict):
                    start_date = formatted.get('startValue')
                    end_date = formatted.get('endValue')
                    
                    print(f" start_date extraída: {start_date}")
                    print(f" end_date extraída: {end_date}")
                    
                    if start_date and end_date:
                        and_or_where = " AND " if where_clause else "WHERE "
                        where_clause += f"{and_or_where}TR.dts >= %(fdata_start)s AND TR.dts <= %(fdata_end)s"
                        parameters['fdata_start'] = start_date + ' 00:00:00'  
                        parameters['fdata_end'] = end_date + ' 23:59:59' 
            
            elif isinstance(fdata_value, list) and len(fdata_value) >= 2:
                start_date = str(fdata_value[0]).replace(">=", "").strip()
                end_date = str(fdata_value[1]).replace("<=", "").strip()
                
                print(f" start_date extraída: {start_date}")
                print(f" end_date extraída: {end_date}")
                
                and_or_where = " AND " if where_clause else "WHERE "
                where_clause += f"{and_or_where}TR.dts >= %(fdata_start)s AND TR.dts <= %(fdata_end)s"
                parameters['fdata_start'] = start_date
                parameters['fdata_end'] = end_date
            
            elif isinstance(fdata_value, dict):
                start_date = fdata_value.get(">=") or fdata_value.get("formatted", [None])[0]
                end_date = fdata_value.get("<=") or fdata_value.get("formatted", [None, None])[1]
                
                if start_date and end_date:
                    and_or_where = " AND " if where_clause else "WHERE "
                    where_clause += f"{and_or_where}TR.dts >= %(fdata_start)s AND TR.dts <= %(fdata_end)s"
                    parameters['fdata_start'] = start_date
                    parameters['fdata_end'] = end_date

        print(f" DEBUG WHERE CLAUSE: {where_clause}")
        print(f" DEBUG PARAMS: {parameters}")

        dql = dbmssql.dql(request.data, False)
        
        cols = """
            TR.id, TR.num, TR.dts, TR.dep, TR.tp_hor,
            TR.ss_01, TR.ty_01, TR.ss_02, TR.ty_02,
            TR.ss_03, TR.ty_03, TR.ss_04, TR.ty_04,
            TR.ss_05, TR.ty_05, TR.ss_06, TR.ty_06,
            TR.ss_07, TR.ty_07, TR.ss_08, TR.ty_08,
            TR.nt
        """
        
        dql.columns = encloseColumn(cols, False)
        
        # Função de paginação segura para SQL Server
        def sql_rponto(paging_func, columns_func, sort_func):
            offset = (dql.currentPage - 1) * dql.pageSize  
            limit = dql.pageSize
            order_clause = sort_func(dql.sort) if dql.sort else "ORDER BY TR.dts DESC, TR.num ASC"
            paging_clause = f"OFFSET {offset} ROWS FETCH NEXT {limit} ROWS ONLY"
            
            sql_query = f"""
                SELECT {columns_func(dql.columns)}
                FROM rponto.dbo.time_registration TR
                {where_clause}
                {order_clause}
                {paging_clause}
            """
            print("🔧 DEBUG SQL:", sql_query)
            return sql_query
        
        response_rponto = dbmssql.executeList(
            sql_rponto, 
            connection_rponto, 
            parameters,  
            [],  #
            None,  
            f"select {dql.currentPage * dql.pageSize + 1}"  
        )
        
        if not response_rponto.get('rows'):
            return Response({
                "rows": [], "total": 0, "page": dql.currentPage,
                "pageSize": dql.pageSize, "status": "success"
            })
        
        registos = response_rponto['rows']
        total_records = response_rponto.get('total', 0)
        
        nums_list = list(set([r['num'] for r in registos if r.get('num')]))
        funcionarios_dict = {}
        if nums_list:
            placeholders = ','.join(['%s' for _ in nums_list])
            sql_func1 = f"SELECT NFUNC, NOME FROM TRIMTEK_1GEP.dbo.FUNC1 WHERE NFUNC IN ({placeholders})"
            connection_sage.execute(sql_func1, tuple(nums_list))
            columns_func1 = [col[0] for col in connection_sage.description]
            for row in connection_sage.fetchall():
                func_data = dict(zip(columns_func1, row))
                funcionarios_dict[func_data['NFUNC']] = func_data

        # 3. Normalização e Processamento de Turnos
        registos_normalizados = []
        for registro in registos:
            primeira_picagem_dt = None
            
            # Limpar e normalizar os tipos de picagem
            for i in range(1, 9):
                ty_key = f'ty_{i:02d}'
                if registro.get(ty_key):
                    # Garante que é string, remove espaços e converte para minúsculas
                    registro[ty_key] = str(registro[ty_key]).strip().lower()
            
            for i in range(1, 9):
                ss_key = f'ss_{i:02d}'
                val = registro.get(ss_key)
                if val:
                    dt_obj = val
                    if isinstance(val, str):
                        try: dt_obj = datetime.strptime(val, '%Y-%m-%d %H:%M:%S')
                        except: pass
                    
                    if not primeira_picagem_dt:
                        primeira_picagem_dt = dt_obj
                    
                    if isinstance(dt_obj, (datetime, date)):
                        registro[ss_key] = dt_obj.strftime('%Y-%m-%d %H:%M:%S')

            if primeira_picagem_dt:
                hora = primeira_picagem_dt.hour
                if hora < 6:
                    data_turno = (primeira_picagem_dt - timedelta(days=1)).date()
                else:
                    data_turno = primeira_picagem_dt.date()
                
                registro['data_turno'] = data_turno.strftime('%Y-%m-%d')
                registro['tipo_turno'] = identificar_tipo_turno(hora)
            else:
                dts = registro.get('dts')
                registro['data_turno'] = dts.strftime('%Y-%m-%d') if isinstance(dts, (datetime, date)) else str(dts)
                registro['tipo_turno'] = 'N/A'

            num = registro.get('num')
            registro['nome_colaborador'] = funcionarios_dict.get(num, {}).get('NOME', 'Nome não disponível')
            
            if isinstance(registro.get('dts'), (datetime, date)):
                registro['dts'] = registro['dts'].strftime('%Y-%m-%d %H:%M:%S')

            registos_normalizados.append(registro)

        # 4. Filtro manual por nome
        if fnome_value:
            registos_normalizados = [r for r in registos_normalizados if fnome_value in r.get('nome_colaborador', '').lower()]
            total_records = len(registos_normalizados)

        return Response({
            "rows": registos_normalizados,
            "total": total_records,
            "page": dql.currentPage,
            "pageSize": dql.pageSize,
            "status": "success"
        })
        
    except Exception as error:
        print(f" Erro em RegistosRH: {str(error)}")
        import traceback
        traceback.print_exc()
        return Response({"status": "error", "title": str(error)})
    
    finally:
        connection_rponto.close()
        connection_sage.close()


def identificar_tipo_turno(hora_entrada):
    """
    Identifica o tipo de turno baseado na hora de entrada
    """
    if 6 <= hora_entrada < 14:
        return "MANHÃ (08:00-14:00)"
    elif 14 <= hora_entrada < 22:
        return "TARDE (14:00-22:00)"
    else:  # 22:00-06:00
        return "NOITE (22:00-06:00)"



    

def GetTurnosEquipas(request, format=None):
    parameters = request.data. get('parameters', {})
    data_inicio_str = parameters.get('data_inicio')
    data_fim_str = parameters. get('data_fim')
    
    if not data_inicio_str: 
        dt_inicio = datetime.now().replace(day=1)
        data_inicio_str = dt_inicio.strftime('%Y-%m-%d')
    else: 
        dt_inicio = datetime.strptime(data_inicio_str, '%Y-%m-%d')
    
    if not data_fim_str: 
        proximo_mes = (dt_inicio. replace(day=28) + timedelta(days=4)).replace(day=1)
        data_fim = proximo_mes - timedelta(days=1)
        data_fim_str = data_fim. strftime('%Y-%m-%d')
    
    query = f"""
    SET DATEFIRST 1;
    
    SELECT 
        FORMAT(DATEADD(DAY, c.ordem_rotacao - 1, '2026-01-01'), 'yyyy-MM-dd') AS data,
        DATENAME(WEEKDAY, DATEADD(DAY, c.ordem_rotacao - 1, '2026-01-01')) AS dia_semana,
        c.equipa_letra AS equipa,
        c.esquema_tipo AS esquema,
        CASE 
            WHEN c.ordem_rotacao IN (1, 358, 359, 365) THEN 'DSC'
            ELSE c.turno_sigla
        END AS turno_sigla,
        CASE
            WHEN c. ordem_rotacao IN (1, 358, 359, 365) THEN 'Feriado'
            ELSE COALESCE(t.nome, 'Sem turno')
        END AS turno_nome,
        CASE 
            WHEN c.ordem_rotacao IN (1, 358, 359, 365) THEN NULL 
            ELSE t.hora_inicio 
        END AS hora_inicio,
        CASE 
            WHEN c.ordem_rotacao IN (1, 358, 359, 365) THEN NULL 
            ELSE t.hora_fim 
        END AS hora_fim,
        CASE 
            WHEN c.ordem_rotacao IN (1, 358, 359, 365) THEN '#E0E0E0'
            ELSE t.cor_hex 
        END AS cor_hex,
        CASE 
            WHEN c.ordem_rotacao IN (1, 358, 359, 365) THEN 1 
            ELSE 0 
        END AS is_feriado,
        h.name AS nome_feriado
    FROM rponto. dbo.ciclo_laboracao c
    LEFT JOIN rponto. dbo.turnos t ON t.sigla = c.turno_sigla
    LEFT JOIN rponto.dbo.holidays h ON h.holiday_date = DATEADD(DAY, c.ordem_rotacao - 1, '2026-01-01')
    WHERE DATEADD(DAY, c.ordem_rotacao - 1, '2026-01-01') >= '{data_inicio_str}'
      AND DATEADD(DAY, c.ordem_rotacao - 1, '2026-01-01') <= '{data_fim_str}'
    ORDER BY c.ordem_rotacao, c.esquema_tipo, c.equipa_letra;
    """
    
    try:
        with connections[connMssqlName].cursor() as cursor:
            cursor. execute(query)
            columns = [col[0] for col in cursor.description]
            rows = [dict(zip(columns, row)) for row in cursor.fetchall()]
        
        escalas_agrupadas = {}
        
        dt_current = dt_inicio
        dt_end = datetime.strptime(data_fim_str, '%Y-%m-%d')
        
        while dt_current <= dt_end:
            data_str = dt_current. strftime('%Y-%m-%d')
            escalas_agrupadas[data_str] = {
                'data':  data_str,
                'dia_semana': dt_current. strftime('%A'),
                'equipas': []
            }
            dt_current += timedelta(days=1)
        
        for row in rows:
            data = row['data']
            if data in escalas_agrupadas:
                escalas_agrupadas[data]['equipas'].append({
                    'equipa': row['equipa'],
                    'esquema': row['esquema'],
                    'turno_sigla': row['turno_sigla'],
                    'turno_nome':  row['turno_nome'],
                    'hora_inicio':  str(row['hora_inicio']) if row['hora_inicio'] else None,
                    'hora_fim': str(row['hora_fim']) if row['hora_fim'] else None,
                    'cor_hex': row['cor_hex'],
                    'is_feriado':  bool(row['is_feriado']),
                    'nome_feriado': row['nome_feriado']
                })
        
        return Response({
            'success': True,
            'data_inicio': data_inicio_str,
            'data_fim':  data_fim_str,
            'total_dias': len(escalas_agrupadas),
            'escalas':  list(escalas_agrupadas.values())
        })
        
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=500)





def CalendarList(request, format=None):
    connection = connections[connMssqlName].cursor()
    f = Filters(request.data['filter'])
    f.setParameters({
        #**rangeP(f.filterData.get('fdata'), 'dts', lambda k, v: f'CONVERT(DATE, dts)'),
        "REFNUM_0": {"value": lambda v: f"==F{str(v.get('fnum')).zfill(5)}" if v.get('fnum') is not None else None, "field": lambda k, v: f'T.{k}'},
        "num": {"value": lambda v: f"=={v.get('num')}" if v.get('num') is not None else None, "field": lambda k, v: f'T.REFNUM_0'},
    }, True)
    f.where("")
    f.auto()
    f.value()

    _year = request.data['filter'].get("y") if request.data['filter'].get("y") is not None else datetime.now().year
    _month = request.data['filter'].get("m") if request.data['filter'].get("m") is not None else None
    f2 = Filters(request.data['filter'])
    f2.setParameters({
        #**rangeP(f.filterData.get('fdata'), 'dts', lambda k, v: f'CONVERT(DATE, dts)'),
        "FULLNAME": {"value": lambda v: v.get('fnome').lower() if v.get('fnome') is not None else None, "field": lambda k, v: f'lower({k})'},
        "y": {"value": lambda v: f"=={_year}", "field": lambda k, v: f'C.{k}'},
        "m": {"value": lambda v: f"=={_month}" if _month is not None else None, "field": lambda k, v: f'C.{k}'}
    }, True)
    f2.where()
    f2.auto()
    f2.value()


    def filterMonthMultiSelect(data,name,operator):
        f = Filters(data)
        fP = {}
        if name in data:
            dt = [o['value'] for o in data[name]]
            for idx,v in enumerate(dt):
                fP[f"m{idx}"] = {"key":"m", "value": f"=={v}", "field": lambda k, v: f'C.{k}'}
        f.setParameters({**fP}, True)
        f.auto()
        f.where(False, operator)
        f.value("or")
        return f
    fmonths = filterMonthMultiSelect(request.data['filter'],'months',"and" if f2.hasFilters else "where")
    
    fmulti = filterMulti(request.data['filter'], {
        # 'flotenw': {"keys": ['lotenwinf', 'lotenwsup'], "table": 'mb.'},
        # 'ftiponw': {"keys": ['tiponwinf', 'tiponwsup'], "table": 'mb.'},
        # 'fbobine': {"keys": ['nome'], "table": 'mb.'},
    }, False, "and" if f.hasFilters else "where" ,False)
    fmulti["text"] = f""" """

    parameters = {**f.parameters, **fmulti['parameters'],**f2.parameters,**fmonths.parameters}
    dql = dbmssql.dql(request.data, False)
    cols = f"""*"""
    dql.columns=encloseColumn(cols,False)
    dql.sort = " ORDER BY(SELECT NULL) " if not dql.sort else dql.sort #Obrigatório se PAGING em sqlserver
    sql = lambda p, c, s: (
        f"""            
            WITH [CTE_CALENDAR] AS
            (SELECT CAST('{_year}-01-01' AS DATE) AS [date]
            union all
            select DATEADD(dd,1,[date]) FROM [CTE_CALENDAR]
            WHERE DATEADD(dd,1,[date]) <= CAST('{_year}-12-31' AS DATE)
            ), [CALENDAR] AS 
            (SELECT 
            [date],
            DATEPART(ISO_WEEK,[date]) isowyear,
            DATEPART(WEEK,[date]) wyear,
            DATEPART(WEEKDAY,[date]) wday,
            FORMAT([date], 'dddd', 'pt-pt') wdayname,
            --DATENAME(WEEKDAY,[date]) wdayname,
            DATEPART(MONTH,[date]) m,
            DATEPART(YEAR,[date]) y,
            CASE WHEN DATEPART(ISO_WEEK,[date])>DATEPART(WEEK,[date]) THEN DATEPART(YEAR,[date])-1 ELSE DATEPART(YEAR,[date]) END isoy
            FROM [CTE_CALENDAR]
            )
            SELECT {c(f'{dql.columns}')} FROM (
            SELECT [YEA_0],[WEEK],[DAYWEEK],[REFNUM_0],[PLNTYP_0], EN_MANHA,SA_MANHA,EN_TARDE,SA_TARDE, SRN_0,NAM_0, CONCAT(SRN_0,' ',NAM_0) FULLNAME
            FROM (
            SELECT T.*,EID.SRN_0, EID.NAM_0 FROM (
            select DISTINCT 1 WEEK,YEA_0, REFNUM_0,STRTIM0_0, ENDTIM0_0,STRTIM1_0, ENDTIM1_0,STRTIM0_1, ENDTIM0_1,STRTIM1_1, ENDTIM1_1,STRTIM0_2, ENDTIM0_2,STRTIM1_2, ENDTIM1_2,STRTIM0_3, ENDTIM0_3,STRTIM1_3, ENDTIM1_3,
            STRTIM0_4, ENDTIM0_4,STRTIM1_4, ENDTIM1_4,STRTIM0_5, ENDTIM0_5,STRTIM1_5, ENDTIM1_5,STRTIM0_6, ENDTIM0_6,STRTIM1_6, ENDTIM1_6,PLNTYP_0
            from x3peoplesql.[PEOPLELTEK].[EMPLOCTR] CT
            JOIN x3peoplesql.[PEOPLELTEK].PLANTYP PT ON PT.COD_0 = CT.PLNTYP_0
            JOIN x3peoplesql.[PEOPLELTEK].TYPWEEK PW0 ON PW0.COD_0 = PT.WEKTYP_0
            UNION ALL
            select DISTINCT 2 WEEK,YEA_0, REFNUM_0,STRTIM0_0, ENDTIM0_0,STRTIM1_0, ENDTIM1_0,STRTIM0_1, ENDTIM0_1,STRTIM1_1, ENDTIM1_1,STRTIM0_2, ENDTIM0_2,STRTIM1_2, ENDTIM1_2,STRTIM0_3, ENDTIM0_3,STRTIM1_3, ENDTIM1_3,
            STRTIM0_4, ENDTIM0_4,STRTIM1_4, ENDTIM1_4,STRTIM0_5, ENDTIM0_5,STRTIM1_5, ENDTIM1_5,STRTIM0_6, ENDTIM0_6,STRTIM1_6, ENDTIM1_6,PLNTYP_0
            from x3peoplesql.[PEOPLELTEK].[EMPLOCTR] CT
            JOIN x3peoplesql.[PEOPLELTEK].PLANTYP PT ON PT.COD_0 = CT.PLNTYP_0
            JOIN x3peoplesql.[PEOPLELTEK].TYPWEEK PW0 ON PW0.COD_0 = PT.WEKTYP_1
            UNION ALL
            select DISTINCT 3 WEEK,YEA_0, REFNUM_0,STRTIM0_0, ENDTIM0_0,STRTIM1_0, ENDTIM1_0,STRTIM0_1, ENDTIM0_1,STRTIM1_1, ENDTIM1_1,STRTIM0_2, ENDTIM0_2,STRTIM1_2, ENDTIM1_2,STRTIM0_3, ENDTIM0_3,STRTIM1_3, ENDTIM1_3,
            STRTIM0_4, ENDTIM0_4,STRTIM1_4, ENDTIM1_4,STRTIM0_5, ENDTIM0_5,STRTIM1_5, ENDTIM1_5,STRTIM0_6, ENDTIM0_6,STRTIM1_6, ENDTIM1_6,PLNTYP_0
            from x3peoplesql.[PEOPLELTEK].[EMPLOCTR] CT
            JOIN x3peoplesql.[PEOPLELTEK].PLANTYP PT ON PT.COD_0 = CT.PLNTYP_0
            JOIN x3peoplesql.[PEOPLELTEK].TYPWEEK PW0 ON PW0.COD_0 = PT.WEKTYP_2
            UNION ALL
            select DISTINCT 4 WEEK,YEA_0, REFNUM_0, STRTIM0_0, ENDTIM0_0,STRTIM1_0, ENDTIM1_0,STRTIM0_1, ENDTIM0_1,STRTIM1_1, ENDTIM1_1,STRTIM0_2, ENDTIM0_2,STRTIM1_2, ENDTIM1_2,STRTIM0_3, ENDTIM0_3,STRTIM1_3, ENDTIM1_3,
            STRTIM0_4, ENDTIM0_4,STRTIM1_4, ENDTIM1_4,STRTIM0_5, ENDTIM0_5,STRTIM1_5, ENDTIM1_5,STRTIM0_6, ENDTIM0_6,STRTIM1_6, ENDTIM1_6,PLNTYP_0
            from x3peoplesql.[PEOPLELTEK].[EMPLOCTR] CT
            JOIN x3peoplesql.[PEOPLELTEK].PLANTYP PT ON PT.COD_0 = CT.PLNTYP_0
            JOIN x3peoplesql.[PEOPLELTEK].TYPWEEK PW0 ON PW0.COD_0 = PT.WEKTYP_3
            UNION ALL
            select DISTINCT 5 WEEK,YEA_0, REFNUM_0,STRTIM0_0, ENDTIM0_0,STRTIM1_0, ENDTIM1_0,STRTIM0_1, ENDTIM0_1,STRTIM1_1, ENDTIM1_1,STRTIM0_2, ENDTIM0_2,STRTIM1_2, ENDTIM1_2,STRTIM0_3, ENDTIM0_3,STRTIM1_3, ENDTIM1_3,
            STRTIM0_4, ENDTIM0_4,STRTIM1_4, ENDTIM1_4,STRTIM0_5, ENDTIM0_5,STRTIM1_5, ENDTIM1_5,STRTIM0_6, ENDTIM0_6,STRTIM1_6, ENDTIM1_6,PLNTYP_0
            from x3peoplesql.[PEOPLELTEK].[EMPLOCTR] CT
            JOIN x3peoplesql.[PEOPLELTEK].PLANTYP PT ON PT.COD_0 = CT.PLNTYP_0
            JOIN x3peoplesql.[PEOPLELTEK].TYPWEEK PW0 ON PW0.COD_0 = PT.WEKTYP_4
            UNION ALL
            select DISTINCT 6 WEEK,YEA_0, REFNUM_0,STRTIM0_0, ENDTIM0_0,STRTIM1_0, ENDTIM1_0,STRTIM0_1, ENDTIM0_1,STRTIM1_1, ENDTIM1_1,STRTIM0_2, ENDTIM0_2,STRTIM1_2, ENDTIM1_2,STRTIM0_3, ENDTIM0_3,STRTIM1_3, ENDTIM1_3,
            STRTIM0_4, ENDTIM0_4,STRTIM1_4, ENDTIM1_4,STRTIM0_5, ENDTIM0_5,STRTIM1_5, ENDTIM1_5,STRTIM0_6, ENDTIM0_6,STRTIM1_6, ENDTIM1_6,PLNTYP_0
            from x3peoplesql.[PEOPLELTEK].[EMPLOCTR] CT
            JOIN x3peoplesql.[PEOPLELTEK].PLANTYP PT ON PT.COD_0 = CT.PLNTYP_0
            JOIN x3peoplesql.[PEOPLELTEK].TYPWEEK PW0 ON PW0.COD_0 = PT.WEKTYP_5
            UNION ALL
            select DISTINCT 7 WEEK,YEA_0, REFNUM_0,STRTIM0_0, ENDTIM0_0,STRTIM1_0, ENDTIM1_0,STRTIM0_1, ENDTIM0_1,STRTIM1_1, ENDTIM1_1,STRTIM0_2, ENDTIM0_2,STRTIM1_2, ENDTIM1_2,STRTIM0_3, ENDTIM0_3,STRTIM1_3, ENDTIM1_3,
            STRTIM0_4, ENDTIM0_4,STRTIM1_4, ENDTIM1_4,STRTIM0_5, ENDTIM0_5,STRTIM1_5, ENDTIM1_5,STRTIM0_6, ENDTIM0_6,STRTIM1_6, ENDTIM1_6,PLNTYP_0
            from x3peoplesql.[PEOPLELTEK].[EMPLOCTR] CT
            JOIN x3peoplesql.[PEOPLELTEK].PLANTYP PT ON PT.COD_0 = CT.PLNTYP_0
            JOIN x3peoplesql.[PEOPLELTEK].TYPWEEK PW0 ON PW0.COD_0 = PT.WEKTYP_6
            UNION ALL
            select DISTINCT 8 WEEK,YEA_0, REFNUM_0,STRTIM0_0, ENDTIM0_0,STRTIM1_0, ENDTIM1_0,STRTIM0_1, ENDTIM0_1,STRTIM1_1, ENDTIM1_1,STRTIM0_2, ENDTIM0_2,STRTIM1_2, ENDTIM1_2,STRTIM0_3, ENDTIM0_3,STRTIM1_3, ENDTIM1_3,
            STRTIM0_4, ENDTIM0_4,STRTIM1_4, ENDTIM1_4,STRTIM0_5, ENDTIM0_5,STRTIM1_5, ENDTIM1_5,STRTIM0_6, ENDTIM0_6,STRTIM1_6, ENDTIM1_6,PLNTYP_0
            from x3peoplesql.[PEOPLELTEK].[EMPLOCTR] CT
            JOIN x3peoplesql.[PEOPLELTEK].PLANTYP PT ON PT.COD_0 = CT.PLNTYP_0
            JOIN x3peoplesql.[PEOPLELTEK].TYPWEEK PW0 ON PW0.COD_0 = PT.WEKTYP_7
            UNION ALL
            select DISTINCT 9 WEEK,YEA_0, REFNUM_0,STRTIM0_0, ENDTIM0_0,STRTIM1_0, ENDTIM1_0,STRTIM0_1, ENDTIM0_1,STRTIM1_1, ENDTIM1_1,STRTIM0_2, ENDTIM0_2,STRTIM1_2, ENDTIM1_2,STRTIM0_3, ENDTIM0_3,STRTIM1_3, ENDTIM1_3,
            STRTIM0_4, ENDTIM0_4,STRTIM1_4, ENDTIM1_4,STRTIM0_5, ENDTIM0_5,STRTIM1_5, ENDTIM1_5,STRTIM0_6, ENDTIM0_6,STRTIM1_6, ENDTIM1_6,PLNTYP_0
            from x3peoplesql.[PEOPLELTEK].[EMPLOCTR] CT
            JOIN x3peoplesql.[PEOPLELTEK].PLANTYP PT ON PT.COD_0 = CT.PLNTYP_0
            JOIN x3peoplesql.[PEOPLELTEK].TYPWEEK PW0 ON PW0.COD_0 = PT.WEKTYP_8
            UNION ALL
            select DISTINCT 10 WEEK,YEA_0, REFNUM_0,STRTIM0_0, ENDTIM0_0,STRTIM1_0, ENDTIM1_0,STRTIM0_1, ENDTIM0_1,STRTIM1_1, ENDTIM1_1,STRTIM0_2, ENDTIM0_2,STRTIM1_2, ENDTIM1_2,STRTIM0_3, ENDTIM0_3,STRTIM1_3, ENDTIM1_3,
            STRTIM0_4, ENDTIM0_4,STRTIM1_4, ENDTIM1_4,STRTIM0_5, ENDTIM0_5,STRTIM1_5, ENDTIM1_5,STRTIM0_6, ENDTIM0_6,STRTIM1_6, ENDTIM1_6,PLNTYP_0
            from x3peoplesql.[PEOPLELTEK].[EMPLOCTR] CT
            JOIN x3peoplesql.[PEOPLELTEK].PLANTYP PT ON PT.COD_0 = CT.PLNTYP_0
            JOIN x3peoplesql.[PEOPLELTEK].TYPWEEK PW0 ON PW0.COD_0 = PT.WEKTYP_9
            UNION ALL
            select DISTINCT 11 WEEK,YEA_0, REFNUM_0,STRTIM0_0, ENDTIM0_0,STRTIM1_0, ENDTIM1_0,STRTIM0_1, ENDTIM0_1,STRTIM1_1, ENDTIM1_1,STRTIM0_2, ENDTIM0_2,STRTIM1_2, ENDTIM1_2,STRTIM0_3, ENDTIM0_3,STRTIM1_3, ENDTIM1_3,
            STRTIM0_4, ENDTIM0_4,STRTIM1_4, ENDTIM1_4,STRTIM0_5, ENDTIM0_5,STRTIM1_5, ENDTIM1_5,STRTIM0_6, ENDTIM0_6,STRTIM1_6, ENDTIM1_6,PLNTYP_0
            from x3peoplesql.[PEOPLELTEK].[EMPLOCTR] CT
            JOIN x3peoplesql.[PEOPLELTEK].PLANTYP PT ON PT.COD_0 = CT.PLNTYP_0
            JOIN x3peoplesql.[PEOPLELTEK].TYPWEEK PW0 ON PW0.COD_0 = PT.WEKTYP_10
            UNION ALL
            select DISTINCT 12 WEEK,YEA_0, REFNUM_0,STRTIM0_0, ENDTIM0_0,STRTIM1_0, ENDTIM1_0,STRTIM0_1, ENDTIM0_1,STRTIM1_1, ENDTIM1_1,STRTIM0_2, ENDTIM0_2,STRTIM1_2, ENDTIM1_2,STRTIM0_3, ENDTIM0_3,STRTIM1_3, ENDTIM1_3,
            STRTIM0_4, ENDTIM0_4,STRTIM1_4, ENDTIM1_4,STRTIM0_5, ENDTIM0_5,STRTIM1_5, ENDTIM1_5,STRTIM0_6, ENDTIM0_6,STRTIM1_6, ENDTIM1_6,PLNTYP_0
            from x3peoplesql.[PEOPLELTEK].[EMPLOCTR] CT
            JOIN x3peoplesql.[PEOPLELTEK].PLANTYP PT ON PT.COD_0 = CT.PLNTYP_0
            JOIN x3peoplesql.[PEOPLELTEK].TYPWEEK PW0 ON PW0.COD_0 = PT.WEKTYP_11
            UNION ALL
            select DISTINCT 13 WEEK,YEA_0, REFNUM_0,STRTIM0_0, ENDTIM0_0,STRTIM1_0, ENDTIM1_0,STRTIM0_1, ENDTIM0_1,STRTIM1_1, ENDTIM1_1,STRTIM0_2, ENDTIM0_2,STRTIM1_2, ENDTIM1_2,STRTIM0_3, ENDTIM0_3,STRTIM1_3, ENDTIM1_3,
            STRTIM0_4, ENDTIM0_4,STRTIM1_4, ENDTIM1_4,STRTIM0_5, ENDTIM0_5,STRTIM1_5, ENDTIM1_5,STRTIM0_6, ENDTIM0_6,STRTIM1_6, ENDTIM1_6,PLNTYP_0
            from x3peoplesql.[PEOPLELTEK].[EMPLOCTR] CT
            JOIN x3peoplesql.[PEOPLELTEK].PLANTYP PT ON PT.COD_0 = CT.PLNTYP_0
            JOIN x3peoplesql.[PEOPLELTEK].TYPWEEK PW0 ON PW0.COD_0 = PT.WEKTYP_12
            UNION ALL
            select DISTINCT 14 WEEK,YEA_0, REFNUM_0,STRTIM0_0, ENDTIM0_0,STRTIM1_0, ENDTIM1_0,STRTIM0_1, ENDTIM0_1,STRTIM1_1, ENDTIM1_1,STRTIM0_2, ENDTIM0_2,STRTIM1_2, ENDTIM1_2,STRTIM0_3, ENDTIM0_3,STRTIM1_3, ENDTIM1_3,
            STRTIM0_4, ENDTIM0_4,STRTIM1_4, ENDTIM1_4,STRTIM0_5, ENDTIM0_5,STRTIM1_5, ENDTIM1_5,STRTIM0_6, ENDTIM0_6,STRTIM1_6, ENDTIM1_6,PLNTYP_0
            from x3peoplesql.[PEOPLELTEK].[EMPLOCTR] CT
            JOIN x3peoplesql.[PEOPLELTEK].PLANTYP PT ON PT.COD_0 = CT.PLNTYP_0
            JOIN x3peoplesql.[PEOPLELTEK].TYPWEEK PW0 ON PW0.COD_0 = PT.WEKTYP_13
            UNION ALL
            select DISTINCT 15 WEEK,YEA_0, REFNUM_0,STRTIM0_0, ENDTIM0_0,STRTIM1_0, ENDTIM1_0,STRTIM0_1, ENDTIM0_1,STRTIM1_1, ENDTIM1_1,STRTIM0_2, ENDTIM0_2,STRTIM1_2, ENDTIM1_2,STRTIM0_3, ENDTIM0_3,STRTIM1_3, ENDTIM1_3,
            STRTIM0_4, ENDTIM0_4,STRTIM1_4, ENDTIM1_4,STRTIM0_5, ENDTIM0_5,STRTIM1_5, ENDTIM1_5,STRTIM0_6, ENDTIM0_6,STRTIM1_6, ENDTIM1_6,PLNTYP_0
            from x3peoplesql.[PEOPLELTEK].[EMPLOCTR] CT
            JOIN x3peoplesql.[PEOPLELTEK].PLANTYP PT ON PT.COD_0 = CT.PLNTYP_0
            JOIN x3peoplesql.[PEOPLELTEK].TYPWEEK PW0 ON PW0.COD_0 = PT.WEKTYP_14
            UNION ALL
            select DISTINCT 16 WEEK,YEA_0, REFNUM_0,STRTIM0_0, ENDTIM0_0,STRTIM1_0, ENDTIM1_0,STRTIM0_1, ENDTIM0_1,STRTIM1_1, ENDTIM1_1,STRTIM0_2, ENDTIM0_2,STRTIM1_2, ENDTIM1_2,STRTIM0_3, ENDTIM0_3,STRTIM1_3, ENDTIM1_3,
            STRTIM0_4, ENDTIM0_4,STRTIM1_4, ENDTIM1_4,STRTIM0_5, ENDTIM0_5,STRTIM1_5, ENDTIM1_5,STRTIM0_6, ENDTIM0_6,STRTIM1_6, ENDTIM1_6,PLNTYP_0
            from x3peoplesql.[PEOPLELTEK].[EMPLOCTR] CT
            JOIN x3peoplesql.[PEOPLELTEK].PLANTYP PT ON PT.COD_0 = CT.PLNTYP_0
            JOIN x3peoplesql.[PEOPLELTEK].TYPWEEK PW0 ON PW0.COD_0 = PT.WEKTYP_15
            UNION ALL
            select DISTINCT 17 WEEK,YEA_0, REFNUM_0,STRTIM0_0, ENDTIM0_0,STRTIM1_0, ENDTIM1_0,STRTIM0_1, ENDTIM0_1,STRTIM1_1, ENDTIM1_1,STRTIM0_2, ENDTIM0_2,STRTIM1_2, ENDTIM1_2,STRTIM0_3, ENDTIM0_3,STRTIM1_3, ENDTIM1_3,
            STRTIM0_4, ENDTIM0_4,STRTIM1_4, ENDTIM1_4,STRTIM0_5, ENDTIM0_5,STRTIM1_5, ENDTIM1_5,STRTIM0_6, ENDTIM0_6,STRTIM1_6, ENDTIM1_6,PLNTYP_0
            from x3peoplesql.[PEOPLELTEK].[EMPLOCTR] CT
            JOIN x3peoplesql.[PEOPLELTEK].PLANTYP PT ON PT.COD_0 = CT.PLNTYP_0
            JOIN x3peoplesql.[PEOPLELTEK].TYPWEEK PW0 ON PW0.COD_0 = PT.WEKTYP_16
            UNION ALL
            select DISTINCT 18 WEEK,YEA_0, REFNUM_0,STRTIM0_0, ENDTIM0_0,STRTIM1_0, ENDTIM1_0,STRTIM0_1, ENDTIM0_1,STRTIM1_1, ENDTIM1_1,STRTIM0_2, ENDTIM0_2,STRTIM1_2, ENDTIM1_2,STRTIM0_3, ENDTIM0_3,STRTIM1_3, ENDTIM1_3,
            STRTIM0_4, ENDTIM0_4,STRTIM1_4, ENDTIM1_4,STRTIM0_5, ENDTIM0_5,STRTIM1_5, ENDTIM1_5,STRTIM0_6, ENDTIM0_6,STRTIM1_6, ENDTIM1_6,PLNTYP_0
            from x3peoplesql.[PEOPLELTEK].[EMPLOCTR] CT
            JOIN x3peoplesql.[PEOPLELTEK].PLANTYP PT ON PT.COD_0 = CT.PLNTYP_0
            JOIN x3peoplesql.[PEOPLELTEK].TYPWEEK PW0 ON PW0.COD_0 = PT.WEKTYP_17
            UNION ALL
            select DISTINCT 19 WEEK,YEA_0, REFNUM_0,STRTIM0_0, ENDTIM0_0,STRTIM1_0, ENDTIM1_0,STRTIM0_1, ENDTIM0_1,STRTIM1_1, ENDTIM1_1,STRTIM0_2, ENDTIM0_2,STRTIM1_2, ENDTIM1_2,STRTIM0_3, ENDTIM0_3,STRTIM1_3, ENDTIM1_3,
            STRTIM0_4, ENDTIM0_4,STRTIM1_4, ENDTIM1_4,STRTIM0_5, ENDTIM0_5,STRTIM1_5, ENDTIM1_5,STRTIM0_6, ENDTIM0_6,STRTIM1_6, ENDTIM1_6,PLNTYP_0
            from x3peoplesql.[PEOPLELTEK].[EMPLOCTR] CT
            JOIN x3peoplesql.[PEOPLELTEK].PLANTYP PT ON PT.COD_0 = CT.PLNTYP_0
            JOIN x3peoplesql.[PEOPLELTEK].TYPWEEK PW0 ON PW0.COD_0 = PT.WEKTYP_18
            UNION ALL
            select DISTINCT 20 WEEK,YEA_0, REFNUM_0,STRTIM0_0, ENDTIM0_0,STRTIM1_0, ENDTIM1_0,STRTIM0_1, ENDTIM0_1,STRTIM1_1, ENDTIM1_1,STRTIM0_2, ENDTIM0_2,STRTIM1_2, ENDTIM1_2,STRTIM0_3, ENDTIM0_3,STRTIM1_3, ENDTIM1_3,
            STRTIM0_4, ENDTIM0_4,STRTIM1_4, ENDTIM1_4,STRTIM0_5, ENDTIM0_5,STRTIM1_5, ENDTIM1_5,STRTIM0_6, ENDTIM0_6,STRTIM1_6, ENDTIM1_6,PLNTYP_0
            from x3peoplesql.[PEOPLELTEK].[EMPLOCTR] CT
            JOIN x3peoplesql.[PEOPLELTEK].PLANTYP PT ON PT.COD_0 = CT.PLNTYP_0
            JOIN x3peoplesql.[PEOPLELTEK].TYPWEEK PW0 ON PW0.COD_0 = PT.WEKTYP_19
            UNION ALL
            select DISTINCT 21 WEEK,YEA_0, REFNUM_0,STRTIM0_0, ENDTIM0_0,STRTIM1_0, ENDTIM1_0,STRTIM0_1, ENDTIM0_1,STRTIM1_1, ENDTIM1_1,STRTIM0_2, ENDTIM0_2,STRTIM1_2, ENDTIM1_2,STRTIM0_3, ENDTIM0_3,STRTIM1_3, ENDTIM1_3,
            STRTIM0_4, ENDTIM0_4,STRTIM1_4, ENDTIM1_4,STRTIM0_5, ENDTIM0_5,STRTIM1_5, ENDTIM1_5,STRTIM0_6, ENDTIM0_6,STRTIM1_6, ENDTIM1_6,PLNTYP_0
            from x3peoplesql.[PEOPLELTEK].[EMPLOCTR] CT
            JOIN x3peoplesql.[PEOPLELTEK].PLANTYP PT ON PT.COD_0 = CT.PLNTYP_0
            JOIN x3peoplesql.[PEOPLELTEK].TYPWEEK PW0 ON PW0.COD_0 = PT.WEKTYP_20
            UNION ALL
            select DISTINCT 22 WEEK,YEA_0, REFNUM_0,STRTIM0_0, ENDTIM0_0,STRTIM1_0, ENDTIM1_0,STRTIM0_1, ENDTIM0_1,STRTIM1_1, ENDTIM1_1,STRTIM0_2, ENDTIM0_2,STRTIM1_2, ENDTIM1_2,STRTIM0_3, ENDTIM0_3,STRTIM1_3, ENDTIM1_3,
            STRTIM0_4, ENDTIM0_4,STRTIM1_4, ENDTIM1_4,STRTIM0_5, ENDTIM0_5,STRTIM1_5, ENDTIM1_5,STRTIM0_6, ENDTIM0_6,STRTIM1_6, ENDTIM1_6,PLNTYP_0
            from x3peoplesql.[PEOPLELTEK].[EMPLOCTR] CT
            JOIN x3peoplesql.[PEOPLELTEK].PLANTYP PT ON PT.COD_0 = CT.PLNTYP_0
            JOIN x3peoplesql.[PEOPLELTEK].TYPWEEK PW0 ON PW0.COD_0 = PT.WEKTYP_21
            UNION ALL
            select DISTINCT 23 WEEK,YEA_0, REFNUM_0,STRTIM0_0, ENDTIM0_0,STRTIM1_0, ENDTIM1_0,STRTIM0_1, ENDTIM0_1,STRTIM1_1, ENDTIM1_1,STRTIM0_2, ENDTIM0_2,STRTIM1_2, ENDTIM1_2,STRTIM0_3, ENDTIM0_3,STRTIM1_3, ENDTIM1_3,
            STRTIM0_4, ENDTIM0_4,STRTIM1_4, ENDTIM1_4,STRTIM0_5, ENDTIM0_5,STRTIM1_5, ENDTIM1_5,STRTIM0_6, ENDTIM0_6,STRTIM1_6, ENDTIM1_6,PLNTYP_0
            from x3peoplesql.[PEOPLELTEK].[EMPLOCTR] CT
            JOIN x3peoplesql.[PEOPLELTEK].PLANTYP PT ON PT.COD_0 = CT.PLNTYP_0
            JOIN x3peoplesql.[PEOPLELTEK].TYPWEEK PW0 ON PW0.COD_0 = PT.WEKTYP_22
            UNION ALL
            select DISTINCT 24 WEEK,YEA_0, REFNUM_0,STRTIM0_0, ENDTIM0_0,STRTIM1_0, ENDTIM1_0,STRTIM0_1, ENDTIM0_1,STRTIM1_1, ENDTIM1_1,STRTIM0_2, ENDTIM0_2,STRTIM1_2, ENDTIM1_2,STRTIM0_3, ENDTIM0_3,STRTIM1_3, ENDTIM1_3,
            STRTIM0_4, ENDTIM0_4,STRTIM1_4, ENDTIM1_4,STRTIM0_5, ENDTIM0_5,STRTIM1_5, ENDTIM1_5,STRTIM0_6, ENDTIM0_6,STRTIM1_6, ENDTIM1_6,PLNTYP_0
            from x3peoplesql.[PEOPLELTEK].[EMPLOCTR] CT
            JOIN x3peoplesql.[PEOPLELTEK].PLANTYP PT ON PT.COD_0 = CT.PLNTYP_0
            JOIN x3peoplesql.[PEOPLELTEK].TYPWEEK PW0 ON PW0.COD_0 = PT.WEKTYP_23
            UNION ALL
            select DISTINCT 25 WEEK,YEA_0, REFNUM_0,STRTIM0_0, ENDTIM0_0,STRTIM1_0, ENDTIM1_0,STRTIM0_1, ENDTIM0_1,STRTIM1_1, ENDTIM1_1,STRTIM0_2, ENDTIM0_2,STRTIM1_2, ENDTIM1_2,STRTIM0_3, ENDTIM0_3,STRTIM1_3, ENDTIM1_3,
            STRTIM0_4, ENDTIM0_4,STRTIM1_4, ENDTIM1_4,STRTIM0_5, ENDTIM0_5,STRTIM1_5, ENDTIM1_5,STRTIM0_6, ENDTIM0_6,STRTIM1_6, ENDTIM1_6,PLNTYP_0
            from x3peoplesql.[PEOPLELTEK].[EMPLOCTR] CT
            JOIN x3peoplesql.[PEOPLELTEK].PLANTYP PT ON PT.COD_0 = CT.PLNTYP_0
            JOIN x3peoplesql.[PEOPLELTEK].TYPWEEK PW0 ON PW0.COD_0 = PT.WEKTYP_24
            UNION ALL
            select DISTINCT 26 WEEK,YEA_0, REFNUM_0,STRTIM0_0, ENDTIM0_0,STRTIM1_0, ENDTIM1_0,STRTIM0_1, ENDTIM0_1,STRTIM1_1, ENDTIM1_1,STRTIM0_2, ENDTIM0_2,STRTIM1_2, ENDTIM1_2,STRTIM0_3, ENDTIM0_3,STRTIM1_3, ENDTIM1_3,
            STRTIM0_4, ENDTIM0_4,STRTIM1_4, ENDTIM1_4,STRTIM0_5, ENDTIM0_5,STRTIM1_5, ENDTIM1_5,STRTIM0_6, ENDTIM0_6,STRTIM1_6, ENDTIM1_6,PLNTYP_0
            from x3peoplesql.[PEOPLELTEK].[EMPLOCTR] CT
            JOIN x3peoplesql.[PEOPLELTEK].PLANTYP PT ON PT.COD_0 = CT.PLNTYP_0
            JOIN x3peoplesql.[PEOPLELTEK].TYPWEEK PW0 ON PW0.COD_0 = PT.WEKTYP_25
            UNION ALL
            select DISTINCT 27 WEEK,YEA_0, REFNUM_0,STRTIM0_0, ENDTIM0_0,STRTIM1_0, ENDTIM1_0,STRTIM0_1, ENDTIM0_1,STRTIM1_1, ENDTIM1_1,STRTIM0_2, ENDTIM0_2,STRTIM1_2, ENDTIM1_2,STRTIM0_3, ENDTIM0_3,STRTIM1_3, ENDTIM1_3,
            STRTIM0_4, ENDTIM0_4,STRTIM1_4, ENDTIM1_4,STRTIM0_5, ENDTIM0_5,STRTIM1_5, ENDTIM1_5,STRTIM0_6, ENDTIM0_6,STRTIM1_6, ENDTIM1_6,PLNTYP_0
            from x3peoplesql.[PEOPLELTEK].[EMPLOCTR] CT
            JOIN x3peoplesql.[PEOPLELTEK].PLANTYP PT ON PT.COD_0 = CT.PLNTYP_0
            JOIN x3peoplesql.[PEOPLELTEK].TYPWEEK PW0 ON PW0.COD_0 = PT.WEKTYP_26
            UNION ALL
            select DISTINCT 28 WEEK,YEA_0, REFNUM_0,STRTIM0_0, ENDTIM0_0,STRTIM1_0, ENDTIM1_0,STRTIM0_1, ENDTIM0_1,STRTIM1_1, ENDTIM1_1,STRTIM0_2, ENDTIM0_2,STRTIM1_2, ENDTIM1_2,STRTIM0_3, ENDTIM0_3,STRTIM1_3, ENDTIM1_3,
            STRTIM0_4, ENDTIM0_4,STRTIM1_4, ENDTIM1_4,STRTIM0_5, ENDTIM0_5,STRTIM1_5, ENDTIM1_5,STRTIM0_6, ENDTIM0_6,STRTIM1_6, ENDTIM1_6,PLNTYP_0
            from x3peoplesql.[PEOPLELTEK].[EMPLOCTR] CT
            JOIN x3peoplesql.[PEOPLELTEK].PLANTYP PT ON PT.COD_0 = CT.PLNTYP_0
            JOIN x3peoplesql.[PEOPLELTEK].TYPWEEK PW0 ON PW0.COD_0 = PT.WEKTYP_27
            UNION ALL
            select DISTINCT 29 WEEK,YEA_0, REFNUM_0,STRTIM0_0, ENDTIM0_0,STRTIM1_0, ENDTIM1_0,STRTIM0_1, ENDTIM0_1,STRTIM1_1, ENDTIM1_1,STRTIM0_2, ENDTIM0_2,STRTIM1_2, ENDTIM1_2,STRTIM0_3, ENDTIM0_3,STRTIM1_3, ENDTIM1_3,
            STRTIM0_4, ENDTIM0_4,STRTIM1_4, ENDTIM1_4,STRTIM0_5, ENDTIM0_5,STRTIM1_5, ENDTIM1_5,STRTIM0_6, ENDTIM0_6,STRTIM1_6, ENDTIM1_6,PLNTYP_0
            from x3peoplesql.[PEOPLELTEK].[EMPLOCTR] CT
            JOIN x3peoplesql.[PEOPLELTEK].PLANTYP PT ON PT.COD_0 = CT.PLNTYP_0
            JOIN x3peoplesql.[PEOPLELTEK].TYPWEEK PW0 ON PW0.COD_0 = PT.WEKTYP_28
            UNION ALL
            select DISTINCT 30 WEEK,YEA_0, REFNUM_0,STRTIM0_0, ENDTIM0_0,STRTIM1_0, ENDTIM1_0,STRTIM0_1, ENDTIM0_1,STRTIM1_1, ENDTIM1_1,STRTIM0_2, ENDTIM0_2,STRTIM1_2, ENDTIM1_2,STRTIM0_3, ENDTIM0_3,STRTIM1_3, ENDTIM1_3,
            STRTIM0_4, ENDTIM0_4,STRTIM1_4, ENDTIM1_4,STRTIM0_5, ENDTIM0_5,STRTIM1_5, ENDTIM1_5,STRTIM0_6, ENDTIM0_6,STRTIM1_6, ENDTIM1_6,PLNTYP_0
            from x3peoplesql.[PEOPLELTEK].[EMPLOCTR] CT
            JOIN x3peoplesql.[PEOPLELTEK].PLANTYP PT ON PT.COD_0 = CT.PLNTYP_0
            JOIN x3peoplesql.[PEOPLELTEK].TYPWEEK PW0 ON PW0.COD_0 = PT.WEKTYP_29
            UNION ALL
            select DISTINCT 31 WEEK,YEA_0, REFNUM_0,STRTIM0_0, ENDTIM0_0,STRTIM1_0, ENDTIM1_0,STRTIM0_1, ENDTIM0_1,STRTIM1_1, ENDTIM1_1,STRTIM0_2, ENDTIM0_2,STRTIM1_2, ENDTIM1_2,STRTIM0_3, ENDTIM0_3,STRTIM1_3, ENDTIM1_3,
            STRTIM0_4, ENDTIM0_4,STRTIM1_4, ENDTIM1_4,STRTIM0_5, ENDTIM0_5,STRTIM1_5, ENDTIM1_5,STRTIM0_6, ENDTIM0_6,STRTIM1_6, ENDTIM1_6,PLNTYP_0
            from x3peoplesql.[PEOPLELTEK].[EMPLOCTR] CT
            JOIN x3peoplesql.[PEOPLELTEK].PLANTYP PT ON PT.COD_0 = CT.PLNTYP_0
            JOIN x3peoplesql.[PEOPLELTEK].TYPWEEK PW0 ON PW0.COD_0 = PT.WEKTYP_30
            UNION ALL
            select DISTINCT 32 WEEK,YEA_0, REFNUM_0,STRTIM0_0, ENDTIM0_0,STRTIM1_0, ENDTIM1_0,STRTIM0_1, ENDTIM0_1,STRTIM1_1, ENDTIM1_1,STRTIM0_2, ENDTIM0_2,STRTIM1_2, ENDTIM1_2,STRTIM0_3, ENDTIM0_3,STRTIM1_3, ENDTIM1_3,
            STRTIM0_4, ENDTIM0_4,STRTIM1_4, ENDTIM1_4,STRTIM0_5, ENDTIM0_5,STRTIM1_5, ENDTIM1_5,STRTIM0_6, ENDTIM0_6,STRTIM1_6, ENDTIM1_6,PLNTYP_0
            from x3peoplesql.[PEOPLELTEK].[EMPLOCTR] CT
            JOIN x3peoplesql.[PEOPLELTEK].PLANTYP PT ON PT.COD_0 = CT.PLNTYP_0
            JOIN x3peoplesql.[PEOPLELTEK].TYPWEEK PW0 ON PW0.COD_0 = PT.WEKTYP_31
            UNION ALL
            select DISTINCT 33 WEEK,YEA_0, REFNUM_0,STRTIM0_0, ENDTIM0_0,STRTIM1_0, ENDTIM1_0,STRTIM0_1, ENDTIM0_1,STRTIM1_1, ENDTIM1_1,STRTIM0_2, ENDTIM0_2,STRTIM1_2, ENDTIM1_2,STRTIM0_3, ENDTIM0_3,STRTIM1_3, ENDTIM1_3,
            STRTIM0_4, ENDTIM0_4,STRTIM1_4, ENDTIM1_4,STRTIM0_5, ENDTIM0_5,STRTIM1_5, ENDTIM1_5,STRTIM0_6, ENDTIM0_6,STRTIM1_6, ENDTIM1_6,PLNTYP_0
            from x3peoplesql.[PEOPLELTEK].[EMPLOCTR] CT
            JOIN x3peoplesql.[PEOPLELTEK].PLANTYP PT ON PT.COD_0 = CT.PLNTYP_0
            JOIN x3peoplesql.[PEOPLELTEK].TYPWEEK PW0 ON PW0.COD_0 = PT.WEKTYP_32
            UNION ALL
            select DISTINCT 34 WEEK,YEA_0, REFNUM_0,STRTIM0_0, ENDTIM0_0,STRTIM1_0, ENDTIM1_0,STRTIM0_1, ENDTIM0_1,STRTIM1_1, ENDTIM1_1,STRTIM0_2, ENDTIM0_2,STRTIM1_2, ENDTIM1_2,STRTIM0_3, ENDTIM0_3,STRTIM1_3, ENDTIM1_3,
            STRTIM0_4, ENDTIM0_4,STRTIM1_4, ENDTIM1_4,STRTIM0_5, ENDTIM0_5,STRTIM1_5, ENDTIM1_5,STRTIM0_6, ENDTIM0_6,STRTIM1_6, ENDTIM1_6,PLNTYP_0
            from x3peoplesql.[PEOPLELTEK].[EMPLOCTR] CT
            JOIN x3peoplesql.[PEOPLELTEK].PLANTYP PT ON PT.COD_0 = CT.PLNTYP_0
            JOIN x3peoplesql.[PEOPLELTEK].TYPWEEK PW0 ON PW0.COD_0 = PT.WEKTYP_33
            UNION ALL
            select DISTINCT 35 WEEK,YEA_0, REFNUM_0,STRTIM0_0, ENDTIM0_0,STRTIM1_0, ENDTIM1_0,STRTIM0_1, ENDTIM0_1,STRTIM1_1, ENDTIM1_1,STRTIM0_2, ENDTIM0_2,STRTIM1_2, ENDTIM1_2,STRTIM0_3, ENDTIM0_3,STRTIM1_3, ENDTIM1_3,
            STRTIM0_4, ENDTIM0_4,STRTIM1_4, ENDTIM1_4,STRTIM0_5, ENDTIM0_5,STRTIM1_5, ENDTIM1_5,STRTIM0_6, ENDTIM0_6,STRTIM1_6, ENDTIM1_6,PLNTYP_0
            from x3peoplesql.[PEOPLELTEK].[EMPLOCTR] CT
            JOIN x3peoplesql.[PEOPLELTEK].PLANTYP PT ON PT.COD_0 = CT.PLNTYP_0
            JOIN x3peoplesql.[PEOPLELTEK].TYPWEEK PW0 ON PW0.COD_0 = PT.WEKTYP_34
            UNION ALL
            select DISTINCT 36 WEEK,YEA_0, REFNUM_0,STRTIM0_0, ENDTIM0_0,STRTIM1_0, ENDTIM1_0,STRTIM0_1, ENDTIM0_1,STRTIM1_1, ENDTIM1_1,STRTIM0_2, ENDTIM0_2,STRTIM1_2, ENDTIM1_2,STRTIM0_3, ENDTIM0_3,STRTIM1_3, ENDTIM1_3,
            STRTIM0_4, ENDTIM0_4,STRTIM1_4, ENDTIM1_4,STRTIM0_5, ENDTIM0_5,STRTIM1_5, ENDTIM1_5,STRTIM0_6, ENDTIM0_6,STRTIM1_6, ENDTIM1_6,PLNTYP_0
            from x3peoplesql.[PEOPLELTEK].[EMPLOCTR] CT
            JOIN x3peoplesql.[PEOPLELTEK].PLANTYP PT ON PT.COD_0 = CT.PLNTYP_0
            JOIN x3peoplesql.[PEOPLELTEK].TYPWEEK PW0 ON PW0.COD_0 = PT.WEKTYP_35
            UNION ALL
            select DISTINCT 37 WEEK,YEA_0, REFNUM_0,STRTIM0_0, ENDTIM0_0,STRTIM1_0, ENDTIM1_0,STRTIM0_1, ENDTIM0_1,STRTIM1_1, ENDTIM1_1,STRTIM0_2, ENDTIM0_2,STRTIM1_2, ENDTIM1_2,STRTIM0_3, ENDTIM0_3,STRTIM1_3, ENDTIM1_3,
            STRTIM0_4, ENDTIM0_4,STRTIM1_4, ENDTIM1_4,STRTIM0_5, ENDTIM0_5,STRTIM1_5, ENDTIM1_5,STRTIM0_6, ENDTIM0_6,STRTIM1_6, ENDTIM1_6,PLNTYP_0
            from x3peoplesql.[PEOPLELTEK].[EMPLOCTR] CT
            JOIN x3peoplesql.[PEOPLELTEK].PLANTYP PT ON PT.COD_0 = CT.PLNTYP_0
            JOIN x3peoplesql.[PEOPLELTEK].TYPWEEK PW0 ON PW0.COD_0 = PT.WEKTYP_36
            UNION ALL
            select DISTINCT 38 WEEK,YEA_0, REFNUM_0,STRTIM0_0, ENDTIM0_0,STRTIM1_0, ENDTIM1_0,STRTIM0_1, ENDTIM0_1,STRTIM1_1, ENDTIM1_1,STRTIM0_2, ENDTIM0_2,STRTIM1_2, ENDTIM1_2,STRTIM0_3, ENDTIM0_3,STRTIM1_3, ENDTIM1_3,
            STRTIM0_4, ENDTIM0_4,STRTIM1_4, ENDTIM1_4,STRTIM0_5, ENDTIM0_5,STRTIM1_5, ENDTIM1_5,STRTIM0_6, ENDTIM0_6,STRTIM1_6, ENDTIM1_6,PLNTYP_0
            from x3peoplesql.[PEOPLELTEK].[EMPLOCTR] CT
            JOIN x3peoplesql.[PEOPLELTEK].PLANTYP PT ON PT.COD_0 = CT.PLNTYP_0
            JOIN x3peoplesql.[PEOPLELTEK].TYPWEEK PW0 ON PW0.COD_0 = PT.WEKTYP_37
            UNION ALL
            select DISTINCT 39 WEEK,YEA_0, REFNUM_0,STRTIM0_0, ENDTIM0_0,STRTIM1_0, ENDTIM1_0,STRTIM0_1, ENDTIM0_1,STRTIM1_1, ENDTIM1_1,STRTIM0_2, ENDTIM0_2,STRTIM1_2, ENDTIM1_2,STRTIM0_3, ENDTIM0_3,STRTIM1_3, ENDTIM1_3,
            STRTIM0_4, ENDTIM0_4,STRTIM1_4, ENDTIM1_4,STRTIM0_5, ENDTIM0_5,STRTIM1_5, ENDTIM1_5,STRTIM0_6, ENDTIM0_6,STRTIM1_6, ENDTIM1_6,PLNTYP_0
            from x3peoplesql.[PEOPLELTEK].[EMPLOCTR] CT
            JOIN x3peoplesql.[PEOPLELTEK].PLANTYP PT ON PT.COD_0 = CT.PLNTYP_0
            JOIN x3peoplesql.[PEOPLELTEK].TYPWEEK PW0 ON PW0.COD_0 = PT.WEKTYP_38
            UNION ALL
            select DISTINCT 40 WEEK,YEA_0, REFNUM_0,STRTIM0_0, ENDTIM0_0,STRTIM1_0, ENDTIM1_0,STRTIM0_1, ENDTIM0_1,STRTIM1_1, ENDTIM1_1,STRTIM0_2, ENDTIM0_2,STRTIM1_2, ENDTIM1_2,STRTIM0_3, ENDTIM0_3,STRTIM1_3, ENDTIM1_3,
            STRTIM0_4, ENDTIM0_4,STRTIM1_4, ENDTIM1_4,STRTIM0_5, ENDTIM0_5,STRTIM1_5, ENDTIM1_5,STRTIM0_6, ENDTIM0_6,STRTIM1_6, ENDTIM1_6,PLNTYP_0
            from x3peoplesql.[PEOPLELTEK].[EMPLOCTR] CT
            JOIN x3peoplesql.[PEOPLELTEK].PLANTYP PT ON PT.COD_0 = CT.PLNTYP_0
            JOIN x3peoplesql.[PEOPLELTEK].TYPWEEK PW0 ON PW0.COD_0 = PT.WEKTYP_39
            UNION ALL
            select DISTINCT 41 WEEK,YEA_0, REFNUM_0,STRTIM0_0, ENDTIM0_0,STRTIM1_0, ENDTIM1_0,STRTIM0_1, ENDTIM0_1,STRTIM1_1, ENDTIM1_1,STRTIM0_2, ENDTIM0_2,STRTIM1_2, ENDTIM1_2,STRTIM0_3, ENDTIM0_3,STRTIM1_3, ENDTIM1_3,
            STRTIM0_4, ENDTIM0_4,STRTIM1_4, ENDTIM1_4,STRTIM0_5, ENDTIM0_5,STRTIM1_5, ENDTIM1_5,STRTIM0_6, ENDTIM0_6,STRTIM1_6, ENDTIM1_6,PLNTYP_0
            from x3peoplesql.[PEOPLELTEK].[EMPLOCTR] CT
            JOIN x3peoplesql.[PEOPLELTEK].PLANTYP PT ON PT.COD_0 = CT.PLNTYP_0
            JOIN x3peoplesql.[PEOPLELTEK].TYPWEEK PW0 ON PW0.COD_0 = PT.WEKTYP_40
            UNION ALL
            select DISTINCT 42 WEEK,YEA_0, REFNUM_0,STRTIM0_0, ENDTIM0_0,STRTIM1_0, ENDTIM1_0,STRTIM0_1, ENDTIM0_1,STRTIM1_1, ENDTIM1_1,STRTIM0_2, ENDTIM0_2,STRTIM1_2, ENDTIM1_2,STRTIM0_3, ENDTIM0_3,STRTIM1_3, ENDTIM1_3,
            STRTIM0_4, ENDTIM0_4,STRTIM1_4, ENDTIM1_4,STRTIM0_5, ENDTIM0_5,STRTIM1_5, ENDTIM1_5,STRTIM0_6, ENDTIM0_6,STRTIM1_6, ENDTIM1_6,PLNTYP_0
            from x3peoplesql.[PEOPLELTEK].[EMPLOCTR] CT
            JOIN x3peoplesql.[PEOPLELTEK].PLANTYP PT ON PT.COD_0 = CT.PLNTYP_0
            JOIN x3peoplesql.[PEOPLELTEK].TYPWEEK PW0 ON PW0.COD_0 = PT.WEKTYP_41
            UNION ALL
            select DISTINCT 43 WEEK,YEA_0, REFNUM_0,STRTIM0_0, ENDTIM0_0,STRTIM1_0, ENDTIM1_0,STRTIM0_1, ENDTIM0_1,STRTIM1_1, ENDTIM1_1,STRTIM0_2, ENDTIM0_2,STRTIM1_2, ENDTIM1_2,STRTIM0_3, ENDTIM0_3,STRTIM1_3, ENDTIM1_3,
            STRTIM0_4, ENDTIM0_4,STRTIM1_4, ENDTIM1_4,STRTIM0_5, ENDTIM0_5,STRTIM1_5, ENDTIM1_5,STRTIM0_6, ENDTIM0_6,STRTIM1_6, ENDTIM1_6,PLNTYP_0
            from x3peoplesql.[PEOPLELTEK].[EMPLOCTR] CT
            JOIN x3peoplesql.[PEOPLELTEK].PLANTYP PT ON PT.COD_0 = CT.PLNTYP_0
            JOIN x3peoplesql.[PEOPLELTEK].TYPWEEK PW0 ON PW0.COD_0 = PT.WEKTYP_42
            UNION ALL
            select DISTINCT 44 WEEK,YEA_0, REFNUM_0,STRTIM0_0, ENDTIM0_0,STRTIM1_0, ENDTIM1_0,STRTIM0_1, ENDTIM0_1,STRTIM1_1, ENDTIM1_1,STRTIM0_2, ENDTIM0_2,STRTIM1_2, ENDTIM1_2,STRTIM0_3, ENDTIM0_3,STRTIM1_3, ENDTIM1_3,
            STRTIM0_4, ENDTIM0_4,STRTIM1_4, ENDTIM1_4,STRTIM0_5, ENDTIM0_5,STRTIM1_5, ENDTIM1_5,STRTIM0_6, ENDTIM0_6,STRTIM1_6, ENDTIM1_6,PLNTYP_0
            from x3peoplesql.[PEOPLELTEK].[EMPLOCTR] CT
            JOIN x3peoplesql.[PEOPLELTEK].PLANTYP PT ON PT.COD_0 = CT.PLNTYP_0
            JOIN x3peoplesql.[PEOPLELTEK].TYPWEEK PW0 ON PW0.COD_0 = PT.WEKTYP_43
            UNION ALL
            select DISTINCT 45 WEEK,YEA_0, REFNUM_0,STRTIM0_0, ENDTIM0_0,STRTIM1_0, ENDTIM1_0,STRTIM0_1, ENDTIM0_1,STRTIM1_1, ENDTIM1_1,STRTIM0_2, ENDTIM0_2,STRTIM1_2, ENDTIM1_2,STRTIM0_3, ENDTIM0_3,STRTIM1_3, ENDTIM1_3,
            STRTIM0_4, ENDTIM0_4,STRTIM1_4, ENDTIM1_4,STRTIM0_5, ENDTIM0_5,STRTIM1_5, ENDTIM1_5,STRTIM0_6, ENDTIM0_6,STRTIM1_6, ENDTIM1_6,PLNTYP_0
            from x3peoplesql.[PEOPLELTEK].[EMPLOCTR] CT
            JOIN x3peoplesql.[PEOPLELTEK].PLANTYP PT ON PT.COD_0 = CT.PLNTYP_0
            JOIN x3peoplesql.[PEOPLELTEK].TYPWEEK PW0 ON PW0.COD_0 = PT.WEKTYP_44
            UNION ALL
            select DISTINCT 46 WEEK,YEA_0, REFNUM_0,STRTIM0_0, ENDTIM0_0,STRTIM1_0, ENDTIM1_0,STRTIM0_1, ENDTIM0_1,STRTIM1_1, ENDTIM1_1,STRTIM0_2, ENDTIM0_2,STRTIM1_2, ENDTIM1_2,STRTIM0_3, ENDTIM0_3,STRTIM1_3, ENDTIM1_3,
            STRTIM0_4, ENDTIM0_4,STRTIM1_4, ENDTIM1_4,STRTIM0_5, ENDTIM0_5,STRTIM1_5, ENDTIM1_5,STRTIM0_6, ENDTIM0_6,STRTIM1_6, ENDTIM1_6,PLNTYP_0
            from x3peoplesql.[PEOPLELTEK].[EMPLOCTR] CT
            JOIN x3peoplesql.[PEOPLELTEK].PLANTYP PT ON PT.COD_0 = CT.PLNTYP_0
            JOIN x3peoplesql.[PEOPLELTEK].TYPWEEK PW0 ON PW0.COD_0 = PT.WEKTYP_45
            UNION ALL
            select DISTINCT 47 WEEK,YEA_0, REFNUM_0,STRTIM0_0, ENDTIM0_0,STRTIM1_0, ENDTIM1_0,STRTIM0_1, ENDTIM0_1,STRTIM1_1, ENDTIM1_1,STRTIM0_2, ENDTIM0_2,STRTIM1_2, ENDTIM1_2,STRTIM0_3, ENDTIM0_3,STRTIM1_3, ENDTIM1_3,
            STRTIM0_4, ENDTIM0_4,STRTIM1_4, ENDTIM1_4,STRTIM0_5, ENDTIM0_5,STRTIM1_5, ENDTIM1_5,STRTIM0_6, ENDTIM0_6,STRTIM1_6, ENDTIM1_6,PLNTYP_0
            from x3peoplesql.[PEOPLELTEK].[EMPLOCTR] CT
            JOIN x3peoplesql.[PEOPLELTEK].PLANTYP PT ON PT.COD_0 = CT.PLNTYP_0
            JOIN x3peoplesql.[PEOPLELTEK].TYPWEEK PW0 ON PW0.COD_0 = PT.WEKTYP_46
            UNION ALL
            select DISTINCT 48 WEEK,YEA_0, REFNUM_0,STRTIM0_0, ENDTIM0_0,STRTIM1_0, ENDTIM1_0,STRTIM0_1, ENDTIM0_1,STRTIM1_1, ENDTIM1_1,STRTIM0_2, ENDTIM0_2,STRTIM1_2, ENDTIM1_2,STRTIM0_3, ENDTIM0_3,STRTIM1_3, ENDTIM1_3,
            STRTIM0_4, ENDTIM0_4,STRTIM1_4, ENDTIM1_4,STRTIM0_5, ENDTIM0_5,STRTIM1_5, ENDTIM1_5,STRTIM0_6, ENDTIM0_6,STRTIM1_6, ENDTIM1_6,PLNTYP_0
            from x3peoplesql.[PEOPLELTEK].[EMPLOCTR] CT
            JOIN x3peoplesql.[PEOPLELTEK].PLANTYP PT ON PT.COD_0 = CT.PLNTYP_0
            JOIN x3peoplesql.[PEOPLELTEK].TYPWEEK PW0 ON PW0.COD_0 = PT.WEKTYP_47
            UNION ALL
            select DISTINCT 49 WEEK,YEA_0, REFNUM_0,STRTIM0_0, ENDTIM0_0,STRTIM1_0, ENDTIM1_0,STRTIM0_1, ENDTIM0_1,STRTIM1_1, ENDTIM1_1,STRTIM0_2, ENDTIM0_2,STRTIM1_2, ENDTIM1_2,STRTIM0_3, ENDTIM0_3,STRTIM1_3, ENDTIM1_3,
            STRTIM0_4, ENDTIM0_4,STRTIM1_4, ENDTIM1_4,STRTIM0_5, ENDTIM0_5,STRTIM1_5, ENDTIM1_5,STRTIM0_6, ENDTIM0_6,STRTIM1_6, ENDTIM1_6,PLNTYP_0
            from x3peoplesql.[PEOPLELTEK].[EMPLOCTR] CT
            JOIN x3peoplesql.[PEOPLELTEK].PLANTYP PT ON PT.COD_0 = CT.PLNTYP_0
            JOIN x3peoplesql.[PEOPLELTEK].TYPWEEK PW0 ON PW0.COD_0 = PT.WEKTYP_48
            UNION ALL
            select DISTINCT 50 WEEK,YEA_0, REFNUM_0,STRTIM0_0, ENDTIM0_0,STRTIM1_0, ENDTIM1_0,STRTIM0_1, ENDTIM0_1,STRTIM1_1, ENDTIM1_1,STRTIM0_2, ENDTIM0_2,STRTIM1_2, ENDTIM1_2,STRTIM0_3, ENDTIM0_3,STRTIM1_3, ENDTIM1_3,
            STRTIM0_4, ENDTIM0_4,STRTIM1_4, ENDTIM1_4,STRTIM0_5, ENDTIM0_5,STRTIM1_5, ENDTIM1_5,STRTIM0_6, ENDTIM0_6,STRTIM1_6, ENDTIM1_6,PLNTYP_0
            from x3peoplesql.[PEOPLELTEK].[EMPLOCTR] CT
            JOIN x3peoplesql.[PEOPLELTEK].PLANTYP PT ON PT.COD_0 = CT.PLNTYP_0
            JOIN x3peoplesql.[PEOPLELTEK].TYPWEEK PW0 ON PW0.COD_0 = PT.WEKTYP_49
            UNION ALL
            select DISTINCT 51 WEEK,YEA_0, REFNUM_0,STRTIM0_0, ENDTIM0_0,STRTIM1_0, ENDTIM1_0,STRTIM0_1, ENDTIM0_1,STRTIM1_1, ENDTIM1_1,STRTIM0_2, ENDTIM0_2,STRTIM1_2, ENDTIM1_2,STRTIM0_3, ENDTIM0_3,STRTIM1_3, ENDTIM1_3,
            STRTIM0_4, ENDTIM0_4,STRTIM1_4, ENDTIM1_4,STRTIM0_5, ENDTIM0_5,STRTIM1_5, ENDTIM1_5,STRTIM0_6, ENDTIM0_6,STRTIM1_6, ENDTIM1_6,PLNTYP_0
            from x3peoplesql.[PEOPLELTEK].[EMPLOCTR] CT
            JOIN x3peoplesql.[PEOPLELTEK].PLANTYP PT ON PT.COD_0 = CT.PLNTYP_0
            JOIN x3peoplesql.[PEOPLELTEK].TYPWEEK PW0 ON PW0.COD_0 = PT.WEKTYP_50
            UNION ALL
            select DISTINCT 52 WEEK,YEA_0, REFNUM_0,STRTIM0_0, ENDTIM0_0,STRTIM1_0, ENDTIM1_0,STRTIM0_1, ENDTIM0_1,STRTIM1_1, ENDTIM1_1,STRTIM0_2, ENDTIM0_2,STRTIM1_2, ENDTIM1_2,STRTIM0_3, ENDTIM0_3,STRTIM1_3, ENDTIM1_3,
            STRTIM0_4, ENDTIM0_4,STRTIM1_4, ENDTIM1_4,STRTIM0_5, ENDTIM0_5,STRTIM1_5, ENDTIM1_5,STRTIM0_6, ENDTIM0_6,STRTIM1_6, ENDTIM1_6,PLNTYP_0
            from x3peoplesql.[PEOPLELTEK].[EMPLOCTR] CT
            JOIN x3peoplesql.[PEOPLELTEK].PLANTYP PT ON PT.COD_0 = CT.PLNTYP_0
            JOIN x3peoplesql.[PEOPLELTEK].TYPWEEK PW0 ON PW0.COD_0 = PT.WEKTYP_51
            UNION ALL
            select DISTINCT 53 WEEK,YEA_0, REFNUM_0,STRTIM0_0, ENDTIM0_0,STRTIM1_0, ENDTIM1_0,STRTIM0_1, ENDTIM0_1,STRTIM1_1, ENDTIM1_1,STRTIM0_2, ENDTIM0_2,STRTIM1_2, ENDTIM1_2,STRTIM0_3, ENDTIM0_3,STRTIM1_3, ENDTIM1_3,
            STRTIM0_4, ENDTIM0_4,STRTIM1_4, ENDTIM1_4,STRTIM0_5, ENDTIM0_5,STRTIM1_5, ENDTIM1_5,STRTIM0_6, ENDTIM0_6,STRTIM1_6, ENDTIM1_6,PLNTYP_0
            from x3peoplesql.[PEOPLELTEK].[EMPLOCTR] CT
            JOIN x3peoplesql.[PEOPLELTEK].PLANTYP PT ON PT.COD_0 = CT.PLNTYP_0
            JOIN x3peoplesql.[PEOPLELTEK].TYPWEEK PW0 ON PW0.COD_0 = PT.WEKTYP_52
            ) T 
            JOIN x3peoplesql.[PEOPLELTEK].EMPLOID EID on EID.REFNUM_0 = T.REFNUM_0
            {f.text} {fmulti["text"]}
            --WHERE T.REFNUM_0='F00085' -- AND YEA_0=2020
            ) MyTable
            CROSS APPLY (
            SELECT DAY_ORDER,DAYWEEK,EN_MANHA,SA_MANHA,EN_TARDE,SA_TARDE
            FROM (VALUES
                (0,2,[STRTIM0_0],[ENDTIM0_0],[STRTIM1_0],[ENDTIM1_0]),
                (1,3,[STRTIM0_1],[ENDTIM0_1],[STRTIM1_1],[ENDTIM1_1]),
                (2,4,[STRTIM0_2],[ENDTIM0_2],[STRTIM1_2],[ENDTIM1_2]),
                (3,5,[STRTIM0_3],[ENDTIM0_3],[STRTIM1_3],[ENDTIM1_3]),
                (4,6,[STRTIM0_4],[ENDTIM0_4],[STRTIM1_4],[ENDTIM1_4]),
                (5,7,[STRTIM0_5],[ENDTIM0_5],[STRTIM1_5],[ENDTIM1_5]),
                (6,1,[STRTIM0_6],[ENDTIM0_6],[STRTIM1_6],[ENDTIM1_6])
            ) AS [SourceTable](DAY_ORDER,DAYWEEK,EN_MANHA,SA_MANHA,EN_TARDE,SA_TARDE)
            ) AS [UnpivotTable]
            ) H
            JOIN CALENDAR AS C ON C.wday=H.DAYWEEK and C.isoy=H.YEA_0 AND C.isowyear=H.WEEK
            {f2.text} {fmonths.text}
            {s(dql.sort)} {p(dql.paging)} {p(dql.limit)}
            OPTION(MAXRECURSION 400)
            
        """
    )
    if ("export" in request.data["parameters"]):
        dql.limit=f"""OFFSET 0 ROWS FETCH NEXT {request.data["parameters"]["limit"]} ROWS ONLY"""
        dql.paging=""
        dql.sort = " ORDER BY(date) " if dql.sort == " ORDER BY(SELECT NULL) " else dql.sort #Obrigatório se PAGING em sqlserver
        return export(sql(lambda v:v,lambda v:v,lambda v:v), db_parameters=parameters, parameters={**request.data["parameters"],"filter":request.data.get('filter')},conn_name=AppSettings.reportConn["sage"],dbi=dbmssql,conn=connection)
    try:
        response = dbmssql.executeList(sql, connection, parameters,[],None,None)
    except Exception as error:
        print(str(error))
        return Response({"status": "error", "title": str(error)})
    return Response(response)    




def GetCameraRecords(request, format=None):
    records = []
    parameters = request.data['parameters']
    if parameters.get('date') and parameters.get('num'):
        path = os.path.join(parameters.get('date'),parameters.get('num'))        
        files = os.listdir(os.path.join(records_base_path,path))
        # Create a list of tuples where each tuple contains the filename and its modification time
        file_times = [(f, datetime.fromtimestamp(os.path.getmtime(os.path.join(os.path.join(records_base_path,path), f)))) for f in files]
        # Sort the list of tuples by the modification time
        file_times_sorted = sorted(file_times, key=lambda x: x[1])        
        for f in file_times_sorted:
            filename = f[0]
            v = datetime.strptime(filename.replace(".jpg",""), '%Y%m%d.%H%M%S').strftime("%Y-%m-%d %H:%M:%S")
            records.append({"filename":os.path.join(path,filename).replace("\\","/"),"tstamp":v})
    return Response(records)




# mapeamento de pastas/dep
DEPT_MAPPING = {
    'DAF': 'Contabilidade e Financeiro',
    'DSE': 'Manutenção e SI',
    'DPLAN': 'Planeamento',
    'DPROD': 'Produção',
    'DQUAL': 'Qualidade',
    'DRH': 'RH',
    'DTEC': 'Técnico'
}

#caminho para a pasta alterar mais tarde para Picagem 2026
BASE_PATH = '/mnt/Picagem/Picagem 2026_2'

#helpers

def parse_date_field(date_val):
    if isinstance(date_val, str):
        return date_val[:10]
    if hasattr(date_val, 'strftime'):
        return date_val.strftime('%Y-%m-%d')
    return str(date_val)[:10]


def parse_datetime_field(dt_val):
    if isinstance(dt_val, datetime):
        return dt_val
    if isinstance(dt_val, str):
        try:
            return datetime.strptime(dt_val[:19], '%Y-%m-%d %H:%M:%S')
        except (ValueError, TypeError):
            return None
    return None


def is_midnight(dt_obj):
    if not dt_obj:
        return False
    return dt_obj.hour == 0 and dt_obj.minute == 0 and dt_obj.second == 0


def format_fnum_filter(fnum_filter):
    if not fnum_filter:
        return None
    
    fnum_filter = fnum_filter.strip()
    
    if '%' in fnum_filter:
        return fnum_filter
    
    if fnum_filter.isdigit():
        return f"F{fnum_filter.zfill(5)}"
    
    if fnum_filter.startswith('F') and len(fnum_filter) < 6:
        num_part = fnum_filter[1:]
        if num_part.isdigit():
            return f"F{num_part.zfill(5)}"
    
    return fnum_filter


#region FUNÇÕES PARA AJUSTE DE TURNO NOTURNO

def _extract_date_str(dts):
    if isinstance(dts, str):
        return dts.split(' ')[0] if ' ' in dts else dts[:10]
    elif isinstance(dts, datetime):
        return dts.strftime('%Y-%m-%d')
    elif hasattr(dts, 'date'):
        return dts.date().isoformat()
    elif hasattr(dts, 'strftime'):
        return dts.strftime('%Y-%m-%d')
    else:
        return str(dts)[:10]


def _parse_datetime_safe(valor):
    if isinstance(valor, str):
        try:
            return datetime.strptime(valor[:19], '%Y-%m-%d %H:%M:%S')
        except (ValueError, TypeError, IndexError):
            return None
    elif isinstance(valor, datetime):
        return valor
    elif hasattr(valor, 'to_pydatetime'):
        return valor.to_pydatetime()
    return None


def _is_midnight(dt_obj):
    if not dt_obj:
        return False
    return dt_obj.hour == 0 and dt_obj.minute == 0 and dt_obj.second == 0


def _extrair_picagens(registo):
    picagens = []
    for i in range(1, 9):
        ss_key = f'ss_{i:02d}'
        ss_val = registo.get(ss_key)
        if ss_val:
            dt = _parse_datetime_safe(ss_val)
            if dt and not _is_midnight(dt):
                picagens.append({
                    'valor': ss_val,
                    'datetime': dt,
                    'hora': dt.hour,
                    'indice': i
                })
    return sorted(picagens, key=lambda x: x['datetime'])


def ajustar_picagens_turno_noturno(registos_db):
    if not registos_db:
        return registos_db
    
    print("\n" + "="*70)
    print("="*70)
    
    # Converter para dicts
    registos = []
    for reg in registos_db:
        if isinstance(reg, dict):
            registos.append(reg.copy())
        else:
            registos.append(dict(reg))
    
    # reordenar picagens em cada registo 
    print("reordenar picagens em cada registo")
    
    for registo in registos:
        picagens = _extrair_picagens(registo)
        
        if picagens:
            picagens_sorted = sorted(picagens, key=lambda x: x['datetime'])
            
            for i in range(1, 9):
                registo[f'ss_{i:02d}'] = None
            
            for idx, pic in enumerate(picagens_sorted[:8]):
                registo[f'ss_{(idx+1):02d}'] = pic['valor']
    
    # criar índice por (num, data) 
    print("criar índice de registos")
    
    indice_registos = {}
    for reg in registos:
        num = str(reg.get('num', '')).strip()
        data = _extract_date_str(reg.get('dts'))
        chave = (num, data)
        indice_registos[chave] = reg
    
    print(f"  Total de registos únicos: {len(indice_registos)}")
    
    #  combinar múltiplos registos do mesmo dia 
    print(" Combinando múltiplos registos do mesmo dia...")
    
    for chave, registo in list(indice_registos.items()):
        num, data = chave
        picagens = _extrair_picagens(registo)
        
        if not picagens:
            continue
        
        picagens_sorted = sorted(picagens, key=lambda x: x['datetime'])
        
        for i in range(1, 9):
            registo[f'ss_{i:02d}'] = None
        
        for idx, pic in enumerate(picagens_sorted[:8]):
            registo[f'ss_{(idx+1):02d}'] = pic['valor']
    
    print("Reassigning punches based on time...")
    
    new_indice = {}
    
    for (num, data), registo in indice_registos.items():
        picagens = _extrair_picagens(registo)
        
        for pic in picagens:
            punch_date = pic['datetime'].date()
            
            # Move 00:00-07:59 to previous day
            if 0 <= pic['hora'] < 8:
                adjusted_date = punch_date - timedelta(days=1)
            # Move 23:00-23:59 to next day
            elif 23 <= pic['hora'] <= 23:
                adjusted_date = punch_date + timedelta(days=1)
            # Keep 08:00-22:59 on original day
            else:
                adjusted_date = punch_date
            
            adjusted_date_str = adjusted_date.isoformat()
            chave = (num, adjusted_date_str)
            
            # Create or get the adjusted day's record
            if chave not in new_indice:
                new_indice[chave] = {
                    'num': num,
                    'dts': adjusted_date_str,
                    'dep': registo.get('dep', ''),
                    'tp_hor': registo.get('tp_hor', ''),
                    'ss_01': None, 'ss_02': None, 'ss_03': None, 'ss_04': None,
                    'ss_05': None, 'ss_06': None, 'ss_07': None, 'ss_08': None
                }
            
            # Add the punch to the adjusted day's record (next available slot)
            for i in range(1, 9):
                if new_indice[chave][f'ss_{i:02d}'] is None:
                    new_indice[chave][f'ss_{i:02d}'] = pic['valor']
                    break
    
    # Sort punches in each new record
    for registo in new_indice.values():
        picagens = _extrair_picagens(registo)
        if picagens:
            picagens_sorted = sorted(picagens, key=lambda x: x['datetime'])
            for i in range(1, 9):
                registo[f'ss_{i:02d}'] = None
            for idx, pic in enumerate(picagens_sorted[:8]):
                registo[f'ss_{(idx+1):02d}'] = pic['valor']

    registos_finais = list(new_indice.values())
    
    print("\n" + "="*70)
    print(f" CONCLUÍDO: {len(registos_finais)} registos finais")
    print("="*70 + "\n")
    
    return registos_finais


def load_template_workbook(dept_code):
    """Carrega o workbook template do departamento"""
    dept_folder = DEPT_MAPPING.get(dept_code)
    if not dept_folder:
        return None
    
    template_path = os.path.join(BASE_PATH, dept_folder, 'template.xlsx')
    
    if not os.path.exists(template_path):
        return None
    
    try:
        return openpyxl.load_workbook(template_path)
    except Exception as e:
        print(f" Erro ao carregar template para {dept_code}: {str(e)}")
        return None


# ===== FUNÇÕES DE EXPORT =====

def _export_normal(registos_db, funcionarios_dict, start_dt, end_dt, d_start_str, d_end_str, fnum_filter):
    
    registos_por_funcionario = {}
    for registo in registos_db:
        num = registo.get('num', '').strip()
        data_str = parse_date_field(registo.get('dts'))
        
        if num not in registos_por_funcionario:
            registos_por_funcionario[num] = {}
        
        registos_por_funcionario[num][data_str] = registo
    
    wb = openpyxl.Workbook()
    wb.remove(wb.active)
    
    dias_pt = [
        "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira",
        "Sexta-feira", "Sábado", "Domingo"
    ]
    headers = [
        'Nº', 'Departamento', 'Tipo Horário', 'Data', 'Dia da Semana',
        'P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7', 'P8', 'Duração'
    ]
    
    for num_func in sorted(registos_por_funcionario.keys()):
        nome_func = funcionarios_dict.get(num_func, num_func)
        registos_func = registos_por_funcionario[num_func]
        
        sheet_name = nome_func[:31]
        for char in ['/', '\\', ':', '*', '?', '[', ']']:
            sheet_name = sheet_name.replace(char, '-')
        
        if not sheet_name or sheet_name in [s.title for s in wb.worksheets]:
            sheet_name = num_func
        
        ws = wb.create_sheet(title=sheet_name)
        
        header_fill = PatternFill(
            start_color="4472C4", end_color="4472C4", fill_type="solid"
        )
        header_font = Font(bold=True, size=11, color="FFFFFF")
        
        for i, text in enumerate(headers, 1):
            cell = ws.cell(row=1, column=i, value=text)
            cell.font = header_font
            cell.fill = header_fill
            cell.alignment = Alignment(horizontal='center', vertical='center')
        
        row_idx = 2
        curr_dt = start_dt
        
        while curr_dt <= end_dt:
            data_str = curr_dt.strftime('%Y-%m-%d')
            registo = registos_func.get(data_str, {})
            
            ws.cell(row=row_idx, column=1, value=num_func)
            ws.cell(row=row_idx, column=2, value=registo.get('dep', '').strip() if registo else '')
            ws.cell(row=row_idx, column=3, value=registo.get('tp_hor', '').strip() if registo else '')
            
            cell_data = ws.cell(row=row_idx, column=4, value=curr_dt)
            cell_data.number_format = 'DD/MM/YYYY'
            cell_data.alignment = Alignment(horizontal='center')
            
            ws.cell(row=row_idx, column=5, value=dias_pt[curr_dt.weekday()])
            
            picagens = []
            tem_picagens = False
            for i in range(1, 9):
                ss_key = f'ss_{i:02d}'
                ss_val = registo.get(ss_key) if registo else None
                
                if ss_val:
                    dt_pic = parse_datetime_field(ss_val)
                    if dt_pic and not is_midnight(dt_pic):
                        cell = ws.cell(row=row_idx, column=5 + i, value=dt_pic)
                        cell.number_format = 'YYYY-MM-DD HH:MM:SS'
                        cell.alignment = Alignment(horizontal='center')
                        picagens.append(dt_pic)
                        tem_picagens = True
            
            # Cálculo de duração
            r = row_idx
            if tem_picagens and len(picagens) >= 2:
                formula = (
                    f'=('
                    f'IF(AND(F{r}<>"",G{r}<>""),G{r}-F{r},0)+'
                    f'IF(AND(H{r}<>"",I{r}<>""),I{r}-H{r},0)+'
                    f'IF(AND(J{r}<>"",K{r}<>""),K{r}-J{r},0)+'
                    f'IF(AND(L{r}<>"",M{r}<>""),M{r}-L{r},0)'
                    f'-IF(('
                    f'IF(AND(F{r}<>"",G{r}<>""),1,0)+'
                    f'IF(AND(H{r}<>"",I{r}<>""),1,0)+'
                    f'IF(AND(J{r}<>"",K{r}<>""),1,0)+'
                    f'IF(AND(L{r}<>"",M{r}<>""),1,0)'
                    f')>0,1/24,0)'
                    f')'
                )
                dur_cell = ws.cell(row=r, column=14, value=formula)
                dur_cell.number_format = '[h]:mm'
                dur_cell.alignment = Alignment(horizontal='center')
            
            # Formatação
            is_weekend = curr_dt.weekday() >= 5
            weekend_fill = PatternFill(
                start_color="F2F2F2", end_color="F2F2F2", fill_type="solid"
            )
            no_punch_fill = PatternFill(
                start_color="FFF9E6", end_color="FFF9E6", fill_type="solid"
            )
            
            for c in range(1, 15):
                cell = ws.cell(row=row_idx, column=c)
                if is_weekend:
                    cell.fill = weekend_fill
                elif not tem_picagens:
                    cell.fill = no_punch_fill
            
            curr_dt += timedelta(days=1)
            row_idx += 1
        
        # Ajuste de colunas
        ws.column_dimensions['A'].width = 12
        ws.column_dimensions['B'].width = 15
        ws.column_dimensions['C'].width = 15
        ws.column_dimensions['D'].width = 12
        ws.column_dimensions['E'].width = 18
        for col in ['F', 'G', 'H', 'I', 'J', 'K', 'L', 'M']:
            ws.column_dimensions[col].width = 20
        ws.column_dimensions['N'].width = 12
    
    output = BytesIO()
    wb.save(output)
    output.seek(0)
    
    if fnum_filter:
        filename = f'Picagens_{fnum_filter}_{d_start_str}_a_{d_end_str}.xlsx'
    else:
        filename = f'Picagens_{d_start_str}_a_{d_end_str}.xlsx'
    
    response = HttpResponse(
        output.getvalue(),
        content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )
    response['Content-Disposition'] = f'attachment; filename={filename}'
    
    print(f" Exportação normal concluída: {filename}")
    return response


def _export_by_department_worker(registos_db, funcionarios_dict):
    DEPT_FOLDERS = {
        'DAF': 'Contabilidade e Financeiro', 'DSE': 'Manutenção e SI',
        'DPLAN': 'Planeamento', 'DPROD': 'Produção',
        'DQUAL': 'Qualidade', 'DRH': 'RH', 'DTEC': 'Técnico'
    }
    base_path = '/mnt/Picagem/Picagem 2026_2'
    temp_dir = '/tmp/excel_sync'
    os.makedirs(temp_dir, exist_ok=True)
    
    try:
        df_novo = pd.DataFrame(registos_db)
        df_novo['nome_funcionario'] = df_novo['num'].map(funcionarios_dict)
        pastas_reais = {d.name.lower().strip(): d.path for d in os.scandir(base_path) if d.is_dir()}

        for dept_code, group_df in df_novo.groupby('dep'):
            dept_code = str(dept_code).strip()
            folder_name = DEPT_FOLDERS.get(dept_code)
            dept_path = pastas_reais.get(folder_name.lower().strip()) if folder_name else None
            if not dept_path: 
                print(f"Pasta não encontrada para {dept_code}")
                continue

            try:
                filename = next(f for f in os.listdir(dept_path) if f.endswith('.xlsm') and not f.startswith('~$'))
                remote_path = os.path.join(dept_path, filename)
                local_path = os.path.join(temp_dir, f"sync_{dept_code}_{filename}")

                # 1. Cópia Binária
                with open(remote_path, 'rb') as f_in, open(local_path, 'wb') as f_out:
                    f_out.write(f_in.read())

                # 2. Carregar e Fazer APPEND
                book = openpyxl.load_workbook(local_path, keep_vba=True)
                if 'Raw Data' in book.sheetnames:
                    sheet = book['Raw Data']
                    data = list(sheet.values)
                    if len(data) > 0:
                        df_old = pd.DataFrame(data[1:], columns=data[0])
                        df_final = pd.concat([df_old, group_df]).drop_duplicates()
                    else:
                        df_final = group_df
                    book.remove(sheet)
                else:
                    df_final = group_df

                # 3. Guardar com Auto-Ajuste
                with pd.ExcelWriter(local_path, engine='openpyxl') as writer:
                    writer.book = book
                    df_final.to_excel(writer, sheet_name='Raw Data', index=False)
                    ws = writer.sheets['Raw Data']
                    for i, col in enumerate(df_final.columns):
                        width = max(df_final[col].astype(str).map(len).max(), len(col)) + 2
                        ws.column_dimensions[get_column_letter(i + 1)].width = width

                # 4. Devolver à rede (Binário)
                with open(local_path, 'rb') as f_src, open(remote_path, 'wb') as f_dst:
                    f_dst.write(f_src.read())
                
                os.remove(local_path)
                print(f" {dept_code} atualizado.")

            except Exception as e:
                print(f" Erro em {dept_code}: {e}")
    except Exception as e:
        print(f" Erro Crítico: {e}")



def _export_clean(registos_db, funcionarios_dict, d_start_str, d_end_str, fnum_filter):
    
    # ===== CONVERTER PARA PANDAS =====
    df = pd.DataFrame(registos_db)
    
    # ===== ADICIONAR NOME DO FUNCIONÁRIO =====
    df['NOME'] = df['num'].apply(lambda x: funcionarios_dict.get(str(x).strip(), ""))
    
    # ===== REORDENAR COLUNAS NA ORDEM SOLICITADA =====
    colunas_ordem = [
        'num',        # Número
        'tp_hor',     # Equipa
        'dep',        # Departamento
        'dts',        # Data
        'NOME',       # Nome
        'nt',         # Picagens (total)
        'ss_01',      # P01
        'ss_02',      # P02
        'ss_03',      # P03
        'ss_04',      # P04
        'ss_05',      # P05
        'ss_06',      # P06
        'ss_07',      # P07
        'ss_08'       # P08
    ]
    
    colunas_existentes = [c for c in colunas_ordem if c in df.columns]
    df = df[colunas_existentes]
    
    # ===== RENOMEAR COLUNAS PARA DISPLAY =====
    colunas_display = {
        'num': 'Número',
        'tp_hor': 'Equipa',
        'dep': 'Departamento',
        'dts': 'Data',
        'NOME': 'Nome',
        'nt': 'Picagens',
        'ss_01': 'P01',
        'ss_02': 'P02',
        'ss_03': 'P03',
        'ss_04': 'P04',
        'ss_05': 'P05',
        'ss_06': 'P06',
        'ss_07': 'P07',
        'ss_08': 'P08'
    }
    
    df_display = df.copy()
    df_display.columns = [colunas_display.get(c, c) for c in df_display.columns]
    
    # ===== LIMPEZA DE DADOS =====
    picagens = ['P01', 'P02', 'P03', 'P04', 'P05', 'P06', 'P07', 'P08']
    for col in picagens:
        if col in df_display.columns:
            df_display[col] = df_display[col].apply(
                lambda x: None if (x and isinstance(x, str) and '00:00:00' in x) else x
            )
    
    # ===== CRIAR WORKBOOK =====
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = 'Dados'
    
    # ===== ESTILOS =====
    cor_header = "4472C4"      # Azul
    cor_clara = "FFFFFF"        # Branco
    cor_escura = "D9E8F5"       # Azul claro
    
    font_header = Font(bold=True, size=11, color="FFFFFF")
    font_normal = Font(size=10)
    
    alignment_center = Alignment(horizontal='center', vertical='center')
    alignment_left = Alignment(horizontal='left', vertical='center')
    
    thin_border = Border(
        left=Side(style='thin', color='D3D3D3'),
        right=Side(style='thin', color='D3D3D3'),
        top=Side(style='thin', color='D3D3D3'),
        bottom=Side(style='thin', color='D3D3D3')
    )
    
    # ===== ESCREVER HEADER =====
    headers = list(df_display.columns)
    fill_header = PatternFill(start_color=cor_header, end_color=cor_header, fill_type="solid")
    
    for col_idx, header in enumerate(headers, 1):
        cell = ws.cell(row=1, column=col_idx, value=header)
        cell.font = font_header
        cell.fill = fill_header
        cell.alignment = alignment_center
        cell.border = thin_border
    
    # ===== ESCREVER DADOS =====
    for row_idx, (_, row) in enumerate(df_display.iterrows(), 2):
        # Linhas alternadas
        row_color = cor_clara if (row_idx - 2) % 2 == 0 else cor_escura
        fill_row = PatternFill(start_color=row_color, end_color=row_color, fill_type="solid")
        
        for col_idx, col_name in enumerate(headers, 1):
            value = row[col_name]
            
            # Tratar data para remover a parte da hora
            if col_name == 'Data' and value:
                value = str(value).split(' ')[0] if ' ' in str(value) else value
            
            cell = ws.cell(row=row_idx, column=col_idx, value=value)
            cell.font = font_normal
            cell.fill = fill_row
            cell.border = thin_border
            
            # Alinhamento: texto à esquerda, números ao centro
            if col_name in ['Número', 'Nome', 'Departamento', 'Equipa']:
                cell.alignment = alignment_left
            else:
                cell.alignment = alignment_center
    
    # ===== AUTO-AJUSTE DE COLUNAS =====
    for column_cells in ws.columns:
        max_length = 0
        column_letter = get_column_letter(column_cells[0].column)
        
        for cell in column_cells:
            try:
                if cell.value:
                    max_length = max(max_length, len(str(cell.value)))
            except:
                pass
        
        # Definir largura com margem
        adjusted_width = max_length + 2
        
        # Mínimos por coluna
        if column_letter == 'E':  # Nome
            adjusted_width = max(adjusted_width, 30)
        elif column_letter in ['F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N']:  # Picagens
            adjusted_width = max(adjusted_width, 15)
        else:  # Outras
            adjusted_width = max(adjusted_width, 12)
        
        ws.column_dimensions[column_letter].width = adjusted_width
    
    ws.auto_filter.ref = f"A1:{get_column_letter(len(headers))}1"
    ws.freeze_panes = "A2"
    
    output = BytesIO()
    wb.save(output)
    output.seek(0)
    
    filename = f'Listagem_{fnum_filter or "Geral"}_{d_start_str}_a_{d_end_str}.xlsx'
    
    response = HttpResponse(
        output.getvalue(),
        content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )
    response['Content-Disposition'] = f'attachment; filename={filename}'
    
    
    return response


# ===== ENDPOINT PRINCIPAL (ATUALIZADO) =====

@api_view(['POST'])
@renderer_classes([JSONRenderer])
def ExportRegistosExcel(request):
    try:
        filtros = request.data.get('filter', {})
        export_type = request.data.get('exportType')  # 'normal', 'department', 'clean'
        
        fdate_from_raw = filtros.get('fdateFrom')
        fdate_to_raw = filtros.get('fdateTo')
        fnum_filter = filtros.get('fnum', '').strip()
        
        if not fdate_from_raw or not fdate_to_raw:
            return HttpResponse("Filtros de data ausentes.", status=400)
        
        # ===== PARSE DAS DATAS =====
        d_start_str = parse_date_field(fdate_from_raw)
        d_end_str = parse_date_field(fdate_to_raw)
        d_next_day = (datetime.strptime(d_end_str, '%Y-%m-%d') + timedelta(days=1)).strftime('%Y-%m-%d')
        
        start_dt = datetime.strptime(d_start_str, '%Y-%m-%d')
        end_dt = datetime.strptime(d_end_str, '%Y-%m-%d')
        
        # ===== QUERY SQL (MSSQL) =====
        dbmssql = connections[connMssqlName].cursor()  
        sql = """
            SELECT num, dts, nt, dep, tp_hor, ss_01, ss_02, ss_03, ss_04, ss_05, ss_06, ss_07, ss_08
            FROM rponto.dbo.time_registration
            WHERE dts >= %s AND dts < %s
        """
        params = [d_start_str, d_next_day]
        if fnum_filter:
            sql += " AND num = %s"
            params.append(format_fnum_filter(fnum_filter))
        
        with dbmssql as cursor:
            cursor.execute(sql, params)
            columns = [col[0] for col in cursor.description]
            registos_db = [dict(zip(columns, row)) for row in cursor.fetchall()]
        
        if not registos_db:
            return HttpResponse("Nenhum registo encontrado.", status=404)
        
        # ===== BUSCAR NOMES (SAGE) =====
        nums = list(set(r['num'] for r in registos_db if r.get('num')))
        funcionarios_dict = {}
        
        connSageName = connections[connSage100cName].cursor()
        with connSageName as cursor_sage:
            if nums:
                placeholders = ','.join(['%s'] * len(nums))
                cursor_sage.execute(
                    f"SELECT NFUNC, NOME FROM TRIMTEK_1GEP.dbo.FUNC1 WHERE NFUNC IN ({placeholders})", 
                    nums
                )
                funcionarios_dict = {
                    row[0].strip(): row[1].strip() 
                    for row in cursor_sage.fetchall()
                }
        
        # ===== ROUTER DE EXPORTAÇÃO =====
        
        if export_type == 'clean':
            return _export_clean(
                registos_db,  # ← Registos SEM AJUSTE
                funcionarios_dict, 
                d_start_str, 
                d_end_str, 
                fnum_filter
            )
        
        # Para as outras exportações, FAZER O AJUSTE
        registos_db = ajustar_picagens_turno_noturno(registos_db)
        
        if export_type == 'normal':
            return _export_normal(
                registos_db, 
                funcionarios_dict, 
                start_dt, 
                end_dt, 
                d_start_str, 
                d_end_str, 
                fnum_filter
            )
        
        elif export_type == 'department':
            thread = threading.Thread(
                target=_export_by_department_worker, 
                args=(registos_db, funcionarios_dict)
            )
            thread.daemon = True
            thread.start()
            return JsonResponse(
                {"status": "processing", "message": "Exportação iniciada em background."}, 
                status=202
            )
        
        else:
            return HttpResponse(f"Tipo de exportação inválido: {export_type}", status=400)
        
    except Exception as e:
        print(f" Erro na exportação: {str(e)}")
        import traceback
        traceback.print_exc()
        return HttpResponse(f"Erro: {str(e)}", status=500)