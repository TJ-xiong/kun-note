import time
import requests
from functools import wraps
from flask import request, g, current_app, jsonify

# 内存缓存：{token: (user_info, expire_timestamp)}
_token_cache: dict = {}
CACHE_TTL = 300  # 5 分钟


def _verify_token(token: str) -> dict:
    """调用用户中心验证 token 并获取用户信息"""
    # 检查缓存
    cached = _token_cache.get(token)
    if cached and cached[1] > time.time():
        return cached[0]

    user_center_url = current_app.config['USER_CENTER_URL']
    resp = requests.get(
        f'{user_center_url}/users/me',
        headers={'Authorization': f'Bearer {token}'},
        timeout=5
    )
    if resp.status_code != 200:
        raise ValueError('Token expired or invalid')

    user_info = resp.json()
    # 缓存结果
    _token_cache[token] = (user_info, time.time() + CACHE_TTL)
    return user_info


def require_token(f):
    """验证 Bearer Token 的装饰器，将用户信息存入 g.user"""

    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return jsonify({'code': 401, 'message': 'Missing or invalid Authorization header'}), 401

        token = auth_header[7:]
        try:
            user_info = _verify_token(token)
            g.user = user_info
        except ValueError:
            return jsonify({'code': 401, 'message': 'Token expired or invalid'}), 401
        except requests.RequestException:
            return jsonify({'code': 503, 'message': 'User center unavailable'}), 503

        return f(*args, **kwargs)

    return decorated
