from app.schemas.post import PostCreate

try:
    p = PostCreate(content="test")
    print("Success:", p.model_dump())
except Exception as e:
    print("Error:", e)
