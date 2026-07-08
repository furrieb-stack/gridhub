from sqlalchemy import create_engine, Column, Integer, String, DateTime, Boolean, Text, ForeignKey, inspect, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from sqlalchemy.dialects.postgresql import JSONB
from datetime import datetime, timezone
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# //User model
class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(30), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=True)
    
    display_name = Column(String(50), nullable=True)
    avatar_url = Column(String(500), nullable=True)
    banner_url = Column(String(500), nullable=True)
    bio = Column(Text, nullable=True)
    
    oauth_provider = Column(String(20), nullable=True)
    oauth_id = Column(String(100), nullable=True)
    oauth_setup_complete = Column(Boolean, default=False)
    
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    is_admin = Column(Boolean, default=False)
    is_mod = Column(Boolean, default=False)
    is_banned = Column(Boolean, default=False)
    is_private = Column(Boolean, default=False)
    privacy_settings = Column(Text, nullable=True)
    
    banned_at = Column(DateTime, nullable=True)
    ban_reason = Column(String(500), nullable=True)
    ban_ip = Column(String(45), nullable=True)
    soft_ban_data = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=datetime.now(timezone.utc), onupdate=datetime.now(timezone.utc))
    
    posts = relationship("Post", back_populates="author", cascade="all, delete-orphan")
    comments = relationship("Comment", back_populates="author", cascade="all, delete-orphan")
    subgrids = relationship("Subgrid", back_populates="owner", cascade="all, delete-orphan")
    karma = relationship("Karma", back_populates="user", cascade="all, delete-orphan", uselist=False)
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")

# //Subgrid model
class Subgrid(Base):
    __tablename__ = "subgrids"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, index=True, nullable=False)
    display_name = Column(String(100), nullable=True)
    description = Column(Text, nullable=True)
    avatar_url = Column(String(500), nullable=True)
    banner_url = Column(String(500), nullable=True)
    is_verified = Column(Boolean, default=False)
    is_nsfw = Column(Boolean, default=False)
    
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=datetime.now(timezone.utc), onupdate=datetime.now(timezone.utc))
    
    owner = relationship("User", back_populates="subgrids")
    posts = relationship("Post", back_populates="subgrid", cascade="all, delete-orphan")
    subscribers = relationship("SubgridSubscription", back_populates="subgrid", cascade="all, delete-orphan")
    moderators = relationship("SubgridModerator", back_populates="subgrid", cascade="all, delete-orphan")
    flairs = relationship("Flair", back_populates="subgrid", cascade="all, delete-orphan")

# //Subgrid moderator
class SubgridModerator(Base):
    __tablename__ = "subgrid_moderators"
    
    id = Column(Integer, primary_key=True, index=True)
    subgrid_id = Column(Integer, ForeignKey("subgrids.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    added_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.now(timezone.utc))
    
    subgrid = relationship("Subgrid", back_populates="moderators")
    user = relationship("User", foreign_keys=[user_id])
    adder = relationship("User", foreign_keys=[added_by])

# //Subgrid subscription
class SubgridSubscription(Base):
    __tablename__ = "subgrid_subscriptions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    subgrid_id = Column(Integer, ForeignKey("subgrids.id"), nullable=False)
    subscribed_at = Column(DateTime, default=datetime.now(timezone.utc))
    
    user = relationship("User")
    subgrid = relationship("Subgrid", back_populates="subscribers")

# //Flair
class Flair(Base):
    __tablename__ = "flairs"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(30), nullable=False)
    color = Column(String(7), nullable=True)
    subgrid_id = Column(Integer, ForeignKey("subgrids.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.now(timezone.utc))
    
    subgrid = relationship("Subgrid", back_populates="flairs")
    posts = relationship("Post", back_populates="flair")

# //Post model
class Post(Base):
    __tablename__ = "posts"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(100), nullable=True)
    content = Column(Text, nullable=False)
    
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    subgrid_id = Column(Integer, ForeignKey("subgrids.id"), nullable=True)
    flair_id = Column(Integer, ForeignKey("flairs.id"), nullable=True)
    
    upvotes = Column(Integer, default=0)
    downvotes = Column(Integer, default=0)
    score = Column(Integer, default=0)
    share_count = Column(Integer, default=0)
    is_pinned = Column(Boolean, default=False)
    
    created_at = Column(DateTime, default=datetime.now(timezone.utc))
    updated_at = Column(DateTime, nullable=True)
    
    author = relationship("User", back_populates="posts")
    subgrid = relationship("Subgrid", back_populates="posts")
    flair = relationship("Flair", back_populates="posts")
    comments = relationship("Comment", back_populates="post", cascade="all, delete-orphan")
    votes = relationship("Vote", back_populates="post", cascade="all, delete-orphan")
    media = relationship("PostMedia", back_populates="post", cascade="all, delete-orphan")

# //Post media
class PostMedia(Base):
    __tablename__ = "post_media"
    
    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("posts.id"), nullable=True)
    url = Column(String(500), nullable=False)
    media_type = Column(String(20), nullable=False)
    uploaded_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.now(timezone.utc))
    
    post = relationship("Post", back_populates="media")
    uploader = relationship("User")

# //Comment model
class Comment(Base):
    __tablename__ = "comments"
    
    id = Column(Integer, primary_key=True, index=True)
    content = Column(Text, nullable=False)
    
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    post_id = Column(Integer, ForeignKey("posts.id"), nullable=False)
    parent_id = Column(Integer, ForeignKey("comments.id"), nullable=True)
    
    upvotes = Column(Integer, default=0)
    downvotes = Column(Integer, default=0)
    score = Column(Integer, default=0)
    
    created_at = Column(DateTime, default=datetime.now(timezone.utc))
    updated_at = Column(DateTime, nullable=True)
    deleted_at = Column(DateTime, nullable=True)
    
    author = relationship("User", back_populates="comments")
    post = relationship("Post", back_populates="comments")
    parent = relationship("Comment", remote_side=[id], backref="replies")
    votes = relationship("Vote", back_populates="comment", cascade="all, delete-orphan")

# //Votes
class Vote(Base):
    __tablename__ = "votes"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    post_id = Column(Integer, ForeignKey("posts.id"), nullable=True)
    comment_id = Column(Integer, ForeignKey("comments.id"), nullable=True)
    value = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=datetime.now(timezone.utc))
    
    user = relationship("User")
    post = relationship("Post", back_populates="votes")
    comment = relationship("Comment", back_populates="votes")

# //Karma
class Karma(Base):
    __tablename__ = "karma"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    total_score = Column(Integer, default=0)
    post_karma = Column(Integer, default=0)
    comment_karma = Column(Integer, default=0)
    updated_at = Column(DateTime, default=datetime.now(timezone.utc), onupdate=datetime.now(timezone.utc))
    
    user = relationship("User", back_populates="karma")

# //Login attempts
class LoginAttempt(Base):
    __tablename__ = "login_attempts"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(30), nullable=False)
    ip_address = Column(String(45), nullable=False)
    success = Column(Boolean, default=False)
    attempted_at = Column(DateTime, default=datetime.now(timezone.utc))

# //Notification
class Notification(Base):
    __tablename__ = "notifications"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    type = Column(String(50), nullable=False)
    data = Column(JSONB, nullable=True)
    read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.now(timezone.utc))
    
    user = relationship("User", back_populates="notifications")

# //Story model
class Story(Base):
    __tablename__ = "stories"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    media_url = Column(String(500), nullable=False)
    media_type = Column(String(20), default="image")
    created_at = Column(DateTime, default=datetime.now(timezone.utc))
    expires_at = Column(DateTime, nullable=False)

    user = relationship("User")
    likes = relationship("StoryLike", back_populates="story", cascade="all, delete-orphan")

class StoryLike(Base):
    __tablename__ = "story_likes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    story_id = Column(Integer, ForeignKey("stories.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.now(timezone.utc))

    user = relationship("User", foreign_keys=[user_id])
    story = relationship("Story", back_populates="likes")

# //WebSocket connections tracking
class WebSocketConnection(Base):
    __tablename__ = "websocket_connections"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    connected_at = Column(DateTime, default=datetime.now(timezone.utc))
    disconnected_at = Column(DateTime, nullable=True)
    ip_address = Column(String(45), nullable=True)
    
    user = relationship("User")

# //Report
# //Post view tracking (1 view per user per day)
class PostView(Base):
    __tablename__ = "post_views"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    post_id = Column(Integer, ForeignKey("posts.id"), nullable=False)
    viewed_at = Column(DateTime, default=datetime.now(timezone.utc))
    
    user = relationship("User")
    post = relationship("Post")

# //Follow/Subscription
class Follow(Base):
    __tablename__ = "follows"
    
    id = Column(Integer, primary_key=True, index=True)
    follower_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    followed_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.now(timezone.utc))
    
    follower = relationship("User", foreign_keys=[follower_id])
    followed = relationship("User", foreign_keys=[followed_id])

# //SavedPost
class SavedPost(Base):
    __tablename__ = "saved_posts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    post_id = Column(Integer, ForeignKey("posts.id"), nullable=False)
    saved_at = Column(DateTime, default=datetime.now(timezone.utc))

    user = relationship("User", foreign_keys=[user_id])
    post = relationship("Post")

# //Hashtag
class Hashtag(Base):
    __tablename__ = "hashtags"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, index=True, nullable=False)
    post_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.now(timezone.utc))

class PostHashtag(Base):
    __tablename__ = "post_hashtags"
    
    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("posts.id"), nullable=False)
    hashtag_id = Column(Integer, ForeignKey("hashtags.id"), nullable=False)
    
    post = relationship("Post")
    hashtag = relationship("Hashtag")

class Report(Base):
    __tablename__ = "reports"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    post_id = Column(Integer, ForeignKey("posts.id"), nullable=True)
    comment_id = Column(Integer, ForeignKey("comments.id"), nullable=True)
    reason = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)
    resolved = Column(Boolean, default=False)
    resolved_at = Column(DateTime, nullable=True)
    resolved_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.now(timezone.utc))
    
    user = relationship("User", foreign_keys=[user_id])
    resolver = relationship("User", foreign_keys=[resolved_by])

class VerificationRequest(Base):
    __tablename__ = "verification_requests"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(String(20), default="pending")
    created_at = Column(DateTime, default=datetime.now(timezone.utc))
    resolved_at = Column(DateTime, nullable=True)
    
    user = relationship("User")

def ensure_columns():
    inspector = inspect(engine)
    
    if not inspector.has_table('users'):
        return
    
    existing_columns = [col['name'] for col in inspector.get_columns('users')]
    
    required_columns = {
        'display_name': 'VARCHAR(50)',
        'avatar_url': 'VARCHAR(500)',
        'banner_url': 'VARCHAR(500)',
        'bio': 'TEXT',
        'is_verified': 'BOOLEAN DEFAULT FALSE',
        'is_admin': 'BOOLEAN DEFAULT FALSE',
        'is_mod': 'BOOLEAN DEFAULT FALSE',
        'is_banned': 'BOOLEAN DEFAULT FALSE',
        'banned_at': 'TIMESTAMP',
        'ban_reason': 'VARCHAR(500)',
        'ban_ip': 'VARCHAR(45)',
        'soft_ban_data': 'TEXT',
        'updated_at': 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
        'oauth_provider': 'VARCHAR(20)',
        'oauth_id': 'VARCHAR(100)',
        'oauth_setup_complete': 'BOOLEAN DEFAULT FALSE',
        'is_private': 'BOOLEAN DEFAULT FALSE',
        'privacy_settings': 'TEXT'
    }
    
    with engine.connect() as conn:
        for col_name, col_type in required_columns.items():
            if col_name not in existing_columns:
                try:
                    conn.execute(text(f'ALTER TABLE users ADD COLUMN IF NOT EXISTS {col_name} {col_type}'))
                    print(f"Added column: {col_name}")
                except Exception as e:
                    print(f"Could not add column {col_name}: {e}")
        conn.commit()

    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE users ALTER COLUMN hashed_password DROP NOT NULL"))
            conn.commit()
            print("Made hashed_password nullable")
        except Exception as e:
            conn.rollback()

    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE post_media ALTER COLUMN post_id DROP NOT NULL"))
            conn.commit()
            print("Made post_media.post_id nullable")
        except Exception as e:
            conn.rollback()
            
    if inspector.has_table('posts'):
        existing_columns = [col['name'] for col in inspector.get_columns('posts')]
        post_columns = {
            'subgrid_id': 'INTEGER REFERENCES subgrids(id)',
            'flair_id': 'INTEGER REFERENCES flairs(id)',
            'upvotes': 'INTEGER DEFAULT 0',
            'downvotes': 'INTEGER DEFAULT 0',
            'score': 'INTEGER DEFAULT 0',
            'is_pinned': 'BOOLEAN DEFAULT FALSE'
        }
        
        with engine.connect() as conn:
            for col_name, col_type in post_columns.items():
                if col_name not in existing_columns:
                    try:
                        conn.execute(text(f'ALTER TABLE posts ADD COLUMN IF NOT EXISTS {col_name} {col_type}'))
                        print(f"Added column: {col_name} to posts")
                    except Exception as e:
                        print(f"Could not add column {col_name} to posts: {e}")
            conn.commit()
    
    if inspector.has_table('comments'):
        existing_columns = [col['name'] for col in inspector.get_columns('comments')]
        comment_columns = {
            'parent_id': 'INTEGER REFERENCES comments(id)',
            'upvotes': 'INTEGER DEFAULT 0',
            'downvotes': 'INTEGER DEFAULT 0',
            'score': 'INTEGER DEFAULT 0',
            'deleted_at': 'TIMESTAMP'
        }
        
        with engine.connect() as conn:
            for col_name, col_type in comment_columns.items():
                if col_name not in existing_columns:
                    try:
                        conn.execute(text(f'ALTER TABLE comments ADD COLUMN IF NOT EXISTS {col_name} {col_type}'))
                        print(f"Added column: {col_name} to comments")
                    except Exception as e:
                        print(f"Could not add column {col_name} to comments: {e}")
            conn.commit()

    if inspector.has_table('stories'):
        existing_columns = [col['name'] for col in inspector.get_columns('stories')]
        story_columns = {
            'expires_at': 'TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP + INTERVAL \'24 hours\'',
        }

        with engine.connect() as conn:
            for col_name, col_type in story_columns.items():
                if col_name not in existing_columns:
                    try:
                        conn.execute(text(f'ALTER TABLE stories ADD COLUMN IF NOT EXISTS {col_name} {col_type}'))
                        print(f"Added column: {col_name} to stories")
                    except Exception as e:
                        print(f"Could not add column {col_name} to stories: {e}")
            conn.commit()

# //Create all tables
def create_tables():
    Base.metadata.create_all(bind=engine)
    ensure_columns()
    print("Database schema is up to date")

# //Database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()