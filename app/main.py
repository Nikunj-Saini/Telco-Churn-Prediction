import streamlit as st
import pandas as pd
import joblib
import os
from PIL import Image

# Set page config
st.set_page_config(page_title="Telco Churn Prediction App", layout="wide")

# Load model and preprocessor
@st.cache_resource
def load_models():
    best_model = joblib.load('models/best_model.pkl')
    return best_model

try:
    model = load_models()
except:
    model = None

st.title("Telco Customer Churn Prediction & Dashboard")

tabs = st.tabs(["Dashboard & Insights", "Prediction Form"])

with tabs[0]:
    st.header("Exploratory Data Analysis & SHAP Insights")
    
    col1, col2 = st.columns(2)
    with col1:
        if os.path.exists('reports/figures/eda_tenure.png'):
            st.image(Image.open('reports/figures/eda_tenure.png'), caption="Churn by Tenure")
        if os.path.exists('reports/figures/eda_Contract.png'):
            st.image(Image.open('reports/figures/eda_Contract.png'), caption="Churn by Contract")
    with col2:
        if os.path.exists('reports/figures/eda_MonthlyCharges.png'):
            st.image(Image.open('reports/figures/eda_MonthlyCharges.png'), caption="Distribution of MonthlyCharges")
        if os.path.exists('reports/figures/eda_InternetService.png'):
            st.image(Image.open('reports/figures/eda_InternetService.png'), caption="Churn by InternetService")
            
    st.subheader("Global Feature Importance (SHAP)")
    if os.path.exists('reports/figures/shap_summary.png'):
        st.image(Image.open('reports/figures/shap_summary.png'), caption="SHAP Summary Plot")

with tabs[1]:
    st.header("Predict Customer Churn Risk")
    
    if model is None:
        st.warning("Model not found. Please train the model first by running pipeline.py")
    else:
        with st.form("prediction_form"):
            col1, col2 = st.columns(2)
            
            with col1:
                gender = st.selectbox("Gender", ["Male", "Female"])
                senior = st.selectbox("Senior Citizen", [0, 1])
                partner = st.selectbox("Partner", ["Yes", "No"])
                dependents = st.selectbox("Dependents", ["Yes", "No"])
                tenure = st.number_input("Tenure (months)", min_value=0, max_value=100, value=12)
                phone = st.selectbox("Phone Service", ["Yes", "No"])
                multi_lines = st.selectbox("Multiple Lines", ["Yes", "No", "No phone service"])
                internet = st.selectbox("Internet Service", ["DSL", "Fiber optic", "No"])
                security = st.selectbox("Online Security", ["Yes", "No", "No internet service"])
                
            with col2:
                backup = st.selectbox("Online Backup", ["Yes", "No", "No internet service"])
                protection = st.selectbox("Device Protection", ["Yes", "No", "No internet service"])
                support = st.selectbox("Tech Support", ["Yes", "No", "No internet service"])
                tv = st.selectbox("Streaming TV", ["Yes", "No", "No internet service"])
                movies = st.selectbox("Streaming Movies", ["Yes", "No", "No internet service"])
                contract = st.selectbox("Contract", ["Month-to-month", "One year", "Two year"])
                paperless = st.selectbox("Paperless Billing", ["Yes", "No"])
                payment = st.selectbox("Payment Method", ["Electronic check", "Mailed check", "Bank transfer (automatic)", "Credit card (automatic)"])
                monthly_charges = st.number_input("Monthly Charges", min_value=0.0, value=50.0)
                total_charges = st.number_input("Total Charges", min_value=0.0, value=500.0)
                
            submit = st.form_submit_button("Predict Churn")
            
        if submit:
            # Create input dataframe
            input_data = pd.DataFrame([{
                'gender': gender,
                'SeniorCitizen': senior,
                'Partner': partner,
                'Dependents': dependents,
                'tenure': tenure,
                'PhoneService': phone,
                'MultipleLines': multi_lines,
                'InternetService': internet,
                'OnlineSecurity': security,
                'OnlineBackup': backup,
                'DeviceProtection': protection,
                'TechSupport': support,
                'StreamingTV': tv,
                'StreamingMovies': movies,
                'Contract': contract,
                'PaperlessBilling': paperless,
                'PaymentMethod': payment,
                'MonthlyCharges': monthly_charges,
                'TotalCharges': total_charges
            }])
            
            # Feature Engineering logic (same as pipeline)
            input_data['tenure_bucket'] = pd.cut(input_data['tenure'], bins=[0, 12, 24, 48, 60, 100], labels=['0-1', '1-2', '2-4', '4-5', '5+'])
            
            services = ['PhoneService', 'MultipleLines', 'InternetService', 'OnlineSecurity', 
                        'OnlineBackup', 'DeviceProtection', 'TechSupport', 'StreamingTV', 'StreamingMovies']
            input_data['number_of_services'] = input_data[services].apply(lambda x: sum((x != 'No') & (x != 'No internet service') & (x != 'No phone service')), axis=1)
            
            input_data['avg_monthly_charge'] = input_data['TotalCharges'] / input_data['tenure'] if input_data['tenure'].iloc[0] > 0 else 0
            input_data['avg_monthly_charge'] = input_data['avg_monthly_charge'].fillna(0)
            
            input_data['has_support'] = input_data['TechSupport'].apply(lambda x: 1 if x == 'Yes' else 0)
            input_data['is_autopay'] = input_data['PaymentMethod'].apply(lambda x: 1 if 'automatic' in x else 0)
            
            try:
                # Predict
                prob = model.predict_proba(input_data)[:, 1][0]
                
                st.subheader("Prediction Result")
                st.write(f"**Churn Probability:** {prob:.2%}")
                
                if prob > 0.8:
                    st.error("High Risk of Churn! Recommended Action: Offer retention discount immediately.")
                elif prob > 0.5:
                    st.warning("Medium Risk of Churn. Recommended Action: Reach out with targeted communication.")
                else:
                    st.success("Low Risk of Churn. Customer is likely to stay.")
                    
            except Exception as e:
                st.error(f"Error making prediction: {str(e)}")
