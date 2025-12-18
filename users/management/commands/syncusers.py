import os
import django

# Set Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sistema.settings.local')

# Initialize Django
django.setup()

import unicodedata
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.db import connections

class Command(BaseCommand):
    help = 'Sincroniza novos funcionários da base de dados externa para o Django Admin, usando NFUNC como username.'

    def split_name(self, full_name):
        """Divide o nome completo em primeiro e último nome, tratando maiúsculas e minúsculas."""
        parts = full_name.strip().split()
        first_name = parts[0] if parts else ''
        last_name = parts[-1] if len(parts) > 1 else ''
        
        # Aplicar capitalize () no primeiro nome e último nome para garantir a formatação correta (colocar nomes como SANTOS em Santos)
        first_name = first_name.capitalize() if first_name else ''
        last_name = last_name.capitalize() if last_name else ''
        
        return first_name, last_name

    def remove_accents(self, text):
        """Remove os acentos do texto."""
        nfkd_form = unicodedata.normalize('NFKD', text)
        return ''.join([c for c in nfkd_form if not unicodedata.combining(c)])

    def handle(self, *args, **kwargs):
        # Consultar os utilizadores existentes no Django para garantir que não duplica
        existing_usernames = set(User.objects.values_list('username', flat=True))

        with connections['sage100c'].cursor() as cursor:
            # Seleciona apenas funcionários não demitidos
            cursor.execute('''
                SELECT F.[NFUNC], F.[NOME_PREFERIDO], F.[DEPARTAMENTO], F.[DEMITIDO], F.[DTNASC]
                FROM [TRIMTEK_1GEP].[dbo].[FUNC1] F
                WHERE F.[DEMITIDO] = 0
                ORDER BY F.[DEPARTAMENTO] ASC, F.[NFUNC] ASC;
            ''')
            external_users = cursor.fetchall()  # Resultado da query
        
        print("Resultado da query:", external_users)

        count = 0
        for colaborador_id, full_name, departamento, demitido, dtnasc in external_users:
            # Dividir o nome completo para primeiro e último nome
            first_name, last_name = self.split_name(full_name)
            if not first_name or not last_name:
                continue  # Ignora se o nome for inválido

            # Verificar se o NFUNC já existe no Django Admin
            if colaborador_id in existing_usernames:
                continue  # Ignora o utilizador se já existir

            # Gerar o username com base no NFUNC
            username = str(colaborador_id)

            # Remover acentos dos nomes antes de gerar o email
            first_name_normalized = self.remove_accents(first_name).lower()
            last_name_normalized = self.remove_accents(last_name).lower()

            # Gerar o email baseado no primeiro e último nome, sem acentos
            email = f"{first_name_normalized}.{last_name_normalized}@elastictek.com".replace(" ", "")

            # Adicionar o novo utilizador
            User.objects.create(
                username=username,
                email=email,
                first_name=first_name,
                last_name=last_name,
                password='exemplo1234',  # Pw   padrão
                is_staff=False,
                is_active=True
            )
            # Adicionar o NFUNC à lista para evitar duplicações no futuro
            existing_usernames.add(colaborador_id)

            count += 1
            self.stdout.write(self.style.SUCCESS(f'Utilizador {username} adicionado com email {email}.'))

        if count == 0:
            self.stdout.write(self.style.WARNING('Nenhum novo funcionário encontrado.'))
        else:
            self.stdout.write(self.style.SUCCESS(f'Sincronização concluída. {count} novos funcionários adicionados.'))
