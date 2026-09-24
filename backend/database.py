import os

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker


load_dotenv()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DEFAULT_DB_PATH = os.path.join(BASE_DIR, "thrift_main.sqlite")

DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{DEFAULT_DB_PATH}")
REDIS_URL = os.getenv("REDIS_URL")

if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

if DATABASE_URL.startswith("sqlite"):
    if DATABASE_URL.startswith("sqlite:///C:"):
        DATABASE_URL = DATABASE_URL.replace("sqlite:///C:", "sqlite:///c:")
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
    engine = create_engine(DATABASE_URL, pool_pre_ping=True)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class RedisMock:
    def __init__(self):
        self.data = {}
        self.ttls = {}

    def set(self, key, value, ex=None):
        self.data[key] = value
        if ex:
            self.ttls[key] = ex

    def get(self, key):
        return self.data.get(key)

    def exists(self, key):
        return key in self.data

    def delete(self, key):
        self.data.pop(key, None)
        self.ttls.pop(key, None)

    def ttl(self, key):
        return self.ttls.get(key, 600)


if REDIS_URL:
    from redis import Redis

    redis_client = Redis.from_url(REDIS_URL, decode_responses=True)
else:
    print("REDIS_URL not found. Using in-memory Redis mock.")
    redis_client = RedisMock()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
