"""Authentication routes: registration, login and account deletion."""

import os

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..core.config import settings
from ..core.database import get_db
from ..core.rate_limit import rate_limit_dependency
from ..core.security import create_access_token, get_current_user, hash_password, verify_password
from ..models import ClothingItem, User
from ..schemas import Token, UserCreate, UserOut

router = APIRouter(prefix="/api/auth", tags=["auth"])

MIN_PASSWORD_LENGTH = 8


@router.post(
    "/register",
    response_model=UserOut,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(rate_limit_dependency)],
)
def register(payload: UserCreate, db: Session = Depends(get_db)) -> User:
    """Create a new user account. 409 if the email already exists, 400 otherwise."""
    if len(payload.password) < MIN_PASSWORD_LENGTH:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Password must be at least {MIN_PASSWORD_LENGTH} characters",
        )

    existing = db.query(User).filter(User.email == payload.email).first()
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )

    user = User(email=payload.email, hashed_password=hash_password(payload.password))
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post(
    "/login",
    response_model=Token,
    dependencies=[Depends(rate_limit_dependency)],
)
def login(payload: UserCreate, db: Session = Depends(get_db)) -> Token:
    """Authenticate and issue a Bearer token. 401 on wrong credentials."""
    user = db.query(User).filter(User.email == payload.email).first()
    if user is None or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    return Token(access_token=create_access_token(user.id))


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
def delete_me(
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    """Delete the authenticated user's account and all associated data.

    Removes outfits, clothing items (including their image files on disk) and
    finally the user row itself. Cascades in the ORM delete the child rows.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        return None

    image_paths = [
        item.image_path
        for item in db.query(ClothingItem).filter(ClothingItem.user_id == user_id).all()
    ]

    db.delete(user)
    db.commit()

    for path in image_paths:
        full_path = os.path.join(settings.UPLOAD_DIR, path)
        if os.path.isfile(full_path):
            os.remove(full_path)

    return None
