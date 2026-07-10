import sys
from sqlalchemy import create_engine, text

backend_path = r"e:\AI_Applications\SchoolApplication\backend"
if backend_path not in sys.path:
    sys.path.append(backend_path)

from app.core.config import settings

def migrate():
    print(f"Connecting to database: {settings.DATABASE_URL}")
    engine = create_engine(settings.DATABASE_URL)
    with engine.connect() as conn:
        print("Creating stationery tables if they do not exist...")
        
        # 1. Create stationary_items
        conn.execute(text("""
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='stationary_items' and xtype='U')
            BEGIN
                CREATE TABLE stationary_items (
                    id INT IDENTITY(1,1) PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    description NVARCHAR(MAX) NULL,
                    category VARCHAR(100) NOT NULL,
                    price DECIMAL(10,2) NOT NULL,
                    stock INT NOT NULL DEFAULT 0,
                    is_active BIT NOT NULL DEFAULT 1,
                    created_at DATETIME NOT NULL DEFAULT GETDATE()
                )
            END
        """))
        
        # 2. Create stationary_orders
        conn.execute(text("""
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='stationary_orders' and xtype='U')
            BEGIN
                CREATE TABLE stationary_orders (
                    id INT IDENTITY(1,1) PRIMARY KEY,
                    student_name VARCHAR(255) NULL,
                    class_name VARCHAR(100) NULL,
                    order_date DATETIME NOT NULL DEFAULT GETDATE(),
                    status VARCHAR(50) NOT NULL DEFAULT 'Pending',
                    total_price DECIMAL(10,2) NOT NULL,
                    created_by_id INT NOT NULL FOREIGN KEY REFERENCES users(id)
                )
            END
        """))
        
        # 3. Create stationary_order_items
        conn.execute(text("""
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='stationary_order_items' and xtype='U')
            BEGIN
                CREATE TABLE stationary_order_items (
                    id INT IDENTITY(1,1) PRIMARY KEY,
                    order_id INT NOT NULL FOREIGN KEY REFERENCES stationary_orders(id) ON DELETE CASCADE,
                    item_id INT NOT NULL FOREIGN KEY REFERENCES stationary_items(id),
                    quantity INT NOT NULL,
                    unit_price DECIMAL(10,2) NOT NULL
                )
            END
        """))
        
        conn.commit()
        print("Stationery Database Migration complete!")

if __name__ == "__main__":
    migrate()
