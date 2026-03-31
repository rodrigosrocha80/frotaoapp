import bcrypt
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db import get_db
from app.deps import require_roles
from app.models import PerfilUsuario, Usuario
from app.schemas import UsuarioCreate, UsuarioOut, UsuarioUpdate

router = APIRouter(prefix="/usuarios", tags=["usuarios"])


@router.get("", response_model=list[UsuarioOut])
def list_usuarios(
    db: Session = Depends(get_db),
    _=Depends(require_roles(PerfilUsuario.ADMIN)),
):
    """Listar todos os usuários (apenas admin)"""
    return db.scalars(select(Usuario).order_by(Usuario.nome)).all()


@router.get("/{usuario_id}", response_model=UsuarioOut)
def get_usuario(
    usuario_id: int,
    db: Session = Depends(get_db),
    _=Depends(require_roles(PerfilUsuario.ADMIN)),
):
    """Obter detalhes de um usuário específico (apenas admin)"""
    usuario = db.get(Usuario, usuario_id)
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    return usuario


@router.post("", response_model=UsuarioOut)
def create_usuario(
    usuario_data: UsuarioCreate,
    db: Session = Depends(get_db),
    _=Depends(require_roles(PerfilUsuario.ADMIN)),
):
    """Criar um novo usuário (apenas admin)"""
    # Normalizar e-mail para manter consistência com Supabase/Auth
    email_normalizado = usuario_data.email.strip().lower()

    # Validar unicidade do email (case-insensitive)
    if db.scalar(select(Usuario).where(func.lower(Usuario.email) == email_normalizado)):
        raise HTTPException(status_code=400, detail="Email já existe")

    # Hash da senha
    senha_hash = bcrypt.hashpw(usuario_data.senha.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

    usuario = Usuario(
        nome=usuario_data.nome,
        email=email_normalizado,
        perfil=usuario_data.perfil,
        senha_hash=senha_hash,
        ativo=True
    )
    db.add(usuario)
    db.commit()
    db.refresh(usuario)
    return usuario


@router.put("/{usuario_id}", response_model=UsuarioOut)
def update_usuario(
    usuario_id: int,
    usuario_data: UsuarioUpdate,
    db: Session = Depends(get_db),
    _=Depends(require_roles(PerfilUsuario.ADMIN)),
):
    """Atualizar um usuário existente (apenas admin)"""
    usuario = db.get(Usuario, usuario_id)
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")

    # Atualizar campos
    updates = usuario_data.model_dump(exclude_unset=True)

    # Normalizar e validar unicidade do email em atualização (case-insensitive)
    if "email" in updates and updates["email"] is not None:
        email_normalizado = updates["email"].strip().lower()
        existing = db.scalar(
            select(Usuario).where(
                func.lower(Usuario.email) == email_normalizado,
                Usuario.id != usuario_id
            )
        )
        if existing:
            raise HTTPException(status_code=400, detail="Email já existe")
        updates["email"] = email_normalizado
    if "senha" in updates:
        updates["senha_hash"] = bcrypt.hashpw(updates["senha"].encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        del updates["senha"]

    for field, value in updates.items():
        setattr(usuario, field, value)

    db.commit()
    db.refresh(usuario)
    return usuario


@router.delete("/{usuario_id}")
def delete_usuario(
    usuario_id: int,
    db: Session = Depends(get_db),
    _=Depends(require_roles(PerfilUsuario.ADMIN)),
):
    """Deletar um usuário (apenas admin)"""
    usuario = db.get(Usuario, usuario_id)
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")

    # Não permitir deletar o próprio usuário
    current_user = db.query(Usuario).filter(Usuario.supabase_user_id == usuario.supabase_user_id).first()
    if current_user and current_user.id == usuario_id:
        raise HTTPException(status_code=400, detail="Não é possível deletar o próprio usuário")

    db.delete(usuario)
    db.commit()
    return {"message": "Usuário deletado com sucesso"}
