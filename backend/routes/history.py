import logging
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel
from bson import ObjectId

from backend.utils.auth import get_current_user
from backend.database import db_manager, load_local_json, save_local_json

logger = logging.getLogger("leafguard.history")

router = APIRouter(prefix="/history", tags=["History"])


class BatchDeleteRequest(BaseModel):
    ids: List[str]


def _normalize_id(doc: Dict[str, Any]) -> Dict[str, Any]:
    item = dict(doc)
    if "_id" in item:
        item["id"] = str(item.pop("_id"))
    elif "id" not in item:
        item["id"] = f"{item.get('plant', 'scan')}-{item.get('created_at', '')}"
    return item


@router.get("")
@router.get("/")
async def get_history(
    limit: int = Query(50, ge=1, le=200),
    plant: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """
    Retrieve scan history strictly belonging to the current authenticated user.
    """
    user_id = current_user.get("email") or current_user.get("id")

    items: List[Dict[str, Any]] = []

    # 1. Fetch from MongoDB if available
    coll = db_manager.get_collection("predictions")
    if coll is not None:
        try:
            query: Dict[str, Any] = {"user_id": user_id}
            if plant:
                query["plant"] = {"$regex": plant, "$options": "i"}
            cursor = coll.find(query).sort("timestamp", -1).limit(limit)
            items = [_normalize_id(doc) for doc in list(cursor)]
        except Exception as e:
            logger.warning(f"MongoDB history query error: {e}")

    # 2. Fetch from local JSON store
    local_items = load_local_json("history_store.json")
    if isinstance(local_items, list):
        filtered_local = [
            _normalize_id(x) for x in local_items
            if x.get("user_id") == user_id
            and (not plant or plant.lower() in str(x.get("plant", "")).lower())
        ]
        seen = set(x.get("id") for x in items)
        for loc in filtered_local:
            if loc.get("id") not in seen:
                items.append(loc)
                seen.add(loc.get("id"))

    # Sort descending by created_at
    items.sort(key=lambda x: str(x.get("created_at") or ""), reverse=True)
    return {"history": items[:limit], "total": len(items)}


@router.get("/{item_id}")
async def get_history_item(
    item_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Retrieve details of a single scan record.
    Enforces authorization: users can only view their own records.
    """
    user_id = current_user.get("email") or current_user.get("id")

    # 1. Search in MongoDB
    coll = db_manager.get_collection("predictions")
    if coll is not None:
        try:
            query: Dict[str, Any] = {"user_id": user_id}
            if ObjectId.is_valid(item_id):
                query["_id"] = ObjectId(item_id)
            else:
                query["$or"] = [{"id": item_id}, {"_id": item_id}]

            doc = coll.find_one(query)
            if doc:
                return _normalize_id(doc)
        except Exception as e:
            logger.warning(f"MongoDB item query error: {e}")

    # 2. Search in local JSON store
    local_items = load_local_json("history_store.json")
    if isinstance(local_items, list):
        for item in local_items:
            if item.get("user_id") == user_id and (item.get("id") == item_id or str(item.get("_id")) == item_id):
                return _normalize_id(item)

    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Scan record not found or access denied.")


@router.delete("/{item_id}")
async def delete_history_item(
    item_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Delete a single scan record belonging to the authenticated user.
    """
    user_id = current_user.get("email") or current_user.get("id")
    deleted = False

    # 1. Delete from MongoDB
    coll = db_manager.get_collection("predictions")
    if coll is not None:
        try:
            if ObjectId.is_valid(item_id):
                res = coll.delete_one({"_id": ObjectId(item_id), "user_id": user_id})
            else:
                res = coll.delete_one({"$or": [{"id": item_id}, {"_id": item_id}], "user_id": user_id})
            if res.deleted_count > 0:
                deleted = True
        except Exception as e:
            logger.warning(f"MongoDB delete error: {e}")

    # 2. Delete from local JSON store
    local_items = load_local_json("history_store.json")
    if isinstance(local_items, list):
        updated = [x for x in local_items if not (x.get("user_id") == user_id and (x.get("id") == item_id or str(x.get("_id")) == item_id))]
        if len(updated) != len(local_items):
            deleted = True
            save_local_json("history_store.json", updated)

    return {"success": True, "deleted": deleted}


@router.post("/delete")
async def delete_history_batch(
    body: BatchDeleteRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Delete multiple scan records belonging to the authenticated user.
    """
    user_id = current_user.get("email") or current_user.get("id")
    deleted_count = 0

    # 1. MongoDB batch delete
    coll = db_manager.get_collection("predictions")
    if coll is not None:
        try:
            obj_ids = [ObjectId(tid) for tid in body.ids if ObjectId.is_valid(tid)]
            str_ids = [tid for tid in body.ids if not ObjectId.is_valid(tid)]
            query = {
                "user_id": user_id,
                "$or": [
                    {"_id": {"$in": obj_ids}},
                    {"id": {"$in": str_ids}}
                ]
            }
            res = coll.delete_many(query)
            deleted_count += res.deleted_count
        except Exception as e:
            logger.warning(f"MongoDB batch delete error: {e}")

    # 2. Local store batch delete
    local_items = load_local_json("history_store.json")
    if isinstance(local_items, list):
        id_set = set(body.ids)
        updated = [x for x in local_items if not (x.get("user_id") == user_id and (x.get("id") in id_set or str(x.get("_id")) in id_set))]
        deleted_local = len(local_items) - len(updated)
        if deleted_local > 0:
            save_local_json("history_store.json", updated)
            deleted_count = max(deleted_count, deleted_local)

    return {"success": True, "deleted_count": deleted_count}


@router.delete("")
@router.delete("/")
async def clear_all_history(current_user: dict = Depends(get_current_user)):
    """
    Clear all scan history records for the current authenticated user.
    """
    user_id = current_user.get("email") or current_user.get("id")

    # 1. Clear in MongoDB
    coll = db_manager.get_collection("predictions")
    if coll is not None:
        try:
            coll.delete_many({"user_id": user_id})
        except Exception as e:
            logger.warning(f"MongoDB clear history error: {e}")

    # 2. Clear in local store
    local_items = load_local_json("history_store.json")
    if isinstance(local_items, list):
        updated = [x for x in local_items if x.get("user_id") != user_id]
        save_local_json("history_store.json", updated)

    return {"success": True, "message": "All history records cleared successfully."}
