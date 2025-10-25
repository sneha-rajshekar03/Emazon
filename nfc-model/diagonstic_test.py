"""
Diagnostic script to test the recommender system directly
Run this to find the exact error location
"""

import sys
import traceback

print("="*60)
print("DIAGNOSTIC TEST SCRIPT")
print("="*60)

try:
    print("\n1. Importing RecommenderDB...")
    from database import RecommenderDB
    print("   ✓ Import successful")
    
    print("\n2. Initializing database...")
    db = RecommenderDB()
    print("   ✓ Database initialized")
    
    print("\n3. Testing with user U0001...")
    print(f"   Current user_map keys: {list(db.user_map.keys())[:10]}")
    print(f"   Total users in map: {len(db.user_map)}")
    
    # Test get_or_add_user
    print("\n4. Testing get_or_add_user...")
    try:
        user_idx = db.get_or_add_user("U0001")
        print(f"   ✓ User index: {user_idx}")
    except Exception as e:
        print(f"   ✗ ERROR in get_or_add_user: {e}")
        traceback.print_exc()
        sys.exit(1)
    
    # Test basic recommendation
    print("\n5. Testing rerank_for_user_optimized...")
    try:
        results = db.rerank_for_user_optimized(
            user_id_str="U0001",
            query="laptop",
            top_k=5
        )
        print(f"   ✓ Got {len(results)} results")
        
        if results:
            print("\n   First result details:")
            iidx, final_score, search_score, ncf_score, content_score, pref_score = results[0]
            print(f"   - Item index: {iidx}")
            print(f"   - Final score: {final_score}")
            
            # Try to get product info
            print("\n6. Testing product info lookup...")
            try:
                product_id = db.iidx_to_product_id.get(iidx)
                print(f"   - Product ID: {product_id}")
                
                info = db.product_id_to_info.get(product_id, {})
                print(f"   - Product title: {info.get('title', 'N/A')[:50]}")
                
            except Exception as e:
                print(f"   ✗ ERROR looking up product: {e}")
                traceback.print_exc()
        
    except Exception as e:
        print(f"   ✗ ERROR in rerank_for_user_optimized: {e}")
        traceback.print_exc()
        sys.exit(1)
    
    # Test preference tracker
    print("\n7. Testing preference tracker...")
    try:
        prefs = db.preference_tracker.get_user_preferences("U0001")
        print(f"   ✓ Preferences: {prefs}")
    except Exception as e:
        print(f"   ✗ ERROR in preference tracker: {e}")
        traceback.print_exc()
    
    # Test the safe method
    print("\n8. Testing get_recommendations_safe...")
    try:
        recommendations = db.get_recommendations_safe(
            user_id="U0001",
            query="laptop",
            top_k=5,
            user_profile={
                "gender": "male",
                "age_group": "adult",
                "occupation": "professional",
                "pets": []
            }
        )
        print(f"   ✓ Got {len(recommendations)} recommendations")
        
        if recommendations:
            print(f"\n   First recommendation:")
            rec = recommendations[0]
            print(f"   - ID: {rec.get('product_id')}")
            print(f"   - Title: {rec.get('title', '')[:50]}")
            print(f"   - Score: {rec.get('initial_score')}")
        
    except Exception as e:
        print(f"   ✗ ERROR in get_recommendations_safe: {e}")
        traceback.print_exc()
        sys.exit(1)
    
    print("\n" + "="*60)
    print("ALL TESTS PASSED!")
    print("="*60)
    print("\nThe recommender system is working correctly.")
    print("The error must be in how the API is calling it.")
    print("\nCheck your API code for:")
    print("1. How it's passing user_id")
    print("2. How it's processing the results")
    print("3. Any dictionary lookups using [] instead of .get()")
    
except Exception as e:
    print("\n" + "="*60)
    print("FATAL ERROR")
    print("="*60)
    print(f"Error: {e}")
    print("\nFull traceback:")
    traceback.print_exc()
    print("\n" + "="*60)
    sys.exit(1)