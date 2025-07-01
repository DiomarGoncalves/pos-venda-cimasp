import psycopg2
from psycopg2 import sql

def migrar_banco(ORIGEM_URL, DESTINO_URL):
    origem = psycopg2.connect(ORIGEM_URL)
    destino = psycopg2.connect(DESTINO_URL)
    origem_cursor = origem.cursor()
    destino_cursor = destino.cursor()

    # Lista todas as tabelas do schema 'public'
    origem_cursor.execute("""
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
    """)
    tabelas = origem_cursor.fetchall()

    for (tabela,) in tabelas:
        print(f"📦 Migrando tabela: {tabela}")

        # Pega as colunas da tabela
        origem_cursor.execute(sql.SQL("""
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_name = %s
            ORDER BY ordinal_position;
        """), [tabela])
        colunas_info = origem_cursor.fetchall()

        # Drop da tabela antes de criar (evita conflito)
        destino_cursor.execute(sql.SQL("DROP TABLE IF EXISTS {} CASCADE;").format(sql.Identifier(tabela)))

        # Cria sequências se necessário (nextval)
        for nome, tipo, nullable, default in colunas_info:
            if default and "nextval" in default:
                seq_name = default.split("'")[1]
                destino_cursor.execute(f"CREATE SEQUENCE IF NOT EXISTS {seq_name};")

        # Cria a tabela no destino com as colunas
        colunas_ddl = []
        for nome, tipo, nullable, default in colunas_info:
            linha = f"{nome} {tipo}"
            if default:
                linha += f" DEFAULT {default}"
            if nullable == "NO":
                linha += " NOT NULL"
            colunas_ddl.append(linha)

        ddl_create = f"CREATE TABLE {tabela} ({', '.join(colunas_ddl)});"
        destino_cursor.execute(ddl_create)

        # Copia os dados da tabela
        origem_cursor.execute(sql.SQL("SELECT * FROM {}").format(sql.Identifier(tabela)))
        rows = origem_cursor.fetchall()

        if rows:
            values_placeholder = ", ".join(["%s"] * len(rows[0]))
            insert_sql = sql.SQL("INSERT INTO {} VALUES (" + values_placeholder + ")").format(sql.Identifier(tabela))
            destino_cursor.executemany(insert_sql.as_string(destino), rows)

        # Atualiza a sequência com base no maior valor da coluna
        for nome, tipo, nullable, default in colunas_info:
            if default and "nextval" in default:
                seq_name = default.split("'")[1]
                destino_cursor.execute(sql.SQL(
                    "SELECT MAX({}) FROM {}"
                ).format(sql.Identifier(nome), sql.Identifier(tabela)))
                max_id = destino_cursor.fetchone()[0] or 0
                destino_cursor.execute(f"ALTER SEQUENCE {seq_name} RESTART WITH {max_id + 1};")

        destino.commit()
        print(f"✅ Tabela {tabela} migrada com sucesso.\n")

    origem_cursor.close()
    destino_cursor.close()
    origem.close()
    destino.close()
    print("🎉 Migração finalizada com sucesso!")
