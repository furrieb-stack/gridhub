from database import get_db, Post
from app.schemas.post import PostResponse

db = next(get_db())
post = db.query(Post).first()
if post:
    print(f"Post id: {post.id}")
    try:
        res = PostResponse.model_validate(post)
        print("Success")
    except Exception as e:
        print("Error:", e)
