# =============================================================================
# AJOUTER DANS models.py du dépôt backend
# =============================================================================
# Ajouter les imports suivants si absents :
#   from sqlalchemy import Column, Integer, String, Text, DateTime
#   from datetime import datetime
#
# Puis coller cette classe aux côtés de vos autres modèles.
# La table sera créée automatiquement au démarrage si vous utilisez
# Base.metadata.create_all(bind=engine) dans votre startup.
# =============================================================================

from sqlalchemy import Column, Integer, String, Text, DateTime
from datetime import datetime
# from database import Base   ← déjà importé dans models.py, ne pas dupliquer


class MacroCache(Base):  # noqa: F821  (Base est déjà défini dans models.py)
    """Cache PostgreSQL pour les endpoints /macro/* — TTL configurable (défaut 24h)."""

    __tablename__ = "macro_cache"

    id         = Column(Integer,      primary_key=True, index=True)
    cache_key  = Column(String(255),  unique=True, nullable=False, index=True)
    data_json  = Column(Text,         nullable=False)
    updated_at = Column(DateTime,     default=datetime.utcnow, onupdate=datetime.utcnow)
