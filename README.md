# Telco Customer Churn Prediction

## Problem Statement
The telecommunications industry faces severe customer churn due to high competition and the ease of switching service providers. Acquiring a new customer is significantly more expensive than retaining an existing one. This project aims to predict which customers are at a high risk of churning, so that proactive retention strategies can be employed. 

## Approach
1. **Data Cleaning & EDA**: Processed the IBM Telco Churn dataset, handled missing values, and created exploratory visualizations.
2. **Feature Engineering**: Extracted meaningful insights like tenure buckets, number of services used, average monthly charges, and simplified flags for tech support and autopay.
3. **Modeling**: Built a comprehensive sklearn `Pipeline` using a `ColumnTransformer` for preprocessing. Compared Logistic Regression, Random Forest, XGBoost, and LightGBM models. Addressed class imbalance using class weights and SMOTE.
4. **Evaluation**: Evaluated models on Recall, Precision, F1, ROC-AUC, and PR-AUC. Selected optimal threshold based on a cost-benefit matrix (₹5,000 for missed churner, ₹500 for unnecessary retention offer).
5. **Interpretability**: Used SHAP (SHapley Additive exPlanations) for global feature importance and local predictions.
6. **Business Impact**: Segmented customers into risk tiers and estimated the ROI of a targeted retention campaign.

## Results
- Evaluated models and observed robust ROC-AUC scores.
- Cost-based threshold optimization minimizes unnecessary campaign costs while maximizing retention.
- Feature importance highlighted `tenure`, `Contract_Month-to-month`, and `InternetService_Fiber optic` as key churn drivers.
- Estimated positive ROI for targeting the top 20% risky customers.

## Business Insights
1. **Month-to-month contracts** are highly correlated with churn; incentivizing 1-year or 2-year contracts could improve retention.
2. **Fiber optic** internet users churn more frequently than DSL users, indicating potential service quality or pricing issues.
3. **Lack of Tech Support** and Online Security increases churn risk. Bundling these services might improve loyalty.
4. **Early tenure (0-12 months)** is the most critical period. Onboarding programs should focus on this window.
5. **Electronic check** payment method has a significantly higher churn rate compared to automatic payments. Promoting autopay can reduce churn.
6. **Higher monthly charges** without corresponding value-add services lead to dissatisfaction. Targeted discounts for high-risk, high-value customers could be effective.

## Project Structure
- `data/` : Raw and processed data.
- `notebooks/` : Notebooks (if any).
- `src/` : Pipeline and helper scripts.
- `reports/figures/` : EDA and SHAP plots.
- `models/` : Saved best model.
- `app/` : Streamlit app for dashboard and predictions.

## Requirements
See `requirements.txt` for pinned versions.

## Usage
1. Install dependencies: `pip install -r requirements.txt`
2. Run the pipeline: `python src/pipeline.py`
3. Launch Streamlit app: `streamlit run app/main.py`
