from motor.motor_asyncio import AsyncIOMotorClient
import certifi

def create_mongo_client(mongodb_url: str, ssl_allow_invalid: bool = False) -> AsyncIOMotorClient:
    motor_kwargs = {
        "serverSelectionTimeoutMS": 10000,
        "connectTimeoutMS": 10000,
        "socketTimeoutMS": 20000,
        "maxPoolSize": 10,
    }
    
    try:
        if mongodb_url and (mongodb_url.startswith("mongodb+srv://") or "mongodb.net" in mongodb_url):
            motor_kwargs["tls"] = True
            motor_kwargs["tlsCAFile"] = certifi.where()
            motor_kwargs["serverSelectionTimeoutMS"] = 20000
    except Exception:
        pass
        
    if ssl_allow_invalid:
        motor_kwargs["tlsAllowInvalidCertificates"] = True
        motor_kwargs["tlsAllowInvalidHostnames"] = True
        
    return AsyncIOMotorClient(mongodb_url, **motor_kwargs)
