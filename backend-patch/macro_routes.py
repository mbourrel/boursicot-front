# =============================================================================
# INTÉGRATION DANS api.py du dépôt backend
# =============================================================================
#
# Option A — APIRouter (recommandé si votre api.py est déjà structuré) :
#   Ajouter en haut de api.py :
#       from macro_routes import macro_router
#       app.include_router(macro_router)
#
# Option B — Copie directe :
#   Copier les fonctions get_cached / set_cached / get_macro_cycle /
#   get_macro_liquidity directement dans api.py, en adaptant les imports.
#
# Dans les deux cas, adapter les imports get_db / MacroCache selon votre
# arborescence de fichiers.
# =============================================================================

import os
import json
from datetime import datetime, timedelta

import pandas as pd
import yfinance as yf
from fredapi import Fred

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

# ── Adapter selon votre projet ────────────────────────────────────────────────
from database import get_db          # fonction de session SQLAlchemy
from models import MacroCache        # modèle ajouté via macro_cache_model.py
# ─────────────────────────────────────────────────────────────────────────────

macro_router = APIRouter(prefix="/macro", tags=["macro"])


# ── Helpers cache ─────────────────────────────────────────────────────────────

def get_cached(db: Session, key: str, max_age_hours: int = 24):
    """Retourne les données en cache si elles existent et ne sont pas expirées."""
    record = db.query(MacroCache).filter(MacroCache.cache_key == key).first()
    if not record:
        return None
    if datetime.utcnow() - record.updated_at > timedelta(hours=max_age_hours):
        return None
    return json.loads(record.data_json)


def set_cached(db: Session, key: str, data: dict):
    """Écrit ou met à jour une entrée de cache PostgreSQL."""
    record = db.query(MacroCache).filter(MacroCache.cache_key == key).first()
    if record:
        record.data_json  = json.dumps(data)
        record.updated_at = datetime.utcnow()
    else:
        record = MacroCache(cache_key=key, data_json=json.dumps(data))
        db.add(record)
    db.commit()


# ── GET /macro/cycle ──────────────────────────────────────────────────────────

@macro_router.get("/cycle")
def get_macro_cycle(db: Session = Depends(get_db)):
    """
    Détermine la phase du cycle économique (Expansion / Surchauffe /
    Contraction / Récession) à partir de :
      - INDPRO   (Production industrielle — proxy croissance)
      - CPIAUCSL (Indice des prix à la consommation — inflation)
    Source : FRED (Federal Reserve Bank of St. Louis)
    Résultat mis en cache 24h dans PostgreSQL.
    """
    cached = get_cached(db, "macro_cycle")
    if cached:
        return cached

    api_key = os.getenv("FRED_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="Variable FRED_API_KEY manquante")

    # ── Récupération FRED (15 mois pour avoir 12 mois de recul YoY + marge) ──
    try:
        fred  = Fred(api_key=api_key)
        start = datetime.now() - timedelta(days=15 * 31)
        end   = datetime.now()
        indpro = fred.get_series("INDPRO",   observation_start=start, observation_end=end).dropna()
        cpi    = fred.get_series("CPIAUCSL", observation_start=start, observation_end=end).dropna()
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Erreur FRED : {exc}")

    # ── Calcul YoY et détection de tendance ───────────────────────────────────
    def yoy_and_trend(series: pd.Series):
        if len(series) < 14:
            raise HTTPException(
                status_code=500,
                detail=f"Historique FRED insuffisant ({len(series)} mois, 14 requis)",
            )
        curr     = float(series.iloc[-1])
        prev     = float(series.iloc[-2])
        yr_ago   = float(series.iloc[-13])
        yr_ago_p = float(series.iloc[-14])
        yoy_curr = (curr - yr_ago)   / yr_ago   * 100
        yoy_prev = (prev - yr_ago_p) / yr_ago_p * 100
        return round(yoy_curr, 2), ("up" if yoy_curr > yoy_prev else "down")

    growth_yoy,    growth_trend    = yoy_and_trend(indpro)
    inflation_yoy, inflation_trend = yoy_and_trend(cpi)

    # ── Logique des 4 quadrants ───────────────────────────────────────────────
    if   growth_trend == "up"   and inflation_trend == "down": phase = "Expansion"
    elif growth_trend == "up"   and inflation_trend == "up":   phase = "Surchauffe"
    elif growth_trend == "down" and inflation_trend == "up":   phase = "Contraction"
    else:                                                       phase = "Récession"

    result = {
        "phase":           phase,
        "growth_yoy":      growth_yoy,
        "inflation_yoy":   inflation_yoy,
        "growth_trend":    growth_trend,
        "inflation_trend": inflation_trend,
    }
    set_cached(db, "macro_cycle", result)
    return result


# ── GET /macro/liquidity ──────────────────────────────────────────────────────

@macro_router.get("/liquidity")
def get_macro_liquidity(db: Session = Depends(get_db)):
    """
    Retourne M2SL (masse monétaire USA, FRED) et BTC-USD (yfinance) normalisés
    en base 100 depuis janvier 2020, rééchantillonnés au mois.
    Résultat mis en cache 24h dans PostgreSQL.
    """
    cached = get_cached(db, "macro_liquidity")
    if cached:
        return cached

    api_key = os.getenv("FRED_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="Variable FRED_API_KEY manquante")

    start_date = "2020-01-01"

    # ── M2 depuis FRED ────────────────────────────────────────────────────────
    try:
        fred   = Fred(api_key=api_key)
        m2_raw = fred.get_series("M2SL", observation_start=start_date).dropna()
        m2     = m2_raw.resample("MS").last()   # forcer début de mois
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Erreur FRED M2SL : {exc}")

    # ── BTC depuis Yahoo Finance ──────────────────────────────────────────────
    try:
        btc_df = yf.download("BTC-USD", start=start_date, auto_adjust=True, progress=False)
        if btc_df.empty:
            raise ValueError("Aucune donnée retournée pour BTC-USD")
        close = btc_df["Close"]
        # yfinance v0.2+ peut renvoyer un DataFrame multi-colonnes
        if isinstance(close, pd.DataFrame):
            close = close.squeeze()
        btc = close.resample("MS").last().dropna()
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Erreur yfinance BTC : {exc}")

    # ── Alignement sur dates communes + normalisation base 100 ───────────────
    df = pd.DataFrame({"m2": m2, "btc": btc}).dropna()
    if len(df) < 2:
        raise HTTPException(
            status_code=500,
            detail=f"Trop peu de points après alignement M2/BTC ({len(df)})",
        )

    base_m2  = df["m2"].iloc[0]
    base_btc = df["btc"].iloc[0]
    df["m2_norm"]  = df["m2"]  / base_m2  * 100
    df["btc_norm"] = df["btc"] / base_btc * 100

    result = {
        "dates":          [d.strftime("%Y-%m-%d") for d in df.index],
        "m2_normalized":  [round(float(v), 2) for v in df["m2_norm"]],
        "btc_normalized": [round(float(v), 2) for v in df["btc_norm"]],
    }
    set_cached(db, "macro_liquidity", result)
    return result
