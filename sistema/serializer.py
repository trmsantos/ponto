from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework import serializers
from django.db import connections, transaction
from support.database import encloseColumn, Filters, DBSql, TypeDml, fetchall, Check

connMssqlName = "sqlserver"
db = DBSql(connections[connMssqlName].alias)

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    remember = serializers.BooleanField(required=False)
    
    def __init__(self, *args, **kwargs):
        self.request = kwargs['context']['request']
        super().__init__(*args, **kwargs)

    def validate(self, attrs):
        data = super().validate(attrs)
        if attrs.get('remember'):
            self.request.session.set_expiry(86400)  # set session expiry to 24 hours
        return data

    @classmethod
    def get_token(cls, user):
        connection = connections[connMssqlName].cursor()
        token = super().get_token(user)
        dnum = db.executeSimpleList(lambda: (f"select * from sagex3.ELASTICTEK.AUTILIS WHERE ADDEML_0='{user.email}'"), connection, {})['rows']
        if len(dnum)>0:
            token["num"]=f"F{dnum[0].get('USR_0')[1:].zfill(5)}"  

        groups = user.groups.all().values_list('name',flat=True)
        items = {}
        isAdmin=False
        isRH=False
        grps = list(groups)
        grps.append("all#100")
        for idx, v in enumerate(grps):
            key = ""
            grp = v.split("#")
            if grp == ["admin"]:
                isAdmin=True
                continue
            if grp == ["rh"]:
                isRH=True
                continue
            elif len(grp)==2:
                key=grp[0]
                permission_value=grp[1]
            else:
                if (v.startswith("Logistica")):
                    key = "logistica"
                elif (v.startswith("Produção")):
                    key = "producao"
                elif (v.startswith("Qualidade")):
                    key = "qualidade"
                permission_value = 100 if v.endswith("Operador") or v.endswith("Tecnico") else 200
            if key in items:
                if items[key]<int(permission_value):
                    items[key] = int(permission_value)
            else:
                items[key] = int(permission_value)

        token['first_name'] = user.first_name
        token['last_name'] = user.last_name
        token['email'] = user.email
        token["groups"] = grps
        token["items"] = items
        token["isAdmin"] = isAdmin
        token["isRH"] = isRH
        return token

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer