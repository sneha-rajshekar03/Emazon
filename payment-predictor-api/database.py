import os
from pymongo import MongoClient
import pandas as pd
from datetime import datetime

client = MongoClient(MONGO_URI)
db = client.get_database("Emzon")

def get_all_transactions() -> list:
    """
    Fetches transactions with user profiles and computes ML features:
    - user_id, transaction_date, age, gender, occupation, region, device_type
    - product_price, is_weekend, hour_of_day
    - past_transactions, past_upi_ratio, past_card_ratio, past_cod_ratio
    - average_order_value, last_payment_method, days_since_last_purchase
    - payment_method, ratio_sum
    """
    print("📥 Fetching transactions and profiles from MongoDB...")
    
    # Fetch all data from correct collections
    transactions = list(db.purchasehistories.find({}).sort('transaction_date', 1))
    user_profiles = {str(u['userId']).strip(): u for u in db.profiles.find({})}
    
    if not transactions:
        print("⚠️  No transactions found in database!")
        return []
    
    print(f"✅ Found {len(transactions)} transactions and {len(user_profiles)} user profiles")
    
    # Convert to DataFrame for easier processing
    df = pd.DataFrame(transactions)
    
    # Basic field mapping
    df['user_id'] = df['user_id'].astype(str)
    df['transaction_date'] = pd.to_datetime(df['transaction_date'])
    df['product_price'] = df['total_amount'].fillna(0).astype(float)
    df['payment_method'] = df['payment_method'].fillna('upi').str.lower()
    df['device_type'] = df['device_type'].fillna('Mobile')
    
    # Extract time features
    df['hour_of_day'] = df['transaction_date'].dt.hour
    df['is_weekend'] = (df['transaction_date'].dt.dayofweek >= 5).astype(int)
    
    # Sort by user and date for temporal feature calculation
    df = df.sort_values(['user_id', 'transaction_date']).reset_index(drop=True)
    
    # Initialize feature columns
    df['past_transactions'] = 0
    df['past_upi_ratio'] = 0.0
    df['past_card_ratio'] = 0.0
    df['past_cod_ratio'] = 0.0
    df['average_order_value'] = 0.0
    df['last_payment_method'] = 'upi'
    df['days_since_last_purchase'] = 0
    
    print("🔧 Computing temporal features (past behavior)...")
    
    # Calculate features for each transaction based on PREVIOUS transactions
    for user_id in df['user_id'].unique():
        user_mask = df['user_id'] == user_id
        user_indices = df[user_mask].index.tolist()
        
        for i, idx in enumerate(user_indices):
            if i == 0:
                # First transaction for this user - no history
                df.at[idx, 'past_transactions'] = 0
                df.at[idx, 'past_upi_ratio'] = 0.0
                df.at[idx, 'past_card_ratio'] = 0.0
                df.at[idx, 'past_cod_ratio'] = 0.0
                df.at[idx, 'average_order_value'] = 0.0
                df.at[idx, 'last_payment_method'] = 'upi'  # default
                df.at[idx, 'days_since_last_purchase'] = 0
            else:
                # Get all PREVIOUS transactions for this user
                prev_indices = user_indices[:i]
                prev_txns = df.loc[prev_indices]
                
                # Count of past transactions
                past_count = len(prev_txns)
                df.at[idx, 'past_transactions'] = past_count
                
                # Payment method ratios from past transactions
                payment_counts = prev_txns['payment_method'].value_counts()
                df.at[idx, 'past_upi_ratio'] = payment_counts.get('upi', 0) / past_count
                df.at[idx, 'past_card_ratio'] = payment_counts.get('card', 0) / past_count
                df.at[idx, 'past_cod_ratio'] = payment_counts.get('cod', 0) / past_count
                
                # Average order value from past transactions
                df.at[idx, 'average_order_value'] = prev_txns['product_price'].mean()
                
                # Last payment method used
                df.at[idx, 'last_payment_method'] = prev_txns.iloc[-1]['payment_method']
                
                # Days since last purchase
                current_date = df.at[idx, 'transaction_date']
                last_date = prev_txns.iloc[-1]['transaction_date']
                df.at[idx, 'days_since_last_purchase'] = (current_date - last_date).days
    
    # Add ratio_sum (should equal 1.0 for existing users)
    df['ratio_sum'] = df['past_upi_ratio'] + df['past_card_ratio'] + df['past_cod_ratio']
    
    # Merge with user profiles
    print("🔗 Merging user profile data...")
    
    profile_data = []
    for _, row in df.iterrows():
        user_id = str(user_id).strip()
        profile = user_profiles.get(user_id, {})
        
        # Extract age (handle empty strings)
        age = profile.get('age', '')
        if age == '' or age is None:
            age = 30  # Default age if missing
        else:
            try:
                age = int(age)
            except (ValueError, TypeError):
                age = 30
        
        # Extract region from location
        location = profile.get('location', 'Urban')
        if 'Rural' in location or 'Village' in location:
            region = 'Rural'
        elif 'Suburb' in location:
            region = 'Suburban'
        else:
            region = 'Urban'
        
        profile_data.append({
            'age': age,
            'gender': profile.get('gender', 'Male'),
            'occupation': profile.get('occupation', 'Other'),
            'region': region
        })
    
    profile_df = pd.DataFrame(profile_data)
    df = pd.concat([df, profile_df], axis=1)
    
    # Select final columns in the exact order needed by the model
    final_columns = [
        'user_id',
        'transaction_date',
        'age',
        'gender',
        'occupation',
        'region',
        'device_type',
        'product_price',
        'is_weekend',
        'hour_of_day',
        'past_transactions',
        'past_upi_ratio',
        'past_card_ratio',
        'past_cod_ratio',
        'average_order_value',
        'last_payment_method',
        'days_since_last_purchase',
        'payment_method',
        'ratio_sum'
    ]
    
    df_final = df[final_columns].copy()
    
    # Convert to list of dicts
    result = df_final.to_dict('records')
    
    print(f"✅ Processed {len(result)} transactions with all ML features")
    print(f"   Sample record keys: {list(result[0].keys()) if result else 'None'}")
    
    # Print sample statistics
    if result:
        sample = df_final.iloc[0]
        print(f"\n📊 Sample Transaction Features:")
        print(f"   User ID: {sample['user_id']}")
        print(f"   Past Transactions: {sample['past_transactions']}")
        print(f"   UPI Ratio: {sample['past_upi_ratio']:.2f}")
        print(f"   Card Ratio: {sample['past_card_ratio']:.2f}")
        print(f"   COD Ratio: {sample['past_cod_ratio']:.2f}")
        print(f"   Ratio Sum: {sample['ratio_sum']:.2f}")
    
    return result


def get_user_history(user_id: str) -> list:
    """
    Fetches a single user's transaction history with profile and ML features
    """
    print(f"📥 Fetching history for user: {user_id}")
    
    # FIXED: Use purchasehistories collection instead of transactions
    transactions = list(db.purchasehistories.find({'user_id': user_id}).sort('transaction_date', 1))
    profile = db.profiles.find_one({'userId': user_id}) or {}
    
    if not transactions:
        print(f"⚠️  No transactions found for user {user_id}")
        return []
    
    # Convert to DataFrame
    df = pd.DataFrame(transactions)
    df['transaction_date'] = pd.to_datetime(df['transaction_date'])
    df['product_price'] = df['total_amount'].fillna(0).astype(float)
    df['payment_method'] = df['payment_method'].fillna('upi').str.lower()
    df['device_type'] = df['device_type'].fillna('Mobile')
    
    # Extract time features
    df['hour_of_day'] = df['transaction_date'].dt.hour
    df['is_weekend'] = (df['transaction_date'].dt.dayofweek >= 5).astype(int)
    
    # Sort by date
    df = df.sort_values('transaction_date').reset_index(drop=True)
    
    # Calculate temporal features
    result = []
    for i in range(len(df)):
        if i == 0:
            past_txns = 0
            past_upi = past_card = past_cod = 0.0
            avg_order = 0.0
            last_payment = 'upi'
            days_since = 0
        else:
            prev = df.iloc[:i]
            past_txns = len(prev)
            payment_counts = prev['payment_method'].value_counts()
            past_upi = payment_counts.get('upi', 0) / past_txns
            past_card = payment_counts.get('card', 0) / past_txns
            past_cod = payment_counts.get('cod', 0) / past_txns
            avg_order = prev['product_price'].mean()
            last_payment = prev.iloc[-1]['payment_method']
            days_since = (df.iloc[i]['transaction_date'] - prev.iloc[-1]['transaction_date']).days
        
        # Extract age
        age = profile.get('age', '')
        if age == '' or age is None:
            age = 30
        else:
            try:
                age = int(age)
            except (ValueError, TypeError):
                age = 30
        
        # Extract region
        location = profile.get('location', 'Urban')
        if 'Rural' in location or 'Village' in location:
            region = 'Rural'
        elif 'Suburb' in location:
            region = 'Suburban'
        else:
            region = 'Urban'
        
        result.append({
            'user_id': user_id,
            'transaction_date': df.iloc[i]['transaction_date'],
            'age': age,
            'gender': profile.get('gender', 'Male'),
            'occupation': profile.get('occupation', 'Other'),
            'region': region,
            'device_type': df.iloc[i]['device_type'],
            'product_price': df.iloc[i]['product_price'],
            'is_weekend': int(df.iloc[i]['is_weekend']),
            'hour_of_day': int(df.iloc[i]['hour_of_day']),
            'past_transactions': past_txns,
            'past_upi_ratio': past_upi,
            'past_card_ratio': past_card,
            'past_cod_ratio': past_cod,
            'average_order_value': avg_order,
            'last_payment_method': last_payment,
            'days_since_last_purchase': days_since,
            'payment_method': df.iloc[i]['payment_method'],
            'ratio_sum': past_upi + past_card + past_cod
        })
    
    print(f"✅ Retrieved {len(result)} transactions for user {user_id}")
    return result


def get_user_current_profile(user_id: str) -> dict:
    """
    Gets the user's CURRENT profile state from profiles collection,
    enriched with transaction history features from purchasehistories
    Useful for real-time predictions
    """
    # Fetch user profile from profiles collection
    profile = db.profiles.find_one({'userId': user_id})
    
    if not profile:
        print(f"⚠️  No profile found for user {user_id}")
        return None
    
    # Fetch transaction history to compute behavioral features
    transactions = list(db.purchasehistories.find({'user_id': user_id}).sort('transaction_date', 1))
    
    if not transactions:
        # No transaction history - return profile with default behavioral features
        age = profile.get('age', '')
        if age == '' or age is None:
            age = 30
        else:
            try:
                age = int(age)
            except (ValueError, TypeError):
                age = 30
        
        location = profile.get('location', 'Urban')
        if 'Rural' in location or 'Village' in location:
            region = 'Rural'
        elif 'Suburb' in location:
            region = 'Suburban'
        else:
            region = 'Urban'
        
        return {
            'user_id': user_id,
            'age': age,
            'gender': profile.get('gender', 'Male'),
            'occupation': profile.get('occupation', 'Other'),
            'region': region,
            'device_type': profile.get('device_type', 'Mobile'),
            'past_transactions': 0,
            'past_upi_ratio': 0.0,
            'past_card_ratio': 0.0,
            'past_cod_ratio': 0.0,
            'average_order_value': 0.0,
            'last_payment_method': 'upi',
            'days_since_last_purchase': 0
        }
    
    # Calculate behavioral features from transaction history
    df = pd.DataFrame(transactions)
    df['transaction_date'] = pd.to_datetime(df['transaction_date'])
    df['payment_method'] = df['payment_method'].fillna('upi').str.lower()
    df['product_price'] = df['total_amount'].fillna(0).astype(float)
    df['device_type'] = df['device_type'].fillna('Mobile')
    
    payment_counts = df['payment_method'].value_counts()
    total = len(df)
    
    last_txn = df.sort_values('transaction_date').iloc[-1]
    days_since = (datetime.now() - last_txn['transaction_date']).days
    
    # Extract profile data
    age = profile.get('age', '')
    if age == '' or age is None:
        age = 30
    else:
        try:
            age = int(age)
        except (ValueError, TypeError):
            age = 30
    
    location = profile.get('location', 'Urban')
    if 'Rural' in location or 'Village' in location:
        region = 'Rural'
    elif 'Suburb' in location:
        region = 'Suburban'
    else:
        region = 'Urban'
    
    return {
        'user_id': user_id,
        'age': age,
        'gender': profile.get('gender', 'Male'),
        'occupation': profile.get('occupation', 'Other'),
        'region': region,
        'device_type': last_txn['device_type'],
        'past_transactions': total,
        'past_upi_ratio': payment_counts.get('upi', 0) / total,
        'past_card_ratio': payment_counts.get('card', 0) / total,
        'past_cod_ratio': payment_counts.get('cod', 0) / total,
        'average_order_value': df['product_price'].mean(),
        'last_payment_method': last_txn['payment_method'],
        'days_since_last_purchase': days_since
    }