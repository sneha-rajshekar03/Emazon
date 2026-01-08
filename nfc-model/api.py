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

app = FastAPI(title="Enhanced Pet-Aware Recommender API v10.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_PATH = "./database"
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# ====================================================================
# GENDER KEYWORDS
# ====================================================================
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

MALE_PATTERNS = [rf"\b{word}\b" for word in MALE_WORDS]
FEMALE_PATTERNS = [rf"\b{word}\b" for word in FEMALE_WORDS]

# ====================================================================
# PET KEYWORDS AND PATTERNS
# ====================================================================
PET_KEYWORDS = {
    "dog": [
        "dog", "puppy", "puppies", "canine", "kennel", "leash", "collar",
        "dog food", "dog toy", "dog bed", "dog treat", "dog bowl",
        "harness", "muzzle", "paw", "fetch", "bark"
    ],
    "cat": [
        "cat", "kitten", "kittens", "feline", "litter", "scratch",
        "cat food", "cat toy", "cat bed", "cat treat", "cat bowl",
        "catnip", "meow", "purr", "whisker"
    ],
    "bird": [
        "bird", "parrot", "parakeet", "canary", "cage", "perch",
        "bird seed", "bird food", "avian", "feather", "chirp"
    ],
    "fish": [
        "fish", "aquarium", "tank", "goldfish", "tropical fish",
        "fish food", "filter", "aquatic", "fin", "gill"
    ],
    "other": [
        "hamster", "guinea pig", "rabbit", "reptile", "turtle",
        "ferret", "gerbil", "chinchilla", "lizard", "snake"
    ]
}

PET_PATTERNS = {
    pet_type: [re.compile(rf'\b{re.escape(kw)}\b', re.IGNORECASE) for kw in keywords]
    for pet_type, keywords in PET_KEYWORDS.items()
}

GENDER_SENSITIVE_CATEGORIES = {
    "amazon_fashion",
    "clothing_shoes_and_jewelry",
    "all_beauty"
}

WEAK_SIGNAL_BOOST = 0.1
MIN_CLICKS_FOR_PRICE_RANKING = 1


# ====================================================================
# PET DETECTION FUNCTIONS
# ====================================================================
def detect_pet_type_from_text(text: str) -> Optional[str]:
    """Detect pet type from product title or category"""
    if not text:
        return None
    
    text_lower = text.lower()
    match_counts = {}
    
    for pet_type, patterns in PET_PATTERNS.items():
        count = sum(1 for pattern in patterns if pattern.search(text_lower))
        if count > 0:
            match_counts[pet_type] = count
    
    if match_counts:
        return max(match_counts.items(), key=lambda x: x[1])[0]
    return None


def extract_pet_type_from_product(product_info: Dict) -> Optional[str]:
    """Extract pet type from product information"""
    title = product_info.get('title', '')
    category = product_info.get('category', '')
    combined_text = f"{title} {category}"
    return detect_pet_type_from_text(combined_text)


# ====================================================================
# UTILITY FUNCTIONS
# ====================================================================
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


# ====================================================================
# NCF MODEL
# ====================================================================
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


# ====================================================================
# ENHANCED USER PREFERENCE TRACKER WITH PET SUPPORT
# ====================================================================
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
            'pet_ownership': Counter(),  # Legacy field
            
            # ✅ NEW: Structured pet fields
            'petType': None,  # Tier 1: Explicit preference from profile
            'learnedPets': [],  # Tier 2: Inferred from behavior
            'pet_interaction_counts': Counter(),  # Track interaction frequency
            
            'last_updated': None,
            'total_clicks': 0,
            'last_search_query': None
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
        
        # ✅ NEW: Save explicit pet preference from either petType or pets array
        if 'petType' in demographics and demographics['petType']:
            self.user_preferences[user_id]['petType'] = demographics['petType']
            print(f"✅ Explicit pet preference set (petType): {demographics['petType']}")
        elif 'pets' in demographics and demographics['pets'] and len(demographics['pets']) > 0:
            # Convert pets array to petType (take first pet)
            first_pet = demographics['pets'][0].lower()
            self.user_preferences[user_id]['petType'] = first_pet
            print(f"✅ Explicit pet preference set (from pets array): {first_pet}")
        
        self.user_preferences[user_id]['last_updated'] = datetime.datetime.now()
        self.save_preferences()
    
    def get_demographics(self, user_id):
        if user_id in self.user_preferences and self.user_preferences[user_id].get('demographics'):
            return self.user_preferences[user_id]['demographics']
        return {}
    
    def record_click(self, user_id, product_info):
        """Record STRONG signal - increments total_clicks and learns pets"""
        if user_id not in self.user_preferences:
            self.user_preferences[user_id] = self._create_empty_profile()
            
        user_prefs = self.user_preferences[user_id]
        
        # ✅ BACKWARD COMPATIBILITY: Initialize missing fields
        if 'pet_interaction_counts' not in user_prefs:
            user_prefs['pet_interaction_counts'] = Counter()
        if 'learnedPets' not in user_prefs:
            user_prefs['learnedPets'] = []
        if 'petType' not in user_prefs:
            user_prefs['petType'] = None
        
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
        
        # ✅ NEW: Learn pet preferences from clicks
        pet_type = extract_pet_type_from_product(product_info)
        if pet_type:
            # Increment interaction count
            user_prefs['pet_interaction_counts'][pet_type] += 1
            
            # Add to learnedPets if not already there
            if pet_type not in user_prefs['learnedPets']:
                user_prefs['learnedPets'].append(pet_type)
            
            print(f"🐾 Learned pet: {pet_type} (total: {user_prefs['pet_interaction_counts'][pet_type]})")
        
        category = product_info.get('category')
        if category and category not in [None, "N/A", ""]:
            user_prefs['preferred_categories'][category] += 1
        
        price = self.parse_price(product_info.get('price'))
        if price and price > 0:
            user_prefs['preferred_price_range'].append(price)
        if len(user_prefs['preferred_price_range']) > 20:
            user_prefs['preferred_price_range'] = user_prefs['preferred_price_range'][-20:]
        
        # Legacy pet tracking (keep for backwards compatibility)
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
        """Legacy pet tracking (kept for backwards compatibility)"""
        title = product_info.get('title', '').lower()
        category = product_info.get('category', '').lower()
        
        for pet_type, keywords in PET_KEYWORDS.items():
            if any(keyword in title or keyword in category for keyword in keywords):
                user_prefs['pet_ownership'][pet_type] += 1
    
    def get_pet_preferences(self, user_id):
        """
        ✅ NEW: Get structured pet preferences for ranking
        Returns: {
            'explicit': str or None,
            'learned': List[str],
            'dominant': str or None,
            'counts': Dict
        }
        """
        if user_id not in self.user_preferences:
            return {
                'explicit': None,
                'learned': [],
                'dominant': None,
                'counts': {}
            }
        
        prefs = self.user_preferences[user_id]
        
        # ✅ BACKWARD COMPATIBILITY: Initialize missing fields
        if 'pet_interaction_counts' not in prefs:
            prefs['pet_interaction_counts'] = Counter()
        if 'learnedPets' not in prefs:
            prefs['learnedPets'] = []
        if 'petType' not in prefs:
            prefs['petType'] = None
        
        # Get dominant learned pet (most interactions)
        dominant = None
        if prefs['pet_interaction_counts']:
            dominant = prefs['pet_interaction_counts'].most_common(1)[0][0]
        
        return {
            'explicit': prefs.get('petType'),
            'learned': prefs.get('learnedPets', []),
            'dominant': dominant,
            'counts': dict(prefs.get('pet_interaction_counts', {}))
        }
    
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
                'pet_preferences': {'explicit': None, 'learned': [], 'dominant': None, 'counts': {}},
                'total_interactions': 0,
                'last_active': None
            }
        
        prefs = self.user_preferences[user_id]
        total_clicks = prefs.get('total_clicks', 0)
        
        avg_price = np.mean(prefs['preferred_price_range']) if prefs['preferred_price_range'] else None
        price_range = (min(prefs['preferred_price_range']), max(prefs['preferred_price_range'])) if prefs['preferred_price_range'] else None
        likely_pets = [pet for pet, count in prefs['pet_ownership'].most_common(3) if count > 0]
        
        # ✅ NEW: Include structured pet preferences
        pet_preferences = self.get_pet_preferences(user_id)
        
        return {
            'top_categories': prefs['preferred_categories'].most_common(5),
            'top_brands': [],
            'top_sellers': [],
            'price_preference': {'average': avg_price, 'range': price_range},
            'rating_preference': None,
            'likely_pets': likely_pets,  # Legacy field
            'pet_preferences': pet_preferences,  # ✅ NEW: Structured pet data
            'total_interactions': total_clicks,
            'last_active': prefs['last_updated']
        }


# ====================================================================
# SCORING FUNCTIONS
# ====================================================================
def calculate_gender_score(product_title, product_cat, user_gender):
    """Gender alignment for fashion/beauty only"""
    if not user_gender or user_gender not in ["male", "female"]:
        return 0.0
    
    title_lower = product_title.lower()
    cat_lower = product_cat.lower()
    combined_text = f"{title_lower} {cat_lower}"
    
    if user_gender == "male":
        user_patterns = MALE_PATTERNS
        opposite_patterns = FEMALE_PATTERNS
    else:
        user_patterns = FEMALE_PATTERNS
        opposite_patterns = MALE_PATTERNS
    
    has_user_keywords = any(re.search(pattern, combined_text, re.IGNORECASE) for pattern in user_patterns)
    has_opposite_keywords = any(re.search(pattern, combined_text, re.IGNORECASE) for pattern in opposite_patterns)
    
    if has_opposite_keywords and not has_user_keywords:
        return -0.45
    elif has_user_keywords and not has_opposite_keywords:
        return 0.30
    elif has_user_keywords and has_opposite_keywords:
        return 0.0
    else:
        return 0.0


def calculate_price_score(product_price, avg_price):
    """Price relevance - boost only, never negative"""
    if not avg_price or not product_price or product_price <= 0:
        return 0.0
    
    distance = abs(product_price - avg_price) / avg_price
    
    if distance <= 0.20:
        return 0.50
    elif distance <= 0.40:
        return 0.30
    elif distance <= 0.70:
        return 0.15
    else:
        return 0.0


def calculate_category_score(product_cat, preferred_categories, is_homepage=False):
    """Category affinity with homepage normalization"""
    if not preferred_categories or not product_cat:
        return 0.0
    
    normalized_product_cat = normalize_category(product_cat)
    
    category_count = 0.0
    for cat, count in preferred_categories.items():
        if normalize_category(cat) == normalized_product_cat:
            category_count = max(category_count, count)
    
    if category_count == 0:
        return 0.0
    
    if is_homepage and len(preferred_categories) > 0:
        max_category_count = max(preferred_categories.values())
        relative_strength = category_count / max_category_count
        base_score = 0.40 * relative_strength * 0.6
        return base_score
    else:
        score = min(0.40, category_count * 0.10)
        return score


def calculate_pet_score(product_info, pet_preferences, query=None):
    """
    ✅ CONTEXT-AWARE: Calculate pet relevance score using 3-tier system
    Returns: 0.0 to 1.0 boost (only when query is pet-related OR no query)
    """
    # Detect product pet type
    product_pet_type = extract_pet_type_from_product(product_info)
    if not product_pet_type:
        return 0.0
    
    # ✅ CRITICAL: Check if query is pet-related
    query_is_pet_related = False
    has_query = False
    
    if query:
        has_query = True
        query_lower = query.lower()
        query_is_pet_related = any(
            keyword in query_lower 
            for keywords in PET_KEYWORDS.values() 
            for keyword in keywords
        ) or "pet" in query_lower
        
        # ✅ NEW: If user searches for non-pet things (shirts, books, etc.), DISABLE pet boost
        if has_query and not query_is_pet_related:
            print(f"      🐾 [DISABLED] Non-pet query '{query}' - pet boost disabled for {product_pet_type} product")
            return 0.0
    
    # Only apply pet scoring if:
    # 1. Query is pet-related, OR
    # 2. No query (homepage/browse mode)
    
    # Tier 1: Explicit preference (STRONGEST - boosted to 1.0)
    explicit = pet_preferences.get('explicit')
    if explicit and explicit == product_pet_type:
        print(f"      🐾 [TIER 1] Explicit match: {product_pet_type} → +1.00 (STRONG)")
        return 1.0
    
    # Tier 2: Learned behavior (medium - boosted)
    learned = pet_preferences.get('learned', [])
    dominant = pet_preferences.get('dominant')
    counts = pet_preferences.get('counts', {})
    
    if product_pet_type in learned:
        if product_pet_type == dominant:
            interactions = counts.get(product_pet_type, 0)
            print(f"      🐾 [TIER 2] Dominant learned: {product_pet_type} ({interactions} clicks) → +0.70")
            return 0.70
        else:
            interactions = counts.get(product_pet_type, 0)
            print(f"      🐾 [TIER 2] Secondary learned: {product_pet_type} ({interactions} clicks) → +0.40")
            return 0.40
    
    # Tier 3: Query-only (weak exploration - only if query mentions pets)
    if query_is_pet_related and not learned:
        print(f"      🐾 [TIER 3] Query exploration: {product_pet_type} → +0.10")
        return 0.10
    
    return 0.0


# ====================================================================
# RE-RANKING WITH PET AWARENESS
# ====================================================================
def rerank_with_scores(candidates, user_profile, user_id, is_homepage, query=None):
    """
    ✅ ENHANCED: Scoring with pet awareness
    """
    
    user_gender = user_profile.get("gender", "").lower()
    
    # Get user preferences
    avg_price = None
    preferred_categories = Counter()
    pet_prefs = {'explicit': None, 'learned': [], 'dominant': None, 'counts': {}}
    
    if user_id and user_id in preference_tracker.user_preferences:
        prefs = preference_tracker.user_preferences[user_id]
        price_history = prefs.get('preferred_price_range', [])
        if len(price_history) >= MIN_CLICKS_FOR_PRICE_RANKING:
            avg_price = np.mean(price_history)
        preferred_categories = prefs.get('preferred_categories', Counter())
        
        # ✅ NEW: Get pet preferences
        pet_prefs = preference_tracker.get_pet_preferences(user_id)
    
    print(f"\n{'='*100}")
    print(f"🎯 PET-AWARE SCORE-BASED RANKING")
    print(f"{'='*100}")
    print(f"📊 USER CONTEXT:")
    print(f"   User ID: {user_id}")
    print(f"   Gender: {user_gender}")
    print(f"   Pet preferences: {pet_prefs}")
    print(f"   Homepage: {is_homepage}")
    print(f"   Total candidates: {len(candidates)}")
    
    if avg_price:
        print(f"   Avg price: ${avg_price:.2f}")
    print(f"   Preferred categories: {dict(preferred_categories.most_common(5))}")
    print(f"{'='*100}\n")
    
    scored_products = []
    
    for idx, rec in enumerate(candidates, 1):
        product_id = rec.get("product_id", "unknown")
        product_title = rec.get("title", "")
        product_cat = rec.get("category", "")
        product_price = preference_tracker.parse_price(rec.get("price"))
        base_score = rec.get("initial_score", 0.5)
        
        is_gender_sensitive = is_gender_sensitive_category(product_cat)
        
        # Calculate adjustments
        gender_adj = 0.0
        price_adj = 0.0
        category_adj = 0.0
        pet_adj = 0.0  # ✅ NEW
        
        # RULE 1: Gender scoring
        if is_gender_sensitive and user_gender:
            gender_adj = calculate_gender_score(product_title, product_cat, user_gender)
        
        # RULE 2: Price scoring
        if avg_price and product_price:
            price_adj = calculate_price_score(product_price, avg_price)
        
        # RULE 3: Category affinity
        category_adj = calculate_category_score(product_cat, preferred_categories, is_homepage)
        
        # ✅ RULE 4: Pet scoring
        pet_adj = calculate_pet_score(rec, pet_prefs, query)
        
        # ✅ REBALANCED WEIGHTS with STRENGTHENED pet
        if is_homepage:
            gender_weight = 0.20 if is_gender_sensitive else 0.0
            price_weight = 0.25  # ✅ Reduced from 0.30
            category_weight = 0.20
            pet_weight = 0.20  # ✅ INCREASED from 0.15 to 0.20
            base_weight = 0.15
        else:
            gender_weight = 0.20 if is_gender_sensitive else 0.0
            price_weight = 0.20  # ✅ Reduced from 0.25
            category_weight = 0.15  # ✅ Reduced from 0.20
            pet_weight = 0.20  # ✅ DOUBLED from 0.10 to 0.20
            base_weight = 0.25
        
        # Calculate final score
        final_score = (
            base_weight * base_score +
            gender_weight * gender_adj +
            price_weight * price_adj +
            category_weight * category_adj +
            pet_weight * pet_adj  # ✅ NEW
        )
        
        if idx <= 10 or idx % 10 == 0:
            pet_type = extract_pet_type_from_product(rec)
            print(f"   [{idx:3d}] {product_title[:50]}")
            print(f"         Pet: {pet_type or 'N/A'} | Cat: {product_cat[:25]}")
            print(f"         Scores: base={base_score:.3f} | gender={gender_adj:+.3f} | price={price_adj:+.3f} | cat={category_adj:+.3f} | pet={pet_adj:+.3f}")
            print(f"         ➜ FINAL: {final_score:.4f}\n")
        
        scored_products.append({
            'product': rec,
            'final_score': final_score,
            'debug': {
                'id': product_id,
                'title': product_title[:50],
                'cat': product_cat,
                'pet_type': extract_pet_type_from_product(rec),
                'base': round(base_score, 4),
                'gender_adj': round(gender_adj, 4),
                'price_adj': round(price_adj, 4),
                'category_adj': round(category_adj, 4),
                'pet_adj': round(pet_adj, 4),  # ✅ NEW
                'final': round(final_score, 4),
                'price': f"${product_price:.2f}" if product_price else "N/A"
            }
        })
    
    scored_products.sort(key=lambda x: x['final_score'], reverse=True)
    
    print(f"\n🏆 TOP 10 RESULTS:")
    print(f"{'─'*100}")
    for i, item in enumerate(scored_products[:10], 1):
        d = item['debug']
        print(f"{i:2d}. Score: {d['final']:.4f} | Pet: {d['pet_type'] or 'N/A':8s} | {d['cat'][:30]:30s}")
        print(f"    {d['title']}")
        print(f"    Base: {d['base']:.3f} | Gender: {d['gender_adj']:+.3f} | Price: {d['price_adj']:+.3f} | Cat: {d['category_adj']:+.3f} | Pet: {d['pet_adj']:+.3f}\n")
    
    return [item['product'] for item in scored_products]


# ====================================================================
# LOAD MODEL AND DATA
# ====================================================================
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
        top_cats = [cat for cat, _ in preferred_categories.most_common(3)]
        mixed_query = " ".join(top_cats)
        print(f"🏠 [HOMEPAGE] Using mixed categories as intent: {top_cats}")
        return mixed_query
    else:
        print(f"🏠 [HOMEPAGE] No history, using fallback: {preferred_category}")
        return preferred_category


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
    """Blended candidate generation for homepage"""
    if user_id not in preference_tracker.user_preferences:
        return None, preferred_category
    
    prefs = preference_tracker.user_preferences[user_id]
    
    intent_query = None
    last_search = prefs.get("last_search_query")
    if last_search:
        intent_query = last_search
        print(f"🎯 [BLEND] Intent source: last search '{last_search}'")
    elif prefs.get("clicked_products") and len(prefs["clicked_products"]) > 0:
        intent_query = prefs["clicked_products"][-1].get("title", "")
        print(f"🎯 [BLEND] Intent source: last clicked product")
    
    if not intent_query:
        return None, _fallback_mixed_categories(prefs, preferred_category)
    
    intent_k = int(total_k * 0.65)
    print(f"🎯 [BLEND] Fetching {intent_k} intent-based candidates...")
    intent_candidates = rerank_for_user(user_id, query=intent_query, top_k=intent_k)
    
    category_k = int(total_k * 0.20)
    preferred_categories = prefs.get('preferred_categories', Counter())
    if preferred_categories:
        top_cats = [cat for cat, _ in preferred_categories.most_common(3)]
        category_query = " ".join(top_cats)
        print(f"🎯 [BLEND] Fetching {category_k} category-based candidates from: {top_cats}")
        category_candidates = rerank_for_user(user_id, query=category_query, top_k=category_k)
    else:
        category_candidates = []
    
    explore_k = int(total_k * 0.15)
    print(f"🎯 [BLEND] Fetching {explore_k} exploration candidates...")
    all_items = list(range(prod_emb.shape[0]))
    explore_indices = np.random.choice(all_items, size=min(explore_k, len(all_items)), replace=False)
    explore_candidates = [(int(idx), 0.5) for idx in explore_indices]
    
    seen_items = set()
    blended = []
    
    for item_idx, score in intent_candidates:
        if item_idx not in seen_items:
            blended.append((item_idx, score))
            seen_items.add(item_idx)
    
    for item_idx, score in category_candidates:
        if item_idx not in seen_items:
            blended.append((item_idx, score))
            seen_items.add(item_idx)
    
    for item_idx, score in explore_candidates:
        if item_idx not in seen_items:
            blended.append((item_idx, score))
            seen_items.add(item_idx)
    
    print(f"✅ [BLEND] Mixed candidates: {len(blended)} total")
    
    return blended[:total_k], None


def get_recommendations_safe(user_id=None, query=None, preferred_category=None, 
                            seed_item_idx=None, top_k=10, user_profile=None, 
                            alphas=(0.25, 0.25, 0.2, 0.3), is_homepage=False):
    try:
        if is_homepage and not query and user_id:
            print(f"\n{'='*80}")
            print(f"🏠 HOMEPAGE MODE: Blended Candidate Generation")
            print(f"{'='*80}")
            
            fetch_multiplier = 5
            blended_candidates, fallback_query = get_blended_homepage_candidates(
                user_id, 
                preferred_category, 
                total_k=top_k * fetch_multiplier
            )
            
            if blended_candidates:
                recommendations = blended_candidates
                print(f"✅ Using blended candidates: {len(recommendations)} items")
            else:
                print(f"⚠️ No user history, using fallback: {fallback_query}")
                recommendations = rerank_for_user(user_id, query=fallback_query, 
                                                 seed_item_iidx=seed_item_idx, 
                                                 top_k=top_k * fetch_multiplier, 
                                                 alphas=alphas)
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
        
        if user_profile:
            reranked = rerank_with_scores(initial_recommendations, user_profile, user_id, is_homepage, query)
            return reranked[:top_k]
        
        return initial_recommendations[:top_k]
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return []


# ====================================================================
# API MODELS
# ====================================================================
class UserProfile(BaseModel):
    gender: str
    age: int
    occupation: str
    pets: Optional[List[str]] = []
    petType: Optional[str] = None  # ✅ NEW: Explicit pet preference

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


# ====================================================================
# API ENDPOINTS
# ====================================================================
@app.get("/")
async def root():
    return {
        "message": "Enhanced Pet-Aware Recommender API",
        "status": "running",
        "version": "10.0",
        "features": [
            "✅ 🐾 NEW: 3-tier pet intent resolution system",
            "✅ Tier 1: Explicit pet preference from profile (+0.50)",
            "✅ Tier 2: Learned behavior from clicks (+0.40 dominant, +0.20 secondary)",
            "✅ Tier 3: Query-only exploration (+0.05)",
            "✅ Automatic pet type detection from product titles/categories",
            "✅ Pet interaction tracking and learning",
            "✅ Blended homepage candidates (65% intent + 20% category + 15% explore)",
            "✅ Gender-aware ranking for fashion/beauty",
            "✅ Price and category affinity scoring",
            "✅ Full debug visibility"
        ]
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": "10.0"}

@app.post("/recommend", response_model=RecommendationResponse)
async def get_recommendations(request: RecommendationRequest):
    try:
        print(f"🔍 [API] Request: is_homepage={request.is_homepage}, user_id={request.user_id}")
        
        if request.query and request.user_id:
            preference_tracker.record_search_query(request.user_id, request.query)
        
        user_profile = {
            "gender": request.user_profile.gender.lower(),
            "age": request.user_profile.age,
            "occupation": request.user_profile.occupation.lower(),
            "pets": [pet.lower() for pet in request.user_profile.pets] if request.user_profile.pets else [],
            "petType": request.user_profile.petType  # ✅ NEW
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
    """Record user interaction with pet learning"""
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