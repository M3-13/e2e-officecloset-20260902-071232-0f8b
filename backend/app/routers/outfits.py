"""Outfit routes: create, list, open, recombine and delete outfits.

Every route requires a valid JWT and verifies server-side that the requested
resource (outfit id, or the ``item_ids`` inside a create/update payload)
belongs to the authenticated user. A foreign or missing outfit id answers 404;
a foreign or missing ``item_id`` inside a payload answers 400.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, selectinload

from ..core.database import get_db
from ..core.security import get_current_user
from ..models import ClothingItem, Outfit, OutfitItem
from ..schemas import ItemOut, OutfitCreate, OutfitOut, OutfitUpdate

router = APIRouter(prefix="/api/outfits", tags=["outfits"])


def _owned_items(db: Session, user_id: int, item_ids: list[int]) -> list[ClothingItem]:
    """Return the clothing items for the given ids that the user owns.

    Raises 400 when any id is missing or belongs to another user, matching the
    ownership check for payload-supplied item ids.
    """
    unique_ids = list(dict.fromkeys(item_ids))
    items = (
        db.query(ClothingItem)
        .filter(ClothingItem.user_id == user_id, ClothingItem.id.in_(unique_ids))
        .all()
    )
    if len(items) != len(unique_ids):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="One or more item_ids are invalid",
        )
    return items


def _owned_outfit(db: Session, user_id: int, outfit_id: int) -> Outfit:
    """Return the outfit with the given id if the user owns it.

    A foreign or non-existent outfit id answers the same 404, so callers cannot
    distinguish between the two.
    """
    outfit = (
        db.query(Outfit)
        .options(selectinload(Outfit.items).selectinload(OutfitItem.item))
        .filter(Outfit.id == outfit_id, Outfit.user_id == user_id)
        .first()
    )
    if outfit is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Outfit not found")
    return outfit


def _serialize(outfit: Outfit) -> OutfitOut:
    items = [
        ItemOut(
            id=link.item.id,
            name=link.item.name,
            category=link.item.category,
            image_url=link.item.image_url,
        )
        for link in outfit.items
    ]
    return OutfitOut(id=outfit.id, name=outfit.name, items=items)


def _replace_items(outfit: Outfit, item_ids: list[int]) -> None:
    outfit.items.clear()
    for item_id in list(dict.fromkeys(item_ids)):
        outfit.items.append(OutfitItem(item_id=item_id))


@router.post("", response_model=OutfitOut, status_code=status.HTTP_201_CREATED)
def create_outfit(
    payload: OutfitCreate,
    db: Session = Depends(get_db),
    current_user: int = Depends(get_current_user),
) -> OutfitOut:
    _owned_items(db, current_user, payload.item_ids)
    outfit = Outfit(user_id=current_user, name=payload.name)
    _replace_items(outfit, payload.item_ids)
    db.add(outfit)
    db.commit()
    db.refresh(outfit)
    return _serialize(outfit)


@router.get("", response_model=list[OutfitOut])
def list_outfits(
    db: Session = Depends(get_db),
    current_user: int = Depends(get_current_user),
) -> list[OutfitOut]:
    outfits = (
        db.query(Outfit)
        .options(selectinload(Outfit.items).selectinload(OutfitItem.item))
        .filter(Outfit.user_id == current_user)
        .order_by(Outfit.id)
        .all()
    )
    return [_serialize(outfit) for outfit in outfits]


@router.get("/{outfit_id}", response_model=OutfitOut)
def get_outfit(
    outfit_id: int,
    db: Session = Depends(get_db),
    current_user: int = Depends(get_current_user),
) -> OutfitOut:
    outfit = _owned_outfit(db, current_user, outfit_id)
    return _serialize(outfit)


@router.patch("/{outfit_id}", response_model=OutfitOut)
def update_outfit(
    outfit_id: int,
    payload: OutfitUpdate,
    db: Session = Depends(get_db),
    current_user: int = Depends(get_current_user),
) -> OutfitOut:
    outfit = _owned_outfit(db, current_user, outfit_id)
    _owned_items(db, current_user, payload.item_ids)
    outfit.name = payload.name
    _replace_items(outfit, payload.item_ids)
    db.commit()
    db.refresh(outfit)
    return _serialize(outfit)


@router.delete("/{outfit_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_outfit(
    outfit_id: int,
    db: Session = Depends(get_db),
    current_user: int = Depends(get_current_user),
) -> None:
    outfit = _owned_outfit(db, current_user, outfit_id)
    db.delete(outfit)
    db.commit()
