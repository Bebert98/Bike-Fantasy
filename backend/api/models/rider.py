from pydantic import BaseModel

class Rider(BaseModel):
    rider_name: str
    points: float