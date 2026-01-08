from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict
import uvicorn
import os
import json
import pickle
import faiss
import torch
import torch.nn as nn
import numpy as np
import pandas as pd
from sentence_transformers import SentenceTransformer
from collections import defaultdict, Counter
import datetime
from functools import lru_cache
import re

app = FastAPI(title="Enhanced Hybrid Recommender API v9.3")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_PATH = "./database"
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# ✅ IMPROVED: Lightweight, explainable gender keywords
MALE_WORDS = [
    "men", "mens", "man", "male", "boy", "boys",
    "guy", "gentleman", "suit", "tuxedo", "boxers",
    "briefs", "beard", "shaving", "cologne"
]

FEMALE_WORDS = [
    "women", "womens", "woman", "female", "girl", "girls",
    "lady", "ladies", "dress", "skirt", "gown",
    "bikini", "lingerie", "bra", "blouse", "makeup",
    "cosmetics", "lipstick", "mascara", "perfume", "heels"
]

# Convert to regex patterns with word boundaries
MALE_PATTERNS = [rf"\b{word}\b" for word in MALE_WORDS]
FEMALE_PATTERNS = [rf"\b{word}\b" for word in FEMALE_WORDS]

# ✅ Categories requiring gender-aware ranking (fashion/beauty only)
GENDER_SENSITIVE_CATEGORIES = {
    "amazon_fashion",
    "clothing_shoes_and_jewelry",
    "all_beauty"
}

WEAK_SIGNAL_BOOST = 0.1
MIN_CLICKS_FOR_PRICE_RANKING = 1

PET_KEYWORDS = {
    "dog": ["dog", "puppy", "canine", "kennel", "leash", "collar"],
    "cat": ["cat", "kitten", "feline", "litter", "scratch"]
}
PET_SETS = {pet: set(keywords) for pet, keywords in PET_KEYWORDS.items()}


def normalize_category(category):
    """Normalize category for consistent comparison"""
    if not category:
        return ""
    return category.lower().replace("_", "").replace("-", "").replace(" ", "").strip()


def is_gender_sensitive_category(category):
    """Check if category requires gender-aware ranking (fashion/beauty only)"""
    if not category:
        return False
    normalized = normalize_category(category)
    return any(normalize_category(sensitive_cat) == normalized for sensitive_cat in GENDER_SENSITIVE_CATEGORIES)


class NCF(nn.Module):
    def __init__(self, n_users, n_items, emb_size=64):
        super().__init__()
        self.user_emb = nn.Embedding(n_users, emb_size)
        self.item_emb = nn.Embedding(n_items, emb_size)
        self.mlp = nn.Sequential(
            nn.Linear(emb_size*2, 128),
            nn.ReLU(),
            nn.Linear(128, 64),
            nn.ReLU(),
            nn.Linear(64, 1)
        )
    
    def forward(self, u, i):
        u_emb = self.user_emb(u)
        i_emb = self.item_emb(i)
        x = torch.cat([u_emb, i_emb], dim=-1)
        return self.mlp(x).squeeze()


class UserPreferenceTracker:
    def __init__(self, storage_file="user_preferences.pkl"):
        self.storage_file = os.path.join(BASE_PATH, storage_file)
        self.user_preferences = self.load_preferences()
        
    def load_preferences(self):
        if os.path.exists(self.storage_file):
            try:
                with open(self.storage_file, "rb") as f:
                    return pickle.load(f)
            except:
                return defaultdict(lambda: self._create_empty_profile())
        return defaultdict(lambda: self._create_empty_profile())
    
    def _create_empty_profile(self):
        return {
            'demographics': {},
            'clicked_products': [],
            'preferred_categories': Counter(),
            'preferred_brands': Counter(),
            'preferred_price_range': [],
            'preferred_sellers': Counter(),
            'preferred_ratings': [],
            'pet_ownership': Counter(),
            'last_updated': None,
            'total_clicks': 0,
            'last_search_query': None  # ✅ Track last search query
        }
    
    def save_preferences(self):
        try:
            with open(self.storage_file, "wb") as f:
                pickle.dump(dict(self.user_preferences), f)
            return True
        except Exception as e:
            print(f"Error saving preferences: {e}")
            return False
    
    def save_demographics(self, user_id, demographics):
        if user_id not in self.user_preferences:
            self.user_preferences[user_id] = self._create_empty_profile()
        
        self.user_preferences[user_id]['demographics'] = demographics
        self.user_preferences[user_id]['last_updated'] = datetime.datetime.now()
        self.save_preferences()
    
    def get_demographics(self, user_id):
        if user_id in self.user_preferences and self.user_preferences[user_id].get('demographics'):
            return self.user_preferences[user_id]['demographics']
        return {}
    
    def record_click(self, user_id, product_info):
        """Record STRONG signal - increments total_clicks"""
        if user_id not in self.user_preferences:
            self.user_preferences[user_id] = self._create_empty_profile()
            
        user_prefs = self.user_preferences[user_id]
        
        click_entry = {
            'product_id': product_info.get('product_id', 'unknown'),
            'title': product_info.get('title', 'Unknown'),
            'category': product_info.get('category'),
            'price': product_info.get('price'),
            'timestamp': datetime.datetime.now()
        }
        user_prefs['clicked_products'].append(click_entry)
        if len(user_prefs['clicked_products']) > 50:
            user_prefs['clicked_products'] = user_prefs['clicked_products'][-50:]
        
        category = product_info.get('category')
        if category and category not in [None, "N/A", ""]:
            user_prefs['preferred_categories'][category] += 1
        
        price = self.parse_price(product_info.get('price'))
        if price and price > 0:
            user_prefs['preferred_price_range'].append(price)
        if len(user_prefs['preferred_price_range']) > 20:
            user_prefs['preferred_price_range'] = user_prefs['preferred_price_range'][-20:]
        
        self.update_pet_ownership(user_prefs, product_info)
        
        user_prefs['total_clicks'] += 1
        user_prefs['last_updated'] = datetime.datetime.now()
        
        self.save_preferences()
        print(f"🟣 STRONG SIGNAL: total_clicks = {user_prefs['total_clicks']}")
    
    def record_search_query(self, user_id, query):
        """Record user's search query for homepage intent"""
        if user_id not in self.user_preferences:
            self.user_preferences[user_id] = self._create_empty_profile()
        
        if query and query.strip():
            self.user_preferences[user_id]['last_search_query'] = query.strip()
            self.user_preferences[user_id]['last_updated'] = datetime.datetime.now()
            self.save_preferences()
            print(f"🔍 SEARCH QUERY RECORDED: '{query}'")
    
    def record_weak_signal(self, user_id, category):
        """Record WEAK signal - does NOT increment total_clicks"""
        if user_id not in self.user_preferences:
            self.user_preferences[user_id] = self._create_empty_profile()
        
        user_prefs = self.user_preferences[user_id]
        
        if category and category not in [None, "N/A", ""]:
            user_prefs['preferred_categories'][category] += WEAK_SIGNAL_BOOST
            user_prefs['last_updated'] = datetime.datetime.now()
            self.save_preferences()
            print(f"🟦 WEAK SIGNAL: {category} +{WEAK_SIGNAL_BOOST}, total_clicks = {user_prefs['total_clicks']}")
    
    def update_pet_ownership(self, user_prefs, product_info):
        title = product_info.get('title', '').lower()
        category = product_info.get('category', '').lower()
        
        for pet_type, keywords in PET_SETS.items():
            if any(keyword in title or keyword in category for keyword in keywords):
                user_prefs['pet_ownership'][pet_type] += 1
    
    def parse_price(self, price):
        if not price or price in ['N/A', 0, '0', '0.0', None]:
            return None
        try:
            if isinstance(price, (int, float)):
                return float(price)
            price_str = str(price).replace('$', '').replace(',', '').strip()
            return float(price_str)
        except:
            return None
    
    def get_user_preferences(self, user_id):
        if user_id not in self.user_preferences:
            return {
                'top_categories': [],
                'top_brands': [],
                'top_sellers': [],
                'price_preference': {'average': None, 'range': None},
                'rating_preference': None,
                'likely_pets': [],
                'total_interactions': 0,
                'last_active': None
            }
        
        prefs = self.user_preferences[user_id]
        total_clicks = prefs.get('total_clicks', 0)
        
        avg_price = np.mean(prefs['preferred_price_range']) if prefs['preferred_price_range'] else None
        price_range = (min(prefs['preferred_price_range']), max(prefs['preferred_price_range'])) if prefs['preferred_price_range'] else None
        likely_pets = [pet for pet, count in prefs['pet_ownership'].most_common(3) if count > 0]
        
        return {
            'top_categories': prefs['preferred_categories'].most_common(5),
            'top_brands': [],
            'top_sellers': [],
            'price_preference': {'average': avg_price, 'range': price_range},
            'rating_preference': None,
            'likely_pets': likely_pets,
            'total_interactions': total_clicks,
            'last_active': prefs['last_updated']
        }


print("Loading model and data...")

maps_file = os.path.join(BASE_PATH, "map.pkl")
with open(maps_file, "rb") as f:
    maps = pickle.load(f)

user_map = maps.get("user_map", {})
item_map = maps.get("item_map", {})
num_users = max(len(user_map), 1)
num_items = len(item_map)
iidx_to_product_id = {v: k for k, v in item_map.items()}

model = NCF(num_users, num_items).to(DEVICE)
try:
    state_dict = torch.load(os.path.join(BASE_PATH, "ncf_model.pth"), map_location=DEVICE, weights_only=True)
except:
    state_dict = torch.load(os.path.join(BASE_PATH, "ncf_model.pth"), map_location=DEVICE)
model.load_state_dict(state_dict)
model.eval()

with open(os.path.join(BASE_PATH, "product_meta.json"), "r", encoding="utf-8") as f:
    product_data = json.load(f)

metadata_df = pd.DataFrame(product_data).drop_duplicates(subset="product_id")
metadata_df["product_id"] = metadata_df["product_id"].astype(str)
metadata_df["seller_name"] = metadata_df["seller_details"].apply(lambda x: x.get("seller_name") if isinstance(x, dict) else None)
product_id_to_info = metadata_df.set_index("product_id").to_dict(orient="index")

faiss_index = faiss.read_index(os.path.join(BASE_PATH, "product_faiss.index"))
prod_emb = np.load(os.path.join(BASE_PATH, "prod_embeddings.npy"))
sbert = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")

preference_tracker = UserPreferenceTracker()

print("Model loaded successfully!")


@lru_cache(maxsize=1000)
def cached_sbert_encode(text):
    return sbert.encode([text])


def add_new_users(model, n_new=1):
    old_emb = model.user_emb.weight.data
    emb_size = old_emb.shape[1]
    new_emb = torch.randn(n_new, emb_size, device=old_emb.device) * 0.01
    model.user_emb.weight = nn.Parameter(torch.cat([old_emb, new_emb], dim=0))


def get_or_add_user(user_id):
    if user_id not in user_map:
        new_idx = len(user_map)
        user_map[user_id] = new_idx
        add_new_users(model, 1)
        return new_idx
    return user_map[user_id]


def normalize(arr):
    a = np.array(arr, dtype=float)
    if a.max() == a.min():
        return np.ones_like(a) * 0.5
    return ((a - a.min()) / (a.max() - a.min())).tolist()


def _fallback_mixed_categories(prefs, preferred_category):
    """Create mixed category query for diverse homepage results"""
    preferred_categories = prefs.get("preferred_categories", Counter())
    
    if preferred_categories:
        # Get top 3 categories for diversity
        top_cats = [cat for cat, _ in preferred_categories.most_common(3)]
        mixed_query = " ".join(top_cats)
        print(f"🏠 [HOMEPAGE] Using mixed categories as intent: {top_cats}")
        return mixed_query
    else:
        print(f"🏠 [HOMEPAGE] No history, using fallback: {preferred_category}")
        return preferred_category


def calculate_gender_score(product_title, product_cat, user_gender):
    """
    ✅ STRENGTHENED: Gender alignment for fashion/beauty only
    Returns: +0.30 (match), -0.45 (opposite), 0.0 (neutral)
    Uses word-boundary regex matching
    """
    if not user_gender or user_gender not in ["male", "female"]:
        return 0.0
    
    title_lower = product_title.lower()
    cat_lower = product_cat.lower()
    combined_text = f"{title_lower} {cat_lower}"
    
    # Select patterns based on user gender
    if user_gender == "male":
        user_patterns = MALE_PATTERNS
        opposite_patterns = FEMALE_PATTERNS
    else:
        user_patterns = FEMALE_PATTERNS
        opposite_patterns = MALE_PATTERNS
    
    # Check for keyword presence using regex word boundaries
    has_user_keywords = any(re.search(pattern, combined_text, re.IGNORECASE) for pattern in user_patterns)
    has_opposite_keywords = any(re.search(pattern, combined_text, re.IGNORECASE) for pattern in opposite_patterns)
    
    # Debug logging
    if has_user_keywords or has_opposite_keywords:
        matched_user = [pattern.replace(r'\b', '') for pattern in user_patterns if re.search(pattern, combined_text, re.IGNORECASE)]
        matched_opposite = [pattern.replace(r'\b', '') for pattern in opposite_patterns if re.search(pattern, combined_text, re.IGNORECASE)]
        print(f"      🔍 Gender detection: user={user_gender}, matched_user={matched_user[:3]}, matched_opposite={matched_opposite[:3]}")
    
    # ✅ STRENGTHENED: Scoring logic
    if has_opposite_keywords and not has_user_keywords:
        return -0.45  # ✅ Stronger penalty for opposite gender
    elif has_user_keywords and not has_opposite_keywords:
        return 0.30   # Match = bonus
    elif has_user_keywords and has_opposite_keywords:
        return 0.0    # Mixed signals = neutral
    else:
        return 0.0    # No gender keywords = neutral


def calculate_price_score(product_price, avg_price):
    """
    ✅ BOOST-ONLY: Price relevance based on distance from user's average
    Returns: +0.50 (very close), +0.30 (close), +0.15 (moderate), 0.0 (far)
    NEVER negative - far items just get 0.0
    """
    if not avg_price or not product_price or product_price <= 0:
        return 0.0
    
    distance = abs(product_price - avg_price) / avg_price
    
    if distance <= 0.20:    # Within 20%
        return 0.50  # ✅ Strong boost for very close match
    elif distance <= 0.40:  # Within 40%
        return 0.30
    elif distance <= 0.70:  # Within 70%
        return 0.15
    else:                   # Far from preference
        return 0.0  # ✅ No boost, but NOT negative


def calculate_category_score(product_cat, preferred_categories, is_homepage=False):
    """
    Calculate category affinity score based on click history + weak signals
    Returns: 0.0 to 0.40 based on how often user clicked/viewed this category
    
    ✅ HOMEPAGE FIX: Uses relative scoring to prevent category echo chamber
    """
    if not preferred_categories or not product_cat:
        return 0.0
    
    # Normalize for matching
    normalized_product_cat = normalize_category(product_cat)
    
    # Find matching category in preferences
    category_count = 0.0
    for cat, count in preferred_categories.items():
        if normalize_category(cat) == normalized_product_cat:
            category_count = max(category_count, count)
    
    if category_count == 0:
        return 0.0
    
    # ✅ CRITICAL FIX: Normalize by strongest category to create competition
    if is_homepage and len(preferred_categories) > 0:
        max_category_count = max(preferred_categories.values())
        # Relative strength: 0.0 to 1.0
        relative_strength = category_count / max_category_count
        # Apply damping factor (0.6) to prevent category dominance
        base_score = 0.40 * relative_strength * 0.6
        
        # ✅ DEBUG: Log the transformation
        if category_count > 0:
            absolute_score = min(0.40, category_count * 0.10)
            print(f"      📊 [HOMEPAGE CAT SCORE] {product_cat}: count={category_count:.1f}, relative={relative_strength:.2f}, dampened={base_score:.3f} (would be {absolute_score:.3f} on search)")
        
        return base_score
    else:
        # Search page: Use absolute scoring (1 click = 0.10, 4+ = 0.40)
        score = min(0.40, category_count * 0.10)
        
        if category_count > 0:
            print(f"      📊 [SEARCH CAT SCORE] {product_cat}: count={category_count:.1f}, absolute={score:.3f}")
        
        return score


def rerank_with_scores(candidates, user_profile, user_id, is_homepage):
    """
    ✅ REBALANCED SCORING (no hard filtering!)
    Applies weighted adjustments and re-sorts by final score
    """
    
    user_gender = user_profile.get("gender", "").lower()
    
    # Get user preferences
    avg_price = None
    preferred_categories = Counter()
    
    if user_id and user_id in preference_tracker.user_preferences:
        prefs = preference_tracker.user_preferences[user_id]
        price_history = prefs.get('preferred_price_range', [])
        if len(price_history) >= MIN_CLICKS_FOR_PRICE_RANKING:
            avg_price = np.mean(price_history)
        preferred_categories = prefs.get('preferred_categories', Counter())
    
    print(f"\n{'='*100}")
    print(f"🎯 SCORE-BASED RANKING DEBUG (v9.4 - BLENDED MIX)")
    print(f"{'='*100}")
    print(f"📊 USER CONTEXT:")
    print(f"   User ID: {user_id}")
    print(f"   Gender: {user_gender}")
    print(f"   Homepage: {is_homepage}")
    print(f"   Total candidates: {len(candidates)}")
    
    # ✅ NEW: Show candidate composition for homepage
    if is_homepage:
        category_distribution = Counter()
        for rec in candidates:
            cat = normalize_category(rec.get("category", "Unknown"))
            category_distribution[cat] += 1
        
        print(f"\n   📦 CANDIDATE POOL COMPOSITION:")
        print(f"      Total candidates: {len(candidates)}")
        print(f"      Category distribution (top 10):")
        for cat, count in category_distribution.most_common(10):
            percentage = (count / len(candidates)) * 100
            print(f"      - {cat}: {count} ({percentage:.1f}%)")
        
        # Check for dominance
        if category_distribution.most_common(1)[0][1] > len(candidates) * 0.4:
            print(f"      ⚠️ WARNING: Single category dominance detected!")
        else:
            print(f"      ✅ Good diversity: No single category >40%")
    
    if avg_price:
        print(f"   Avg price: ${avg_price:.2f} (from {len(prefs.get('preferred_price_range', []))} clicks)")
        print(f"   Price range: ${avg_price * 0.6:.2f} - ${avg_price * 1.8:.2f} (preferred)")
    else:
        print(f"   Price scoring: DISABLED (insufficient history)")
    print(f"   Preferred categories: {dict(preferred_categories.most_common(5))}")
    
    # ✅ Show category normalization effect on homepage
    if is_homepage and preferred_categories:
        max_cat_count = max(preferred_categories.values())
        print(f"\n   🔧 HOMEPAGE MODE ACTIVE - CATEGORY NORMALIZATION:")
        print(f"      Max category count: {max_cat_count}")
        print(f"      Normalized category scores:")
        for cat, count in preferred_categories.most_common(3):
            relative = count / max_cat_count
            dampened = 0.40 * relative * 0.6
            print(f"      - {cat}: {count} clicks → relative={relative:.2f} → dampened={dampened:.3f} (was 0.400)")
    elif not is_homepage:
        print(f"\n   📄 SEARCH/CATEGORY MODE - ABSOLUTE SCORING")
        print(f"      Category scores use absolute counts (not normalized)")
    
    print(f"{'='*100}\n")
    
    scored_products = []
    
    print(f"🔄 SCORING ALL PRODUCTS...\n")
    
    for idx, rec in enumerate(candidates, 1):
        product_id = rec.get("product_id", "unknown")
        product_title = rec.get("title", "")
        product_cat = rec.get("category", "")
        product_price = preference_tracker.parse_price(rec.get("price"))
        base_score = rec.get("initial_score", 0.5)
        
        normalized_cat = normalize_category(product_cat)
        is_gender_sensitive = is_gender_sensitive_category(product_cat)
        
        # Calculate adjustments
        gender_adj = 0.0
        price_adj = 0.0
        category_adj = 0.0
        
        # RULE 1: Gender scoring (only for fashion/beauty)
        if is_gender_sensitive and user_gender:
            gender_adj = calculate_gender_score(product_title, product_cat, user_gender)
        
        # RULE 2: Price scoring (boost-only, never negative)
        if avg_price and product_price:
            price_adj = calculate_price_score(product_price, avg_price)
        
        # RULE 3: Category affinity (from clicks + weak signals)
        category_adj = calculate_category_score(product_cat, preferred_categories, is_homepage)
        
        # ✅ REBALANCED WEIGHTS based on context
        if is_homepage:
            # Homepage: Price > Category > Gender > Base
            gender_weight = 0.25 if is_gender_sensitive else 0.0
            price_weight = 0.35  # ✅ Highest priority
            category_weight = 0.25
            base_weight = 0.15
        else:
            # Search: Base > Price > Gender > Category
            gender_weight = 0.20 if is_gender_sensitive else 0.0
            price_weight = 0.30
            category_weight = 0.20
            base_weight = 0.30
        
        # Calculate final score
        final_score = (
            base_weight * base_score +
            gender_weight * gender_adj +
            price_weight * price_adj +
            category_weight * category_adj
        )
        
        # Log every 10th product for sampling
        if idx <= 10 or idx % 10 == 0:
            print(f"   [{idx:3d}] ID: {product_id[:15]:15s} | Cat: {product_cat[:25]:25s}")
            print(f"         Title: {product_title[:60]}")
            print(f"         Price: ${product_price:.2f}" if product_price else "         Price: N/A")
            print(f"         Gender-sensitive: {is_gender_sensitive}")
            print(f"         Scores: base={base_score:.3f} | gender={gender_adj:+.3f} | price={price_adj:+.3f} | cat={category_adj:+.3f}")
            print(f"         Weights: base={base_weight:.2f} | gender={gender_weight:.2f} | price={price_weight:.2f} | cat={category_weight:.2f}")
            print(f"         ➜ FINAL SCORE: {final_score:.4f}")
            
            # Explain the score
            if gender_adj < -0.30:
                print(f"         ⚠️ Gender MISMATCH penalty")
            elif gender_adj > 0.2:
                print(f"         ✅ Gender MATCH bonus")
            
            if price_adj > 0.35:
                print(f"         ✅ Price VERY CLOSE to preference")
            elif price_adj == 0.0 and avg_price and product_price:
                print(f"         ⚠️ Price far from preference (no penalty, just no boost)")
            
            if category_adj > 0.15:
                print(f"         ✅ User LOVES this category")
            
            print()
        
        scored_products.append({
            'product': rec,
            'final_score': final_score,
            'debug': {
                'id': product_id,
                'title': product_title[:50],
                'cat': product_cat,
                'normalized_cat': normalized_cat,
                'is_gender_sensitive': is_gender_sensitive,
                'base': round(base_score, 4),
                'gender_adj': round(gender_adj, 4),
                'price_adj': round(price_adj, 4),
                'category_adj': round(category_adj, 4),
                'final': round(final_score, 4),
                'price': f"${product_price:.2f}" if product_price else "N/A"
            }
        })
    
    # Sort by final score (descending)
    scored_products.sort(key=lambda x: x['final_score'], reverse=True)
    
    # Show comprehensive results
    print(f"\n{'='*100}")
    print(f"🏆 FINAL RANKING RESULTS")
    print(f"{'='*100}\n")
    
    print(f"📈 TOP 10 PRODUCTS (Highest Scores):")
    print(f"{'─'*100}")
    for i, item in enumerate(scored_products[:10], 1):
        d = item['debug']
        print(f"{i:2d}. Score: {d['final']:.4f} | {d['id'][:15]:15s} | {d['cat'][:30]:30s}")
        print(f"    {d['title']}")
        print(f"    Price: {d['price']:>10s} | Base: {d['base']:.3f} | Gender: {d['gender_adj']:+.3f} | Price: {d['price_adj']:+.3f} | Cat: {d['category_adj']:+.3f}")
        
        # Highlight why it ranked high
        reasons = []
        if d['gender_adj'] > 0.2:
            reasons.append("✅ Gender match")
        if d['price_adj'] > 0.25:
            reasons.append("✅ Price match")
        if d['category_adj'] > 0.15:
            reasons.append("✅ Preferred category")
        if d['base'] > 0.7:
            reasons.append("✅ High base relevance")
        if reasons:
            print(f"    Why it's high: {', '.join(reasons)}")
        print()
    
    print(f"{'─'*100}\n")
    print(f"📉 BOTTOM 10 PRODUCTS (Lowest Scores):")
    print(f"{'─'*100}")
    for i, item in enumerate(scored_products[-10:], 1):
        d = item['debug']
        print(f"{i:2d}. Score: {d['final']:.4f} | {d['id'][:15]:15s} | {d['cat'][:30]:30s}")
        print(f"    {d['title']}")
        print(f"    Price: {d['price']:>10s} | Base: {d['base']:.3f} | Gender: {d['gender_adj']:+.3f} | Price: {d['price_adj']:+.3f} | Cat: {d['category_adj']:+.3f}")
        
        # Highlight why it ranked low
        reasons = []
        if d['gender_adj'] < -0.30:
            reasons.append("❌ Gender mismatch")
        if d['price_adj'] == 0.0 and avg_price and product_price:
            reasons.append("⚠️ Price far from preference")
        if d['category_adj'] == 0 and preferred_categories:
            reasons.append("⚠️ Not a preferred category")
        if d['base'] < 0.15:
            reasons.append("⚠️ Low base relevance")
        if reasons:
            print(f"    Why it's low: {', '.join(reasons)}")
        print()
    
    print(f"{'='*100}")
    print(f"📊 SCORING SUMMARY:")
    print(f"   Total products scored: {len(scored_products)}")
    print(f"   Score range: {scored_products[-1]['final_score']:.4f} to {scored_products[0]['final_score']:.4f}")
    print(f"   Median score: {scored_products[len(scored_products)//2]['final_score']:.4f}")
    
    # Count gender-sensitive products
    gender_sensitive_count = sum(1 for item in scored_products if item['debug']['is_gender_sensitive'])
    print(f"   Gender-sensitive products: {gender_sensitive_count}/{len(scored_products)}")
    
    # Count products with price scoring
    price_scored_count = sum(1 for item in scored_products if item['debug']['price_adj'] != 0)
    print(f"   Products with price scoring: {price_scored_count}/{len(scored_products)}")
    
    # Count gender matches/mismatches
    gender_matches = sum(1 for item in scored_products if item['debug']['gender_adj'] > 0.2)
    gender_mismatches = sum(1 for item in scored_products if item['debug']['gender_adj'] < -0.30)
    print(f"   Gender matches: {gender_matches}, mismatches: {gender_mismatches}")
    
    print(f"{'='*100}\n")
    
    # Return only the products (without debug info)
    return [item['product'] for item in scored_products]


def rerank_for_user(user_id_str=None, query=None, seed_item_iidx=None, top_k=100, alphas=(0.25, 0.25, 0.2, 0.3)):
    uidx = get_or_add_user(user_id_str) if user_id_str else None

    if query:
        q_emb = cached_sbert_encode(query)
        faiss.normalize_L2(q_emb)
        D, I = faiss_index.search(q_emb.astype("float32"), top_k)
        candidates, search_scores = I[0].tolist(), D[0].tolist()
    elif seed_item_iidx is not None:
        seed_vec = prod_emb[seed_item_iidx].reshape(1, -1)
        faiss.normalize_L2(seed_vec)
        D, I = faiss_index.search(seed_vec.astype("float32"), top_k)
        candidates, search_scores = I[0].tolist(), D[0].tolist()
    else:
        candidates = list(range(min(top_k, prod_emb.shape[0])))
        search_scores = [1.0]*len(candidates)

    if uidx is not None:
        with torch.no_grad():
            users = torch.LongTensor([uidx]*len(candidates)).to(DEVICE)
            items = torch.LongTensor(candidates).to(DEVICE)
            ncf_scores = model(users, items).cpu().numpy().tolist()
    else:
        ncf_scores = [0.5]*len(candidates)

    s_norm = normalize(search_scores)
    n_norm = normalize(ncf_scores)

    initial_scores = (np.array(s_norm) * alphas[0] + np.array(n_norm) * alphas[1])
    ranked_indices = np.argsort(-initial_scores)
    ranked = [(candidates[i], initial_scores[i]) for i in ranked_indices]
    
    return ranked


def get_blended_homepage_candidates(user_id, preferred_category, total_k=100):
    """
    🔥 BLENDED CANDIDATE GENERATION for homepage
    Returns mix of: 60-70% intent, 15-20% categories, 10-15% exploration
    """
    if user_id not in preference_tracker.user_preferences:
        # New user: use category sampling
        return None, preferred_category
    
    prefs = preference_tracker.user_preferences[user_id]
    
    # Get intent query
    intent_query = None
    last_search = prefs.get("last_search_query")
    if last_search:
        intent_query = last_search
        print(f"🎯 [BLEND] Intent source: last search '{last_search}'")
    elif prefs.get("clicked_products") and len(prefs["clicked_products"]) > 0:
        intent_query = prefs["clicked_products"][-1].get("title", "")
        print(f"🎯 [BLEND] Intent source: last clicked product")
    
    if not intent_query:
        # No intent: use mixed categories
        return None, _fallback_mixed_categories(prefs, preferred_category)
    
    # 1️⃣ Intent-based candidates (60-70% = 65 items)
    intent_k = int(total_k * 0.65)
    print(f"🎯 [BLEND] Fetching {intent_k} intent-based candidates...")
    intent_candidates = rerank_for_user(user_id, query=intent_query, top_k=intent_k)
    
    # 2️⃣ Category-based candidates (15-20% = 20 items)
    category_k = int(total_k * 0.20)
    preferred_categories = prefs.get('preferred_categories', Counter())
    if preferred_categories:
        # Sample from top 3 categories
        top_cats = [cat for cat, _ in preferred_categories.most_common(3)]
        category_query = " ".join(top_cats)
        print(f"🎯 [BLEND] Fetching {category_k} category-based candidates from: {top_cats}")
        category_candidates = rerank_for_user(user_id, query=category_query, top_k=category_k)
    else:
        category_candidates = []
    
    # 3️⃣ Exploration candidates (10-15% = 15 items)
    explore_k = int(total_k * 0.15)
    print(f"🎯 [BLEND] Fetching {explore_k} exploration candidates...")
    # Use random diverse items
    all_items = list(range(prod_emb.shape[0]))
    explore_indices = np.random.choice(all_items, size=min(explore_k, len(all_items)), replace=False)
    explore_candidates = [(int(idx), 0.5) for idx in explore_indices]
    
    # Combine and deduplicate
    seen_items = set()
    blended = []
    
    # Add intent candidates first (highest priority)
    for item_idx, score in intent_candidates:
        if item_idx not in seen_items:
            blended.append((item_idx, score))
            seen_items.add(item_idx)
    
    # Add category candidates
    for item_idx, score in category_candidates:
        if item_idx not in seen_items:
            blended.append((item_idx, score))
            seen_items.add(item_idx)
    
    # Add exploration candidates
    for item_idx, score in explore_candidates:
        if item_idx not in seen_items:
            blended.append((item_idx, score))
            seen_items.add(item_idx)
    
    print(f"✅ [BLEND] Mixed candidates: {len(blended)} total (intent={len([x for x in intent_candidates if x[0] in seen_items])}, category={len([x for x in category_candidates if x[0] in seen_items])}, explore={len([x for x in explore_candidates if x[0] in seen_items])})")
    
    return blended[:total_k], None  # Return None for query to indicate blended mode


def get_recommendations_safe(user_id=None, query=None, preferred_category=None, 
                            seed_item_idx=None, top_k=10, user_profile=None, 
                            alphas=(0.25, 0.25, 0.2, 0.3), is_homepage=False):
    try:
        # 🔥 HOMEPAGE: Use BLENDED candidate generation
        if is_homepage and not query and user_id:
            print(f"\n{'='*80}")
            print(f"🏠 HOMEPAGE MODE: Blended Candidate Generation")
            print(f"{'='*80}")
            
            # Get blended candidates (60% intent + 20% category + 20% explore)
            fetch_multiplier = 5
            blended_candidates, fallback_query = get_blended_homepage_candidates(
                user_id, 
                preferred_category, 
                total_k=top_k * fetch_multiplier
            )
            
            if blended_candidates:
                # Use pre-blended candidates
                recommendations = blended_candidates
                print(f"✅ Using blended candidates: {len(recommendations)} items")
            else:
                # Fallback for new users
                print(f"⚠️ No user history, using fallback: {fallback_query}")
                recommendations = rerank_for_user(user_id, query=fallback_query, 
                                                 seed_item_iidx=seed_item_idx, 
                                                 top_k=top_k * fetch_multiplier, 
                                                 alphas=alphas)
        
        # 🎯 SEARCH/CATEGORY: Use focused intent (unchanged)
        else:
            effective_query = query if query else preferred_category
            print(f"🎯 [SEARCH/CATEGORY] Using focused query: '{effective_query}'")
            
            fetch_multiplier = 5
            recommendations = rerank_for_user(user_id, query=effective_query, 
                                             seed_item_iidx=seed_item_idx, 
                                             top_k=top_k * fetch_multiplier, 
                                             alphas=alphas)
        
        initial_recommendations = []
        for iidx, initial_score in recommendations:
            asin = iidx_to_product_id.get(iidx, f"ID_{iidx}")
            info = product_id_to_info.get(asin, {})
            
            product_info = {
                "product_id": asin,
                "id": asin,
                "title": info.get("title", f"Product_{iidx}"),
                "initial_score": float(initial_score),
                "category": info.get("category_name", "N/A"),
                "price": info.get("price", "N/A"),
                "stars": info.get("stars", "N/A"),
                "imgUrl": info.get("imgUrl", "N/A"),
                "seller_name": info.get("seller_name", "N/A"),
            }
            initial_recommendations.append(product_info)
        
        # ✅ SCORE-BASED RE-RANKING (no hard filtering!)
        if user_profile:
            reranked = rerank_with_scores(initial_recommendations, user_profile, user_id, is_homepage)
            return reranked[:top_k]
        
        return initial_recommendations[:top_k]
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return []


# API Models
class UserProfile(BaseModel):
    gender: str
    age: int
    occupation: str
    pets: Optional[List[str]] = []

class RecommendationRequest(BaseModel):
    user_id: Optional[str] = None
    query: Optional[str] = None
    preferred_category: Optional[str] = None
    seed_item_idx: Optional[int] = None
    top_k: int = 10
    user_profile: UserProfile
    alphas: tuple = (0.25, 0.25, 0.2, 0.3)
    is_homepage: bool = False

class ProductInteraction(BaseModel):
    user_id: str
    product_id: str
    title: str
    category: Optional[str] = None
    price: Optional[str] = None
    stars: Optional[str] = None
    seller_name: Optional[str] = None
    weak_signal: Optional[bool] = False

class RecommendationResponse(BaseModel):
    recommendations: List[Dict]
    user_id: Optional[str]
    query: Optional[str]
    user_preferences: Optional[Dict] = None


@app.get("/")
async def root():
    return {
        "message": "Enhanced Hybrid Recommender API",
        "status": "running",
        "version": "9.4-BLENDED-MIX",
        "features": [
            "✅ 🔥 NEW: Blended homepage candidates (65% intent + 20% category + 15% explore)",
            "✅ Homepage prevents echo chambers while maintaining relevance",
            "✅ Intent still dominates but doesn't monopolize results",
            "✅ Automatic exploration of diverse products",
            "✅ Search/category pages remain focused (unchanged)",
            "✅ Added record_search_query() method to track user searches",
            "✅ Strengthened gender logic (-0.45 penalty for mismatch)",
            "✅ Gender applies ONLY to fashion/beauty categories",
            "✅ Improved keyword detection with word boundaries",
            "✅ Rebalanced weights (Homepage: Price 0.35 > Cat 0.25 > Gender 0.25 > Base 0.15)",
            "✅ Boost-only price scoring (never negative)",
            "✅ Relative category scoring prevents echo chamber",
            "✅ Category damping (0.6x) on homepage",
            "✅ Full debug visibility maintained",
            "✅ NO hard filtering - all products appear, just prioritized"
        ]
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": "9.4-BLENDED-MIX"}

@app.post("/recommend", response_model=RecommendationResponse)
async def get_recommendations(request: RecommendationRequest):
    try:
        # ✅ DEBUG: Log incoming request
        print(f"🔍 [API] Received request: is_homepage={request.is_homepage}, user_id={request.user_id}")
        
        # ✅ Record search query for future homepage intent
        if request.query and request.user_id:
            preference_tracker.record_search_query(request.user_id, request.query)
        
        user_profile = {
            "gender": request.user_profile.gender.lower(),
            "age": request.user_profile.age,
            "occupation": request.user_profile.occupation.lower(),
            "pets": [pet.lower() for pet in request.user_profile.pets] if request.user_profile.pets else [],
        }
        
        if request.user_id:
            preference_tracker.save_demographics(request.user_id, user_profile)
        
        recommendations = get_recommendations_safe(
            user_id=request.user_id,
            query=request.query,
            preferred_category=request.preferred_category,
            seed_item_idx=request.seed_item_idx,
            top_k=request.top_k,
            user_profile=user_profile,
            alphas=request.alphas,
            is_homepage=request.is_homepage
        )
        
        validated_recommendations = []
        for rec in recommendations:
            validated_rec = {
                "id": rec.get("product_id", rec.get("id", "N/A")),
                "title": rec.get("title", "N/A"),
                "category": rec.get("category", "N/A"),
                "price": rec.get("price", "N/A"),
                "stars": rec.get("stars", "N/A"),
                "imgUrl": rec.get("imgUrl", "N/A"),
                "seller_name": rec.get("seller_name", "N/A"),
            }
            validated_recommendations.append(validated_rec)
        
        user_prefs = preference_tracker.get_user_preferences(request.user_id) if request.user_id else None
        
        return RecommendationResponse(
            recommendations=validated_recommendations,
            user_id=request.user_id,
            query=request.query,
            user_preferences=user_prefs
        )
        
    except Exception as e:
        print(f"❌ Error in /recommend: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/user/interaction")
async def record_user_interaction(interaction: ProductInteraction):
    """Record user interaction - ALWAYS returns total_clicks as integer"""
    try:
        if interaction.user_id not in preference_tracker.user_preferences:
            preference_tracker.user_preferences[interaction.user_id] = preference_tracker._create_empty_profile()
        
        if interaction.weak_signal:
            preference_tracker.record_weak_signal(interaction.user_id, interaction.category)
        else:
            product_info = {
                'product_id': interaction.product_id,
                'title': interaction.title,
                'category': interaction.category,
                'price': interaction.price,
                'stars': interaction.stars,
                'seller_name': interaction.seller_name
            }
            preference_tracker.record_click(interaction.user_id, product_info)
        
        user_prefs = preference_tracker.user_preferences[interaction.user_id]
        total_clicks = int(user_prefs.get("total_clicks", 0))
        
        updated_prefs = preference_tracker.get_user_preferences(interaction.user_id)
        
        return {
            "status": "success",
            "user_id": interaction.user_id,
            "total_clicks": total_clicks,
            "updated_preferences": updated_prefs
        }
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return {
            "status": "error",
            "user_id": interaction.user_id,
            "total_clicks": 0,
            "error": str(e),
            "updated_preferences": {}
        }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)