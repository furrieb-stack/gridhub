from fastapi import APIRouter

from app.api.auth import router as auth_router
from app.api.users import router as users_router
from app.api.posts import router as posts_router
from app.api.comments import router as comments_router
from app.api.subgrids import router as subgrids_router
from app.api.flairs import router as flairs_router
from app.api.notifications import router as notifications_router
from app.api.feed import router as feed_router
from app.api.admin import router as admin_router
from app.api.reports import router as reports_router
from app.api.search import router as search_router
from app.api.upload import router as upload_router
from app.api.health import router as health_router
from app.api.karma import router as karma_router
from app.api.stories import router as stories_router
from app.api.oauth import router as oauth_router
from app.api.top import router as top_router
from app.api.push import router as push_router
from app.api.metadata import router as metadata_router

api_router = APIRouter()

api_router.include_router(auth_router)
api_router.include_router(oauth_router)
api_router.include_router(users_router)
api_router.include_router(posts_router)
api_router.include_router(comments_router)
api_router.include_router(subgrids_router)
api_router.include_router(flairs_router)
api_router.include_router(notifications_router)
api_router.include_router(feed_router)
api_router.include_router(admin_router)
api_router.include_router(reports_router)
api_router.include_router(search_router)
api_router.include_router(upload_router)
api_router.include_router(health_router)
api_router.include_router(karma_router)
api_router.include_router(stories_router)
api_router.include_router(top_router)
api_router.include_router(push_router)
api_router.include_router(metadata_router)
