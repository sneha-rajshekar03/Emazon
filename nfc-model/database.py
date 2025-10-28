# hybrid_recommender_with_demographics_and_preferences_optimized.py
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
import re
import warnings
import functools
from functools import lru_cache

# =======================================================
# CONFIG
# =======================================================
BASE_PATH = "./database"   # change to your local folder
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
TOP_K = 10

# =======================================================
# ENHANCED DEMOGRAPHIC KEYWORDS - IMPROVED GENDER FILTERING
# =======================================================
GENDER_KEYWORDS = {
    "male": ["men", "boy", "male", "gentleman", "his", "men's", "man", "boys", "masculine", 
             "groom", "father", "dad", "brother", "husband", "suit", "beard", "shaving",
             "cologne", "boxers", "briefs", "workboot", "tool", "grill", "sports", "fitness",
             "men polo", "men shirt", "men t-shirt", "men jeans", "men shoes", "men watch"],
    
    "female": ["women", "girl", "female", "lady", "her", "women's", "woman", "girls", "feminine",
               "bride", "mother", "mom", "sister", "wife", "dress", "makeup", "skincare",
               "perfume", "lingerie", "bra", "heels", "handbag", "purse", "jewelry", "nail",
               "women dress", "women top", "women skirt", "women blouse", "women handbag"]
}

AGE_GROUP_KEYWORDS = {
    "youth": ["toy", "game", "lego", "comic", "art", "novel", "kids", "child", "children",
              "school-supply", "action-figure", "doll", "puzzle", "cartoon", "baby", "toddler",
              "teenager", "adolescent", "student", "homework", "textbook", "backpack", "lunchbox",
              "playground", "educational", "storybook", "coloring", "stuffed", "pacifier", "diaper"],
    
    "young_adult": ["college", "study", "fashion", "novel", "career", "romance", "dating",
                    "teen", "university", "dorm", "backpack", "laptop", "smartphone", "gadget",
                    "headphone", "sneaker", "gaming", "music", "concert", "festival", "travel",
                    "apartment", "decor", "fitness", "gym", "social", "party", "entertainment",
                    "streaming", "technology", "startup", "internship", "resume", "networking"],
    
    "adult": ["work", "office", "business", "investment", "management", "home", "family",
              "kitchen", "finance", "career", "professional", "commute", "formal-wear",
              "mortgage", "insurance", "retirement", "parenting", "marriage", "realestate",
              "gardening", "cooking", "appliance", "furniture", "decor", "vehicle", "tools",
              "healthcare", "wellness", "mature", "executive", "leadership", "tax", "estate"],
    
    "senior": ["retirement", "pension", "grandparent", "elderly", "senior", "arthritis",
               "health", "medical", "accessibility", "comfort", "mobility", "walker",
               "hearing", "vision", "prescription", "supplement", "gardening", "hobby",
               "travel", "cruise", "birdwatching", "knitting", "reading", "classic",
               "traditional", "memory", "assisted", "caregiver", "pill", "organizer"]
}

OCCUPATION_KEYWORDS = {
    "student": ["book", "pen", "study", "notebook", "art", "novel", "textbook", "education",
                "highlighter", "binder", "calculator", "laptop-sleeve", "dorm-essentials",
                "backpack", "stationery", "homework", "research", "campus", "library",
                "scholarship", "exam", "tuition", "student-id", "cafeteria", "dormitory"],
    
    "professional": ["laptop", "office", "business", "management", "finance", "career",
                     "briefcase", "monitor", "desk-organizer", "planner", "blazer", "work-shoes",
                     "conference", "meeting", "presentation", "corporate", "executive",
                     "deadline", "project", "team", "leadership", "networking", "resume",
                     "interview", "promotion", "salary", "commute", "business-card", "suit"],
    
    "artist": ["art", "painting", "sketch", "novel", "creative", "canvas", "easel", "design",
               "brush-set", "drawing-tablet", "sculpting", "craft", "ink", "charcoal", "gallery",
               "exhibition", "portfolio", "studio", "inspiration", "color", "palette", "watercolor",
               "acrylic", "sketchbook", "illustration", "mural", "pottery", "ceramic", "creative"],
    
    "engineer": ["technology", "software", "hardware", "coding", "programming", "computer",
                 "mechanical", "electrical", "civil", "blueprint", "prototype", "innovation",
                 "algorithm", "data", "analysis", "system", "network", "security", "cloud",
                 "database", "development", "testing", "debugging", "architecture", "design"],
    
    "healthcare": ["medical", "health", "hospital", "clinic", "doctor", "nurse", "patient",
                   "pharmacy", "prescription", "treatment", "therapy", "rehabilitation",
                   "wellness", "fitness", "nutrition", "vitamin", "supplement", "firstaid",
                   "emergency", "surgical", "diagnostic", "caregiver", "eldercare", "mental"],
    
    "teacher": ["education", "classroom", "lesson", "curriculum", "student", "learning",
                "whiteboard", "marker", "textbook", "worksheet", "grade", "assessment",
                "school", "academic", "pedagogy", "instruction", "tutoring", "homework",
                "project", "bulletin", "chalk", "desk", "backpack", "recess", "principal"],
    
    "entrepreneur": ["startup", "business", "venture", "innovation", "funding", "investor",
                     "pitch", "prototype", "market", "strategy", "growth", "scaling",
                     "networking", "partnership", "brand", "marketing", "sales", "revenue",
                     "disruption", "technology", "digital", "ecommerce", "platform", "app"]
}

PET_KEYWORDS = {
    "dog": ["dog", "puppy", "canine", "kennel", "leash", "collar", "dog-food", "dog-toy",
            "dog-bed", "dog-treat", "dog-bowl", "dog-house", "dog-shampoo", "dog-collar",
            "dog-leash", "dog-crate", "dog-bone", "pet-grooming", "vet", "vaccination",
            "obedience", "training", "walking", "fetch", "chew-toy", "dog-jacket"],
    
    "cat": ["cat", "kitten", "feline", "litter", "scratch", "cat-food", "cat-toy", "cat-bed",
            "cat-tree", "catnip", "litter-box", "cat-scratcher", "cat-tower", "cat-treat",
            "cat-bowl", "cat-carrier", "cat-grooming", "brush", "laser-pointer", "feather",
            "mouse-toy", "cat-health", "whisker", "purr", "meow"]
}

# Precompute sets for faster lookup
GENDER_SETS = {gender: set(keywords) for gender, keywords in GENDER_KEYWORDS.items()}
PET_SETS = {pet: set(keywords) for pet, keywords in PET_KEYWORDS.items()}

# =======================================================
# User Preference Tracking - FIXED
# =======================================================
class UserPreferenceTracker:
    def __init__(self, storage_file="user_preferences.pkl"):
        self.storage_file = os.path.join(BASE_PATH, storage_file)
        self.user_preferences = self.load_preferences()
        
    def load_preferences(self):
        """Load user preferences from disk"""
        if os.path.exists(self.storage_file):
            try:
                with open(self.storage_file, "rb") as f:
                    return pickle.load(f)
            except:
                return defaultdict(lambda: {
                    'demographics': {},
                    'clicked_products': [],
                    'preferred_categories': Counter(),
                    'preferred_brands': Counter(),
                    'preferred_price_range': [],
                    'preferred_sellers': Counter(),
                    'preferred_ratings': [],
                    'pet_ownership': Counter(),
                    'last_updated': None,
                    'total_clicks': 0
                })
        return defaultdict(lambda: {
            'demographics': {},
            'clicked_products': [],
            'preferred_categories': Counter(),
            'preferred_brands': Counter(),
            'preferred_price_range': [],
            'preferred_sellers': Counter(),
            'preferred_ratings': [],
            'pet_ownership': Counter(),
            'last_updated': None,
            'total_clicks': 0
        })
    
    def save_preferences(self):
        """Save user preferences to disk"""
        with open(self.storage_file, "wb") as f:
            pickle.dump(dict(self.user_preferences), f)
    
    def save_demographics(self, user_id, demographics):
        """Save user demographic information"""
        # Ensure user entry exists
        if user_id not in self.user_preferences:
            self.user_preferences[user_id] = {
                'demographics': {},
                'clicked_products': [],
                'preferred_categories': Counter(),
                'preferred_brands': Counter(),
                'preferred_price_range': [],
                'preferred_sellers': Counter(),
                'preferred_ratings': [],
                'pet_ownership': Counter(),
                'last_updated': None,
                'total_clicks': 0
            }
        
        self.user_preferences[user_id]['demographics'] = demographics
        self.user_preferences[user_id]['last_updated'] = datetime.datetime.now()
        self.save_preferences()
    
    def get_demographics(self, user_id):
        """Get saved demographic information"""
        if user_id in self.user_preferences and self.user_preferences[user_id].get('demographics'):
            return self.user_preferences[user_id]['demographics']
        return {}
    
    def record_click(self, user_id, product_info):
        """Record a user's click on a product and update preferences"""
        # Ensure user entry exists
        if user_id not in self.user_preferences:
            self.user_preferences[user_id] = {
                'demographics': {},
                'clicked_products': [],
                'preferred_categories': Counter(),
                'preferred_brands': Counter(),
                'preferred_price_range': [],
                'preferred_sellers': Counter(),
                'preferred_ratings': [],
                'pet_ownership': Counter(),
                'last_updated': None,
                'total_clicks': 0
            }
            
        user_prefs = self.user_preferences[user_id]
        
        # Add to clicked products (keep last 50)
        user_prefs['clicked_products'].append({
            'product_id': product_info.get('id'),
            'title': product_info.get('title'),
            'category': product_info.get('category'),
            'price': product_info.get('price'),
            'brand': self.extract_brand(product_info.get('title', '')),
            'seller': product_info.get('seller_name'),
            'rating': product_info.get('stars'),
            'timestamp': datetime.datetime.now()
        })
        
        # Keep only last 50 interactions
        if len(user_prefs['clicked_products']) > 50:
            user_prefs['clicked_products'] = user_prefs['clicked_products'][-50:]
        
        # Update preferences
        if product_info.get('category'):
            user_prefs['preferred_categories'][product_info['category']] += 1
        
        brand = self.extract_brand(product_info.get('title', ''))
        if brand:
            user_prefs['preferred_brands'][brand] += 1
        
        price = self.parse_price(product_info.get('price'))
        if price and price > 0:
            user_prefs['preferred_price_range'].append(price)
            # Keep only last 20 prices
            if len(user_prefs['preferred_price_range']) > 20:
                user_prefs['preferred_price_range'] = user_prefs['preferred_price_range'][-20:]
        
        if product_info.get('seller_name'):
            user_prefs['preferred_sellers'][product_info['seller_name']] += 1
        
        rating = self.parse_rating(product_info.get('stars'))
        if rating:
            user_prefs['preferred_ratings'].append(rating)
            if len(user_prefs['preferred_ratings']) > 20:
                user_prefs['preferred_ratings'] = user_prefs['preferred_ratings'][-20:]
        
        # Update pet ownership inference
        self.update_pet_ownership(user_prefs, product_info)
        
        user_prefs['total_clicks'] += 1
        user_prefs['last_updated'] = datetime.datetime.now()
        
        self.save_preferences()
    
    def update_pet_ownership(self, user_prefs, product_info):
        """Infer pet ownership from product interactions"""
        title = product_info.get('title', '').lower()
        category = product_info.get('category', '').lower()
        
        for pet_type, keywords in PET_KEYWORDS.items():
            if any(keyword in title or keyword in category for keyword in keywords):
                user_prefs['pet_ownership'][pet_type] += 1
    
    def extract_brand(self, title):
        """Extract brand from product title (simple heuristic)"""
        if not title:
            return ""
        # Common brand patterns - you can expand this list
        common_brands = ['nike', 'adidas', 'apple', 'samsung', 'sony', 'lg', 'dell', 'hp', 
                        'lenovo', 'microsoft', 'amazon', 'google', 'bosch', 'whirlpool',
                        'ford', 'toyota', 'honda', 'chevrolet', 'bmw', 'mercedes',
                        'coca-cola', 'pepsi', 'nestle', 'unilever', 'procter', 'gamble']
        title_lower = title.lower()
        for brand in common_brands:
            if brand in title_lower:
                return brand
        return ""
    
    def parse_price(self, price):
        """Parse price from various formats"""
        if not price or price in ['N/A', 0, '0', '0.0']:
            return None
        try:
            if isinstance(price, (int, float)):
                return float(price)
            # Remove currency symbols and commas
            price_str = str(price).replace('$', '').replace(',', '').strip()
            return float(price_str)
        except:
            return None
    
    def parse_rating(self, rating):
        """Parse rating from various formats"""
        if not rating or rating == 'N/A':
            return None
        try:
            return float(rating)
        except:
            return None
    
    def get_user_preferences(self, user_id):
        """Get comprehensive user preferences"""
        if user_id not in self.user_preferences:
            return None
        
        prefs = self.user_preferences[user_id]
        if prefs['total_clicks'] == 0:
            return None
        
        # Calculate averages and patterns
        avg_price = np.mean(prefs['preferred_price_range']) if prefs['preferred_price_range'] else None
        avg_rating = np.mean(prefs['preferred_ratings']) if prefs['preferred_ratings'] else None
        
        price_range = None
        if prefs['preferred_price_range']:
            min_price = min(prefs['preferred_price_range'])
            max_price = max(prefs['preferred_price_range'])
            price_range = (min_price, max_price)
        
        # Get likely pets
        likely_pets = [pet for pet, count in prefs['pet_ownership'].most_common(3) if count > 0]
        
        return {
            'top_categories': prefs['preferred_categories'].most_common(3),
            'top_brands': prefs['preferred_brands'].most_common(3),
            'top_sellers': prefs['preferred_sellers'].most_common(3),
            'price_preference': {
                'average': avg_price,
                'range': price_range
            },
            'rating_preference': avg_rating,
            'likely_pets': likely_pets,
            'total_interactions': prefs['total_clicks'],
            'last_active': prefs['last_updated']
        }

# =======================================================
# NCF Model Definition
# =======================================================
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

# =======================================================
# Load resources
# =======================================================
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
    print("Warning: Using less secure model loading. Consider retraining your model with current PyTorch version.")
    state_dict = torch.load(os.path.join(BASE_PATH, "ncf_model.pth"), map_location=DEVICE)

model.load_state_dict(state_dict)
model.eval()

with open(os.path.join(BASE_PATH, "product_meta.json"), "r", encoding="utf-8") as f:
    product_data = json.load(f)

metadata_df = pd.DataFrame(product_data).drop_duplicates(subset="product_id")
metadata_df["product_id"] = metadata_df["product_id"].astype(str)
metadata_df["seller_name"] = metadata_df["seller_details"].apply(lambda x: x.get("seller_name") if isinstance(x, dict) else None)
metadata_df["seller_rating"] = metadata_df["seller_details"].apply(lambda x: x.get("seller_rating") if isinstance(x, dict) else None)
product_id_to_info = metadata_df.set_index("product_id").to_dict(orient="index")

faiss_index = faiss.read_index(os.path.join(BASE_PATH, "product_faiss.index"))
prod_emb = np.load(os.path.join(BASE_PATH, "prod_embeddings.npy"))
sbert = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")

# Initialize preference tracker
preference_tracker = UserPreferenceTracker()

# =======================================================
# Caching and Optimization Functions
# =======================================================
@lru_cache(maxsize=1000)
def cached_sbert_encode(text):
    return sbert.encode([text])

@lru_cache(maxsize=10000)
def process_text_cached(text: str) -> str:
    return str(text).lower().strip()

# =======================================================
# New user support
# =======================================================
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

# =======================================================
# Enhanced Price Parsing and Filtering
# =======================================================
def parse_price(price):
    """Helper function to parse price correctly"""
    if not price or price in ['N/A', 0, '0', '0.0']:
        return None
    try:
        if isinstance(price, (int, float)):
            return float(price)
        
        price_str = str(price).strip()
        
        # Remove currency symbols and commas
        price_str = price_str.replace('$', '').replace(',', '').strip()
        
        # Handle cases where price might be in wrong format
        if '.' in price_str:
            parts = price_str.split('.')
            if len(parts) == 2:
                # Check if decimal part is reasonable (2 digits max)
                if len(parts[1]) <= 2:
                    return float(price_str)
                else:
                    # Probably wrong format, treat as integer
                    return float(parts[0])
        
        return float(price_str)
    except:
        return None

def extract_seller_rating(seller_rating_str):
    """Extract numeric rating from seller rating string"""
    if not seller_rating_str or seller_rating_str == 'N/A':
        return None
    try:
        # Handle cases like "None (2.92)" or "3.71"
        if 'None' in seller_rating_str:
            # Extract rating from parentheses
            match = re.search(r'\(([\d.]+)\)', seller_rating_str)
            return float(match.group(1)) if match else None
        else:
            return float(seller_rating_str)
    except (ValueError, TypeError):
        return None

def batch_calculate_preference_scores(user_id, candidates):
    """Batch process preference scores with better category matching"""
    if not user_id or user_id not in preference_tracker.user_preferences or preference_tracker.user_preferences[user_id]['total_clicks'] == 0:
        return [np.random.uniform(0.1, 0.3) for _ in candidates]
    
    user_prefs = preference_tracker.user_preferences[user_id]
    scores = []
    
    # Precompute product info in batch
    product_infos = []
    for iidx in candidates:
        asin = iidx_to_product_id.get(iidx, f"ID_{iidx}")
        info = product_id_to_info.get(asin, {})
        product_infos.append({
            'id': asin,
            'title': info.get("title", f"Product_{iidx}"),
            'category': info.get("category_name", "N/A"),
            'price': info.get("price", "N/A"),
            'stars': info.get("stars", "N/A"),
            'seller_name': info.get("seller_name", "N/A"),
        })
    
    # Calculate scores with improved logic
    for product_info in product_infos:
        score = 0.0
        
        # STRONG Category match (50% weight)
        product_category = product_info.get('category', '')
        if product_category and product_category in user_prefs['preferred_categories']:
            category_count = user_prefs['preferred_categories'][product_category]
            category_weight = category_count / user_prefs['total_clicks']
            score += category_weight * 0.5  # Much stronger weight for categories
        
        # Broad category matching (e.g., anything with "clothing" or "fashion")
        title_lower = product_info.get('title', '').lower()
        category_lower = product_category.lower()
        
        # If user prefers clothing, boost anything clothing-related
        if any(cat in ['Clothing', 'Fashion'] for cat in user_prefs['preferred_categories']):
            clothing_terms = ['shirt', 'dress', 'top', 'blouse', 'clothing', 'fashion', 'apparel']
            if any(term in title_lower or term in category_lower for term in clothing_terms):
                score += 0.3  # Bonus for clothing-related items
        
        # Price match with wider tolerance (30% weight)
        product_price = preference_tracker.parse_price(product_info.get('price'))
        if product_price and user_prefs['preferred_price_range']:
            avg_price = np.mean(user_prefs['preferred_price_range'])
            # Wider price tolerance - within 50% of preferred price
            price_ratio = min(product_price, avg_price) / max(product_price, avg_price)
            price_score = price_ratio * 0.3  # More forgiving price matching
            score += price_score
        
        # Brand match (10% weight)
        product_brand = preference_tracker.extract_brand(product_info.get('title', ''))
        if product_brand and product_brand in user_prefs['preferred_brands']:
            brand_weight = user_prefs['preferred_brands'][product_brand] / user_prefs['total_clicks']
            score += brand_weight * 0.1
        
        # Seller match (10% weight)
        product_seller = product_info.get('seller_name')
        if product_seller and product_seller in user_prefs['preferred_sellers']:
            seller_weight = user_prefs['preferred_sellers'][product_seller] / user_prefs['total_clicks']
            score += seller_weight * 0.1
        
        scores.append(min(score, 1.0))
    
    return scores

def rerank_with_preferences(initial_recommendations, user_gender, user_pets):
    """Re-rank products based on user preferences without removing any"""
    reranked_recs = []
    
    for rec in initial_recommendations:
        title = rec.get('title', '').lower()
        
        # Calculate preference adjustments instead of filtering
        preference_adjustment = 0.0
        
        # STRONG Gender preference adjustment - FIXED LOGIC
        if user_gender == 'female':
            if any(term in title for term in ["women's", "women", "girl's", "girl", "female", "lady"]):
                preference_adjustment += 0.5  # Strong boost for female products
            elif any(term in title for term in ["men's", "men", "boy's", "boy", "male"]):
                preference_adjustment -= 0.4  # Strong penalty for male products
        elif user_gender == 'male':
            if any(term in title for term in ["men's", "men", "boy's", "boy", "male"]):
                preference_adjustment += 0.5  # Strong boost for male products
            elif any(term in title for term in ["women's", "women", "girl's", "girl", "female", "lady"]):
                preference_adjustment -= 0.4  # Strong penalty for female products
        
        # Pet preference adjustment
        for pet in user_pets:
            if pet in PET_KEYWORDS:
                pet_kws = PET_KEYWORDS[pet]
                if any(w in title for w in pet_kws):
                    preference_adjustment += 0.3  # Boost for pet-related products
        
        # Quality adjustments (softer penalties)
        price = parse_price(rec.get('price', 0))
        if price and price > 100:  # Only penalize extremely high prices
            preference_adjustment -= 0.1
        
        seller_rating = extract_seller_rating(rec.get('seller_rating', '0'))
        if seller_rating and seller_rating < 3.0:  # Only penalize very low seller ratings
            preference_adjustment -= 0.1
            
        try:
            stars = float(rec.get('stars', 0))
            if stars < 2.0:  # Only penalize very low product ratings
                preference_adjustment -= 0.1
        except (ValueError, TypeError):
            pass
        
        # Apply preference adjustment to final score
        rec["final_score"] = rec.get("final_score", 0) + preference_adjustment
        reranked_recs.append(rec)
    
    # Re-sort by adjusted final score
    reranked_recs = sorted(reranked_recs, key=lambda x: x['final_score'], reverse=True)
    return reranked_recs

# =======================================================
# Enhanced Demographic re-ranking with Pet Support - FIXED GENDER LOGIC
# =======================================================
def calculate_suitability_score_optimized(title: str, category: str, user_profile: dict) -> int:
    title_lower = process_text_cached(title)
    category_lower = process_text_cached(category)
    occupation = process_text_cached(user_profile.get("occupation", ""))
    pets = user_profile.get("pets", [])
    
    score = 0

    # Gender matching with set operations - IMPROVED LOGIC
    user_gender = user_profile.get("gender")
    if user_gender in GENDER_SETS:
        gender_keywords = GENDER_SETS[user_gender]
        opposite_gender = "female" if user_gender == "male" else "male"
        opposite_keywords = GENDER_SETS.get(opposite_gender, set())
        
        # Boost for matching gender keywords
        if any(keyword in title_lower or keyword in category_lower for keyword in gender_keywords):
            score += 2  # Strong boost for matching gender
        
        # Penalty for opposite gender keywords
        if any(keyword in title_lower or keyword in category_lower for keyword in opposite_keywords):
            score -= 2  # Strong penalty for opposite gender

    # Age group matching
    age_group = user_profile.get("age_group")
    if age_group in AGE_GROUP_KEYWORDS:
        age_keywords = AGE_GROUP_KEYWORDS[age_group]
        if any(keyword in title_lower or keyword in category_lower for keyword in age_keywords):
            score += 1

    # Occupation matching
    if occupation and occupation in OCCUPATION_KEYWORDS:
        occ_keywords = OCCUPATION_KEYWORDS[occupation]
        if any(keyword in title_lower or keyword in category_lower for keyword in occ_keywords):
            score += 1

    # Exact occupation match
    if occupation and (occupation in title_lower or occupation in category_lower):
        score += 1

    # Pet-related matching with set operations
    for pet in pets:
        if pet in PET_SETS:
            pet_keywords = PET_SETS[pet]
            if any(keyword in title_lower or keyword in category_lower for keyword in pet_keywords):
                score += 2

    return score

# =======================================================
# Enhanced Hybrid ranking with Preference tracking
# =======================================================
def rerank_for_user_optimized(user_id_str=None, query=None, seed_item_iidx=None, top_k=100, alphas=(0.25, 0.25, 0.2, 0.3)):
    uidx = get_or_add_user(user_id_str) if user_id_str else None

    if query:
        # Use cached encoding
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
        # General recommendations without query
        candidates = list(range(min(top_k, prod_emb.shape[0])))
        search_scores = [1.0]*len(candidates)

    # Vectorized NCF scoring
    if uidx is not None:
        with torch.no_grad():
            users = torch.LongTensor([uidx]*len(candidates)).to(DEVICE)
            items = torch.LongTensor(candidates).to(DEVICE)
            ncf_scores = model(users, items).cpu().numpy().tolist()
    else:
        ncf_scores = [0.5]*len(candidates)

    # Vectorized content similarity
    if query:
        q_emb_norm = q_emb / np.linalg.norm(q_emb, axis=1, keepdims=True)
        cand_embs = prod_emb[candidates]
        content_sim = (cand_embs @ q_emb_norm.T).reshape(-1).tolist()
    elif seed_item_iidx is not None:
        seed = prod_emb[seed_item_iidx]
        cand_embs = prod_emb[candidates]
        seed_norm = seed / np.linalg.norm(seed)
        cand_norm = cand_embs / np.linalg.norm(cand_embs, axis=1, keepdims=True)
        content_sim = (cand_norm @ seed_norm).tolist()
    else:
        content_sim = [0.0]*len(candidates)

    # Batch preference scoring
    preference_scores = batch_calculate_preference_scores(user_id_str, candidates)

    # Vectorized normalization and scoring
    s_norm = normalize(search_scores)
    n_norm = normalize(ncf_scores)
    c_norm = normalize(content_sim)
    p_norm = normalize(preference_scores)

    # Vectorized final scoring
    final_scores = np.array(s_norm) * alphas[0] + np.array(n_norm) * alphas[1] + np.array(c_norm) * alphas[2] + np.array(p_norm) * alphas[3]

    ranked_indices = np.argsort(-final_scores)  # Descending sort
    ranked = [(candidates[i], final_scores[i], search_scores[i], ncf_scores[i], content_sim[i], preference_scores[i]) 
              for i in ranked_indices]
    
    return ranked

def rerank_products_optimized(initial_recommendations, user_profile, user_id=None, query=None, top_k=10):
    filtered_recs = []
    query_text = process_text_cached(query) if query else ""
    
    # Get learned pet preferences
    if user_id:
        user_prefs = preference_tracker.get_user_preferences(user_id)
        if user_prefs and 'likely_pets' in user_prefs:
            # Add learned pets to user profile for scoring
            user_profile['learned_pets'] = user_prefs['likely_pets']
    
    for rec in initial_recommendations:
        product_cat = process_text_cached(rec.get("category", ""))
        product_title = process_text_cached(rec.get("title", ""))

        if query_text and query_text not in product_title and query_text not in product_cat:
            continue

        # Combine explicit pets and learned pets
        all_pets = user_profile.get("pets", []) + user_profile.get("learned_pets", [])
        user_profile_with_pets = user_profile.copy()
        user_profile_with_pets["pets"] = list(set(all_pets))  # Remove duplicates
        
        suitability = calculate_suitability_score_optimized(product_title, product_cat, user_profile_with_pets)
        
        # Enhanced scoring with preference boost
        preference_boost = rec.get("preference_score", 0) * 0.3  # Add preference influence
        rec["suitability_score"] = suitability
        rec["final_score"] = rec["initial_score"] + 0.2 * suitability + preference_boost
        filtered_recs.append(rec)

    reranked = sorted(filtered_recs, key=lambda x: x["final_score"], reverse=True)
    return reranked[:top_k]

# =======================================================
# Debug and Utility Functions
# =======================================================
def debug_user_preferences(user_id):
    """Debug function to show what preferences have been learned"""
    if not user_id:
        print("DEBUG: No user ID provided")
        return
    
    user_prefs = preference_tracker.get_user_preferences(user_id)
    if not user_prefs:
        print(f"DEBUG: User {user_id} has no recorded preferences yet")
        return
    
    print(f"\n--- Learned Preferences for {user_id} ---")
    print(f"Total Interactions: {user_prefs['total_interactions']}")
    print(f"Last Active: {user_prefs['last_active']}")
    
    if user_prefs['top_categories']:
        print("Top Categories:")
        for category, count in user_prefs['top_categories']:
            print(f"  - {category}: {count} clicks")
    
    if user_prefs['top_brands']:
        print("Top Brands:")
        for brand, count in user_prefs['top_brands']:
            print(f"  - {brand}: {count} clicks")
    
    if user_prefs['top_sellers']:
        print("Top Sellers:")
        for seller, count in user_prefs['top_sellers']:
            print(f"  - {seller}: {count} clicks")
    
    if user_prefs['price_preference']['range']:
        price_range = user_prefs['price_preference']['range']
        print(f"Preferred Price Range: ${price_range[0]:.2f} - ${price_range[1]:.2f}")
        print(f"Average Preferred Price: ${user_prefs['price_preference']['average']:.2f}")
    
    if user_prefs['rating_preference']:
        print(f"Preferred Rating: {user_prefs['rating_preference']:.1f} stars")
    
    if user_prefs['likely_pets']:
        print(f"Inferred Pets: {user_prefs['likely_pets']}")

# =======================================================
# MAIN - Enhanced with Interactive Query System
# =======================================================
def get_user_profile(user_id=None):
    """Get user demographic information"""
    print("\n=== User Profile Setup ===")
    
    # Load saved demographics if available
    saved_demographics = {}
    if user_id:
        saved_demographics = preference_tracker.get_demographics(user_id)
    
    if saved_demographics and user_id:
        print(f"Welcome back, User {user_id}! Loading your saved profile...")
        print(f"Gender: {saved_demographics.get('gender', 'Not set')}")
        print(f"Age Group: {saved_demographics.get('age_group', 'Not set')}")
        print(f"Occupation: {saved_demographics.get('occupation', 'Not set')}")
        print(f"Pets: {saved_demographics.get('pets', []) or 'None'}")
        
        update = input("\nDo you want to update your profile? (y/n): ").strip().lower()
        if update != 'y':
            return user_id, saved_demographics
    else:
        # NEW USER FLOW
        if user_id:
            print(f"Welcome, User {user_id}! Let's set up your profile.")
        else:
            print("Welcome! Let's set up your profile.")
    
    # Get new or updated profile information
    if user_id is None:
        user_id = input("Enter User ID (required): ").strip()
        while not user_id:
            print("User ID is required. Please enter a User ID.")
            user_id = input("Enter User ID: ").strip()
    
    # Get gender with validation
    gender = ""
    while gender not in ['male', 'female']:
        gender = input("Enter gender (male/female): ").strip().lower()
        if not gender and saved_demographics.get('gender'):
            gender = saved_demographics.get('gender')
        elif gender not in ['male', 'female']:
            print("Please enter either 'male' or 'female'")
    
    # Get age with validation
    age = None
    while age is None or age <= 0 or age > 120:
        age_input = input("Enter age: ").strip()
        if not age_input and saved_demographics.get('age'):
            age = saved_demographics.get('age')
            break
        try:
            age = int(age_input)
            if age <= 0 or age > 120:
                print("Please enter a valid age (1-120)")
        except ValueError:
            print("Please enter a valid number for age")
    
    # Get occupation
    occupation = input("Enter occupation: ").strip().lower()
    if not occupation and saved_demographics.get('occupation'):
        occupation = saved_demographics.get('occupation')
    
    # Get pet information with better guidance
    print("\nPet ownership (comma-separated, leave blank if none):")
    print("Options: dog, cat, bird, fish, hamster, rabbit, reptile, etc.")
    saved_pets = saved_demographics.get('pets', [])
    pets_prompt = ", ".join(saved_pets) if saved_pets else ""
    pets_input = input(f"Pets [{pets_prompt}]: ").strip().lower()
    
    if pets_input:
        pets = [pet.strip() for pet in pets_input.split(",")]
    elif saved_pets:
        pets = saved_pets
    else:
        pets = []
    
    # Calculate age group
    age_group = "youth" if age < 20 else "young_adult" if age < 30 else "adult" if age < 65 else "senior"
    
    user_profile = {
        "gender": gender, 
        "age_group": age_group, 
        "occupation": occupation,
        "pets": pets,
        "age": age  # Save actual age for future use
    }
    
    # Save demographics
    preference_tracker.save_demographics(user_id, user_profile)
    print("✓ Profile saved successfully!")
    
    # Show confirmation
    print(f"\n=== Profile Summary ===")
    print(f"User ID: {user_id}")
    print(f"Gender: {gender}")
    print(f"Age: {age} ({age_group})")
    print(f"Occupation: {occupation}")
    print(f"Pets: {pets or 'None'}")
    
    return user_id, user_profile

def show_recommendations(user_id, user_profile, query=None, top_k=10):
    """Generate and display recommendations with preference emphasis"""
    # Debug: Show current preferences
    debug_user_preferences(user_id)
    
    # If user has preferences, adjust search strategy
    user_prefs = preference_tracker.get_user_preferences(user_id)
    if user_prefs and user_prefs['total_interactions'] > 0:
        print(f"🎯 Using learned preferences from {user_prefs['total_interactions']} interactions")
        
        # If user prefers specific categories, mention it
        if user_prefs['top_categories']:
            top_cat = user_prefs['top_categories'][0][0]
            print(f"🎯 Focusing on {top_cat} based on your interests")
    
    # Generate recommendations with preference-focused weights
    recommendations = rerank_for_user_optimized(user_id, query=query, top_k=100)

    initial_recommendations = []
    for iidx, final, s, n, c, p in recommendations:
        asin = iidx_to_product_id.get(iidx, f"ID_{iidx}")
        info = product_id_to_info.get(asin, {})
        product_info = {
            "id": asin,
            "title": info.get("title", f"Product_{iidx}"),
            "initial_score": final,
            "category": info.get("category_name", "N/A"),
            "price": info.get("price", "N/A"),
            "stars": info.get("stars", "N/A"),
            "imgUrl": info.get("imgUrl", "N/A"),
            "seller_name": info.get("seller_name", "N/A"),
            "seller_rating": info.get("seller_rating", "N/A"),
            "preference_score": p  # This shows the preference influence
        }
        initial_recommendations.append(product_info)

    # Re-rank with demographics and preferences
    reranked_recs = rerank_products_optimized(initial_recommendations, user_profile, user_id=user_id, query=query, top_k=top_k)
    
    # Apply preference-based re-ranking instead of filtering
    user_gender = user_profile.get('gender', '')
    user_pets = user_profile.get('pets', [])
    reranked_recs = rerank_with_preferences(reranked_recs, user_gender, user_pets)

    print(f"\n--- Personalized Recommendations ({len(reranked_recs)} items) ---")
    for i, item in enumerate(reranked_recs, start=1):
        price_display = "N/A" if item["price"] in (0, "0", "0.0") else item["price"]
        print(f"{i}. {item['title'][:80]}...")
        print(f"   Category: {item['category']}")
        print(f"   Price: ${price_display}, Stars: {item['stars']}")
        print(f"   Seller: {item['seller_name']} (Rating: {item['seller_rating']})")
        print(f"   Match Score: {item['final_score']:.3f} (Preference: {item.get('preference_score', 0):.3f})")  # Show preference score
        print()
    
    return reranked_recs

def record_user_interaction(user_id, recommendations):
    """Record user interaction with recommendations"""
    if user_id and recommendations:
        print("Which product are you interested in? (Enter number, or 0 to skip)")
        try:
            choice = int(input("Your choice: ").strip())
            if 1 <= choice <= len(recommendations):
                selected_product = recommendations[choice-1]
                preference_tracker.record_click(user_id, selected_product)
                print(f"✓ Recorded your interest in: {selected_product['title']}")
                
                # Show updated preferences
                user_prefs = preference_tracker.get_user_preferences(user_id)
                if user_prefs:
                    print("Your preferences have been updated!")
            else:
                print("No interaction recorded.")
        except ValueError:
            print("No interaction recorded.")

if __name__ == "__main__":
    print("=== Enhanced Hybrid Recommender with Demographics & Pet Support ===")
    
    # Get user ID first to check for existing profile
    user_id_input = input("Enter User ID (blank for new user): ").strip()
    
    # If user provides an ID, check if it exists
    existing_user = False
    if user_id_input:
        saved_demographics = preference_tracker.get_demographics(user_id_input)
        if saved_demographics:
            existing_user = True
            print(f"Found existing profile for User {user_id_input}")
        else:
            print(f"New user detected: {user_id_input}")
    
    user_id, user_profile = get_user_profile(user_id_input)
    
    # Show appropriate message based on user status
    if existing_user:
        print(f"\n=== Welcome Back! ===")
    else:
        print(f"\n=== Welcome! Your profile has been created. ===")
    
    # Show initial recommendations based on demographics
    print(f"\n=== Initial Recommendations Based on Your Profile ===")
    print("Gender: {}, Age Group: {}, Occupation: {}, Pets: {}".format(
        user_profile['gender'], user_profile['age_group'], 
        user_profile['occupation'], user_profile['pets'] or 'None'
    ))
    
    initial_recs = show_recommendations(user_id, user_profile, top_k=10)
    record_user_interaction(user_id, initial_recs)

    # Interactive query loop
    while True:
        print("\n=== Search for Products ===")
        print("1. Search by query")
        print("2. Get more general recommendations") 
        print("3. Update profile")
        print("4. Exit")
        
        choice = input("Choose option (1-4): ").strip()
        
        if choice == "1":
            query = input("Enter your search query: ").strip()
            if query:
                print(f"\n=== Search Results for '{query}' ===")
                search_recs = show_recommendations(user_id, user_profile, query=query, top_k=10)
                record_user_interaction(user_id, search_recs)
            else:
                print("Please enter a valid search query.")
                
        elif choice == "2":
            print(f"\n=== More Personalized Recommendations ===")
            general_recs = show_recommendations(user_id, user_profile, top_k=10)
            record_user_interaction(user_id, general_recs)
            
        elif choice == "3":
            user_id, user_profile = get_user_profile(user_id)
            print(f"\n=== Updated Recommendations ===")
            updated_recs = show_recommendations(user_id, user_profile, top_k=10)
            record_user_interaction(user_id, updated_recs)
            
        elif choice == "4":
            print("Thank you for using the recommendation system!")
            print(f"Your profile and preferences have been saved for User ID: {user_id}")
            break
            
        else:
            print("Invalid choice. Please select 1, 2, 3, or 4.")