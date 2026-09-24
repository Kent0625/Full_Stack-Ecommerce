import os

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker


load_dotenv()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DEFAULT_REPORTING_DB_PATH = os.path.join(BASE_DIR, "thrift_reporting.sqlite")

REPORTING_DATABASE_URL = os.getenv(
    "REPORTING_DATABASE_URL", f"sqlite:///{DEFAULT_REPORTING_DB_PATH}"
)

if REPORTING_DATABASE_URL.startswith("postgres://"):
    REPORTING_DATABASE_URL = REPORTING_DATABASE_URL.replace("postgres://", "postgresql://", 1)

if REPORTING_DATABASE_URL.startswith("sqlite"):
    if REPORTING_DATABASE_URL.startswith("sqlite:///C:"):
        REPORTING_DATABASE_URL = REPORTING_DATABASE_URL.replace("sqlite:///C:", "sqlite:///c:")
    reporting_engine = create_engine(
        REPORTING_DATABASE_URL, connect_args={"check_same_thread": False}
    )
else:
    reporting_engine = create_engine(REPORTING_DATABASE_URL, pool_pre_ping=True, pool_recycle=300)

ReportingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=reporting_engine)


def get_reporting_db():
    db = ReportingSessionLocal()
    try:
        yield db
    finally:
        db.close()
