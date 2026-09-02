"""Wardrobe routes: CRUD for the authenticated user's clothing items."""

from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, Response, UploadFile
from sqlalchemy.orm import Session

from ..core.database import get_db
from ..core.security import get_current_user
from ..models import ClothingItem
from ..schemas import ItemOut, ItemUpdate
from ..services import images

router = APIRouter(prefix="/api/wardrobe", tags=["wardrobe"])

VALID_CATEGORIES = {"oberteile", "unterteile", "kleider", "schuhe", "accessoires"}


def _check_upload_size(request: Request) -> None:
    """Reject an oversized upload before the multipart body is read."""
    images.validate_content_length(request.headers.get("content-length"))


def _get_owned_item(db: Session, item_id: int, user_id: int) -> ClothingItem | None:
    return (
        db.query(ClothingItem)
        .filter(ClothingItem.id == item_id, ClothingItem.user_id == user_id)
        .first()
    )


@router.get("/items", response_model=list[ItemOut])
def list_items(
    category: str | None = None,
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[ClothingItem]:
    query = db.query(ClothingItem).filter(ClothingItem.user_id == user_id)
    if category is not None:
        query = query.filter(ClothingItem.category == category)
    return query.all()


@router.post("/items", response_model=ItemOut, status_code=201)
async def create_item(
    user_id: int = Depends(get_current_user),
    _: None = Depends(_check_upload_size),
    name: str | None = Form(None),
    category: str | None = Form(None),
    image: UploadFile | None = File(None),
    db: Session = Depends(get_db),
) -> ClothingItem:
    if name is None or not name.strip():
        raise HTTPException(status_code=400, detail="name is required")
    if category is None or not category.strip():
        raise HTTPException(status_code=400, detail="category is required")
    if category not in VALID_CATEGORIES:
        raise HTTPException(status_code=400, detail="invalid category")
    if image is None:
        raise HTTPException(status_code=400, detail="image is required")

    filename = await images.save_image(image)

    item = ClothingItem(
        user_id=user_id,
        name=name.strip(),
        category=category,
        image_path=filename,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.patch("/items/{item_id}", response_model=ItemOut)
def update_item(
    item_id: int,
    payload: ItemUpdate,
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ClothingItem:
    item = _get_owned_item(db, item_id, user_id)
    if item is None:
        raise HTTPException(status_code=404, detail="Item not found")

    if payload.name is not None:
        if not payload.name.strip():
            raise HTTPException(status_code=400, detail="name must not be empty")
        item.name = payload.name.strip()
    if payload.category is not None:
        if payload.category not in VALID_CATEGORIES:
            raise HTTPException(status_code=400, detail="invalid category")
        item.category = payload.category

    db.commit()
    db.refresh(item)
    return item


@router.delete("/items/{item_id}", status_code=204)
def delete_item(
    item_id: int,
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Response:
    item = _get_owned_item(db, item_id, user_id)
    if item is None:
        raise HTTPException(status_code=404, detail="Item not found")

    filename = item.image_path
    db.delete(item)
    db.commit()
    images.delete_image_file(filename)
    return Response(status_code=204)
