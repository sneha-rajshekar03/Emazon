"""
Payment Method Predictor API - FastAPI
UPDATED: Support for hex string user IDs (68d18b29942c7f5a8864ae4f format)
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import pandas as pd
import numpy as np
import joblib
import warnings
from typing import Optional, List, Dict
from datetime import datetime
warnings.filterwarnings('ignore')
from database import get_all_transactions, get_user_current_profile

# ============================================================================
# FastAPI App Setup
# ============================================================================

app = FastAPI(
    title="Payment Method Predictor API",
    description="ML-powered payment method prediction with 90% accuracy - Hex String User ID Support",
    version="2.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "https://your-domain.com",
        "https://your-domain.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================================
# Request/Response Models (Pydantic)
# ============================================================================

class PredictionRequest(BaseModel):
    """Enhanced prediction request with HEX STRING user_id"""
    user_id: str = Field(..., description="User identifier (hex string)", example="68d18b29942c7f5a8864ae4f")
    product_price: float = Field(..., description="Product price in rupees", example=5000.0)
    age: Optional[int] = Field(None, ge=18, le=100, description="User age", example=28)
    gender: Optional[str] = Field(None, description="Gender: Male/Female", example="Male")
    occupation: Optional[str] = Field(None, description="Occupation category", example="Technical/IT")
    region: Optional[str] = Field(None, description="Region: Urban/Suburban/Rural", example="Urban")
    device_type: Optional[str] = Field(None, description="Device: Mobile/Desktop/Tablet", example="Mobile")
    hour_of_day: Optional[int] = Field(None, ge=0, le=23, description="Hour of day (0-23)", example=14)
    is_weekend: Optional[bool] = Field(None, description="Is weekend transaction", example=False)

class PredictionResponse(BaseModel):
    user_id: str
    prediction: str
    confidence: float
    confidence_level: str
    probabilities: Dict[str, float]
    user_profile: Optional[Dict]
    features_used: Optional[Dict]
    insights: List[str]
    is_new_user: bool

# ============================================================================
# Payment Predictor Class
# ============================================================================

class PaymentPredictor:
    """Main payment prediction system with HEX STRING user_id support"""
    
    def __init__(self):
        self.rf_model = None
        self.gb_model = None
        self.feature_columns = None
        self.label_encoders = None
        self.user_profiles = {}
        self.is_loaded = False
    
    def load_models(self):
        """Load trained models and build user profiles from MongoDB"""
        try:
            print("📦 Loading ML models...")
            
            self.rf_model, self.gb_model = joblib.load('payment_predictor_time_aware.pkl')
            self.feature_columns = joblib.load('feature_columns_time_aware.pkl')
            self.label_encoders = joblib.load('label_encoders_time_aware.pkl')
            
            print("✅ Models loaded successfully")
            print(f"   - Random Forest: {self.rf_model.n_estimators} trees")
            print(f"   - Gradient Boosting: {self.gb_model.n_estimators} estimators")
            print(f"   - Features: {len(self.feature_columns)}")
            
            print("📥 Loading transaction history from MongoDB...")
            records = get_all_transactions()
            
            if not records:
                print("⚠️ No transaction data found in MongoDB!")
                return False

            df = pd.DataFrame(records)
            
            # Ensure user_id is string (hex format)
            df['user_id'] = df['user_id'].astype(str)
            df['transaction_date'] = pd.to_datetime(df['transaction_date'])
            df = df.sort_values(['user_id', 'transaction_date']).reset_index(drop=True)
            
            print(f"✅ Loaded {len(df)} transactions from {df['user_id'].nunique()} users")
            
            print("🔧 Building user profiles from database...")
            # Use the LATEST state for each user (last transaction)
            for user_id in df['user_id'].unique():
                user_data = df[df['user_id'] == user_id].sort_values('transaction_date')
                
                # Get CURRENT profile state using database function
                current_profile = get_user_current_profile(user_id)
                
                if current_profile:
                    last_row = user_data.iloc[-1]
                    
                    self.user_profiles[user_id] = {
                        'past_txns': current_profile['past_transactions'],
                        'past_upi_ratio': current_profile['past_upi_ratio'],
                        'past_card_ratio': current_profile['past_card_ratio'],
                        'past_cod_ratio': current_profile['past_cod_ratio'],
                        'avg_order_value': current_profile['average_order_value'],
                        'last_payment': current_profile['last_payment_method'],
                        'last_date': user_data['transaction_date'].iloc[-1],
                        'user_data': {
                            'age': current_profile['age'],
                            'gender': current_profile['gender'],
                            'occupation': current_profile['occupation'],
                            'region': current_profile['region'],
                            'device_type': current_profile['device_type']
                        }
                    }
            
            self.is_loaded = True
            print(f"✅ Built profiles for {len(self.user_profiles)} users")
            print(f"   Sample user IDs: {list(self.user_profiles.keys())[:3]}")
            print("🚀 Payment Predictor API ready!")
            return True
            
        except FileNotFoundError as e:
            print(f"❌ Error: Required file not found - {e}")
            return False
        except Exception as e:
            print(f"❌ Error loading models: {e}")
            import traceback
            print(traceback.format_exc())
            return False
    
    def predict(self, user_id: str, product_price: float, 
                age: int = None, gender: str = None, 
                occupation: str = None, region: str = None,
                device_type: str = None, hour_of_day: int = None, 
                is_weekend: bool = None) -> dict:
        """Enhanced prediction with HEX STRING user_id"""
        
        try:
            # Handle new users (not in database yet)
            if user_id not in self.user_profiles:
                # Set defaults for new users
                default_age = age or 30
                default_gender = gender or 'Male'
                default_occupation = occupation or 'Other'
                default_region = region or 'Urban'
                default_device = device_type or 'Mobile'
                
                return {
                    'user_id': user_id,
                    'prediction': 'upi',
                    'confidence': 0.40,
                    'confidence_level': 'Low',
                    'probabilities': {'upi': 0.40, 'card': 0.35, 'cod': 0.25},
                    'user_profile': None,
                    'features_used': {
                        'age': default_age,
                        'gender': default_gender,
                        'occupation': default_occupation,
                        'region': default_region,
                        'device_type': default_device,
                        'hour_of_day': hour_of_day if hour_of_day is not None else 'not_provided',
                        'is_weekend': is_weekend if is_weekend is not None else 'not_provided',
                        'product_price': product_price
                    },
                    'insights': [
                        f'New user ({user_id[:8]}...) - no transaction history available',
                        'Defaulting to UPI (most popular payment method)',
                        'Provide complete user details for better predictions'
                    ],
                    'is_new_user': True
                }
            
            profile = self.user_profiles[user_id]
            user_data = profile['user_data']
            
            # Use provided values OR fall back to user profile defaults
            age = age if age is not None else user_data['age']
            gender = gender if gender is not None else user_data['gender']
            occupation = occupation if occupation is not None else user_data['occupation']
            region = region if region is not None else user_data['region']
            device_type = device_type if device_type is not None else user_data['device_type']
            hour_of_day = hour_of_day if hour_of_day is not None else pd.Timestamp.now().hour
            is_weekend = is_weekend if is_weekend is not None else (pd.Timestamp.now().dayofweek >= 5)
            
            days_since_last = (pd.Timestamp.now() - profile['last_date']).days
            
            enhanced_user_data = {
                'age': age,
                'gender': gender,
                'occupation': occupation,
                'region': region,
                'device_type': device_type
            }
            
            # Build feature vector
            features = self._build_features(
                profile, enhanced_user_data, product_price,
                device_type, hour_of_day, is_weekend,
                days_since_last
            )
            
            # Create DataFrame for prediction
            X = pd.DataFrame([features])[self.feature_columns].fillna(0)
            
            # Get predictions from both models
            rf_proba = self.rf_model.predict_proba(X)[0]
            gb_proba = self.gb_model.predict_proba(X)[0]
            
            # Ensemble prediction
            ensemble_proba = (rf_proba + gb_proba) / 2
            
            # ALWAYS use highest probability
            prediction = self.rf_model.classes_[ensemble_proba.argmax()]
            confidence = float(ensemble_proba.max())
            
            # Determine confidence level
            if confidence >= 0.80:
                confidence_level = 'Very High'
            elif confidence >= 0.65:
                confidence_level = 'High'
            elif confidence >= 0.50:
                confidence_level = 'Medium'
            else:
                confidence_level = 'Low'
            
            # Generate insights
            insights = self._generate_enhanced_insights(
                user_id, profile, features, product_price, 
                age, occupation, region, device_type
            )
            
            # Format probabilities
            probabilities = {
                method: float(prob)
                for method, prob in zip(self.rf_model.classes_, ensemble_proba)
            }
            sorted_probs = dict(sorted(probabilities.items(), key=lambda x: x[1], reverse=True))
            
            return {
                'user_id': user_id,
                'prediction': prediction,
                'confidence': round(confidence, 4),
                'confidence_level': confidence_level,
                'probabilities': sorted_probs,
                'user_profile': {
                    'total_transactions': profile['past_txns'],
                    'upi_usage': f"{profile['past_upi_ratio']*100:.1f}%",
                    'card_usage': f"{profile['past_card_ratio']*100:.1f}%",
                    'cod_usage': f"{profile['past_cod_ratio']*100:.1f}%",
                    'avg_order_value': round(profile['avg_order_value'], 2),
                    'last_payment': profile['last_payment'],
                    'days_since_last_purchase': days_since_last
                },
                'features_used': {
                    'age': age,
                    'gender': gender,
                    'occupation': occupation,
                    'region': region,
                    'device_type': device_type,
                    'hour_of_day': hour_of_day,
                    'is_weekend': is_weekend,
                    'product_price': product_price
                },
                'insights': insights,
                'is_new_user': False
            }
            
        except Exception as e:
            print(f"❌ PREDICTION ERROR: {str(e)}")
            import traceback
            print(traceback.format_exc())
            raise
    
    def _build_features(self, profile, user_data, product_price,
                       device_type, hour_of_day, is_weekend, days_since_last):
        """Build complete feature vector for prediction"""
        features = {}
        
        # Payment history ratios
        features['real_past_upi_ratio'] = profile['past_upi_ratio']
        features['real_past_card_ratio'] = profile['past_card_ratio']
        features['real_past_cod_ratio'] = profile['past_cod_ratio']
        
        # Payment preference features
        ratios = [profile['past_upi_ratio'], profile['past_card_ratio'], profile['past_cod_ratio']]
        sorted_ratios = sorted(ratios, reverse=True)
        
        features['max_payment_ratio'] = sorted_ratios[0]
        features['second_max_ratio'] = sorted_ratios[1] if len(sorted_ratios) > 1 else 0
        features['preference_gap'] = sorted_ratios[0] - sorted_ratios[1]
        features['preference_confidence'] = sorted_ratios[0] * np.log1p(profile['past_txns'])
        
        dominant_idx = ratios.index(max(ratios))
        features['dominant_method'] = dominant_idx
        
        # Loyalty scores
        features['upi_loyalty'] = int(profile['past_upi_ratio'] * 10)
        features['card_loyalty'] = int(profile['past_card_ratio'] * 10)
        features['cod_loyalty'] = int(profile['past_cod_ratio'] * 10)
        
        # Transaction history
        features['real_past_txns'] = profile['past_txns']
        features['log_past_txns'] = np.log1p(profile['past_txns'])
        features['is_new'] = 1 if profile['past_txns'] <= 2 else 0
        features['is_moderate'] = 1 if 2 < profile['past_txns'] <= 7 else 0
        features['is_experienced'] = 1 if profile['past_txns'] > 7 else 0
        
        # Price features
        features['product_price'] = product_price
        features['log_price'] = np.log1p(product_price)
        features['price_k'] = product_price / 1000
        features['price_low'] = 1 if product_price < 2000 else 0
        features['price_mid'] = 1 if 2000 <= product_price < 8000 else 0
        features['price_high'] = 1 if product_price >= 8000 else 0
        features['real_avg_order_value'] = profile['avg_order_value']
        features['price_vs_avg'] = product_price / (profile['avg_order_value'] + 1)
        features['is_expensive_for_user'] = 1 if features['price_vs_avg'] > 1.5 else 0
        features['is_cheap_for_user'] = 1 if features['price_vs_avg'] < 0.7 else 0
        
        # Last payment features
        last_payment_encoded = self.label_encoders['last_payment'].transform([profile['last_payment']])[0]
        features['last_payment_encoded'] = last_payment_encoded
        features['real_days_since_last'] = days_since_last
        features['is_recent'] = 1 if days_since_last <= 7 else 0
        features['is_returning'] = 1 if days_since_last > 30 else 0
        
        # Demographics
        features['age'] = user_data['age']
        features['age_young'] = 1 if user_data['age'] < 30 else 0
        features['age_middle'] = 1 if 30 <= user_data['age'] < 50 else 0
        features['age_senior'] = 1 if user_data['age'] >= 50 else 0
        # Fill missing or empty categorical fields with defaults
        defaults = {
       'gender': 'Male',
       'occupation': 'Other',
       'region': 'Urban'
      }

        for col in ['gender', 'occupation', 'region']:
          if col not in user_data or user_data[col] in [None, '']:user_data[col] = defaults[col]

        # Encode categorical features
        for col in ['gender', 'occupation', 'region']:
            encoded_val = self.label_encoders[col].transform([user_data[col]])[0]
            features[f'{col}_encoded'] = encoded_val
        
        # Occupation groups
        high_income = ['Finance', 'Legal', 'Business', 'Healthcare']
        tech = ['Technical/IT']
        budget = ['Student', 'Retired']
        
        features['is_high_income'] = 1 if user_data['occupation'] in high_income else 0
        features['is_tech'] = 1 if user_data['occupation'] in tech else 0
        features['is_budget'] = 1 if user_data['occupation'] in budget else 0
        
        # Region features
        features['is_urban'] = 1 if user_data['region'] == 'Urban' else 0
        features['is_rural'] = 1 if user_data['region'] == 'Rural' else 0
        
        # Device features
        device_encoded = self.label_encoders['device_type'].transform([device_type])[0]
        features['device_type_encoded'] = device_encoded
        features['is_mobile'] = 1 if device_type == 'Mobile' else 0
        features['is_desktop'] = 1 if device_type == 'Desktop' else 0
        
        # Time features
        features['is_weekend'] = 1 if is_weekend else 0
        features['hour_of_day'] = hour_of_day
        features['hour_morning'] = 1 if 6 <= hour_of_day < 12 else 0
        features['hour_afternoon'] = 1 if 12 <= hour_of_day < 18 else 0
        features['hour_evening'] = 1 if 18 <= hour_of_day < 23 else 0
        
        # Interaction features
        features['mobile_young'] = features['is_mobile'] * features['age_young']
        features['mobile_upi_user'] = features['is_mobile'] * (1 if profile['past_upi_ratio'] > 0.5 else 0)
        features['desktop_card_user'] = features['is_desktop'] * (1 if profile['past_card_ratio'] > 0.3 else 0)
        features['rural_cod_user'] = features['is_rural'] * (1 if profile['past_cod_ratio'] > 0.3 else 0)
        features['high_income_card'] = features['is_high_income'] * (1 if profile['past_card_ratio'] > 0.2 else 0)
        features['senior_cod'] = features['age_senior'] * (1 if profile['past_cod_ratio'] > 0.2 else 0)
        
        return features
    
    def _generate_enhanced_insights(self, user_id, profile, features, 
                                   product_price, age, occupation, region, device_type):
        """Generate enhanced insights"""
        insights = []
        
        # Use shortened user_id for display
        short_id = user_id[:8] + "..." if len(user_id) > 8 else user_id
        
        if profile['past_txns'] > 15:
            insights.append(f"VIP user ({short_id}) with {profile['past_txns']} transactions")
        elif profile['past_txns'] > 10:
            insights.append(f"Loyal customer with {profile['past_txns']} transactions")
        elif profile['past_txns'] <= 3:
            insights.append("New customer - building preference profile")
        
        if features['max_payment_ratio'] > 0.7:
            methods = ['UPI', 'Card', 'COD']
            dominant = methods[features['dominant_method']]
            insights.append(f"Strong {dominant} preference ({features['max_payment_ratio']*100:.0f}% of history)")
        
        if age < 30 and device_type == 'Mobile':
            insights.append("Young mobile user - typically prefers UPI")
        elif age >= 50:
            insights.append("Senior user - may prefer COD or Card")
        
        if occupation in ['Technical/IT', 'Finance', 'Business']:
            insights.append(f"{occupation} professional - tech-savvy payment behavior")
        
        if features['is_expensive_for_user']:
            insights.append(f"₹{product_price:,.0f} is higher than typical ₹{profile['avg_order_value']:,.0f}")
        
        return insights[:5]

# ============================================================================
# Initialize Predictor
# ============================================================================

predictor = PaymentPredictor()

# ============================================================================
# API Endpoints
# ============================================================================

@app.on_event("startup")
async def startup_event():
    """Load models when API starts"""
    print("="*70)
    print("🚀 PAYMENT PREDICTOR API v2.1.0 - HEX STRING USER ID SUPPORT")
    print("="*70)
    success = predictor.load_models()
    if not success:
        print("\n⚠️  WARNING: Models failed to load!")
    print("="*70)

@app.get("/")
async def root():
    return {
        "name": "Payment Method Predictor API",
        "version": "2.1.0",
        "user_id_format": "Hex String (e.g., 68d18b29942c7f5a8864ae4f)",
        "status": "online" if predictor.is_loaded else "model_not_loaded",
        "documentation": "/docs"
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy" if predictor.is_loaded else "unhealthy",
        "model_loaded": predictor.is_loaded,
        "users_in_system": len(predictor.user_profiles),
        "timestamp": datetime.now().isoformat()
    }

@app.post("/predict", response_model=PredictionResponse)
async def predict_payment(request: PredictionRequest):
    """Predict payment method - HEX STRING user_id"""
    if not predictor.is_loaded:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    try:
        result = predictor.predict(
            user_id=request.user_id,
            product_price=request.product_price,
            age=request.age,
            gender=request.gender,
            occupation=request.occupation,
            region=request.region,
            device_type=request.device_type,
            hour_of_day=request.hour_of_day,
            is_weekend=request.is_weekend
        )
        return result
    except Exception as e:
        import traceback
        print(f"❌ ERROR: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")

@app.get("/user/{user_id}/profile")
async def get_user_profile(user_id: str):
    """Get user's payment history - HEX STRING user_id"""
    if not predictor.is_loaded:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    if user_id not in predictor.user_profiles:
        raise HTTPException(status_code=404, detail=f"User {user_id} not found")
    
    profile = predictor.user_profiles[user_id]
    user_data = profile['user_data']
    
    return {
        "user_id": user_id,
        "total_transactions": profile['past_txns'],
        "payment_preferences": {
            "upi": f"{profile['past_upi_ratio']*100:.1f}%",
            "card": f"{profile['past_card_ratio']*100:.1f}%",
            "cod": f"{profile['past_cod_ratio']*100:.1f}%"
        },
        "demographics": user_data,
        "avg_order_value": round(profile['avg_order_value'], 2),
        "last_payment": profile['last_payment']
    }

@app.get("/stats")
async def get_stats():
    """Get API statistics"""
    if not predictor.is_loaded:
        return {"status": "model_not_loaded"}
    
    all_txns = [p['past_txns'] for p in predictor.user_profiles.values()]
    
    return {
        "total_users": len(predictor.user_profiles),
        "total_transactions": sum(all_txns),
        "avg_transactions_per_user": round(np.mean(all_txns), 2),
        "sample_user_ids": list(predictor.user_profiles.keys())[:5],
        "timestamp": datetime.now().isoformat()
    }

# ============================================================================
# Run Server
# ============================================================================

if __name__ == "__main__":
    import uvicorn
    
    print("\n🚀 Starting Payment Predictor API Server v2.1.0")
    print("📍 http://localhost:5050")
    print("📚 http://localhost:5050/docs")
    
    uvicorn.run(app, host="0.0.0.0", port=5050, log_level="info")