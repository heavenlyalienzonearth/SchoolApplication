# Database setup options

## Python / SQLAlchemy setup
Run:

```powershell
.nv\Scripts\python.exe single_db_setup.py
```

## Microsoft SQL Server script
Run the script [mssql_single_db_setup.sql](mssql_single_db_setup.sql) in SQL Server Management Studio (SSMS) or Azure Data Studio.

It will:
- create the SchoolDB database if missing
- create the schema tables
- insert default seed data
- run safely on repeated execution
