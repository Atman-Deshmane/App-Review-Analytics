import json
import pandas as pd

def debug_clustering():
    with open("reviews_tagged.json", "r") as f:
        data = json.load(f)
    
    df = pd.DataFrame(data)
    
    # Get tags of the top review
    top_review = df.sort_values(by='thumbs_up_count', ascending=False).iloc[0]
    print(f"Top Review Tags: {top_review['tags']}")
    
    # Flatten all tags
    all_tags = []
    for tags in df['tags']:
        if isinstance(tags, list):
            all_tags.extend(tags)
    
    unique_tags = list(set(all_tags))
    print(f"Total Unique Tags: {len(unique_tags)}")
    print(f"Sample Tags: {unique_tags[:10]}")

if __name__ == "__main__":
    debug_clustering()
