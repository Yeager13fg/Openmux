#!/data/data/com.termux/files/usr/bin/bash
# ============================================================
#  OpenMux - Script de Instalação Automática
#  Uso: curl -sL https://raw.githubusercontent.com/Yeager13fg/Openmux/main/install.sh | bash
# ============================================================

set -e

REPO_URL="https://github.com/Yeager13fg/Openmux.git"
AGENT_CMD="openmux"

echo ""
echo "📱 Instalando OpenMux..."
echo ""

# 1. Verifica e instala o Git se necessário
if ! command -v git &> /dev/null; then
    echo "📦 Instalando Git..."
    pkg update -y && pkg install -y git
else
    echo "✅ Git já instalado."
fi

# 2. Verifica e instala o Node.js se necessário
if ! command -v node &> /dev/null; then
    echo "📦 Instalando Node.js..."
    pkg update -y && pkg install -y nodejs-lts
else
    echo "✅ Node.js já instalado ($(node -v))."
fi

# 3. Clona o repositório em pasta temporária
TMP_DIR=$(mktemp -d)
echo "📥 Baixando arquivos..."
git clone --depth 1 "$REPO_URL" "$TMP_DIR"

# 4. Instala globalmente no sistema do Termux
echo "⚙️  Instalando o comando globalmente..."
cd "$TMP_DIR"
TARBALL=$(npm pack)
npm install -g "$TARBALL"

# 5. Limpa a pasta temporária
echo "🧹 Limpando arquivos temporários..."
rm -rf "$TMP_DIR"

# 6. Cria pasta de configuração
mkdir -p "$HOME/.openmux/sessions"

echo ""
echo "🎉 Instalação concluída com sucesso!"
echo "🚀 Para iniciar, digite: $AGENT_CMD"
echo ""
