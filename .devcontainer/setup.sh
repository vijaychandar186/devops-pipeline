#!/usr/bin/env bash
set -euo pipefail

# Post-create setup for the DevOps Pipeline dev container.
# Runs once after the container is created.

echo "==> System packages"
sudo apt-get update -qq
sudo apt-get install -y --no-install-recommends \
  postgresql-client \
  redis-tools \
  make \
  jq \
  curl \
  unzip

echo "==> codespell (spell checker)"
pipx install codespell

echo "==> k6 (stress testing)"
sudo gpg --batch --no-default-keyring \
  --keyring /usr/share/keyrings/k6-archive-keyring.gpg \
  --keyserver hkp://keyserver.ubuntu.com:80 \
  --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69 2>/dev/null
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" \
  | sudo tee /etc/apt/sources.list.d/k6.list > /dev/null
sudo apt-get update -qq
sudo apt-get install -y k6

echo "==> git-cliff (changelog generator)"
CLIFF_TAG=$(curl -fsSL https://api.github.com/repos/orhun/git-cliff/releases/latest | jq -r .tag_name)
CLIFF_VER="${CLIFF_TAG#v}"
curl -fsSL \
  "https://github.com/orhun/git-cliff/releases/download/${CLIFF_TAG}/git-cliff-${CLIFF_VER}-x86_64-unknown-linux-gnu.tar.gz" \
  | sudo tar -xz -C /usr/local/bin \
    --strip-components=1 \
    "git-cliff-${CLIFF_VER}/git-cliff"

echo "==> Project dependencies"
make install

echo "==> Done"
