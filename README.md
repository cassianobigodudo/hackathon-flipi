# 📚 FliPi - Compartilhe suas ideias, Inspire outros leitores

<img width="2558" height="1279" alt="image" src="https://github.com/user-attachments/assets/75cadcf4-0d7e-4813-a058-965e56642ed7" />
> Uma plataforma social de recomendação de livros baseada em resenhas reais e curadoria comunitária.

### 👥 O Time (Squad Hackathon)
* **Cassiano Calazans Coelho Machado** Líder/ Backend/ Documentação
* **José Vitor de Mattos Pinheiro** Backend
* **Jaime António Cá** Backend
* **Giovani Razzante** Designer UI/UX
* **Theo Pereira do Santos** Designer UI/UX
* **Jonathan Zoz** Frontend / Backend

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
* **Exploração:** Visualização completa na pagina inicial dos livros mais recomendados.
* **Prova Social:** Leitura de resenhas e avaliações feitas pela comunidade.
* **Busca Inteligente:** Filtragem por gênero, autor, editora e título.

### 🔐 Acesso Membro (Logado)
* **Gestão de Identidade:** Cadastro, login e personalização de perfil.
* **Contribuição:**
    * Escrever, editar e excluir resenhas pessoais.
    * Avaliar livros (Rating de 1 a 5 estrelas).
    * Curtir resenhas de outros usuários (Engajamento).
* **Recomendação Especial:** Recomendação especialmente para o usuário baseado em suas resenhas positivas
* **Expansão:** Cadastro de novos livros via código **ISBN** (popula o banco automaticamente se não existir).
* **Curadoria** Criação de **Listas de Livros Personalizadas** (ex: Favoritos, Meta de Leitura 2024).

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

### Landing Page
<img width="2558" height="1279" alt="image" src="https://github.com/user-attachments/assets/1612c23b-ad6a-4d17-82a6-1ead2d312174" />


### Página Inicial (Recomendações Populares) 
<img width="2555" height="1275" alt="image" src="https://github.com/user-attachments/assets/2fcf4525-d654-47fe-97ba-98c6c156e4fa" />

### Página de Pesquisa
<img width="2557" height="1274" alt="image" src="https://github.com/user-attachments/assets/32ffceae-e6e2-4a69-9c06-662c744f1f7d" />

### Página do Livro
<img width="2554" height="1275" alt="image" src="https://github.com/user-attachments/assets/ff48f6ff-a34c-41b6-b87f-09deed867180" />

### Escrivaninha (Escrever Resenha)
<img width="2551" height="1272" alt="image" src="https://github.com/user-attachments/assets/359e0536-da7f-4742-8ec5-be180d742b55" />

### Recomendações Personalizadas
<img width="2557" height="1279" alt="image" src="https://github.com/user-attachments/assets/427a284b-801a-4705-8cf7-a04b1b6471a9" />


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
