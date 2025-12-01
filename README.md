# 📚 FliPi - Conectando Leitores, Descobrindo Histórias

> Uma plataforma social de recomendação de livros baseada em resenhas reais e curadoria comunitária.

### 👥 O Time (Squad Hackathon)
* **Cassiano Calazans Coelho Machado**
* **José Vitor de Mattos Pinheiro**
* **Jaime António Cá**
* **Giovani Razzante**
* **Theo**
* **Jonathan Zoz**

---

## 🎯 O Problema
Em um mundo com milhões de livros publicados, os leitores sofrem com a "paralisia da escolha". Algoritmos de grandes lojas focam em vendas, não em experiência. Leitores buscam recomendações autênticas, baseadas em opiniões de pessoas reais, e não apenas em "mais vendidos".

## 💡 A Solução: FliPi
O **FliPi** não é apenas um repositório de livros; é uma **rede social de leitura**. Focamos na experiência de **descoberta** através de:
1.  **Resenhas Humanizadas:** O core do sistema é a opinião detalhada do usuário.
2.  **Listas Personalizadas:** Curadoria feita pelos próprios leitores (ex: "Livros para ler em um dia", "Clássicos da Sci-Fi").
3.  **Catálogo Aberto:** Integração via ISBN para expandir o acervo organicamente.

---

## 🚀 Funcionalidades Principais

### 🔓 Acesso Público (Visitante)
* **Exploração:** Visualização completa do catálogo de livros.
* **Prova Social:** Leitura de resenhas e avaliações feitas pela comunidade.
* **Busca Inteligente:** Filtragem por gênero, autor, editora e título.

### 🔐 Acesso Membro (Logado)
* **Gestão de Identidade:** Cadastro, login e personalização de perfil.
* **Contribuição:**
    * Escrever, editar e excluir resenhas pessoais.
    * Avaliar livros (Rating de 1 a 5 estrelas).
    * Curtir resenhas de outros usuários (Engajamento).
* **Curadoria (Diferencial):** Criação de **Listas de Livros Personalizadas** (ex: Favoritos, Meta de Leitura 2024).
* **Expansão:** Cadastro de novos livros via código **ISBN** (popula o banco automaticamente se não existir).

---

## 🛠️ Tecnologias Utilizadas

O projeto foi construído utilizando uma arquitetura moderna e escalável:

* **Frontend:** React.js, React Router, Axios.
* **Backend:** Node.js, Express.
* **Banco de Dados:** PostgreSQL.
* **Testes:** Vitest.
* **Estilização:** CSS Modules / Design Responsivo.

---

## 📸 Screenshots

### Landing Page & Dashboard
*(Insira o print da nova Landing Page aqui)*

### Página do Livro & Resenhas
*(Insira o print da página de detalhes do livro aqui)*

### Criação de Listas Personalizadas
*(Insira o print da feature de listas aqui)*

---

## ⚙️ Como Executar o Projeto

### Pré-requisitos
* Node.js instalado
* PostgreSQL configurado

### 1. Backend (API)
```bash
cd Backend
npm install    # Instala: express, nodemon, cors, pg
npm start      # Ou o comando configurado no package.json

cd Frontend
npm install    # Instala: axios, react-router, react-icons, vitest
npm run dev    # Inicia o servidor de desenvolvimento