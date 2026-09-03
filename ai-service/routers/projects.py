from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import models
from db import get_db
from deps import get_current_user
from schemas import ProjectCreate, ProjectOut

router = APIRouter(prefix="/projects", tags=["projects"])


@router.get("", response_model=list[ProjectOut])
def list_projects(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[models.Project]:
    return (
        db.query(models.Project)
        .filter(models.Project.owner_id == current_user.id)
        .order_by(models.Project.name)
        .all()
    )


@router.post("", response_model=ProjectOut)
def create_project(
    body: ProjectCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> models.Project:
    name = body.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="nom de projet requis")
    project = models.Project(owner_id=current_user.id, name=name)
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


@router.delete("/{project_id}")
def delete_project(
    project_id: str,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict[str, bool]:
    """Supprime un projet et detache les reunions qui y etaient rattachees
    (les reunions elles-memes ne sont jamais touchees par cette suppression)."""
    project = (
        db.query(models.Project)
        .filter(models.Project.id == project_id, models.Project.owner_id == current_user.id)
        .first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="projet introuvable")

    db.query(models.Meeting).filter(models.Meeting.project_id == project_id).update(
        {"project_id": None}
    )
    db.delete(project)
    db.commit()
    return {"ok": True}
