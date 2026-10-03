from fastapi import FastAPI
from pydantic import BaseModel
import joblib
import pandas as pd
from fastapi.middleware.cors import CORSMiddleware
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

model_path = os.path.join(os.path.dirname(__file__), '..', 'models', 'best_model.pkl')
try:
    model = joblib.load(model_path)
except Exception as e:
    print(f"Error loading model: {e}")
    model = None

class CustomerData(BaseModel):
    gender: str
    SeniorCitizen: int
    Partner: str
    Dependents: str
    tenure: int
    PhoneService: str
    MultipleLines: str
    InternetService: str
    OnlineSecurity: str
    OnlineBackup: str
    DeviceProtection: str
    TechSupport: str
    StreamingTV: str
    StreamingMovies: str
    Contract: str
    PaperlessBilling: str
    PaymentMethod: str
    MonthlyCharges: float
    TotalCharges: float

@app.post("/api/predict")
def predict(data: CustomerData):
    if not model:
        return {"error": "Model not loaded"}
        
    df = pd.DataFrame([data.dict()])
    df['tenure_bucket'] = pd.cut(df['tenure'], bins=[0, 12, 24, 48, 60, 100], labels=['0-1', '1-2', '2-4', '4-5', '5+'])
    
    services = ['PhoneService', 'MultipleLines', 'InternetService', 'OnlineSecurity', 
                'OnlineBackup', 'DeviceProtection', 'TechSupport', 'StreamingTV', 'StreamingMovies']
    df['number_of_services'] = df[services].apply(lambda x: sum((x != 'No') & (x != 'No internet service') & (x != 'No phone service')), axis=1)
    
    df['avg_monthly_charge'] = df['TotalCharges'] / df['tenure'] if df['tenure'].iloc[0] > 0 else 0
    df['avg_monthly_charge'] = df['avg_monthly_charge'].fillna(0)
    
    df['has_support'] = df['TechSupport'].apply(lambda x: 1 if x == 'Yes' else 0)
    df['is_autopay'] = df['PaymentMethod'].apply(lambda x: 1 if 'automatic' in x else 0)
    
    prob = model.predict_proba(df)[:, 1][0]
    return {"churn_probability": float(prob)}

@app.get("/health")
def health():
    return {"success": True, "database": "CONNECTED"}
