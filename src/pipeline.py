import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from xgboost import XGBClassifier
from lightgbm import LGBMClassifier
from sklearn.metrics import classification_report, roc_auc_score, average_precision_score, recall_score, precision_score, f1_score
from imblearn.over_sampling import SMOTE
from imblearn.pipeline import Pipeline as ImbPipeline
import shap
import joblib
import os

# Create directories if not exist
os.makedirs('reports/figures', exist_ok=True)
os.makedirs('models', exist_ok=True)
os.makedirs('data/processed', exist_ok=True)

# 1. Download/Load Data
df = pd.read_csv('data/raw/Telco-Customer-Churn.csv')

# 2. Data cleaning
df['TotalCharges'] = pd.to_numeric(df['TotalCharges'], errors='coerce')
df.dropna(subset=['TotalCharges'], inplace=True)
df.drop('customerID', axis=1, inplace=True)
df['Churn'] = df['Churn'].map({'Yes': 1, 'No': 0})

# 3. Report class imbalance
print("Class Imbalance:")
print(df['Churn'].value_counts(normalize=True))

# 4. EDA
# Save some EDA plots
sns.set_theme(style="whitegrid")

features_to_plot = ['Contract', 'tenure', 'InternetService', 'PaymentMethod', 'TechSupport', 'SeniorCitizen']
for feat in features_to_plot:
    plt.figure(figsize=(8,5))
    if feat == 'tenure':
        sns.histplot(data=df, x='tenure', hue='Churn', multiple="stack")
    else:
        sns.countplot(data=df, x=feat, hue='Churn')
    plt.title(f'Churn by {feat}')
    plt.tight_layout()
    plt.savefig(f'reports/figures/eda_{feat}.png')
    plt.close()

plt.figure(figsize=(8,5))
sns.histplot(data=df, x='MonthlyCharges', hue='Churn', kde=True)
plt.title('Distribution of MonthlyCharges for churned vs retained')
plt.savefig('reports/figures/eda_MonthlyCharges.png')
plt.close()

# 5. Feature Engineering
df['tenure_bucket'] = pd.cut(df['tenure'], bins=[0, 12, 24, 48, 60, 100], labels=['0-1', '1-2', '2-4', '4-5', '5+'])
services = ['PhoneService', 'MultipleLines', 'InternetService', 'OnlineSecurity', 
            'OnlineBackup', 'DeviceProtection', 'TechSupport', 'StreamingTV', 'StreamingMovies']
# Simplistic count of services (just treating any non-No as a service)
df['number_of_services'] = df[services].apply(lambda x: sum((x != 'No') & (x != 'No internet service') & (x != 'No phone service')), axis=1)
df['avg_monthly_charge'] = df['TotalCharges'] / df['tenure']
df['avg_monthly_charge'] = df['avg_monthly_charge'].fillna(0)
df['has_support'] = df['TechSupport'].apply(lambda x: 1 if x == 'Yes' else 0)
df['is_autopay'] = df['PaymentMethod'].apply(lambda x: 1 if 'automatic' in x else 0)

# Save processed data
df.to_csv('data/processed/cleaned_data.csv', index=False)

# 6. Preprocessing pipeline
categorical_features = df.select_dtypes(include=['object', 'category']).columns.tolist()
if 'Churn' in categorical_features: categorical_features.remove('Churn')
numerical_features = df.select_dtypes(include=['int64', 'float64']).columns.tolist()
numerical_features.remove('Churn')

preprocessor = ColumnTransformer(
    transformers=[
        ('num', StandardScaler(), numerical_features),
        ('cat', OneHotEncoder(handle_unknown='ignore', sparse_output=False), categorical_features)
    ])

# 7. Stratified train/test split
X = df.drop('Churn', axis=1)
y = df['Churn']
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, stratify=y, random_state=42)

# 8. Model comparison
models = {
    'Logistic Regression': LogisticRegression(class_weight='balanced', random_state=42, max_iter=1000),
    'Random Forest': RandomForestClassifier(class_weight='balanced', random_state=42),
    'XGBoost': XGBClassifier(scale_pos_weight=y_train.value_counts()[0]/y_train.value_counts()[1], random_state=42),
    'LightGBM': LGBMClassifier(class_weight='balanced', random_state=42, verbose=-1)
}

results = []
best_model = None
best_auc = 0
best_model_name = ""

for name, model in models.items():
    pipeline = Pipeline(steps=[('preprocessor', preprocessor),
                               ('classifier', model)])
    pipeline.fit(X_train, y_train)
    y_pred = pipeline.predict(X_test)
    y_proba = pipeline.predict_proba(X_test)[:, 1]
    
    auc = roc_auc_score(y_test, y_proba)
    if auc > best_auc:
        best_auc = auc
        best_model = pipeline
        best_model_name = name
        
    results.append({
        'Model': name,
        'Recall': recall_score(y_test, y_pred),
        'Precision': precision_score(y_test, y_pred),
        'F1': f1_score(y_test, y_pred),
        'ROC-AUC': auc,
        'PR-AUC': average_precision_score(y_test, y_proba)
    })

results_df = pd.DataFrame(results)
print("\nModel Comparison:")
print(results_df.to_markdown())

# Retrain best model using SMOTE (just to show it)
smote_pipeline = ImbPipeline(steps=[
    ('preprocessor', preprocessor),
    ('smote', SMOTE(random_state=42)),
    ('classifier', models[best_model_name].set_params(class_weight=None) if hasattr(models[best_model_name], 'class_weight') else models[best_model_name])
])
smote_pipeline.fit(X_train, y_train)

# Save best model
joblib.dump(best_model, 'models/best_model.pkl')
joblib.dump(preprocessor, 'models/preprocessor.pkl')

# 9. Threshold selection
y_proba_best = best_model.predict_proba(X_test)[:, 1]
thresholds = np.linspace(0.1, 0.9, 90)
costs = []
for t in thresholds:
    y_pred_t = (y_proba_best >= t).astype(int)
    # False Negative (Missed churner) cost = 5000
    # False Positive (Unnecessary retention offer) cost = 500
    fn = np.sum((y_test == 1) & (y_pred_t == 0))
    fp = np.sum((y_test == 0) & (y_pred_t == 1))
    cost = fn * 5000 + fp * 500
    costs.append(cost)

best_threshold = thresholds[np.argmin(costs)]
print(f"\nOptimal threshold based on cost: {best_threshold:.2f}")

plt.figure(figsize=(8,5))
plt.plot(thresholds, costs)
plt.axvline(best_threshold, color='r', linestyle='--')
plt.title('Cost vs Probability Threshold')
plt.xlabel('Threshold')
plt.ylabel('Total Cost')
plt.savefig('reports/figures/cost_vs_threshold.png')
plt.close()

# 10. SHAP
X_train_transformed = preprocessor.transform(X_train)
X_test_transformed = preprocessor.transform(X_test)
feature_names = preprocessor.get_feature_names_out()

model_step = best_model.named_steps['classifier']

if best_model_name in ['Random Forest', 'XGBoost', 'LightGBM']:
    explainer = shap.TreeExplainer(model_step)
    shap_values = explainer.shap_values(X_test_transformed)
    if isinstance(shap_values, list): # RF returns list
        shap_values = shap_values[1]
else:
    explainer = shap.LinearExplainer(model_step, X_train_transformed)
    shap_values = explainer.shap_values(X_test_transformed)

plt.figure()
shap.summary_plot(shap_values, X_test_transformed, feature_names=feature_names, show=False)
plt.savefig('reports/figures/shap_summary.png', bbox_inches='tight')
plt.close()

plt.figure()
shap.summary_plot(shap_values, X_test_transformed, feature_names=feature_names, plot_type="bar", show=False)
plt.savefig('reports/figures/shap_bar.png', bbox_inches='tight')
plt.close()

for i in range(3):
    plt.figure()
    shap.waterfall_plot(shap.Explanation(values=shap_values[i], base_values=explainer.expected_value[1] if isinstance(explainer.expected_value, list) else explainer.expected_value, data=X_test_transformed[i], feature_names=feature_names), show=False)
    plt.savefig(f'reports/figures/shap_waterfall_{i}.png', bbox_inches='tight')
    plt.close()
    
try:
    tenure_idx = list(feature_names).index('num__tenure')
    monthly_charges_idx = list(feature_names).index('num__MonthlyCharges')

    plt.figure()
    shap.dependence_plot(tenure_idx, shap_values, X_test_transformed, feature_names=feature_names, show=False)
    plt.savefig('reports/figures/shap_dependence_tenure.png', bbox_inches='tight')
    plt.close()

    plt.figure()
    shap.dependence_plot(monthly_charges_idx, shap_values, X_test_transformed, feature_names=feature_names, show=False)
    plt.savefig('reports/figures/shap_dependence_monthlycharges.png', bbox_inches='tight')
    plt.close()
except ValueError:
    pass

# 11. Customer Segmentation & ROI
df['churn_probability'] = best_model.predict_proba(X)[:, 1]
df['risk_tier'] = pd.qcut(df['churn_probability'], q=[0, 0.5, 0.8, 1.0], labels=['Low', 'Medium', 'High'])
top_20_risky = df[df['churn_probability'] >= df['churn_probability'].quantile(0.8)]

cost_per_contact = 500
value_saved = 5000
success_rate = 0.5

true_churners_in_top_20 = top_20_risky['Churn'].sum()
campaign_cost = len(top_20_risky) * cost_per_contact
saved_revenue = true_churners_in_top_20 * success_rate * value_saved
roi = ((saved_revenue - campaign_cost) / campaign_cost) * 100

print(f"\nROI of targeting top 20% risky customers: {roi:.2f}%")

df.to_csv('data/processed/scored_data.csv', index=False)
print("Pipeline complete!")
