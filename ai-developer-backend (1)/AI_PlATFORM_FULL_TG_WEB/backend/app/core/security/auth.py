import bcrypt
import jwt
from datetime import datetime, timedelta
from typing import Optional, Dict
import os

JWT_SECRET = os.getenv("JWT_SECRET")
if not JWT_SECRET:
    raise ValueError("JWT_SECRET not set")
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

def hash_password(password: str) -> str:
    """Хеширование пароля с солью."""
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    """Проверка пароля."""
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_jwt(user_id: int, is_admin: bool = False, expires_delta: Optional[timedelta] = None) -> str:
    """Создание JWT токена доступа."""
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS)

    payload = {
        "sub": str(user_id),
        "admin": is_admin,
        "exp": expire,
        "iat": datetime.utcnow(),
        "type": "access"
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def decode_jwt(token: str) -> Optional[Dict]:
    """Декодирование и валидация JWT токена."""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return {
            "user_id": int(payload["sub"]),
            "is_admin": payload.get("admin", False),
            "exp": payload["exp"]
        }
    except jwt.ExpiredSignatureError:
        return None
    except jwt.PyJWTError:
        return None

def create_refresh_token(user_id: int) -> str:
    """Создание refresh токена."""
    expire = datetime.utcnow() + timedelta(days=30)
    payload = {
        "sub": str(user_id),
        "exp": expire,
        "type": "refresh"
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


import hmac
import hashlib
import urllib.parse

def verify_telegram_init_data(init_data: str, bot_token: str) -> Dict[str, str]:
    """Verify Telegram WebApp initData (Mini App).
    Returns parsed dict if valid, else raises ValueError.
    """
    data = dict(urllib.parse.parse_qsl(init_data, keep_blank_values=True))
    provided_hash = data.pop("hash", "")
    if not provided_hash:
        raise ValueError("No hash in initData")

    check_string = "\n".join([f"{k}={data[k]}" for k in sorted(data.keys())])
    secret_key = hashlib.sha256(bot_token.encode()).digest()
    calculated_hash = hmac.new(secret_key, check_string.encode(), hashlib.sha256).hexdigest()

    if not hmac.compare_digest(calculated_hash, provided_hash):
        raise ValueError("Bad initData hash")
    return data
