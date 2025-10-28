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
import re
from functools import lru_cache

app = FastAPI(title="Enhanced Hybrid Recommender API with Preferences")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =======================================================
# CONFIG
# =======================================================
BASE_PATH = "./database"
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# =======================================================
# ENHANCED DEMOGRAPHIC KEYWORDS
# =======================================================
GENDER_KEYWORDS = {
    "male": ["men", "boy", "male", "gentleman", "his", "men's", "man", "boys", "masculine", 
             "groom", "father", "dad", "brother", "husband", "suit", "beard", "shaving",
             "cologne", "boxers", "briefs", "workboot", "tool", "grill", "sports", "fitness"],
    
    "female": ["women", "girl", "female", "lady", "her", "women's", "woman", "girls", "feminine",
               "bride", "mother", "mom", "sister", "wife", "dress", "makeup", "skincare",
               "perfume", "lingerie", "bra", "heels", "handbag", "purse", "jewelry", "nail"]
}

AGE_GROUP_KEYWORDS = {
    "youth": ["toy", "game", "lego", "comic", "art", "novel", "kids", "child", "children"],
    "young_adult": ["college", "study", "fashion", "novel", "career", "romance", "dating"],
    "adult": ["work", "office", "business", "investment", "management", "home", "family"],
    "senior": ["retirement", "pension", "grandparent", "elderly", "senior", "arthritis"]
}

OCCUPATION_KEYWORDS = {
    "student": ["book", "pen", "study", "notebook", "art", "novel", "textbook", "education"],
    "professional": ["laptop", "office", "business", "management", "finance", "career"],
    "artist": ["art", "painting", "sketch", "novel", "creative", "canvas", "easel", "design"],
    "engineer": ["technology", "software", "hardware", "coding", "programming", "computer"],
    "healthcare": ["medical", "health", "hospital", "clinic", "doctor", "nurse", "patient"],
    "teacher": ["education", "classroom", "lesson", "curriculum", "student", "learning"],
    "entrepreneur": ["startup", "business", "venture", "innovation", "funding", "investor"]
}

PET_KEYWORDS = {
    "dog": ["dog", "puppy", "canine", "kennel", "leash", "collar", "dog-food", "dog-toy"],
    "cat": ["cat", "kitten", "feline", "litter", "scratch", "cat-food", "cat-toy", "cat-bed"]
}

GENDER_SETS = {gender: set(keywords) for gender, keywords in GENDER_KEYWORDS.items()}
PET_SETS = {pet: set(keywords) for pet, keywords in PET_KEYWORDS.items()}

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
# User Preference Tracker
# =======================================================
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
        with open(self.storage_file, "wb") as f:
            pickle.dump(dict(self.user_preferences), f)
    
    def save_demographics(self, user_id, demographics):
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
        if user_id in self.user_preferences and self.user_preferences[user_id].get('demographics'):
            return self.user_preferences[user_id]['demographics']
        return {}
    
    def record_click(self, user_id, product_info):
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
        
        if len(user_prefs['clicked_products']) > 50:
            user_prefs['clicked_products'] = user_prefs['clicked_products'][-50:]
        
        if product_info.get('category'):
            user_prefs['preferred_categories'][product_info['category']] += 1
        
        brand = self.extract_brand(product_info.get('title', ''))
        if brand:
            user_prefs['preferred_brands'][brand] += 1
        
        price = self.parse_price(product_info.get('price'))
        if price and price > 0:
            user_prefs['preferred_price_range'].append(price)
            if len(user_prefs['preferred_price_range']) > 20:
                user_prefs['preferred_price_range'] = user_prefs['preferred_price_range'][-20:]
        
        if product_info.get('seller_name'):
            user_prefs['preferred_sellers'][product_info['seller_name']] += 1
        
        rating = self.parse_rating(product_info.get('stars'))
        if rating:
            user_prefs['preferred_ratings'].append(rating)
            if len(user_prefs['preferred_ratings']) > 20:
                user_prefs['preferred_ratings'] = user_prefs['preferred_ratings'][-20:]
        
        self.update_pet_ownership(user_prefs, product_info)
        
        user_prefs['total_clicks'] += 1
        user_prefs['last_updated'] = datetime.datetime.now()
        
        self.save_preferences()
    
    def update_pet_ownership(self, user_prefs, product_info):
        title = product_info.get('title', '').lower()
        category = product_info.get('category', '').lower()
        
        for pet_type, keywords in PET_KEYWORDS.items():
            if any(keyword in title or keyword in category for keyword in keywords):
                user_prefs['pet_ownership'][pet_type] += 1
    
    def extract_brand(self, title):
        if not title:
            return ""
        common_brands = ['nike', 'adidas', 'apple', 'samsung', 'sony', 'lg', 'dell', 'hp']
        title_lower = title.lower()
        for brand in common_brands:
            if brand in title_lower:
                return brand
        return ""
    
    def parse_price(self, price):
        if not price or price in ['N/A', 0, '0', '0.0']:
            return None
        try:
            if isinstance(price, (int, float)):
                return float(price)
            price_str = str(price).replace('$', '').replace(',', '').strip()
            return float(price_str)
        except:
            return None
    
    def parse_rating(self, rating):
        if not rating or rating == 'N/A':
            return None
        try:
            return float(rating)
        except:
            return None
    
    def get_user_preferences(self, user_id):
        if user_id not in self.user_preferences:
            return None
        
        prefs = self.user_preferences[user_id]
        if prefs['total_clicks'] == 0:
            return None
        
        avg_price = np.mean(prefs['preferred_price_range']) if prefs['preferred_price_range'] else None
        avg_rating = np.mean(prefs['preferred_ratings']) if prefs['preferred_ratings'] else None
        
        price_range = None
        if prefs['preferred_price_range']:
            min_price = min(prefs['preferred_price_range'])
            max_price = max(prefs['preferred_price_range'])
            price_range = (min_price, max_price)
        
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
# Initialize Global Resources
# =======================================================
print("Loading model and data...")

# Load maps
maps_file = os.path.join(BASE_PATH, "map.pkl")
with open(maps_file, "rb") as f:
    maps = pickle.load(f)

user_map = maps.get("user_map", {})
item_map = maps.get("item_map", {})
num_users = max(len(user_map), 1)
num_items = len(item_map)
iidx_to_product_id = {v: k for k, v in item_map.items()}

# Load NCF model
model = NCF(num_users, num_items).to(DEVICE)
try:
    state_dict = torch.load(os.path.join(BASE_PATH, "ncf_model.pth"), map_location=DEVICE, weights_only=True)
except:
    state_dict = torch.load(os.path.join(BASE_PATH, "ncf_model.pth"), map_location=DEVICE)
model.load_state_dict(state_dict)
model.eval()

# Load product metadata
with open(os.path.join(BASE_PATH, "product_meta.json"), "r", encoding="utf-8") as f:
    product_data = json.load(f)

metadata_df = pd.DataFrame(product_data).drop_duplicates(subset="product_id")
metadata_df["product_id"] = metadata_df["product_id"].astype(str)
metadata_df["seller_name"] = metadata_df["seller_details"].apply(lambda x: x.get("seller_name") if isinstance(x, dict) else None)
metadata_df["seller_rating"] = metadata_df["seller_details"].apply(lambda x: x.get("seller_rating") if isinstance(x, dict) else None)
product_id_to_info = metadata_df.set_index("product_id").to_dict(orient="index")

# Load FAISS index and embeddings
faiss_index = faiss.read_index(os.path.join(BASE_PATH, "product_faiss.index"))
prod_emb = np.load(os.path.join(BASE_PATH, "prod_embeddings.npy"))
sbert = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")

# Initialize preference tracker
preference_tracker = UserPreferenceTracker()

print("Model and data loaded successfully!")

# =======================================================
# Helper Functions
# =======================================================
@lru_cache(maxsize=1000)
def cached_sbert_encode(text):
    return sbert.encode([text])

@lru_cache(maxsize=10000)
def process_text_cached(text: str) -> str:
    return str(text).lower().strip()

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

def batch_calculate_preference_scores(user_id, candidates):
    if not user_id or user_id not in preference_tracker.user_preferences or preference_tracker.user_preferences[user_id]['total_clicks'] == 0:
        return [np.random.uniform(0.1, 0.3) for _ in candidates]
    
    user_prefs = preference_tracker.user_preferences[user_id]
    scores = []
    
    for iidx in candidates:
        asin = iidx_to_product_id.get(iidx, f"ID_{iidx}")
        info = product_id_to_info.get(asin, {})
        
        score = 0.0
        
        product_category = info.get("category_name", "")
        if product_category and product_category in user_prefs['preferred_categories']:
            category_count = user_prefs['preferred_categories'][product_category]
            category_weight = category_count / user_prefs['total_clicks']
            score += category_weight * 0.5
        
        product_price = preference_tracker.parse_price(info.get("price"))
        if product_price and user_prefs['preferred_price_range']:
            avg_price = np.mean(user_prefs['preferred_price_range'])
            price_ratio = min(product_price, avg_price) / max(product_price, avg_price)
            price_score = price_ratio * 0.3
            score += price_score
        
        scores.append(min(score, 1.0))
    
    return scores

def calculate_suitability_score(title: str, category: str, user_profile: dict) -> int:
    title_lower = process_text_cached(title)
    category_lower = process_text_cached(category)
    
    score = 0
    
    user_gender = user_profile.get("gender")
    if user_gender in GENDER_SETS:
        gender_keywords = GENDER_SETS[user_gender]
        opposite_gender = "female" if user_gender == "male" else "male"
        opposite_keywords = GENDER_SETS.get(opposite_gender, set())
        
        if any(keyword in title_lower or keyword in category_lower for keyword in gender_keywords):
            score += 2
        
        if any(keyword in title_lower or keyword in category_lower for keyword in opposite_keywords):
            score -= 2
    
    age_group = user_profile.get("age_group")
    if age_group in AGE_GROUP_KEYWORDS:
        age_keywords = AGE_GROUP_KEYWORDS[age_group]
        if any(keyword in title_lower or keyword in category_lower for keyword in age_keywords):
            score += 1
    
    occupation = user_profile.get("occupation", "")
    if occupation and occupation in OCCUPATION_KEYWORDS:
        occ_keywords = OCCUPATION_KEYWORDS[occupation]
        if any(keyword in title_lower or keyword in category_lower for keyword in occ_keywords):
            score += 1
    
    pets = user_profile.get("pets", [])
    for pet in pets:
        if pet in PET_SETS:
            pet_keywords = PET_SETS[pet]
            if any(keyword in title_lower or keyword in category_lower for keyword in pet_keywords):
                score += 2
    
    return score

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

    preference_scores = batch_calculate_preference_scores(user_id_str, candidates)

    s_norm = normalize(search_scores)
    n_norm = normalize(ncf_scores)
    c_norm = normalize(content_sim)
    p_norm = normalize(preference_scores)

    final_scores = np.array(s_norm) * alphas[0] + np.array(n_norm) * alphas[1] + np.array(c_norm) * alphas[2] + np.array(p_norm) * alphas[3]

    ranked_indices = np.argsort(-final_scores)
    ranked = [(candidates[i], final_scores[i], search_scores[i], ncf_scores[i], content_sim[i], preference_scores[i]) 
              for i in ranked_indices]
    
    return ranked

def rerank_products(initial_recommendations, user_profile, user_id=None, query=None, top_k=10):
    filtered_recs = []
    query_text = process_text_cached(query) if query else ""
    
    if user_id:
        user_prefs = preference_tracker.get_user_preferences(user_id)
        if user_prefs and 'likely_pets' in user_prefs:
            user_profile['learned_pets'] = user_prefs['likely_pets']
    
    for rec in initial_recommendations:
        product_cat = process_text_cached(rec.get("category", ""))
        product_title = process_text_cached(rec.get("title", ""))

        if query_text and query_text not in product_title and query_text not in product_cat:
            continue

        all_pets = user_profile.get("pets", []) + user_profile.get("learned_pets", [])
        user_profile_with_pets = user_profile.copy()
        user_profile_with_pets["pets"] = list(set(all_pets))
        
        suitability = calculate_suitability_score(product_title, product_cat, user_profile_with_pets)
        
        preference_boost = rec.get("preference_score", 0) * 0.3
        rec["suitability_score"] = suitability
        rec["final_score"] = rec["initial_score"] + 0.2 * suitability + preference_boost
        filtered_recs.append(rec)

    reranked = sorted(filtered_recs, key=lambda x: x["final_score"], reverse=True)
    return reranked[:top_k]

def get_recommendations_safe(user_id=None, query=None, seed_item_idx=None, top_k=10, user_profile=None, alphas=(0.25, 0.25, 0.2, 0.3)):
    try:
        recommendations = rerank_for_user(user_id, query=query, seed_item_iidx=seed_item_idx, top_k=100, alphas=alphas)
        
        initial_recommendations = []
        for iidx, final, s, n, c, p in recommendations:
            asin = iidx_to_product_id.get(iidx, f"ID_{iidx}")
            info = product_id_to_info.get(asin, {})
            product_info = {
                "product_id": asin,
                "id": asin,
                "title": info.get("title", f"Product_{iidx}"),
                "initial_score": float(final),
                "category": info.get("category_name", "N/A"),
                "price": info.get("price", "N/A"),
                "stars": info.get("stars", "N/A"),
                "image_url": info.get("imgUrl", "N/A"),
                "imgUrl": info.get("imgUrl", "N/A"),
                "seller_name": info.get("seller_name", "N/A"),
                "seller_rating": info.get("seller_rating", "N/A"),
                "preference_score": float(p)
            }
            initial_recommendations.append(product_info)
        
        if user_profile:
            reranked_recs = rerank_products(initial_recommendations, user_profile, user_id=user_id, query=query, top_k=top_k)
        else:
            reranked_recs = initial_recommendations[:top_k]
        
        return reranked_recs
        
    except Exception as e:
        print(f"Error in get_recommendations_safe: {e}")
        import traceback
        traceback.print_exc()
        return []

# =======================================================
# Request/Response Models
# =======================================================
class UserProfile(BaseModel):
    gender: str
    age: int
    occupation: str
    pets: Optional[List[str]] = []

class UserDemographics(BaseModel):
    gender: str
    age: int
    occupation: str
    pets: Optional[List[str]] = []

class RecommendationRequest(BaseModel):
    user_id: Optional[str] = None
    query: Optional[str] = None
    seed_item_idx: Optional[int] = None
    top_k: int = 10
    user_profile: UserProfile
    alphas: tuple = (0.25, 0.25, 0.2, 0.3)

class ProductInteraction(BaseModel):
    user_id: str
    product_id: str
    title: str
    category: Optional[str] = None
    price: Optional[str] = None
    stars: Optional[str] = None
    seller_name: Optional[str] = None

class RecommendationResponse(BaseModel):
    recommendations: List[Dict]
    user_id: Optional[str]
    query: Optional[str]
    user_preferences: Optional[Dict] = None

class UserPreferencesResponse(BaseModel):
    user_id: str
    preferences: Optional[Dict]
    demographics: Optional[Dict]

# =======================================================
# API Endpoints
# =======================================================
@app.get("/")
async def root():
    return {
        "message": "Enhanced Hybrid Recommender API with Preference Tracking",
        "status": "running",
        "version": "2.0",
        "features": [
            "Demographic-based recommendations",
            "Pet ownership support",
            "User preference learning",
            "Click tracking",
            "Personalized re-ranking"
        ]
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "model_loaded": model is not None,
        "num_products": len(item_map),
        "num_users": len(user_map),
        "preference_tracking": True
    }

@app.get("/stats")
async def get_stats():
    tracked_users = len(preference_tracker.user_preferences)
    total_interactions = sum(
        prefs.get('total_clicks', 0)
        for prefs in preference_tracker.user_preferences.values()
    )
    
    return {
        "total_users": len(user_map),
        "total_products": len(item_map),
        "embedding_dim": prod_emb.shape[1],
        "tracked_users": tracked_users,
        "total_interactions": total_interactions
    }

@app.post("/recommend", response_model=RecommendationResponse)
async def get_recommendations(request: RecommendationRequest):
    try:
        age = request.user_profile.age
        age_group = "youth" if age < 20 else "young_adult" if age < 30 else "adult" if age < 65 else "senior"
        
        user_profile = {
            "gender": request.user_profile.gender.lower(),
            "age_group": age_group,
            "occupation": request.user_profile.occupation.lower(),
            "pets": [pet.lower() for pet in request.user_profile.pets] if request.user_profile.pets else [],
            "age": age
        }
        
        if request.user_id:
            preference_tracker.save_demographics(request.user_id, user_profile)
        
        recommendations = get_recommendations_safe(
            user_id=request.user_id,
            query=request.query,
            seed_item_idx=request.seed_item_idx,
            top_k=request.top_k,
            user_profile=user_profile,
            alphas=request.alphas
        )
        
        if not recommendations:
            return RecommendationResponse(
                recommendations=[],
                user_id=request.user_id,
                query=request.query,
                user_preferences=None
            )
        
        validated_recommendations = []
        for rec in recommendations:
            validated_rec = {
                "id": rec.get("product_id", rec.get("id", "N/A")),
                "title": rec.get("title", "N/A"),
                "category": rec.get("category", "N/A"),
                "price": rec.get("price", "N/A"),
                "stars": rec.get("stars", "N/A"),
                "imgUrl": rec.get("image_url", rec.get("imgUrl", "N/A")),
                "seller_name": rec.get("seller_name", "N/A"),
                "seller_rating": rec.get("seller_rating", "N/A"),
                "initial_score": float(rec.get("initial_score", 0)),
                "final_score": float(rec.get("final_score", rec.get("initial_score", 0))),
                "preference_score": float(rec.get("preference_score", 0))
            }
            validated_recommendations.append(validated_rec)
        
        user_prefs = None
        if request.user_id:
            try:
                user_prefs = preference_tracker.get_user_preferences(request.user_id)
            except Exception as e:
                print(f"Warning: Could not get user preferences: {e}")
        
        return RecommendationResponse(
            recommendations=validated_recommendations,
            user_id=request.user_id,
            query=request.query,
            user_preferences=user_prefs
        )
        
    except Exception as e:
        print(f"Error in get_recommendations: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/user/demographics")
async def save_user_demographics(user_id: str, demographics: UserDemographics):
    try:
        age_group = "youth" if demographics.age < 20 else "young_adult" if demographics.age < 30 else "adult" if demographics.age < 65 else "senior"
        
        user_profile = {
            "gender": demographics.gender.lower(),
            "age_group": age_group,
            "occupation": demographics.occupation.lower(),
            "pets": [pet.lower() for pet in demographics.pets] if demographics.pets else [],
            "age": demographics.age
        }
        
        preference_tracker.save_demographics(user_id, user_profile)
        
        return {
            "status": "success",
            "message": "Demographics saved successfully",
            "user_id": user_id,
            "demographics": user_profile
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/user/preferences/{user_id}", response_model=UserPreferencesResponse)
async def get_user_preferences(user_id: str):
    try:
        demographics = preference_tracker.get_demographics(user_id)
        preferences = preference_tracker.get_user_preferences(user_id)
        
        return UserPreferencesResponse(
            user_id=user_id,
            preferences=preferences,
            demographics=demographics
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/user/interaction")
async def record_interaction(interaction: ProductInteraction):
    try:
        product_info = {
            'id': interaction.product_id,
            'title': interaction.title,
            'category': interaction.category if interaction.category else "N/A",
            'price': interaction.price if interaction.price else "N/A",
            'stars': interaction.stars if interaction.stars else "N/A",
            'seller_name': interaction.seller_name if interaction.seller_name else "N/A"
        }
        
        preference_tracker.record_click(interaction.user_id, product_info)
        
        updated_prefs = None
        try:
            updated_prefs = preference_tracker.get_user_preferences(interaction.user_id)
        except Exception as e:
            print(f"Warning: Could not retrieve updated preferences: {e}")
        
        return {
            "status": "success",
            "message": "Interaction recorded successfully",
            "user_id": interaction.user_id,
            "product_id": interaction.product_id,
            "updated_preferences": updated_prefs
        }
    except Exception as e:
        print(f"Error in record_interaction: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/product/{product_id}")
async def get_product(product_id: str):
    info = product_id_to_info.get(product_id)
    if not info:
        raise HTTPException(status_code=404, detail="Product not found")
    return info

@app.get("/products/search")
async def search_products(
    query: str,
    limit: int = 20,
    category: Optional[str] = None,
    min_rating: Optional[float] = None,
    max_price: Optional[float] = None
):
    try:
        q_emb = cached_sbert_encode(query)
        faiss.normalize_L2(q_emb)
        
        D, I = faiss_index.search(q_emb.astype("float32"), limit * 2)
        candidates = I[0].tolist()
        scores = D[0].tolist()
        
        results = []
        for iidx, score in zip(candidates, scores):
            try:
                if not isinstance(iidx, (int, np.integer)):
                    continue
                
                iidx = int(iidx)
                
                if iidx < 0 or iidx >= len(iidx_to_product_id):
                    continue
                
                asin = iidx_to_product_id.get(iidx)
                if asin is None:
                    continue
                
                info = product_id_to_info.get(asin, {})
                
                if category:
                    prod_cat = info.get("category_name", "")
                    if not prod_cat or category.lower() not in prod_cat.lower():
                        continue
                
                if min_rating:
                    try:
                        rating = float(info.get("stars", 0))
                        if rating < min_rating:
                            continue
                    except (ValueError, TypeError):
                        continue
                
                if max_price:
                    try:
                        price = preference_tracker.parse_price(info.get("price"))
                        if price and price > max_price:
                            continue
                    except Exception:
                        pass
                
                results.append({
                    "id": asin,
                    "title": info.get("title", f"Product_{iidx}"),
                    "category": info.get("category_name", "N/A"),
                    "price": info.get("price", "N/A"),
                    "stars": info.get("stars", "N/A"),
                    "imgUrl": info.get("imgUrl", "N/A"),
                    "seller_name": info.get("seller_name", "N/A"),
                    "seller_rating": info.get("seller_rating", "N/A"),
                    "relevance_score": float(score)
                })
                
                if len(results) >= limit:
                    break
                    
            except Exception as e:
                print(f"Error processing search result {iidx}: {e}")
                continue
        
        return {
            "success": True,
            "products": results,
            "total": len(results),
            "query": query
        }
        
    except Exception as e:
        print(f"Error in search_products: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/user/preferences/{user_id}")
async def clear_user_preferences(user_id: str):
    try:
        if user_id in preference_tracker.user_preferences:
            del preference_tracker.user_preferences[user_id]
            preference_tracker.save_preferences()
            return {
                "status": "success",
                "message": f"Preferences cleared for user {user_id}"
            }
        else:
            raise HTTPException(status_code=404, detail="User not found")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/user/debug/{user_id}")
async def debug_user(user_id: str):
    try:
        if user_id not in preference_tracker.user_preferences:
            raise HTTPException(status_code=404, detail="User not found")
        
        user_prefs = preference_tracker.user_preferences[user_id]
        
        price_info = None
        if user_prefs.get('preferred_price_range'):
            price_range = user_prefs['preferred_price_range']
            price_info = {
                "min": min(price_range),
                "max": max(price_range),
                "avg": sum(price_range) / len(price_range)
            }
        
        return {
            "user_id": user_id,
            "demographics": user_prefs.get('demographics', {}),
            "total_clicks": user_prefs.get('total_clicks', 0),
            "last_updated": str(user_prefs.get('last_updated')),
            "clicked_products": [
                {
                    "product_id": p.get('product_id'),
                    "title": p.get('title'),
                    "category": p.get('category'),
                    "timestamp": str(p.get('timestamp'))
                }
                for p in user_prefs.get('clicked_products', [])[-10:]
            ],
            "preferred_categories": dict(user_prefs.get('preferred_categories', {})),
            "preferred_brands": dict(user_prefs.get('preferred_brands', {})),
            "preferred_sellers": dict(user_prefs.get('preferred_sellers', {})),
            "pet_ownership": dict(user_prefs.get('pet_ownership', {})),
            "price_range": price_info
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)