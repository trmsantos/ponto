from email.policy import default
import re
import itertools
from django.utils.connection import ConnectionProxy
from django.views.generic import base
from support.typedb import TypeDB
from sistema.settings.appSettings import AppSettings
from enum import Enum

class TypeDml(Enum):
    INSERT = 1,
    UPDATE = 2,
    DELETE = 3


def replace(regex, s, data):
    "Repçace in a filter every pattern like :name by db named parameter in the pattern %(name)s"
    newstring = ''
    values = {}
    start = 0
    for value in re.finditer(regex, s):
        end, newstart = value.span()
        newstring += s[start:end]
        if value.group(1) in data:
            values[value.group(1)] = data.get(value.group(1), None)
            rep = f"""%({value.group(1)})s"""
            newstring += rep
        else:
            newstring += value.group(0)
        start = newstart
    newstring += s[start:]
    return {"filter": newstring, "values": values if len(values) > 1 else None if len(list(values.values()))==0 else list(values.values())[0]}


def find(lst, exclude=[]):
    return [i for i, v in enumerate(lst) if v in exclude]


def fetchall(cursor, exclude=[]):
    "Return all rows from a cursor as dict"
    columns = [col[0] for col in cursor.description]
    if len(exclude) > 0:
        excludeIdxs = find(columns, exclude)
        columns = [v for i, v in enumerate(columns) if i not in excludeIdxs]
        return [
            dict(
                zip(columns, [v for i, v in enumerate(row) if i not in excludeIdxs]))
            for row in cursor.fetchall()
        ]
    else:
        return [
            dict(zip(columns, row))
            for row in cursor.fetchall()
        ]


def encloseColumn(col, enclose=True, join=True, ignore=[], colSeparator='.', listSeparator=', '):
    if not col:
        return '' if join else []
    if enclose:
        if isinstance(col, list):
            if join:
                return listSeparator.join(colSeparator.join((f'"{wx}"' if wx not in ignore else wx) for wx in w.split(colSeparator)) for w in col)
            else:
                return [colSeparator.join((f'"{wx}"' if wx not in ignore else wx) for wx in w.split(colSeparator)) for w in col]
        else:
            if join:
                return colSeparator.join((f'"{w}"' if w not in ignore else w) for w in col.split(colSeparator))
            else:
                return [(f'"{w}"' if w not in ignore else w) for w in col.split(colSeparator)]
    else:
        return col if not isinstance(col, list) or not join else listSeparator.join(col)


def DBSql(alias):
    type = AppSettings.typeDB.get(alias)
    if type == TypeDB.POSTGRES:
        return PostgresSql(type,alias)
    elif type == TypeDB.MYSQL:
        return MySqlSql(type,alias)
    elif type == TypeDB.SQLSERVER:
        return SqlServerSql(type,alias)


class BaseSql:
    def __init__(self,typeDB):
        self.id = itertools.count()
        self.encloseColumns = True
        self.typeDB = typeDB

    class Dql:
        def __init__(self) -> None:
            self.sort = ""
            self.paging = ""
            self.limit = 0
            self.pageSize = 10
            self.currentPage = 0
            self.columns = '*'

    class Dml:
        def __init__(self) -> None:
            self.columns = []
            self.tags = []
            self.statement = ''
            self.parameters = {}

    class Count:
        def __init__(self) -> None:
            self.statement = ''
            self.parameters = {}
            self.filter = ''
            self.count = 0

    class Exists:
        def __init__(self) -> None:
            self.statement = ''
            self.parameters = {}
            self.filter = ''
            self.exists = False
    
    class Get:
        def __init__(self) -> None:
            self.statement = ''
            self.parameters = {}
            self.filter = ''
            self.rows = False

    class Rows:
        def __init__(self) -> None:
            self.statement = ''
            self.parameters = {}
            self.filter = ''
            self.rows = False

    @property
    def encloseColumns(self):
        return self.__encloseColumns

    @encloseColumns.setter
    def encloseColumns(self, encloseColumns):
        self.__encloseColumns = encloseColumns
    
    def __computeSort(self, dictData):
        sort = {"column": None, "field": None, "direction": "ASC", "options": "", **dictData}
        tbl = f"{sort['table']}." if sort.get('table') else ''
        column = encloseColumn(f"{tbl}{sort.get('column')}", self.encloseColumns) if sort.get(
            'column') is not None else encloseColumn(f"{tbl}{sort.get('field')}", self.encloseColumns)
        if column:
            return f"""{column} {sort["direction"]} {sort.get('options')}"""
        return ""

    def __getSort(self, data={},defaultSort=[]):
        if "sort" in data and len(data["sort"])>0:
            sortData = data.get('sort')
        elif len(defaultSort)>0:
            sortData=defaultSort
        else:
            return ""

        if isinstance(sortData, list):
            if len(sortData) > 0:
                sort = ", ".join(
                    list(map(lambda v: self.__computeSort(v), sortData)))
                return f"""ORDER BY {sort}""" if sort else ""
        elif isinstance(sortData, dict):
            sort = self.__computeSort(sortData)
            return f"""ORDER BY {sort}""" if sort else ""
        return ""


    def disable(self,v):
        return ''


    def enable(self,v):
        return v


    def disableCols(self,v):
        return 'count(*)'
    
    def computeSequencial(self,sql,parameters):
        if self.typeDB==TypeDB.SQLSERVER:
            sqParameters=[]
            def replaceParams(m):
                if m.group(0)[2:-2] in parameters:
                    sqParameters.append(parameters[m.group(0)[2:-2]])
                    return rep[re.escape(m.group(0))]

            rep = dict((re.escape(f"%({k})s"), "%s") for k, v in parameters.items()) 
            pattern = re.compile("|".join(rep.keys()))
            text = pattern.sub(replaceParams, sql)
            return {"sql":text,"parameters":sqParameters}
        return {"sql":sql,"parameters":parameters}

    def executeList(self, sql, connOrCursor, parameters, ignore=[], customDisableCols=None,countSql=None):
        if isinstance(connOrCursor,ConnectionProxy):
            with connOrCursor.cursor() as cursor:
                execSql = self.computeSequencial(sql(self.enable, self.enable,self.enable), parameters)
                # print("1-###########################################################################")
                # print(f'SQL--> {execSql["sql"]}')
                # print(f'PARAMS--> {execSql["parameters"]}')
                # print("###########################################################################")
                cursor.execute(execSql["sql"],execSql["parameters"])
                rows = fetchall(cursor, ignore)
                if (countSql is None):
                    execSql = self.computeSequencial(sql(self.disable, self.disableCols if customDisableCols is None else customDisableCols,self.disable), parameters)
                    cursor.execute(execSql["sql"],execSql["parameters"])
                    count = cursor.fetchone()[0]
                else:
                    execSql = self.computeSequencial(countSql, parameters)
                    cursor.execute(execSql["sql"],execSql["parameters"])
                    count = cursor.fetchone()[0]
        else:
            if (connOrCursor):
                print("DB init success")
            else:
                print("DB init fail")
            execSql = self.computeSequencial(sql(self.enable, self.enable,self.enable), parameters)
            # print("2-###########################################################################")
            # print(f'SQL--> {execSql["sql"]}')
            # print(f'PARAMS--> {execSql["parameters"]}')
            # print("###########################################################################")
            connOrCursor.execute(execSql["sql"],execSql["parameters"])
            rows = fetchall(connOrCursor, ignore)
            if (countSql is None):
                execSql = self.computeSequencial(sql(self.disable, self.disableCols if customDisableCols is None else customDisableCols,self.disable), parameters)
                connOrCursor.execute(execSql["sql"],execSql["parameters"])
                count = connOrCursor.fetchone()[0]
            else:
                execSql = self.computeSequencial(countSql, parameters)
                connOrCursor.execute(execSql["sql"],execSql["parameters"])
                count = connOrCursor.fetchone()[0]

        return {"rows": rows, "total": count}

    def executeSimpleList(self, sql, connOrCursor, parameters, ignore=[]):
        if isinstance(connOrCursor,ConnectionProxy):
            with connOrCursor.cursor() as cursor:
                execSql = self.computeSequencial(sql() if callable(sql) else sql, parameters)
                # print("SL_1-###########################################################################")
                # print(f'SQL--> {execSql["sql"]}')
                # print(f'PARAMS--> {execSql["parameters"]}')
                # print("###########################################################################")
                cursor.execute(execSql["sql"],execSql["parameters"])
                rows = fetchall(cursor, ignore)
        else:
            execSql = self.computeSequencial(sql() if callable(sql) else sql, parameters)
            # print("SL_2-###########################################################################")
            # print(f'SQL--> {execSql["sql"]}')
            # print(f'PARAMS--> {execSql["parameters"]}')
            # print("###########################################################################")
            connOrCursor.execute(execSql["sql"],execSql["parameters"])
            rows = fetchall(connOrCursor, ignore)
        return {"rows": rows}


    def execute(self, sql, connOrCursor, parameters, returning=False):
        if isinstance(connOrCursor,ConnectionProxy):
            with connOrCursor.cursor() as cursor:
                print(f'EXECUTE--> {sql}')
                print(f'PARAMS--> {parameters}')
                execSql = self.computeSequencial(sql, parameters)
                cursor.execute(execSql["sql"],execSql["parameters"])
                if returning:
                    ret = cursor.fetchone()[0]
                    return ret
        else:
            print(f'EXECUTE--> {sql}')
            print(f'PARAMS--> {parameters}')
            execSql = self.computeSequencial(sql, parameters)
            connOrCursor.execute(execSql["sql"],execSql["parameters"])
            if returning:
                ret = connOrCursor.fetchone()[0]
                return ret
        return

class PostgresSql(BaseSql):
    def __init__(self, typeDB,alias):
        super().__init__(typeDB)
        self.typeDB = typeDB
        self.dbAlias = AppSettings.dbAlias.get(alias)


    def columns(self, cols, enclose=True, join=True, ignore=['*', 'count(*)']):
        return encloseColumn(cols, enclose, join, ignore)

    def dql(self, data, computeColumns=True, encloseColumns=True, defaultSort=[]):
        "Compute query items: sort and pagination"
        ret = BaseSql.Dql()
        self.encloseColumns = encloseColumns
        ret.sort = self._BaseSql__getSort(data,defaultSort)
        pagination = {"limit": 0, "pageSize": 10, "currentPage": 0, "page": None,
                      "offset": 0, "enabled": False, **data.get('pagination', {})}
        ret.currentPage = pagination.get('currentPage') if pagination.get(
            'page') is None else pagination.get('page')
        limit, pageSize, offset, enabled = pagination.get('limit'), pagination.get(
            'pageSize'), pagination.get('offset'), pagination.get('enabled')
        if enabled:
            a = (0 if offset < 0 else offset) + \
                (((1 if ret.currentPage <= 0 else ret.currentPage) - 1) * pageSize)
            b = 1 if pageSize <= 0 else pageSize
            ret.paging = f"""LIMIT {b} OFFSET {a}"""
        if limit != 0:
            ret.limit = f"""LIMIT {limit}"""
        else:
            ret.limit = ''
        ret.pageSize = pageSize
        if computeColumns:
            ret.columns = self.columns(
                data.get('columns', ['*']), super().encloseColumns)
        return ret

    def dml(self, typeDml, data, table=None, filterParameters=None, returning=None, encloseColumns=True):
        "Compute insert/update/delete items and statement"
        ret = BaseSql.Dml()

        filter = None
        if filterParameters is not None:
            if isinstance(filterParameters,dict):
                filter = Filters(filterParameters)
                filter.where()
                filter.auto([], [], encloseColumns)
                ret.filter = filter.value('and').text
                ret.parameters = filter.parameters
            else:
                filter = filterParameters
                ret.filter = filterParameters.value('and').text
                ret.parameters = filterParameters.parameters

        if typeDml == TypeDml.DELETE:
            if filter is None:
                raise Exception("Filtro Não pode ser None!")

            if table is not None:
                if returning is None:
                    ret.statement = f'DELETE FROM {table} {filter.text}'
                else:
                    ret.statement = f'DELETE FROM {table} {filter.text} returning {returning}'
            return ret
        #d = data.get('data', {})
        ks = list(data.keys())
        ret.columns = self.columns(ks, encloseColumns, False)
        if typeDml == TypeDml.INSERT:
            for i, c in enumerate(ks):
                ret.tags.append(f'%({c})s')
                ret.parameters[c] = data.get(c)
            if table is not None:
                _cols = f'({",".join(ret.columns)})' if len(ret.columns)>0 else ''
                _values = f'VALUES({",".join(ret.tags)})' if len(ret.columns)>0 else 'DEFAULT VALUES'
                if returning is None:
                    ret.statement = f'INSERT INTO {table}{_cols} {_values}'
                else:
                    ret.statement = f'INSERT INTO {table}{_cols} {_values} returning {returning}'
        elif typeDml == TypeDml.UPDATE:
            if filter is None:
                raise Exception("Filtro Não pode ser None!")
            for i, c in enumerate(ks):
                ret.tags.append(f'{ret.columns[i]} = %({c})s')
                ret.parameters[c] = data.get(c)
            if table is not None:
                if returning is None:
                    ret.statement = f'UPDATE {table} SET {",".join(ret.tags)} {filter.text}'
                else:
                    ret.statement = f'UPDATE {table} SET {",".join(ret.tags)} {filter.text} returning {returning}'
        return ret

    def count(self, table, p={}, connOrCursor=None, encloseColumns=True):
        ret = BaseSql.Count()
        f = Filters(p)
        f.where()
        f.auto([], [], encloseColumns)
        ret.filter = f.value('and').text
        ret.parameters = f.parameters
        ret.statement = f'SELECT count(*) as "count" FROM {table} {f.text}'
        if connOrCursor is not None:
            if isinstance(connOrCursor,ConnectionProxy):
                with connOrCursor.cursor() as cursor:
                    cursor.execute(ret.statement, ret.parameters)
                    ret.count = cursor.fetchone()[0]
            else:
                connOrCursor.execute(ret.statement, ret.parameters)
                ret.count = connOrCursor.fetchone()[0]
        return ret

    def exists(self, table, p={}, connOrCursor=None, encloseColumns=True):
        if isinstance(p,dict):
            ret = BaseSql.Exists()
            f = Filters(p)
            f.where()
            f.auto([], [], encloseColumns)
            ret.filter = f.value('and').text
            ret.parameters = f.parameters
            ret.statement = f'SELECT EXISTS (SELECT 1 FROM {table} {f.text})'
        else:
            ret = BaseSql.Exists()
            ret.filter = p.text
            ret.parameters = p.parameters
            ret.statement = f'SELECT EXISTS (SELECT 1 FROM {table} {p.text})'

        if connOrCursor is not None:
            if isinstance(connOrCursor,ConnectionProxy):
                with connOrCursor.cursor() as cursor:
                    cursor.execute(ret.statement, ret.parameters)
                    ret.exists = cursor.fetchone()[0]
            else:
                connOrCursor.execute(ret.statement, ret.parameters)
                ret.exists = connOrCursor.fetchone()[0]
        return ret

    def get(self,columns, table, p={}, connOrCursor=None, encloseColumns=False):
        if isinstance(p,dict):
            ret = BaseSql.Get()
            f = Filters(p)
            f.where()
            f.auto([], [], encloseColumns)
            ret.filter = f.value('and').text
            ret.parameters = f.parameters
            ret.statement = f'SELECT {columns} FROM {table} {f.text}'
        else:
            ret = BaseSql.Get()
            ret.filter = p.text
            ret.parameters = p.parameters
            ret.statement = f'SELECT {columns} FROM {table} {p.text}'
        if connOrCursor is not None:
            if isinstance(connOrCursor,ConnectionProxy):
                with connOrCursor.cursor() as cursor:
                    cursor.execute(ret.statement, ret.parameters)
                    ret.rows = fetchall(cursor)
            else:
                connOrCursor.execute(ret.statement, ret.parameters)
                ret.rows = fetchall(connOrCursor)
        return ret

    def limit(self, table, p={}, limit=1, connOrCursor=None, encloseColumns=True):
        if isinstance(p,dict):
            ret = BaseSql.Rows()
            f = Filters(p)
            f.where()
            f.auto([], [], encloseColumns)
            ret.filter = f.value('and').text
            ret.parameters = f.parameters
            ret.statement = f'select * from {table} {f.text} limit {limit}'
        else:
            ret = BaseSql.Rows()
            ret.filter = p.text
            ret.parameters = p.parameters
            ret.statement = f'select * from {table} {p.text} limit {limit}'

        if connOrCursor is not None:
            if isinstance(connOrCursor,ConnectionProxy):
                with connOrCursor.cursor() as cursor:
                    cursor.execute(ret.statement, ret.parameters)
                    ret.rows = fetchall(cursor)
            else:
                connOrCursor.execute(ret.statement, ret.parameters)
                ret.rows = fetchall(connOrCursor)
        return ret


class MySqlSql(BaseSql):
    def __init__(self, typeDB,alias):
        super().__init__(typeDB)
        self.typeDB = typeDB
        self.dbAlias = AppSettings.dbAlias.get(alias)

    def columns(self, cols, enclose=False, join=True, ignore=['*', 'count(*)']):
        return encloseColumn(cols, enclose, join, ignore)

    def dql(self, data, computeColumns=True, encloseColumns=False, defaultSort=[]):
        "Compute query items: sort and pagination"
        ret = BaseSql.Dql()
        self.encloseColumns = encloseColumns
        ret.sort = self._BaseSql__getSort(data,defaultSort)
        pagination = {"limit": 0, "pageSize": 10, "currentPage": 0, "page": None, "offset": 0, "enabled": False, **data.get('pagination', {})}
        ret.currentPage = pagination.get('currentPage') if pagination.get('page') is None else pagination.get('page')
        limit, pageSize, offset, enabled = pagination.get('limit'), pagination.get('pageSize'), pagination.get('offset'), pagination.get('enabled')
        if enabled:
            a = (0 if offset < 0 else offset) + \
                (((1 if ret.currentPage <= 0 else ret.currentPage) - 1) * pageSize)
            b = 1 if pageSize <= 0 else pageSize
            ret.paging = f"""LIMIT {b} OFFSET {a}"""
        if limit != 0:
            ret.limit = f"""LIMIT {limit}"""
        else:
            ret.limit = ''
        ret.pageSize = pageSize
        if computeColumns:
            ret.columns = self.columns(
                data.get('columns', ['*']), super().encloseColumns)
        return ret

    def dml(self, typeDml, data, table=None, filterParameters=None, returning=None, encloseColumns=False, ignoreKeys=[]):
        "Compute insert/update/delete items and statement"
        ret = BaseSql.Dml()

        filter = None
        if filterParameters is not None:
            if isinstance(filterParameters,dict):
                filter = Filters(filterParameters)
                filter.where()
                filter.auto([], [], encloseColumns)
                ret.filter = filter.value('and').text
                ret.parameters = filter.parameters
            else:
                filter = filterParameters
                ret.filter = filterParameters.value('and').text
                ret.parameters = filterParameters.parameters

        if typeDml == TypeDml.DELETE:
            if filter is None:
                raise Exception("Filtro Não pode ser None!")

            if table is not None:
                if returning is None:
                    ret.statement = f'DELETE FROM {table} {filter.text}'
                else:
                    ret.statement = f'DELETE FROM {table} {filter.text}'
            return ret
        #d = data.get('data', {})
        ks = list(data.keys())
        ret.columns = self.columns(ks, encloseColumns, False)
        if typeDml == TypeDml.INSERT:
            for i, c in enumerate(ks):
                if (c in ignoreKeys):
                    ret.tags.append(data.get(c))
                else:
                    ret.tags.append(f'%({c})s')
                    ret.parameters[c] = data.get(c)
            if table is not None:
                _cols = f'({",".join(ret.columns)})' if len(ret.columns)>0 else ''
                _values = f'VALUES({",".join(ret.tags)})' if len(ret.columns)>0 else 'DEFAULT VALUES'
                if returning is None:
                    ret.statement = f'INSERT INTO {table}{_cols} {_values}'
                else:
                    ret.statement = f'INSERT INTO {table}{_cols} {_values} returning {returning}'
        elif typeDml == TypeDml.UPDATE:
            if filter is None:
                raise Exception("Filtro Não pode ser None!")
            for i, c in enumerate(ks):
                if (c in ignoreKeys):
                    ret.tags.append(data.get(c))
                else:
                    ret.tags.append(f'{ret.columns[i]} = %({c})s')
                    ret.parameters[c] = data.get(c)
            if table is not None:
                if returning is None:
                    ret.statement = f'UPDATE {table} SET {",".join(ret.tags)} {filter.text}'
                else:
                    ret.statement = f'UPDATE {table} SET {",".join(ret.tags)} {filter.text} returning {returning}'
        return ret

    def count(self, table, p={}, connOrCursor=None, encloseColumns=False):
        ret = BaseSql.Count()
        f = Filters(p)
        f.where()
        f.auto([], [], encloseColumns)
        ret.filter = f.value('and').text
        ret.parameters = f.parameters
        ret.statement = f'SELECT count(*) as "count" FROM {table} {f.text}'
        if connOrCursor is not None:
            if isinstance(connOrCursor,ConnectionProxy):
                with connOrCursor.cursor() as cursor:
                    cursor.execute(ret.statement, ret.parameters)
                    ret.count = cursor.fetchone()[0]
            else:
                connOrCursor.execute(ret.statement, ret.parameters)
                ret.count = connOrCursor.fetchone()[0]
        return ret

    def exists(self, table, p={}, connOrCursor=None, encloseColumns=False):
        if isinstance(p,dict):
            ret = BaseSql.Exists()
            f = Filters(p)
            f.where()
            f.auto([], [], encloseColumns)
            ret.filter = f.value('and').text
            ret.parameters = f.parameters
            ret.statement = f'SELECT EXISTS (SELECT 1 FROM {table} {f.text})'
        else:
            ret = BaseSql.Exists()
            ret.filter = p.text
            ret.parameters = p.parameters
            ret.statement = f'SELECT EXISTS (SELECT 1 FROM {table} {p.text})'
        if connOrCursor is not None:
            if isinstance(connOrCursor,ConnectionProxy):
                with connOrCursor.cursor() as cursor:
                    cursor.execute(ret.statement, ret.parameters)
                    ret.exists = cursor.fetchone()[0]
            else:
                connOrCursor.execute(ret.statement, ret.parameters)
                ret.exists = connOrCursor.fetchone()[0]
        return ret

    def get(self,columns, table, p={}, connOrCursor=None, encloseColumns=False):
        if isinstance(p,dict):
            ret = BaseSql.Get()
            f = Filters(p)
            f.where()
            f.auto([], [], encloseColumns)
            ret.filter = f.value('and').text
            ret.parameters = f.parameters
            ret.statement = f'SELECT {columns} FROM {table} {f.text}'
        else:
            ret = BaseSql.Get()
            ret.filter = p.text
            ret.parameters = p.parameters
            ret.statement = f'SELECT {columns} FROM {table} {p.text}'
        if connOrCursor is not None:
            if isinstance(connOrCursor,ConnectionProxy):
                with connOrCursor.cursor() as cursor:
                    cursor.execute(ret.statement, ret.parameters)
                    ret.rows = fetchall(cursor)
            else:
                connOrCursor.execute(ret.statement, ret.parameters)
                ret.rows = fetchall(connOrCursor)
        return ret

    def limit(self, table, p={}, limit=1, connOrCursor=None, encloseColumns=True):
        if isinstance(p,dict):
            ret = BaseSql.Rows()
            f = Filters(p)
            f.where()
            f.auto([], [], encloseColumns)
            ret.filter = f.value('and').text
            ret.parameters = f.parameters
            ret.statement = f'select * from {table} {f.text} limit {limit}'
        else:
            ret = BaseSql.Rows()
            ret.filter = p.text
            ret.parameters = p.parameters
            ret.statement = f'select * from {table} {p.text} limit {limit}'

        if connOrCursor is not None:
            if isinstance(connOrCursor,ConnectionProxy):
                with connOrCursor.cursor() as cursor:
                    cursor.execute(ret.statement, ret.parameters)
                    ret.rows = fetchall(cursor)
            else:
                connOrCursor.execute(ret.statement, ret.parameters)
                ret.rows = fetchall(connOrCursor)
        return ret

class SqlServerSql(BaseSql):
    def __init__(self, typeDB,alias):
        super().__init__(typeDB)
        self.typeDB = typeDB
        self.dbAlias = AppSettings.dbAlias.get(alias)
    
    def columns(self, cols, enclose=False, join=True, ignore=['*', 'count(*)']):
        return encloseColumn(cols, enclose, join, ignore)

    def dql(self, data, computeColumns=True, encloseColumns=False, defaultSort=[]):
        "Compute query items: sort and pagination"
        ret = BaseSql.Dql()
        self.encloseColumns = encloseColumns
        print("oiii")
        print(defaultSort)
        ret.sort = self._BaseSql__getSort(data,defaultSort)
        pagination = {"limit": 0, "pageSize": 10, "currentPage": 0, "page": None, "offset": 0, "enabled": False, **data.get('pagination', {})}
        ret.currentPage = pagination.get('currentPage') if pagination.get('page') is None else pagination.get('page')
        limit, pageSize, offset, enabled = pagination.get('limit'), pagination.get('pageSize'), pagination.get('offset'), pagination.get('enabled')
        if enabled:
            a = (0 if offset < 0 else offset) + \
                (((1 if ret.currentPage <= 0 else ret.currentPage) - 1) * pageSize)
            b = 1 if pageSize <= 0 else pageSize
            ret.paging = f"""
                OFFSET {a} ROWS 
                FETCH NEXT {b} ROWS ONLY
            """
        if limit != 0:
            ret.limit = f"""
                OFFSET 0 ROWS 
                FETCH FIRST {limit} ROWS ONLY
            """
        else:
            ret.limit = ''
        ret.pageSize = pageSize
        if computeColumns:
            ret.columns = self.columns(
                data.get('columns', ['*']), super().encloseColumns)
        return ret

    def dml(self, typeDml, data, table=None, filterParameters=None, returning=None, encloseColumns=False, ignoreKeys=[]):
        "Compute insert/update/delete items and statement"
        print("dml0")
        ret = BaseSql.Dml()
        filter = None
        if filterParameters is not None:
            if isinstance(filterParameters,dict):
                filter = Filters(filterParameters)
                filter.where()
                filter.auto([], [], encloseColumns)
                ret.filter = filter.value('and').text
                ret.parameters = filter.parameters
            else:
                filter = filterParameters
                ret.filter = filterParameters.value('and').text
                ret.parameters = filterParameters.parameters

        if typeDml == TypeDml.DELETE:
            if filter is None:
                raise Exception("Filtro Não pode ser None!")

            if table is not None:
                if returning is None:
                    ret.statement = f'DELETE FROM {table} {filter.text}'
                else:
                    ret.statement = f'DELETE FROM {table} {filter.text}'
            return ret
        #d = data.get('data', {})
        ks = list(data.keys())
        ret.columns = self.columns(ks, encloseColumns, False)
        if typeDml == TypeDml.INSERT:
            print("dml1")
            for i, c in enumerate(ks):
                if (c in ignoreKeys):
                    ret.tags.append(data.get(c))
                else:
                    ret.tags.append(f'%({c})s')
                    ret.parameters[c] = data.get(c)
            print("dml2")
            if table is not None:
                print("dml3")
                _cols = f'({",".join(ret.columns)})' if len(ret.columns)>0 else ''
                _values = f'VALUES({",".join(ret.tags)})' if len(ret.columns)>0 else 'DEFAULT VALUES'
                if returning is None:
                    ret.statement = f'INSERT INTO {table}{_cols} {_values}'
                else:
                    ret.statement = f'INSERT INTO {table}{_cols} {_values} returning {returning}'
        elif typeDml == TypeDml.UPDATE:
            if filter is None:
                raise Exception("Filtro Não pode ser None!")
            for i, c in enumerate(ks):
                ret.tags.append(f'{ret.columns[i]} = %({c})s')
                ret.parameters[c] = data.get(c)
            if table is not None:
                if returning is None:
                    ret.statement = f'UPDATE {table} SET {",".join(ret.tags)} {filter.text}'
                else:
                    ret.statement = f'UPDATE {table} SET {",".join(ret.tags)} {filter.text} returning {returning}'
        return ret

    def count(self, table, p={}, connOrCursor=None, encloseColumns=False):
        ret = BaseSql.Count()
        f = Filters(p)
        f.where()
        f.auto([], [], encloseColumns)
        ret.filter = f.value('and').text
        ret.parameters = f.parameters
        ret.statement = f'SELECT count(*) as "count" FROM {table} {f.text}'
        if connOrCursor is not None:
            if isinstance(connOrCursor,ConnectionProxy):
                with connOrCursor.cursor() as cursor:
                    cursor.execute(ret.statement, ret.parameters)
                    ret.count = cursor.fetchone()[0]
            else:
                connOrCursor.execute(ret.statement, ret.parameters)
                ret.count = connOrCursor.fetchone()[0]
        return ret

    def exists(self, table, p={}, connOrCursor=None, encloseColumns=False):
        if isinstance(p,dict):
            ret = BaseSql.Exists()
            f = Filters(p)
            f.where()
            f.auto([], [], encloseColumns)
            ret.filter = f.value('and').text
            ret.parameters = f.parameters
            ret.statement = f'SELECT EXISTS (SELECT 1 FROM {table} {f.text})'
        else:
            ret = BaseSql.Exists()
            ret.filter = p.text
            ret.parameters = p.parameters
            ret.statement = f'SELECT EXISTS (SELECT 1 FROM {table} {p.text})'
        print(ret.statement)
        if connOrCursor is not None:
            if isinstance(connOrCursor,ConnectionProxy):
                with connOrCursor.cursor() as cursor:
                    cursor.execute(ret.statement, ret.parameters)
                    ret.exists = cursor.fetchone()[0]
            else:
                connOrCursor.execute(ret.statement, ret.parameters)
                ret.exists = connOrCursor.fetchone()[0]
        return ret
    
    def get(self,columns, table, p={}, connOrCursor=None, encloseColumns=False):
        if isinstance(p,dict):
            ret = BaseSql.Get()
            f = Filters(p)
            f.where()
            f.auto([], [], encloseColumns)
            ret.filter = f.value('and').text
            ret.parameters = f.parameters
            ret.statement = f'SELECT {columns} FROM {table} {f.text}'
        else:
            ret = BaseSql.Get()
            ret.filter = p.text
            ret.parameters = p.parameters
            ret.statement = f'SELECT {columns} FROM {table} {p.text}'
        if connOrCursor is not None:
            if isinstance(connOrCursor,ConnectionProxy):
                with connOrCursor.cursor() as cursor:
                    cursor.execute(ret.statement, ret.parameters)
                    ret.rows = fetchall(cursor)
            else:
                connOrCursor.execute(ret.statement, ret.parameters)
                ret.rows = fetchall(connOrCursor)
        return ret

    def limit(self, table, p={}, limit=1, connOrCursor=None, encloseColumns=True):
        if isinstance(p,dict):
            ret = BaseSql.Rows()
            f = Filters(p)
            f.where()
            f.auto([], [], encloseColumns)
            ret.filter = f.value('and').text
            ret.parameters = f.parameters
            ret.statement = f'select * from {table} {f.text} OFFSET 0 ROWS FETCH FIRST {limit} ROWS ONLY'
        else:
            ret = BaseSql.Rows()
            ret.filter = p.text
            ret.parameters = p.parameters
            ret.statement = f'select * from {table} {p.text} OFFSET 0 ROWS FETCH FIRST {limit} ROWS ONLY'

        if connOrCursor is not None:
            if isinstance(connOrCursor,ConnectionProxy):
                with connOrCursor.cursor() as cursor:
                    cursor.execute(ret.statement, ret.parameters)
                    ret.rows = fetchall(cursor)
            else:
                connOrCursor.execute(ret.statement, ret.parameters)
                ret.rows = fetchall(connOrCursor)
        return ret



class Filters:
    def __init__(self, filterData={}):
        self.paramsSet = {}
        self.paramsSetValues = {}
        self.paramsSetFields = {}
        self.clause = {"value": '', "enabled": False,
                       "force": False, "clause": ''}
        self.filterData = {**filterData}
        self.__filters = []
        self.autoParamsSet = {}
        self.__autoFilters = []
        self.text = ''
        self.length = 0
        self.hasFilters = False
        self.parameters = {}
        self.definedParameters = {}

    def where(self, force=False, override=False):
        self.clause['enabled'] = True
        self.clause['force'] = force
        self.clause['value'] = override if override else 'where'
        return self

    def having(self, force=False, override=False):
        self.clause['enabled'] = True
        self.clause['force'] = force
        self.clause['value'] = override if override else 'having'
        return self

    def on(self, force=False, override=False):
        self.clause['enabled'] = True
        self.clause['force'] = force
        self.clause['value'] = override if override else 'on'
        return self

    def land(self, force=False):
        self.clause['enabled'] = True
        self.clause['force'] = force
        self.clause['value'] = 'and'
        return self

    def lor(self, force=False):
        self.clause['enabled'] = True
        self.clause['force'] = force
        self.clause['value'] = 'or'
        return self

    def setParameters(self, parameters={}, clearData=False):
        for key, value in parameters.items():
            val = None
            k = value['key'] if 'key' in value else key
            fld = k
            none = value['none'] if 'none' in value else True
            if callable(value['value']):
                val = value['value'](self.filterData)
            else:
                val = value['value']
            if none==True or val is not None:
                if 'field' in value:
                    if callable(value['field']):
                        fld = value['field'](k, self.filterData)
                    else:
                        fld = value['field']
                self.paramsSet[key] = {"value": val, "field": fld}
                self.paramsSetValues[key] = val
                self.paramsSetFields[key] = fld
        if (clearData):
            self.filterData.clear()
        return self

    def add(self, filter, test):
        if not filter:
            return None
        f = replace(r'(?<!:):([a-zA-Z0-9_]+)', filter,
                    {**self.filterData, **self.paramsSetValues})
        if callable(test):
            if test(f['values']):
                self.__filters.append(f['filter'])
        else:
            if test:
                self.__filters.append(f['filter'])
        return self

    def auto(self, exclude=[], include=[], encloseColumns=True):
        baseData = {**self.filterData, **self.paramsSetValues}
        nData = {}
        if len(include) > 0:
            nData = {k: v for k, v in baseData.items() if k in include}
        elif len(exclude) > 0:
            nData = {k: v for k, v in baseData.items() if k not in exclude}
        else:
            nData=baseData
        a = FiltersParser(nData, self.paramsSetFields, encloseColumns)
        self.__autoFilters.extend(a['filters'])
        self.autoParamsSet.update(a['parameters'])

    def value(self, op="and"):
        f = []
        f.extend(self.__autoFilters)
        f.extend(self.__filters)

        if self.clause['enabled'] and (len(f) > 0 or self.clause['force']):
            self.clause['clause'] = f""" {self.clause['value']} """
        __filter = f"""({f" {op} ".join(f)})""" if (len(f) > 0) else ''
        __params = {}
        for key, value in self.autoParamsSet.items():
            __params[key] = value
        for key, value in self.paramsSetValues.items():
            __params[key] = value
        for key, value in self.filterData.items():
            if key not in self.paramsSetValues:
                __params[key] = value

        self.text = f"""{self.clause['clause']}{__filter}"""
        self.parameters = __params
        self.length = len(f)
        self.hasFilters = len(f) > 0
        self.definedParameters = self.paramsSetValues

        return self

    def getNumeric(value):
        if value is None: return None
        pattern = f'(^==|^=|^!==|^!=|^>=|^<=|^>|^<|^between:|^in:|^!between:|^!in:|isnull|!isnull|^@:)(.*)'
        result = re.match(pattern, str(value), re.IGNORECASE)
        if not result:
            return f"=={value}"
        else:
            return value

def FiltersParser(data, fields={}, encloseColumns=True):
    filters, parameters = [], {}
    pattern = f'(^==|^=|^!==|^!=|^>=|^<=|^>|^<|^between:|^in:|^!between:|^!in:|isnull|!isnull|^@:)(.*)'
    for key, f in data.items():

        if f == None:
            continue
        result = re.match(pattern, str(f), re.IGNORECASE)
        if any(fields):
            field = fields[key]
        else:
            field = encloseColumn(key, encloseColumns)

        opNot = result.group(1).startswith('!') if result else False
        op = (result.group(1) if not opNot else result.group(
            1)[1:]) if result else '='
        value = result.group(2) if result else f
        if op == '@:':
            filters.append(f'{field}'.replace("[f]",f'%(auto_{key})s'))
            parameters[f'auto_{key}'] = value
        elif op == '==':
            filters.append(
                f'{field} {("=" if not opNot else "<>")} %(auto_{key})s')
            parameters[f'auto_{key}'] = value
        elif op == '=':
            filters.append(
                f'{field} {("like" if not opNot else "not like")} %(auto_{key})s')
            parameters[f'auto_{key}'] = value
        elif op == '>=':
            filters.append(f'{field} >= %(auto_{key})s')
            parameters[f'auto_{key}'] = value
        elif op == '<=':
            filters.append(f'{field} <= %(auto_{key})s')
            parameters[f'auto_{key}'] = value
        elif op == '>':
            filters.append(f'{field} > %(auto_{key})s')
            parameters[f'auto_{key}'] = value
        elif op == '<':
            filters.append(f'{field} < %(auto_{key})s')
            parameters[f'auto_{key}'] = value
        elif op.lower() == 'between:':
            v = value.split(',')
            min = v[0].strip(' ') if v[0].strip(' ') != '' else None
            max = (v[1].strip(' ') if v[1].strip(' ') !=
                   '' else None) if len(v) == 2 else None
            if min and max:
                filters.append(
                    f'({field} {("between" if not opNot else "not between")} %(auto_{key}_min)s and %(auto_{key}_max)s)')
                parameters[f'auto_{key}_min'] = min
                parameters[f'auto_{key}_max'] = max
            elif min:
                filters.append(
                    f'({field} {(">=" if not opNot else "<")} %(auto_{key})s)')
                parameters[f'auto_{key}'] = min
            elif max:
                filters.append(
                    f'({field} {("<=" if not opNot else ">")} %(auto_{key})s)')
                parameters[f'auto_{key}'] = max
        elif op.lower() == 'in:':
            v = value.split(',')
            p = []
            for i, item in enumerate(v):
                p.append(f'%(auto_{key}_{i})s')
                parameters[f'auto_{key}_{i}'] = item
            filters.append(
                f'({field} {("in" if not opNot else "not in")} ({",".join(p)}))')
        elif op.lower() == 'isnull':
            filters.append(
                f'({field} {("is NULL" if not opNot else "is not NULL")})')
    return {"filters": filters, "parameters": parameters}


class Check:
    def NullEmpty(v):
        if isinstance(v, dict):
            return True if all(v.values()) else False
        elif v:
            return True
        return False
