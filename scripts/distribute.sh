#!/bin/bash
# ================================================
# Distribuir cambios de master a ramas de talleres
# Uso: ./scripts/distribute.sh [taller]
# Sin argumentos: distribuye a TODOS los talleres
# Con argumento:  distribuye solo al taller indicado
# ================================================
set -e

WORKSHOPS=("autogarage" "autosymas")

# Si se pasa un argumento, solo distribuir a ese taller
if [ -n "$1" ]; then
  WORKSHOPS=("$1")
fi

CURRENT_BRANCH=$(git branch --show-current)

echo "=== Distribuyendo master a talleres ==="
echo ""

git checkout master
git pull origin master

FAILED=()

for workshop in "${WORKSHOPS[@]}"; do
  BRANCH="deploy/$workshop"
  echo "--- $workshop ($BRANCH) ---"

  if ! git show-ref --verify --quiet "refs/heads/$BRANCH" && ! git show-ref --verify --quiet "refs/remotes/origin/$BRANCH"; then
    echo "  ERROR: La rama $BRANCH no existe. Saltando."
    FAILED+=("$workshop")
    continue
  fi

  git checkout "$BRANCH" 2>/dev/null || git checkout -b "$BRANCH" "origin/$BRANCH"

  if git merge master --ff-only 2>/dev/null; then
    echo "  Fast-forward exitoso"
  else
    echo "  No es fast-forward, haciendo merge..."
    git merge master -m "merge: distribuir master a $workshop"
  fi

  git push origin "$BRANCH"
  echo "  Deployado: $BRANCH"
  echo ""
done

git checkout "$CURRENT_BRANCH"

if [ ${#FAILED[@]} -gt 0 ]; then
  echo "ADVERTENCIA: Fallaron los siguientes talleres: ${FAILED[*]}"
  exit 1
fi

echo "=== Distribución completada ==="
