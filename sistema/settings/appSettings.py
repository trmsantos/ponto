from support.typedb import TypeDB

class AppSettings:
    "Identify the type of DB in the form alias:TypeDB"
    typeDB = {
        "sqlserver": TypeDB.SQLSERVER,
        "sage100c": TypeDB.SQLSERVER,
        "postgres": TypeDB.POSTGRES,
        "default": TypeDB.MYSQL
    }
    dbAlias = {
        "sqlserver":{
            "sgp":f'"SGP-PROD"'
        },
        "postgres":{
            "sgp":f'"SGP-PROD"',
            "sage":f'"SAGE-PROD"'
        }
    }
    reportConn = {
        "sage":"MSSQL-SAGE",
        "sgp":"MYSQL-SGP-PROD",
        "gw":"PG-SGP-GW"
    }
    materializedViews = {
        "MV_OFABRICO_LIST":f'MV_OFABRICO_LIST'
    }

