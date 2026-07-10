from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from database import Post

engine = create_engine('sqlite:///backend/gridhub.db')
Session = sessionmaker(bind=engine)
db = Session()
post = db.query(Post).order_by(Post.id.desc()).first()
print(f"Post id: {post.id if post else 'None'}")
