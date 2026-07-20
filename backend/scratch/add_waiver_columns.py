import sys
from sqlalchemy import create_engine, text, inspect

local_url = "mssql+pyodbc://@localhost/SchoolDB?driver=ODBC+Driver+17+for+SQL+Server&trusted_connection=yes"
prod_url = "mssql+pyodbc://sa:M0_tre_141@200.97.168.156/SchoolDB?driver=ODBC+Driver+17+for+SQL+Server&TrustServerCertificate=yes"

def sync_db(db_url, db_name):
    print(f"\nConnecting to {db_name} database...")
    try:
        engine = create_engine(db_url)
        inspector = inspect(engine)
        
        if inspector.has_table("parent_bills"):
            columns = [c['name'] for c in inspector.get_columns("parent_bills")]
            with engine.connect() as conn:
                if "waiver_approved_by" not in columns:
                    print(f"Adding column 'waiver_approved_by' to 'parent_bills' in {db_name}...")
                    conn.execute(text("ALTER TABLE [parent_bills] ADD [waiver_approved_by] VARCHAR(100) NULL"))
                    conn.commit()
                if "waiver_date" not in columns:
                    print(f"Adding column 'waiver_date' to 'parent_bills' in {db_name}...")
                    conn.execute(text("ALTER TABLE [parent_bills] ADD [waiver_date] VARCHAR(50) NULL"))
                    conn.commit()
                if "waiver_file_url" not in columns:
                    print(f"Adding column 'waiver_file_url' to 'parent_bills' in {db_name}...")
                    conn.execute(text("ALTER TABLE [parent_bills] ADD [waiver_file_url] VARCHAR(255) NULL"))
                    conn.commit()
            print(f"Waiver columns synced successfully in {db_name}.")
        else:
            print(f"Table 'parent_bills' does not exist in {db_name}!")
    except Exception as e:
        print(f"Error syncing {db_name}: {str(e)}")

def main():
    sync_db(prod_url, "Production SQL Server")
    sync_db(local_url, "Local MS SQL Server")

if __name__ == "__main__":
    main()
