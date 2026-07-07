from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)

def clear_database():
    with engine.connect() as conn:
        tables = conn.execute(text("""
            SELECT tablename FROM pg_tables 
            WHERE schemaname = 'public'
        """))
        
        for table in tables:
            try:
                conn.execute(text(f'DROP TABLE IF EXISTS "{table[0]}" CASCADE'))
                print(f"✅ Dropped table: {table[0]}")
            except Exception as e:
                print(f"❌ Could not drop {table[0]}: {e}")
        
        conn.commit()
        print("✅ Database completely cleared!")

if __name__ == "__main__":
    clear_database()