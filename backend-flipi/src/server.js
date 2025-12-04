import express from 'express'
import cors from 'cors'
import pg from 'pg';
import fetch from 'node-fetch';
const { Pool } = pg;

const app = express()

async function iniciarDB(){
    await verificarDB()
    await verificarTabelas()
    await povoarBancoComDadosFicticios(pool)
}

iniciarDB().catch(error => {
    console.error('Erro na inicialização do Banco de Dados: ', error)
})

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'flipidb',
    password: 'jaime@db',
    port: 5432 
  });

async function verificarDB(){

    // Configurando pool para acesso ao banco de dados
    const defaultPool = new Pool({
        user: 'postgres', // Substitua pelo seu usuário do PostgreSQL / PGAdmin
        host: 'localhost',
        database: 'postgres', // Nome da sua database no PostgreSQL / PGAdmi
        password: 'jaime@db', // Substitua pela sua senha do PostgreSQL / PGAdmin
        port: 5432, // Porta padrão do PostgreSQL
    })
    
    const client = await defaultPool.connect();
    const nomeBanco = 'flipidb'
    
    const result = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [nomeBanco])
    
    if(result.rowCount == 0){
    
        console.log(`Banco de dados ${nomeBanco} não existe. Criando...`)
        await client.query(`CREATE DATABASE ${nomeBanco}`)
        console.log(`Banco de dados ${nomeBanco} criado com sucesso!`)
    } else {
    
        console.log(`Banco de dados ${nomeBanco} já existe.`)
    
    }
    
    client.release()
    await defaultPool.end()
}

async function verificarTabelas(){

    const client = await pool.connect();

    const createUsuarioQuery = `
    CREATE TABLE IF NOT EXISTS usuario(
        usuario_id SERIAL PRIMARY KEY,
        usuario_nome VARCHAR(40) NOT NULL,
        usuario_apelido VARCHAR(40) NOT NULL,
        usuario_email VARCHAR(80) UNIQUE NOT NULL,
        usuario_senha VARCHAR(30) NOT NULL,
        url_foto TEXT 
    );`
    await client.query(createUsuarioQuery);
    console.log(`Tabela "usuario" verificada/criada com sucesso.`);

    const createEditoraQuery = `
    CREATE TABLE IF NOT EXISTS editora(
        editora_id SERIAL PRIMARY KEY,
        editora_nome TEXT NOT NULL
    );`
    await client.query(createEditoraQuery);
    console.log(`Tabela "editora" verificada/criada com sucesso.`);

    const createAutorQuery = `
    CREATE TABLE IF NOT EXISTS autor(
        autor_id SERIAL PRIMARY KEY,
        autor_nome TEXT NOT NULL
    );`
    await client.query(createAutorQuery);
    console.log(`Tabela "autor" verificada/criada com sucesso.`);

    const createGeneroQuery = `
    CREATE TABLE IF NOT EXISTS genero(
        genero_id SERIAL PRIMARY KEY,
        genero_nome TEXT NOT NULL
    );`
    await client.query(createGeneroQuery);
    console.log(`Tabela "genero" verificada/criada com sucesso.`);

    const createLivroQuery= `
    CREATE TABLE IF NOT EXISTS livro (
        livro_isbn BIGINT PRIMARY KEY,
        livro_titulo VARCHAR(100) NOT NULL,
        livro_ano INTEGER NOT NULL,
        livro_sinopse TEXT NOT NULL,
        livro_capa TEXT NOT NULL,
        editora_id INTEGER,
        CONSTRAINT fk_livro_editora FOREIGN KEY (editora_id) REFERENCES EDITORA (editora_id) ON UPDATE CASCADE ON DELETE RESTRICT
    );`
    await client.query(createLivroQuery);
    console.log(`Tabela "livro" verificada/criada com sucesso.`);


    const createLivroAutorQuery= `
    CREATE TABLE IF NOT EXISTS livro_autor(
        livro_isbn BIGINT NOT NULL,
        autor_id INT NOT NULL,
        PRIMARY KEY (livro_isbn, autor_id),
        CONSTRAINT fk_livro_autor FOREIGN KEY (autor_id) REFERENCES AUTOR (autor_id) ON UPDATE CASCADE ON DELETE RESTRICT,
        CONSTRAINT fk_livro_isbn FOREIGN KEY (livro_isbn) REFERENCES LIVRO (livro_isbn) ON UPDATE CASCADE ON DELETE CASCADE        
    );`
    await client.query(createLivroAutorQuery);
    console.log(`Tabela "livro_autor" verificada/criada com sucesso.`)

    const createLivroGeneroQuery= `
    CREATE TABLE IF NOT EXISTS livro_genero(
        livro_isbn BIGINT NOT NULL,
        genero_id INT NOT NULL,
        PRIMARY KEY (livro_isbn, genero_id),
        CONSTRAINT fk_livro_genero FOREIGN KEY (genero_id) REFERENCES GENERO (genero_id) ON UPDATE CASCADE ON DELETE RESTRICT,
        CONSTRAINT fk_livro_isbn FOREIGN KEY (livro_isbn) REFERENCES LIVRO (livro_isbn) ON UPDATE CASCADE ON DELETE CASCADE        
    );`
    await client.query(createLivroGeneroQuery);
    console.log(`Tabela "livro_genero" verificada/criada com sucesso.`)

    
    //Criação automática da tabela de listas personalizadas
    const createListQuery= `
    CREATE TABLE IF NOT EXISTS listas_personalizadas(
        id SERIAL PRIMARY KEY, 	
        criador_lista INTEGER NOT NULL REFERENCES usuario(usuario_id),
        nome_lista TEXT NOT NULL, 	
        descricao_lista TEXT NOT NULL, 	
        data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 	
        isbn_livros BIGINT[],
        CONSTRAINT fk_criador_lista FOREIGN KEY (criador_lista)
            REFERENCES usuario(usuario_id)
            ON DELETE CASCADE   
    );`
    await client.query(createListQuery);
    console.log(`Tabela "listas_personalizadas" verificada/criada com sucesso.`)

    //?-----RESENHA------?//
    const createResenhaQuery= `
   CREATE TABLE IF NOT EXISTS resenha(
    resenha_id SERIAL PRIMARY KEY,
    resenha_titulo VARCHAR(40),
    resenha_texto TEXT NOT NULL,
    resenha_nota INT NOT NULL,
    resenha_curtidas INT,
    usuario_id INT NOT NULL,
    livro_isbn BIGINT,

    CONSTRAINT fk_usuario_id FOREIGN KEY (usuario_id) REFERENCES usuario (usuario_id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_livro_isbn FOREIGN KEY (livro_isbn) REFERENCES livro (livro_isbn) ON UPDATE CASCADE ON DELETE RESTRICT
);`
    
    await client.query(createResenhaQuery);
    console.log(`Tabela  "resenha" verificada/criada com sucesso.`)

    // ✅ MOVER PARA AQUI - Agora todas as tabelas existem
    console.log('Iniciando inserção de livros...');
    await inserirLivrosTabela(client);
    console.log('Inserção de livros concluída.');

    client.release();
}

app.use(cors())
app.use(express.json())

async function povoarBancoComDadosFicticios(pool) {
    const client = await pool.connect();
    try {
// 1. CRIAR USUÁRIOS
        console.log("👥 Criando/Verificando usuários...");
        
        // ... (Seu código de insert dos usuários fica aqui) ...
        const insertUsuarios = `
            INSERT INTO usuario (usuario_nome, usuario_apelido, usuario_email, usuario_senha) VALUES
            ('Lucas "King" Silva', 'king_fan', 'lucas@email.com', '123456'),
            ('Mariana Romance', 'mari_leitora', 'mari@email.com', '123456'),
            ('Roberto Crítico', 'beto_books', 'beto@email.com', '123456'),
            ('Fernanda Geek', 'fer_targaryen', 'fer@email.com', '123456'),
            ('João Casual', 'joao_le', 'joao@email.com', '123456'),
            ('Ana Clássicos', 'ana_classicos', 'ana@email.com', '123456'),
            ('Pedro Potterhead', 'pedro_hpat', 'pedro@email.com', '123456'),
            ('Sofia Thriller', 'sofi_suspense', 'sofia@email.com', '123456'),
            ('Guilherme SciFi', 'gui_futuro', 'gui@email.com', '123456'),
            ('Beatriz YoungAdult', 'bia_books', 'bia@email.com', '123456')
            ON CONFLICT (usuario_email) DO NOTHING;
        `;
        await client.query(insertUsuarios);

        // --- CHECKUP DE REALIDADE (O QUE O NODE VÊ?) ---
        console.log("🔍 [DEBUG] Listando usuários encontrados no banco agora:");
        const checkAllUsers = await client.query('SELECT usuario_id, usuario_email FROM usuario');
        
        if (checkAllUsers.rows.length === 0) {
            console.error("🚨 ERRO GRAVE: O banco está vazio! O insert falhou silenciosamente.");
        } else {
            console.table(checkAllUsers.rows); // Isso vai imprimir uma tabela linda no terminal
        }
        // ------------------------------------------------

        // 2. RESENHAS CURADAS (Baseadas na sua lista de ISBNs)
        const reviewsData = [
            // --- GEORGE R.R. MARTIN (Game of Thrones) --
            { isbn: 9780553573404, email: 'fer@email.com', nota: 5, curtidas: 120, titulo: 'O início da lenda', texto: 'A política de Westeros é fascinante. Muito melhor que a série.' },
            { isbn: 9780553381689, email: 'lucas@email.com', nota: 5, curtidas: 45, titulo: 'Brutal', texto: 'Não se apegue a ninguém. A escrita é densa mas vale cada página.' },
            { isbn: 9781417663200, email: 'fer@email.com', nota: 5, curtidas: 80, titulo: 'A Fúria dos Reis', texto: 'A guerra dos cinco reis começa. Tyrion Lannister brilha muito neste livro.' },
            { isbn: 9780007582235, email: 'beto@email.com', nota: 4, curtidas: 30, titulo: 'O Festim dos Corvos', texto: 'Um ritmo mais lento, focado nas consequências da guerra. Cersei é uma personagem complexa.' },
            { isbn: 9781101886045, email: 'gui@email.com', nota: 5, curtidas: 55, titulo: 'Dança dos Dragões', texto: 'Finalmente os dragões cresceram! O Norte se lembra.' },

            // --- STEPHEN KING (Terror/Suspense) ---
            { isbn: 9788581050485, email: 'lucas@email.com', nota: 5, curtidas: 60, titulo: 'O Iluminado', texto: 'O hotel Overlook é a entidade mais assustadora já criada. Claustrofóbico.' },
            { isbn: 9788581050485, email: 'sofia@email.com', nota: 4, curtidas: 22, titulo: 'Melhor que o filme', texto: 'O livro aprofunda a loucura de Jack de uma forma que o filme não conseguiu.' },
            { isbn: 9788581052144, email: 'lucas@email.com', nota: 5, curtidas: 50, titulo: 'Misery', texto: 'Annie Wilkes é a vilã mais realista do King. Angustiante.' },
            { isbn: 9788581050362, email: 'bia@email.com', nota: 4, curtidas: 15, titulo: 'Carrie', texto: 'Triste e explosivo. O bullying retratado é pesado.' },
            { isbn: 9788581050454, email: 'gui@email.com', nota: 4, curtidas: 20, titulo: 'Salem', texto: 'Vampiros clássicos, sem brilhar no sol. A cidade morrendo aos poucos é genial.' },
            { isbn: 9788581050218, email: 'fer@email.com', nota: 5, curtidas: 100, titulo: 'A Torre Negra', texto: 'O homem de preto fugia pelo deserto, e o pistoleiro ia atrás. O início da saga.' },
            { isbn: 9788539000166, email: 'mari@email.com', nota: 5, curtidas: 200, titulo: 'À Espera de um Milagre', texto: 'Chorei copiosamente. John Coffey, inocente e mágico.' },
            { isbn: 9788581050546, email: 'gui@email.com', nota: 5, curtidas: 85, titulo: 'A Dança da Morte', texto: 'O épico pós-apocalíptico definitivo. Captain Trips assusta.' },
            { isbn: 9788556510334, email: 'sofia@email.com', nota: 4, curtidas: 12, titulo: 'A Zona Morta', texto: 'Um suspense político com poderes psíquicos. Muito bom.' },
            { isbn: 9788960176751, email: 'sofia@email.com', nota: 4, curtidas: 18, titulo: 'Mr. Mercedes', texto: 'King provando que sabe escrever policial tão bem quanto terror.' },
            { isbn: 9788560280940, email: 'lucas@email.com', nota: 5, curtidas: 99, titulo: 'IT: A Coisa', texto: 'A amizade do clube dos perdedores é a alma do livro. Pennywise é pesadelo puro.' },

            // --- HARRY POTTER ---
            { isbn: 9789722365543, email: 'pedro@email.com', nota: 5, curtidas: 150, titulo: 'Onde tudo começou', texto: 'Você é um bruxo, Harry! Relendo pela décima vez.' },
            { isbn: 9788532530790, email: 'bia@email.com', nota: 4, curtidas: 40, titulo: 'Câmara Secreta', texto: 'Um pouco mais sombrio que o primeiro. Dobby é irritante mas fofo.' },
            { isbn: 9788532530806, email: 'pedro@email.com', nota: 5, curtidas: 200, titulo: 'Prisioneiro de Azkaban', texto: 'O melhor da saga! Sirius Black e os Marotos.' },
            { isbn: 8532512526, email: 'fer@email.com', nota: 5, curtidas: 110, titulo: 'Cálice de Fogo', texto: 'O torneio tribruxo expande o mundo mágico. O retorno de Voldemort é tenso.' },
            { isbn: 9788532516220, email: 'beto@email.com', nota: 3, curtidas: 20, titulo: 'Ordem da Fênix', texto: 'Harry está muito revoltado neste livro, mas Umbridge é a melhor vilã.' },
            { isbn: 9788532519474, email: 'pedro@email.com', nota: 5, curtidas: 90, titulo: 'Enigma do Príncipe', texto: 'O passado de Voldemort é fascinante. O final... sem palavras.' },
            { isbn: 9788532530424, email: 'beto@email.com', nota: 2, curtidas: 50, titulo: 'Roteiro de Teatro', texto: 'Não considero canônico. A história viaja demais no tempo.' },

            // --- ROMANCE & DRAMA (Colleen Hoover, John Green, etc) ---
            { isbn: 9788551004449, email: 'bia@email.com', nota: 4, curtidas: 45, titulo: 'O Verão que mudou...', texto: 'Leitura leve de verão, triângulo amoroso clássico.' },
            { isbn: 9789899096486, email: 'mari@email.com', nota: 5, curtidas: 88, titulo: 'A Hipótese do Amor', texto: 'Fake dating com cientistas? Amei demais! Adam Carlsen é tudo.' },
            { isbn: 9781471154638, email: 'mari@email.com', nota: 4, curtidas: 30, titulo: 'Novembro 9', texto: 'Colleen Hoover sabe destruir nosso coração. O plot twist me pegou.' },
            { isbn: 9788501114181, email: 'bia@email.com', nota: 4, curtidas: 60, titulo: 'Um de nós está mentindo', texto: 'Clube dos cinco com assassinato. Prende do início ao fim.' },
            { isbn: 9781608181797, email: 'mari@email.com', nota: 3, curtidas: 10, titulo: 'Romance leve', texto: 'Bom para curar ressaca literária.' },
            { isbn: 9781401309169, email: 'mari@email.com', nota: 5, curtidas: 200, titulo: 'PS Eu Te Amo', texto: 'Preparem os lenços. Chorei do começo ao fim.' },
            { isbn: 9788542209334, email: 'sofia@email.com', nota: 5, curtidas: 40, titulo: 'Garota em Pedaços', texto: 'Livro pesado, gatilhos fortes, mas muito necessário sobre saúde mental.' },
            { isbn: 9781527225336, email: 'bia@email.com', nota: 5, curtidas: 120, titulo: 'Heartstopper', texto: 'A coisa mais fofa do mundo! Nick e Charlie são perfeitos.' },
            { isbn: 9788542217735, email: 'ana@email.com', nota: 5, curtidas: 70, titulo: 'Mulherzinhas', texto: 'Jo March é uma inspiração. Um clássico sobre irmandade.' },

            // --- FANTASIA & DISTOPIA ---
            { isbn: 9788580573619, email: 'fer@email.com', nota: 5, curtidas: 60, titulo: 'Roda do Tempo', texto: 'Se você gosta de Tolkien, precisa ler Jordan. Épico.' },
            { isbn: 9788598078397, email: 'pedro@email.com', nota: 5, curtidas: 110, titulo: 'Percy Jackson', texto: 'Mitologia grega em Nova York. Divertido e cheio de ação.' },
            { isbn: 9789895572700, email: 'bia@email.com', nota: 3, curtidas: 200, titulo: 'Crepúsculo', texto: 'É ruim? Talvez. Eu amo? Com certeza. Nostalgia pura.' },
            { isbn: 9788501076601, email: 'mari@email.com', nota: 5, curtidas: 150, titulo: 'Corte de Névoa e Fúria', texto: 'Rhysand definiu meus padrões de homem. O capítulo 55...' },
            { isbn: 9789897545351, email: 'bia@email.com', nota: 4, curtidas: 80, titulo: 'ACOTAR', texto: 'Uma releitura de A Bela e a Fera com faeries. O começo é lento mas melhora.' },
            { isbn: 9788576573135, email: 'gui@email.com', nota: 5, curtidas: 95, titulo: 'Duna', texto: 'A obra prima da ficção científica. Política, ecologia e religião.' },
            { isbn: 9788532520661, email: 'ana@email.com', nota: 5, curtidas: 100, titulo: 'O Conto da Aia', texto: 'Perturbador e necessário. Nolite te bastardes carborundorum.' },
            { isbn: 9780385907026, email: 'gui@email.com', nota: 4, curtidas: 40, titulo: 'Maze Runner', texto: 'Correria e mistério. O final me deixou com muitas perguntas.' },
            { isbn: 9789722330107, email: 'sofia@email.com', nota: 5, curtidas: 60, titulo: 'Coraline', texto: 'Neil Gaiman cria um conto de fadas sombrio. A Outra Mãe dá medo.' },

            // --- CLÁSSICOS & LITERATURA ---
            { isbn: 9786587034201, email: 'beto@email.com', nota: 5, curtidas: 300, titulo: '1984', texto: 'O Grande Irmão está observando. Mais atual do que nunca.' },
            { isbn: 9786586064407, email: 'gui@email.com', nota: 5, curtidas: 180, titulo: 'Revolução dos Bichos', texto: 'Todos os animais são iguais, mas alguns são mais iguais que outros.' },
            { isbn: 9788588781610, email: 'ana@email.com', nota: 5, curtidas: 220, titulo: 'Orgulho e Preconceito', texto: 'Mr. Darcy é o blueprint. Jane Austen, a maior de todas.' },
            { isbn: 9780670520732, email: 'beto@email.com', nota: 5, curtidas: 40, titulo: 'Ratos e Homens', texto: 'Uma história curta e devastadora sobre amizade e sonhos.' },
            { isbn: 9788503009492, email: 'ana@email.com', nota: 5, curtidas: 90, titulo: 'O Sol é para todos', texto: 'Atticus Finch é o exemplo de integridade. Leitura obrigatória.' },
            { isbn: 9780786290215, email: 'mari@email.com', nota: 5, curtidas: 130, titulo: 'A Menina que Roubava Livros', texto: 'Narrado pela Morte. Chorei até desidratar.' },
            { isbn: 9786580210343, email: 'gui@email.com', nota: 5, curtidas: 70, titulo: 'Frankenstein', texto: 'Não é sobre um monstro, é sobre rejeição e humanidade.' },
            { isbn: 9786580210008, email: 'beto@email.com', nota: 5, curtidas: 65, titulo: 'A Metamorfose', texto: 'Gregor Samsa acordou transformado num inseto. Kafka e a alienação.' },
            { isbn: 9788522005239, email: 'joao@email.com', nota: 5, curtidas: 500, titulo: 'O Pequeno Príncipe', texto: 'O essencial é invisível aos olhos. Para crianças e adultos.' },
            { isbn: 9788537817520, email: 'ana@email.com', nota: 4, curtidas: 55, titulo: 'Morro dos Ventos Uivantes', texto: 'Heathcliff e Catherine são tóxicos, mas a escrita é poderosa.' },
            { isbn: 9788587575012, email: 'beto@email.com', nota: 3, curtidas: 40, titulo: 'O Apanhador...', texto: 'Holden Caulfield é insuportável ou incompreendido? Ainda não decidi.' },
            { isbn: 9788501014863, email: 'beto@email.com', nota: 5, curtidas: 35, titulo: 'O Estrangeiro', texto: 'Hoje mamãe morreu. Camus e o absurdo da existência.' },
            { isbn: 9788501068200, email: 'mari@email.com', nota: 5, curtidas: 150, titulo: 'Diário de Anne Frank', texto: 'Um relato real e doloroso de uma menina cheia de sonhos.' },
            { isbn: 9788581301723, email: 'ana@email.com', nota: 4, curtidas: 60, titulo: 'O Grande Gatsby', texto: 'O sonho americano e a decadência. Old sport!' },
            { isbn: 9788579620560, email: 'beto@email.com', nota: 5, curtidas: 80, titulo: 'Lolita', texto: 'A prosa é linda, o tema é perturbador. Nabokov era um gênio.' },

            // --- THRILLER & SUSPENSE ---
            { isbn: 9788957591055, email: 'joao@email.com', nota: 4, curtidas: 50, titulo: 'Código Da Vinci', texto: 'Dan Brown sabe prender o leitor. Polêmica e ação.' },
            { isbn: 9788535924015, email: 'sofia@email.com', nota: 5, curtidas: 40, titulo: 'Dias Perfeitos', texto: 'Raphael Montes tem uma mente doentia (elogio). Téo é assustador.' },
            { isbn: 9788574482446, email: 'beto@email.com', nota: 5, curtidas: 25, titulo: 'Declínio de um homem', texto: 'Osamu Dazai escreve com a própria alma. Deprimente e belo.' },
            { isbn: 8520917674, email: 'mari@email.com', nota: 5, curtidas: 90, titulo: 'Caçador de Pipas', texto: 'Por você, faria isso mil vezes. Emocionante.' },
            
            // --- OUTROS/GERAL (Preenchendo gaps) ---
            { isbn: 9788501071545, email: 'beto@email.com', nota: 5, curtidas: 30, titulo: 'Uma Vida Pequena', texto: 'O livro mais triste que já li. Jude merece paz.' },
            { isbn: 9788580573015, email: 'bia@email.com', nota: 5, curtidas: 100, titulo: 'Extraordinário', texto: 'Auggie Pullman ensina sobre gentileza. Lindo.' },
            { isbn: 9788501110817, email: 'gui@email.com', nota: 5, curtidas: 75, titulo: 'O Ódio que Você Semeia', texto: 'Starr é uma protagonista incrível. Leitura necessária sobre racismo.' },
            { isbn: 9780224070966, email: 'bia@email.com', nota: 5, curtidas: 60, titulo: 'Matilda', texto: 'Dahl cria magia. Quem nunca quis mover objetos com a mente?' },
            { isbn: 9788535937473, email: 'sofia@email.com', nota: 4, curtidas: 20, titulo: 'Uma família feliz', texto: 'Suspense doméstico cheio de reviravoltas.' },
            { isbn: 9782253176503, email: 'mari@email.com', nota: 3, curtidas: 100, titulo: 'Cinquenta Tons', texto: 'É fanfic de Crepúsculo, eu sei. Mas li tudo em dois dias.' },

            // --- CROSSOVERS: FANTASIA & SCI-FI ---
    // Lucas (fã de terror/King) lendo Game of Thrones (brutalidade)
    { isbn: 9780553573404, email: 'lucas@email.com', nota: 5, curtidas: 88, titulo: 'Sangue e Neve', texto: 'A brutalidade desse mundo me lembra o melhor do horror. Ned Stark não merecia aquilo.' },
    // Gui (fã de Sci-fi/King) lendo Harry Potter
    { isbn: 9789722365543, email: 'gui@email.com', nota: 4, curtidas: 45, titulo: 'Universo rico', texto: 'O worldbuilding é sólido, embora o sistema de magia seja um pouco "soft" demais pro meu gosto.' },
    // Fer (fã de épicos) lendo Duna
    { isbn: 9788576573135, email: 'fer@email.com', nota: 5, curtidas: 120, titulo: 'Escala monumental', texto: 'A política das Grandes Casas é tão complexa quanto Westeros. Arrakis é um personagem vivo.' },
    // Pedro (fã de HP/Fantasia) lendo Percy Jackson (releitura ou comparação)
    { isbn: 9788598078397, email: 'bia@email.com', nota: 5, curtidas: 90, titulo: 'Melhor que o filme', texto: 'Filho de Poseidon > Harry Potter? Polêmica! Amo o humor do Percy.' },

    // --- CROSSOVERS: TERROR & SUSPENSE ---
    // Beto (Crítico/Clássicos) lendo King
    { isbn: 9788581050485, email: 'beto@email.com', nota: 3, curtidas: 35, titulo: 'Bom, mas prolixo', texto: 'King tem boas ideias, mas o livro precisava de um editor mais severo. O terror psicológico funciona.' },
    // Ana (Clássicos/Feminismo) lendo O Conto da Aia
    { isbn: 9788532520661, email: 'sofia@email.com', nota: 5, curtidas: 110, titulo: 'Assustadoramente real', texto: 'Gilead não parece tão distante assim. A narrativa da Offred me deu pesadelos.' },
    // Gui lendo IT: A Coisa
    { isbn: 9788560280940, email: 'gui@email.com', nota: 5, curtidas: 70, titulo: 'Derry é maldita', texto: 'A mitologia da tartaruga e do macroverso é a melhor parte. O terror cósmico por trás do palhaço.' },

    // --- CROSSOVERS: ROMANCE & DRAMA ---
    // Mari (Romance/Drama) lendo Orgulho e Preconceito
    { isbn: 9788588781610, email: 'mari@email.com', nota: 5, curtidas: 250, titulo: 'O romance original', texto: 'Darcy e Elizabeth criaram o tropo "enemies to lovers". Suspiro a cada página.' },
    // Bia (YA/Romance) lendo Crepúsculo (releitura)
    { isbn: 9789895572700, email: 'mari@email.com', nota: 4, curtidas: 100, titulo: 'Guilty Pleasure', texto: 'Edward brilha no sol, é ridículo, mas eu não consigo parar de ler.' },
    // Sofia (Thriller) lendo Verity (ops, lista tem Colleen Hoover - Novembro 9)
    { isbn: 9781471154638, email: 'sofia@email.com', nota: 2, curtidas: 15, titulo: 'Problemático', texto: 'O romance é tóxico e o plot twist não faz sentido. Esperava mais suspense.' },
    
    // --- CROSSOVERS: CLÁSSICOS & GERAL ---
    // Lucas (Terror) lendo A Metamorfose
    { isbn: 9786580210008, email: 'lucas@email.com', nota: 5, curtidas: 60, titulo: 'Body Horror existencial', texto: 'Acordar como um inseto é o pesadelo definitivo. A rejeição da família é a verdadeira monstruosidade.' },
    // Ana (Clássicos) lendo 1984
    { isbn: 9786587034201, email: 'ana@email.com', nota: 5, curtidas: 95, titulo: 'A morte da verdade', texto: 'O Duplipensar é uma ferramenta política atual. Orwell entendeu como a linguagem molda a realidade.' },
    // Joao (Geral) lendo O Código Da Vinci
    { isbn: 9788957591055, email: 'pedro@email.com', nota: 4, curtidas: 40, titulo: 'Sessão da tarde', texto: 'É uma caça ao tesouro divertida. Langdon resolve tudo muito fácil, mas entretém.' },
    // Bia (Leve) lendo O Pequeno Príncipe
    { isbn: 9788522005239, email: 'bia@email.com', nota: 5, curtidas: 300, titulo: 'Para chorar', texto: 'Tu te tornas eternamente responsável por aquilo que cativas. Lição pra vida.' },
    
    // --- COMPLETANDO COM MAIS OPINIÕES ---
    { isbn: 9788535924015, email: 'lucas@email.com', nota: 5, curtidas: 50, titulo: 'Brasil no mapa do terror', texto: 'Dias Perfeitos é sufocante. Raphael Montes não deve nada aos gringos.' },
    { isbn: 9780224070966, email: 'mari@email.com', nota: 5, curtidas: 80, titulo: 'Queria ser a Matilda', texto: 'A Srta. Honey é o tipo de professora que muda o mundo. Livro doce e vingativo na medida certa.' },
    { isbn: 9788501014863, email: 'gui@email.com', nota: 4, curtidas: 30, titulo: 'Indiferença total', texto: 'O Estrangeiro me deixou desconfortável. Meursault não sente nada, e isso é assustador.' },
    { isbn: 9788551004449, email: 'ana@email.com', nota: 3, curtidas: 20, titulo: 'Clichê adolescente', texto: 'O Verão que mudou minha vida é bem escrito, mas os personagens tomam decisões muito imaturas.' }

            
        ];

console.log(`📊 Processando ${reviewsData.length} resenhas...`);
        
        let contagemSucesso = 0;
        let contagemDuplicada = 0;
        let contagemErroLivro = 0;
        let contagemErroUser = 0;

        for (const rev of reviewsData) {
            // converter ISBN para string para garantir comparação correta
            const isbnString = String(rev.isbn); 

            // 1. VERIFICAÇÃO PRÉVIA: O Livro existe?
            // Se o livro não estiver no banco, o insert falha. Vamos avisar qual é.
            const checkLivro = await client.query('SELECT 1 FROM livro WHERE livro_isbn = $1', [isbnString]);
            
            if (checkLivro.rowCount === 0) {
                console.log(`❌ ERRO: Livro não encontrado no banco!`);
                console.log(`   -> ISBN: ${rev.isbn}`);
                console.log(`   -> Título Resenha: ${rev.titulo}`);
                contagemErroLivro++;
                continue; // Pula para a próxima resenha
            }

            // 2. VERIFICAÇÃO PRÉVIA: O Usuário existe?
            const checkUser = await client.query('SELECT usuario_id FROM usuario WHERE usuario_email = $1', [rev.email]);
            
            if (checkUser.rowCount === 0) {
                console.log(`❌ ERRO: Usuário não encontrado! Email: ${rev.email}`);
                contagemErroUser++;
                continue;
            }

            // 3. TENTATIVA DE INSERÇÃO
            // Usamos a lógica de "Inserir se não existir"
            const query = `
                INSERT INTO resenha (resenha_titulo, resenha_texto, resenha_nota, resenha_curtidas, usuario_id, livro_isbn)
                SELECT $1, $2, $3, $4, u.usuario_id, $5
                FROM usuario u 
                WHERE u.usuario_email = $6
                AND NOT EXISTS (
                    SELECT 1 FROM resenha r 
                    WHERE r.usuario_id = u.usuario_id 
                    AND r.livro_isbn = $5
                );
            `;

            try {
                const res = await client.query(query, [rev.titulo, rev.texto, rev.nota, rev.curtidas, isbnString, rev.email]);
                
                // O Postgres retorna 'rowCount' = 1 se inseriu, 0 se não fez nada (caiu no NOT EXISTS)
                if (res.rowCount > 0) {
                    contagemSucesso++;
                    // Opcional: console.log(`✅ Inserida: ${rev.titulo}`);
                } else {
                    contagemDuplicada++;
                    // Opcional: console.log(`⚠️ Já existe (Ignorada): ${rev.titulo}`);
                }

            } catch (err) {
                console.error(`🔥 ERRO CRÍTICO ao inserir resenha do livro ${rev.isbn}:`, err.message);
            }
        }

        console.log("\n================ RELATÓRIO FINAL ================")
        console.log(`🟢 Sucesso (Novas): ${contagemSucesso}`);
        console.log(`🟡 Ignoradas (Já existiam): ${contagemDuplicada}`);
        console.log(`🔴 Falha (Livro não existe no Banco): ${contagemErroLivro}`);
        console.log(`🔴 Falha (Usuário não existe): ${contagemErroUser}`);
        console.log("=================================================\n");
        
        // 3. RECRIAR LISTAS DE EXEMPLO (Para a demo)
        console.log("📚 Criando listas personalizadas...");
        
        // Lista Terror (Sofi)
        await client.query(`
            INSERT INTO listas_personalizadas (criador_lista, nome_lista, descricao_lista, isbn_livros)
            SELECT usuario_id, 'Terror King', 'O mestre do horror.', 
            ARRAY[9788581050485, 9788581052144, 9788560280940, 9788581050362]::BIGINT[]
            FROM usuario WHERE usuario_email = 'sofi_suspense'
            ON CONFLICT DO NOTHING;
        `);

        // Lista Fantasia (Pedro)
        await client.query(`
            INSERT INTO listas_personalizadas (criador_lista, nome_lista, descricao_lista, isbn_livros)
            SELECT usuario_id, 'Mundos Mágicos', 'Harry Potter e Percy Jackson.', 
            ARRAY[9789722365543, 9788532530790, 9788532530806, 9788598078397]::BIGINT[]
            FROM usuario WHERE usuario_email = 'pedro_hpat'
            ON CONFLICT DO NOTHING;
        `);

        console.log("🏁 Banco 100% Povoado e Pronto!");

    } catch (err) {
        console.error("Erro fatal no povoamento:", err);
    } finally {
        client.release();
    }
}

async function buscarLivroPorISBN(isbn) {
    try {
        // Removendo hífens se houver
        const isbnLimpo = isbn.toString().replace(/-/g, '');
        console.log(isbnLimpo)
        
        // Buscando informações do livro
        const response = await fetch(`https://openlibrary.org/api/books?bibkeys=ISBN:${isbnLimpo}&format=json&jscmd=data`);
        
        if (!response.ok) {
            throw new Error(`Erro na API: ${response.status}`);
        }
        
        const data = await response.json();
        const chave = `ISBN:${isbnLimpo}`;
        
        // Verificando se o livro foi encontrado
        if (!data[chave]) {
            throw new Error('Livro não encontrado na API');
        }
        
        console.log(data[chave].subjects[0])
        return data[chave];

    } catch (error) {
        console.error('Erro ao buscar livro:', error);
        throw error;
    }
}

async function obterOuCriarEditora(nome) {

    if (!nome) return null;

    const client = await pool.connect();
    
    try {
        // Verifica se a editora já existe
        let result = await client.query('SELECT editora_id FROM editora WHERE editora_nome = $1', [nome]);
        
        if (result.rows.length > 0) {
            return result.rows[0].editora_id;
        }
        
        // Se não existir, cria uma nova editora
        result = await client.query(
            'INSERT INTO editora (editora_nome) VALUES ($1) RETURNING editora_id',
            [nome]
        );
        
        return result.rows[0].editora_id;
    } catch (error) {
        console.error('Erro ao obter/criar editora:', error.message);
        return null;
    }
}

async function obterOuCriarAutor(nome) {
    if (!nome) return null;
    
    const client = await pool.connect();
    try {
        // Verifica se o autor já existe
        let result = await client.query('SELECT autor_id FROM autor WHERE autor_nome = $1', [nome]);
        
        if (result.rows.length > 0) {
            return result.rows[0].autor_id;
        }
        
        // Se não existir, cria um novo autor
        result = await client.query(
            'INSERT INTO autor (autor_nome) VALUES ($1) RETURNING autor_id',
            [nome]
        );
        
        return result.rows[0].autor_id;
    } catch (error) {
        console.error('Erro ao obter/criar autor:', error.message);
        return null;
    }
}

const mapeamentoGeneros = {
    // Ficção Científica
    'science fiction': 'Ficção Científica', 'sci-fi': 'Ficção Científica', 'dystopian': 'Ficção Científica', 
    'utopian': 'Ficção Científica', 'space': 'Ficção Científica', 'future': 'Ficção Científica', 
    'cyberpunk': 'Ficção Científica', 'aliens': 'Ficção Científica', 'time travel': 'Ficção Científica',
    
    // Thriller
    'thriller': 'Thriller', 'thrillers': 'Thriller', 'suspense': 'Thriller', 
    'psychological thriller': 'Thriller', 'spy': 'Thriller', 'espionage': 'Thriller',
    
    // Fantasia
    'fantasy': 'Fantasia', 'fantasy fiction': 'Fantasia', 'magic': 'Fantasia', 
    'magical realism': 'Fantasia', 'wizards': 'Fantasia', 'dragons': 'Fantasia', 
    'mythology': 'Fantasia', 'fairy tales': 'Fantasia', 'supernatural': 'Fantasia',
    
    // Comédia
    'comedy': 'Comédia', 'humor': 'Comédia', 'humorous': 'Comédia', 'satire': 'Comédia', 
    'parody': 'Comédia', 'comic': 'Comédia', 'funny': 'Comédia',
    
    // Biografia
    'biography': 'Biografia', 'autobiography': 'Biografia', 'memoirs': 'Biografia', 
    'life stories': 'Biografia', 'biographical': 'Biografia',
    
    // Crimes
    'crime': 'Crimes', 'criminal': 'Crimes', 'detective': 'Crimes', 'mystery': 'Crimes', 
    'mystery fiction': 'Crimes', 'detective stories': 'Crimes', 'police': 'Crimes', 
    'murder': 'Crimes', 'investigation': 'Crimes', 'noir': 'Crimes',
    
    // Ação e Aventura
    'action': 'Ação e Aventura', 'adventure': 'Ação e Aventura', 'action & adventure': 'Ação e Aventura', 
    'adventure stories': 'Ação e Aventura', 'expeditions': 'Ação e Aventura', 'survival': 'Ação e Aventura', 'quest': 'Ação e Aventura',
    
    // Romance
    'romance': 'Romance', 'love stories': 'Romance', 'romantic fiction': 'Romance', 
    'love': 'Romance', 'relationships': 'Romance', 'romantic': 'Romance',
    
    // Terror
    'horror': 'Terror', 'horror stories': 'Terror', 'ghost stories': 'Terror', 
    'ghosts': 'Terror', 'monsters': 'Terror', 'scary': 'Terror', 'fear': 'Terror', 'haunted': 'Terror',
    
    // Medieval
    'medieval': 'Medieval', 'middle ages': 'Medieval', 'knights': 'Medieval', 
    'castles': 'Medieval', 'feudal': 'Medieval', 'chivalry': 'Medieval', 'crusades': 'Medieval',
    
    // Drama
    'drama': 'Drama', 'dramatic': 'Drama', 'family': 'Drama', 'psychological': 'Drama', 
    'emotional': 'Drama', 'tragedy': 'Drama', 'tragic': 'Drama',
    
    // Outros
    // IMPORTANTE: Mudei de 'historical fiction' para 'Ficção' para evitar confusão,
    // mas a lógica abaixo funcionará independente do valor aqui.
    'fiction': 'Ficção' 
};

function mapearGenerosLiterarios(assuntosOpenLibrary) {
    const generosEncontrados = new Set();
    
    if (!assuntosOpenLibrary || !Array.isArray(assuntosOpenLibrary)) {
        return [];
    }
    
    assuntosOpenLibrary.forEach(assunto => {
        try {
            let assuntoTexto;
            if (typeof assunto === 'string') {
                assuntoTexto = assunto;
            } else if (typeof assunto === 'object' && assunto !== null) {
                assuntoTexto = assunto.name || assunto.title || assunto.subject || assunto.toString();
            } else {
                return;
            }
            
            const assuntoNormalizado = assuntoTexto.toLowerCase().trim();
            
            // 1. Verifica correspondência exata (Prioridade Máxima)
            if (mapeamentoGeneros[assuntoNormalizado]) {
                generosEncontrados.add(mapeamentoGeneros[assuntoNormalizado]);
                return; 
            } 

            // 2. Loop de verificação parcial com LÓGICA DE EXCLUSÃO
            Object.keys(mapeamentoGeneros).forEach(chave => {
                
                // === AQUI ESTÁ A LÓGICA NOVA ===
                // Se a chave for genérica ('fiction'), verificamos se o assunto
                // já é algo mais específico ('science', 'fan', etc).
                if (chave === 'fiction') {
                    // Lista de palavras que, se estiverem presentes, PROÍBEM a chave 'fiction' de ser ativada
                    const excecoes = ['science', 'sci-fi', 'fantasy', 'crime', 'thriller', 'mystery'];
                    
                    // Se o assunto contiver qualquer uma dessas palavras específicas,
                    // nós pulamos (return) e NÃO adicionamos a ficção genérica.
                    const ehEspecifico = excecoes.some(exc => assuntoNormalizado.includes(exc));
                    if (ehEspecifico) {
                        return;
                    }
                }
                // =================================

                if (assuntoNormalizado.includes(chave)) {
                    generosEncontrados.add(mapeamentoGeneros[chave]);
                }
            });
            
        } catch (error) {
            console.log('Erro ao processar assunto:', assunto, error.message);
        }
    });
    
    return Array.from(generosEncontrados);
}

async function obterOuCriarEditoraComClient(client, nome) {
    if (!nome) return null;
    
    try {
        // Verifica se a editora já existe
        let result = await client.query('SELECT editora_id FROM editora WHERE editora_nome = $1', [nome]);
        
        if (result.rows.length > 0) {
            return result.rows[0].editora_id;
        }
        
        // Se não existir, cria uma nova editora
        result = await client.query(
            'INSERT INTO editora (editora_nome) VALUES ($1) RETURNING editora_id',
            [nome]
        );
        
        return result.rows[0].editora_id;
    } catch (error) {
        console.error('Erro ao obter/criar editora:', error.message);
        return null;
    }
}

async function obterOuCriarAutorComClient(client, nome) {
    if (!nome) return null;
    
    try {
        // Verifica se o autor já existe
        let result = await client.query('SELECT autor_id FROM autor WHERE autor_nome = $1', [nome]);
        
        if (result.rows.length > 0) {
            return result.rows[0].autor_id;
        }
        
        // Se não existir, cria um novo autor
        result = await client.query(
            'INSERT INTO autor (autor_nome) VALUES ($1) RETURNING autor_id',
            [nome]
        );
        
        return result.rows[0].autor_id;
    } catch (error) {
        console.error('Erro ao obter/criar autor:', error.message);
        return null;
    }
}

async function obterOuCriarGeneroComClient(client, nome) {
    if (!nome) return null;
    
    try {
        // Verifica se o gênero já existe
        let result = await client.query('SELECT genero_id FROM genero WHERE genero_nome = $1', [nome]);
        
        if (result.rows.length > 0) {
            return result.rows[0].genero_id;
        }
        
        // Se não existir, cria um novo gênero
        result = await client.query(
            'INSERT INTO genero (genero_nome) VALUES ($1) RETURNING genero_id',
            [nome]
        );
        
        return result.rows[0].genero_id;
    } catch (error) {
        console.error('Erro ao obter/criar gênero:', error.message);
        return null;
    }
}

// Função inserirLivrosTabela corrigida
async function inserirLivrosTabela(client) {
    const isbns = [9780553573404, 9788960176751, 9782253176503, 9780008762278, 9780263870770, 9780263929874, 9780373336036, 9781608181797, 9781846175916, 9780553381689, 9788580573619, 9788957591055, 9788535937473, 9788535924015, 9788581050485, 9788581052144, 9788581050362, 9788581050454, 9788581050218, 9788539000166, 9788539000753, 9788539000333, 9788581050546, 9788556510334, 9786580210343, 9781401308582, 9781401308605, 9781401308612, 9781401308629, 9781401308643, 9781401308650, 9781401308667, 9781401308674, 9781401308681, 9781401308704, 9781401308711, 9781401308742, 9781401308797, 9781401308810, 9781401308841, 9781401308858, 9781401308872, 9781401308896, 9781401308902, 9781401308919, 9781401308926, 9781401308933, 9781401308940, 9781401308957, 9781401308964, 9781401308971, 9781401308988, 9781401308995, 9781401309022, 9781401309039, 9781401309046, 9781401309053, 9781401309060, 9781401309091, 9781401309121, 9781401309138, 9781401309145, 9781401309152, 9781401309169, 9781401309206, 9781401309213, 9781401309237, 9781401309251, 9781401309268, 9781401309275, 9781401309336, 9781401309381, 9781401309435, 9781401309442, 9781401309497, 9781417663200, 9780007582235, 9781101886045, 9780670520732, 9788415594482, 9788573266115, 9788542209334, 9788532530790, 9789895572700, 9788503009492, 9788598078397, 9788588781610, 8532512526, 9788551004449, 9786586064407, 9788532530806, 9789722365543, 9788532516220, 9788532519474, 9788532530424, 9789899096486, 9788501076601, 9786587034201, 9780786290215, 9788574482446, 9789898839510, 9789897545351, 9788576573135, 9788501071545, 9786580210008, 9788575421130, 9780224070966, 9787532766963, 9788579620560, 9788522005239, 9788580573015, 9781527225336, 9781471154638, 9788532520661, 9789722330107, 9788501110817, 9788581301723, 9788537817520, 9788587575012, 9788542217735,9788501014863, 9788501114181, 9788580574517, 9788581050393, 8520917674, 9788501068200, 9788539006205, 9780385907026, 9788560280940
    ];

    for (const isbn of isbns) {
        try {
            // Verifica se o livro já existe antes de tentar inserir
            const livroExistente = await client.query('SELECT livro_isbn FROM livro WHERE livro_isbn = $1', [isbn]);
            if (livroExistente.rows.length > 0) {
                console.log(`Livro com ISBN ${isbn} já existe no banco. Pulando...`);
                continue;
            }

            console.log(`Buscando informações para o livro ISBN: ${isbn}`);
            const livro = await buscarLivroPorISBN(isbn);

            const titulo = livro.title || 'Título desconhecido';
            const ano = livro.publish_date ? parseInt(livro.publish_date.match(/\d{4}/)?.[0]) || 2000 : 2000;
            const sinopse = livro.notes || livro.excerpts?.[0]?.text || 'Sem sinopse';
            const capa = livro.cover?.large || livro.cover?.medium || livro.cover?.small || '';
            
            // Usar as funções que aceitam client como parâmetro
            const editoraNome = livro.publishers?.[0]?.name || null;
            const editora_id = editoraNome ? await obterOuCriarEditoraComClient(client, editoraNome) : null;

            const insertQuery = `
                INSERT INTO livro (livro_isbn, livro_titulo, livro_ano, livro_sinopse, livro_capa, editora_id)
                VALUES ($1, $2, $3, $4, $5, $6)
                ON CONFLICT (livro_isbn) DO NOTHING;
            `;

            await client.query(insertQuery, [isbn, titulo, ano, sinopse, capa, editora_id]);
            console.log(`Livro inserido: ${titulo} - Editora ID: ${editora_id}`);

            // Processar autores se existirem
            if (livro.authors && livro.authors.length > 0) {
                for (const autorInfo of livro.authors) {
                    const autorId = await obterOuCriarAutorComClient(client, autorInfo.name);
                    if (autorId) {
                        await client.query(
                            'INSERT INTO livro_autor (livro_isbn, autor_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
                            [isbn, autorId]
                        );
                        console.log(`Autor ${autorInfo.name} associado ao livro ${isbn}`);
                    }
                }
            }

            // Processar gêneros se existirem
            if (livro.subjects && livro.subjects.length > 0) {
                console.log('Assuntos originais da OpenLibrary:', livro.subjects);
                
                // Mapeia os assuntos para gêneros tradicionais
                const generosLiterarios = mapearGenerosLiterarios(livro.subjects);
                console.log('Gêneros mapeados:', generosLiterarios);
                
                // Insere apenas os gêneros mapeados
                for (const generoNome of generosLiterarios) {
                    const generoId = await obterOuCriarGeneroComClient(client, generoNome);
                    if (generoId) {
                        await client.query(
                            'INSERT INTO livro_genero (livro_isbn, genero_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
                            [isbn, generoId]
                        );
                        console.log(`Gênero ${generoNome} associado ao livro ${isbn}`);
                    }
                }
                
                // Se nenhum gênero foi mapeado, adiciona "Drama" como padrão
                if (generosLiterarios.length === 0) {
                    console.log('Nenhum gênero mapeado, adicionando "Drama" como padrão');
                    const generoId = await obterOuCriarGeneroComClient(client, 'Drama');
                    if (generoId) {
                        await client.query(
                            'INSERT INTO livro_genero (livro_isbn, genero_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
                            [isbn, generoId]
                        );
                        console.log(`Gênero padrão "Drama" associado ao livro ${isbn}`);
                    }
                }
            } else {
                // Se não há subjects, adiciona Drama como padrão
                console.log('Livro sem subjects, adicionando "Drama" como padrão');
                const generoId = await obterOuCriarGeneroComClient(client, 'Drama');
                if (generoId) {
                    await client.query(
                        'INSERT INTO livro_genero (livro_isbn, genero_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
                        [isbn, generoId]
                    );
                    console.log(`Gênero padrão "Drama" associado ao livro ${isbn}`);
                }
            }

        } catch (error) {
            console.error(`Erro ao inserir livro com ISBN ${isbn}:`, error.message);
            // Continua com o próximo livro mesmo se houver erro
            continue;
        }
    }
}

// Função para buscar livro completo com suas relações
async function buscarLivroCompleto(isbn) {
    const client = await pool.connect();
    try {
        // Busca informações básicas do livro
        const livroResult = await client.query('SELECT * FROM livro WHERE livro_isbn = $1', [isbn]);
        if (livroResult.rows.length === 0) {
            throw new Error('Livro não encontrado');
        }
        
        const livro = livroResult.rows[0];
        
        // Busca informações da editora
        if (livro.editora_id) {
            const editoraResult = await client.query('SELECT * FROM editora WHERE editora_id = $1', [livro.editora_id]);
            if (editoraResult.rows.length > 0) {
                livro.editora = editoraResult.rows[0];   // Adiciona informações da editora ao objeto livro
            }
        }
        
        // Busca autores do livro
        const autoresResult = await client.query(
            'SELECT a.* FROM autor a JOIN livro_autor la ON a.autor_id = la.autor_id WHERE la.livro_isbn = $1',
            [isbn]
        );
        livro.autores = autoresResult.rows;            // Adiciona lista de autores ao objeto livro
        
        // Busca gêneros do livro
        const generosResult = await client.query(
            'SELECT g.* FROM genero g JOIN livro_genero lg ON g.genero_id = lg.genero_id WHERE lg.livro_isbn = $1',
            [isbn]
        );
        livro.generos = generosResult.rows;            // Adiciona lista de gêneros ao objeto livro
        
        return livro;                                 // Retorna o livro com todas as relações
    } finally {
        client.release();                             // Libera a conexão
    }
}

// Modifique a rota para usar o novo sistema de mapeamento
app.post('/livro/isbn/:isbn', async (req, res) => {
    const { isbn } = req.params;
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        // Verifica se o livro já existe no banco
        const livroExistente = await client.query('SELECT * FROM livro WHERE livro_isbn = $1', [isbn]);
        if (livroExistente.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'Livro já existe no banco de dados' });
        }
        
        // Busca dados do livro na API
        const dadosLivro = await buscarLivroPorISBN(isbn);
        
        // Extrai informações relevantes
        const titulo = dadosLivro.title || 'Título não disponível';
        const ano = dadosLivro.publish_date ? parseInt(dadosLivro.publish_date.match(/\d{4}/)[0]) : 0;
        const sinopse = dadosLivro.excerpts ? dadosLivro.excerpts[0].text : (dadosLivro.description ? 
                       (typeof dadosLivro.description === 'string' ? dadosLivro.description : dadosLivro.description.value) : 
                       'Sinopse não disponível');
        const limitedSinopse = sinopse.substring(0, 399);
        
        const capa = dadosLivro.cover ? dadosLivro.cover.large || dadosLivro.cover.medium || dadosLivro.cover.small : null;
        
        // Obtém ou cria editora
        const editoraNome = dadosLivro.publishers && dadosLivro.publishers.length > 0 ? dadosLivro.publishers[0].name : null;
        const editoraId = editoraNome ? await obterOuCriarEditora(editoraNome) : null;
        
        // Insere o livro no banco
        console.log("isbn ====>>> ", isbn);
        console.log("titulo====>>> ", titulo);
        console.log("ano====>>> ", ano);
        console.log("limitedSinopse ====>>> ", limitedSinopse);
        console.log("editoraId ====>>> ", editoraId);
        console.log("capa ====>>> ", capa);

        
        const livroResult = await client.query(
            'INSERT INTO livro (livro_isbn, livro_titulo, livro_ano, livro_sinopse, editora_id, livro_capa) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [isbn, titulo, ano, limitedSinopse, editoraId, capa]
        );
        
        // Processa e insere autores
        if (dadosLivro.authors && dadosLivro.authors.length > 0) {
            for (const autorInfo of dadosLivro.authors) {
                const autorId = await obterOuCriarAutor(autorInfo.name);
                await client.query(
                    'INSERT INTO livro_autor (livro_isbn, autor_id) VALUES ($1, $2)',
                    [isbn, autorId]
                );
            }
        }
        
        // *** NOVA LÓGICA PARA GÊNEROS ***
        // Mapeia os assuntos da OpenLibrary para gêneros literários tradicionais
        if (dadosLivro.subjects && dadosLivro.subjects.length > 0) {
            console.log('Assuntos originais da OpenLibrary:', dadosLivro.subjects);
            
            // Mapeia os assuntos para gêneros tradicionais
            const generosLiterarios = mapearGenerosLiterarios(dadosLivro.subjects);
            console.log('Gêneros mapeados:', generosLiterarios);
            
            // Insere apenas os gêneros mapeados
            for (const generoNome of generosLiterarios) {
                const generoId = await obterOuCriarGenero(generoNome);
                if (generoId) {
                    await client.query(
                        'INSERT INTO livro_genero (livro_isbn, genero_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
                        [isbn, generoId]
                    );
                }
            }
            
            // Se nenhum gênero foi mapeado, adiciona "Drama" como padrão
            if (generosLiterarios.length === 0) {
                console.log('Nenhum gênero mapeado, adicionando "Drama" como padrão');
                const generoId = await obterOuCriarGenero('Drama');
                if (generoId) {
                    await client.query(
                        'INSERT INTO livro_genero (livro_isbn, genero_id) VALUES ($1, $2)',
                        [isbn, generoId]
                    );
                }
            }
        }
        
        await client.query('COMMIT');
        
        // Busca o livro completo com suas relações para retornar na resposta
        const livroCompleto = await buscarLivroCompleto(isbn);
        res.status(201).json(livroCompleto);
        
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Erro ao adicionar livro:', err.message);
        res.status(500).json({ error: 'Erro ao adicionar livro', detalhes: err.message });
    } finally {
        client.release();
    }
});

// Rota para listar todos os gêneros cadastrados (útil para debug e visualização)
app.get('/generos', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM genero ORDER BY genero_nome');
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Erro ao buscar gêneros' });
    }
});

// Rota para buscar livros por gênero
app.get('/livros/genero/:genero_id', async (req, res) => {
    const { genero_id } = req.params;
    try {
        const result = await pool.query(`
            SELECT l.*, g.genero_nome 
            FROM livro l 
            JOIN livro_genero lg ON l.livro_isbn = lg.livro_isbn 
            JOIN genero g ON lg.genero_id = g.genero_id 
            WHERE g.genero_id = $1
        `, [genero_id]);
        
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Erro ao buscar livros por gênero' });
    }
});

// Rota para pegar livros ordenados por popularidade (Nota Média)
app.get('/livros/populares', async (req, res) => {
    try {
        const query = `
            SELECT l.*, 
                   COALESCE(AVG(r.resenha_nota), 0) as media_nota,
                   COUNT(r.resenha_id) as total_resenhas
            FROM livro l
            LEFT JOIN resenha r ON l.livro_isbn = r.livro_isbn
            GROUP BY l.livro_isbn
            ORDER BY media_nota DESC, total_resenhas DESC
            LIMIT 80; 
        `;
        // LIMIT 20 para a home não ficar pesada
        const resultado = await pool.query(query);
        res.json(resultado.rows);
    } catch (error) {
        console.error('Erro ao buscar populares:', error);
        res.status(500).json({ erro: 'Erro no servidor' });
    }
});

app.post('/livros/recomendacao-inteligente', async (req, res) => {
    const { usuario_id } = req.body;
    console.log(`🔍 [RECOMENDACAO] Solicitada para User ID: ${usuario_id}`);

    try {
        // 1. Tenta descobrir o perfil do usuário (O que ele deu nota alta - 4 ou 5)
        // ADICIONEI: Busca também a EDITORA (l.editora_id)
        const queryFavoritos = `
            SELECT la.autor_id, lg.genero_id, l.editora_id
            FROM resenha r
            LEFT JOIN livro l ON r.livro_isbn = l.livro_isbn
            LEFT JOIN livro_autor la ON r.livro_isbn = la.livro_isbn
            LEFT JOIN livro_genero lg ON r.livro_isbn = lg.livro_isbn
            WHERE r.usuario_id = $1 AND r.resenha_nota >= 4
        `;
        const favoritos = await pool.query(queryFavoritos, [usuario_id]);

        // Filtra nulls e remove duplicatas
        const autoresIds = [...new Set(favoritos.rows.map(row => row.autor_id).filter(id => id != null))];
        const generosIds = [...new Set(favoritos.rows.map(row => row.genero_id).filter(id => id != null))];
        const editorasIds = [...new Set(favoritos.rows.map(row => row.editora_id).filter(id => id != null))];

        console.log("📊 [PERFIL ENCONTRADO]:");
        console.log(`   - Autores IDs: ${autoresIds}`);
        console.log(`   - Gêneros IDs: ${generosIds}`);
        console.log(`   - Editoras IDs: ${editorasIds}`);

        // 2. SE NÃO TEM DADOS SUFICIENTES (CONTA NOVA OU DADOS INCOMPLETOS), RETORNA POPULARES
        if (autoresIds.length === 0 && generosIds.length === 0 && editorasIds.length === 0) {
            console.log("⚠️ -> Perfil vazio (Livro sem metadados ou usuário novo). Retornando Populares...");
            
            const populares = await pool.query(`
                SELECT l.livro_isbn, l.livro_titulo, l.livro_capa, l.livro_ano, l.livro_sinopse,
                       COALESCE(AVG(r.resenha_nota), 0) as media_nota
                FROM livro l
                LEFT JOIN resenha r ON l.livro_isbn = r.livro_isbn
                GROUP BY l.livro_isbn, l.livro_titulo, l.livro_capa, l.livro_ano, l.livro_sinopse
                ORDER BY media_nota DESC
                LIMIT 20
            `);
            
            return res.json({ tipo: 'populares', dados: populares.rows });
        }

        // 3. BUSCA PERSONALIZADA MELHORADA (Autor > Editora > Gênero)
        // Adicionei peso para a ordenação: Mesma Autor/Editora aparece antes de apenas Mesmo Gênero
       // ... dentro da rota /livros/recomendacao-inteligente

// 3. BUSCA PERSONALIZADA CORRIGIDA (Remove Duplicatas)
const queryRecomendacao = `
    SELECT l.livro_isbn, l.livro_titulo, l.livro_capa, l.livro_ano, l.livro_sinopse,
           COALESCE(AVG(r.resenha_nota), 0) as media_nota,
           -- USA MAX() PARA PEGAR A PONTUAÇÃO MÁXIMA SEM CRIAR NOVAS LINHAS
           (
               COALESCE(MAX(CASE WHEN la.autor_id = ANY($1::int[]) THEN 3 ELSE 0 END), 0) +
               COALESCE(MAX(CASE WHEN l.editora_id = ANY($3::int[]) THEN 2 ELSE 0 END), 0) +
               COALESCE(MAX(CASE WHEN lg.genero_id = ANY($2::int[]) THEN 1 ELSE 0 END), 0)
           ) as relevancia
    FROM livro l
    LEFT JOIN livro_autor la ON l.livro_isbn = la.livro_isbn
    LEFT JOIN livro_genero lg ON l.livro_isbn = lg.livro_isbn
    LEFT JOIN resenha r ON l.livro_isbn = r.livro_isbn
    WHERE (
        (CARDINALITY($1::int[]) > 0 AND la.autor_id = ANY($1::int[])) 
        OR 
        (CARDINALITY($2::int[]) > 0 AND lg.genero_id = ANY($2::int[]))
        OR
        (CARDINALITY($3::int[]) > 0 AND l.editora_id = ANY($3::int[]))
    )
    AND l.livro_isbn NOT IN (SELECT livro_isbn FROM resenha WHERE usuario_id = $4)
    
    -- O SEGREDO ESTÁ AQUI: AGRUPAR APENAS PELAS COLUNAS DO LIVRO
    GROUP BY l.livro_isbn, l.livro_titulo, l.livro_capa, l.livro_ano, l.livro_sinopse
    
    ORDER BY relevancia DESC, media_nota DESC
    LIMIT 20;
`;

// ... resto do código (execução da query) igual

        const recomendados = await pool.query(queryRecomendacao, [autoresIds, generosIds, editorasIds, usuario_id]);
        
        console.log(`✅ -> Encontradas ${recomendados.rows.length} recomendações personalizadas.`);

        if (recomendados.rows.length === 0) {
            console.log("   -> Personalizados esgotados. Fallback para Populares.");
            // Fallback para populares... (mesma query de cima)
            const popularesFallback = await pool.query(`
                SELECT l.livro_isbn, l.livro_titulo, l.livro_capa, l.livro_ano, l.livro_sinopse,
                       COALESCE(AVG(r.resenha_nota), 0) as media_nota
                FROM livro l
                LEFT JOIN resenha r ON l.livro_isbn = r.livro_isbn
                GROUP BY l.livro_isbn, l.livro_titulo, l.livro_capa, l.livro_ano, l.livro_sinopse
                ORDER BY media_nota DESC LIMIT 20
            `);
            return res.json({ tipo: 'populares', dados: popularesFallback.rows });
        }

        res.json({ tipo: 'personalizado', dados: recomendados.rows });

    } catch (error) {
        console.error('❌ ERRO NO BACKEND DE RECOMENDAÇÃO:', error);
        res.status(500).json({ erro: 'Erro no servidor' });
    }
});



app.get('/livro/:isbn', async (req, res) => {
    const { isbn } = req.params;                       // Obtém o ISBN da URL
    
    try {
        
        const livro = await buscarLivroCompleto(isbn); // Busca o livro completo
        res.json(livro);                              // Retorna o livro
    } catch (err) {
        console.error(err.message);
        res.status(404).json({ error: 'Livro não encontrado' });
    }
});

app.get('/livro/buscar/:titulo', async (req, res) => {
    const { titulo } = req.params;
    const { generos, autor, editora, ano } = req.query;
    
    console.log('Filtros recebidos:', { titulo, generos, autor, editora, ano });
    
    try {
        // Construir a query dinamicamente
        let query = `
            SELECT l.livro_isbn,
                   l.livro_titulo,
                   l.livro_ano,
                   l.livro_sinopse,
                   l.livro_capa,
                   l.editora_id,
                   STRING_AGG(DISTINCT a.autor_nome, ', ') AS autores, 
                   STRING_AGG(DISTINCT g.genero_nome, ', ') AS generos
            FROM livro l
            LEFT JOIN livro_autor la ON l.livro_isbn = la.livro_isbn
            LEFT JOIN autor a ON la.autor_id = a.autor_id
            LEFT JOIN livro_genero lg ON l.livro_isbn = lg.livro_isbn
            LEFT JOIN genero g ON lg.genero_id = g.genero_id
            LEFT JOIN editora e ON l.editora_id = e.editora_id
            WHERE l.livro_titulo ILIKE $1
        `;

        const queryParams = [`%${titulo}%`];
        let paramIndex = 2;

        // Filtro por autor
        if (autor) {
            query += ` AND a.autor_nome ILIKE $${paramIndex}`;
            queryParams.push(`%${autor}%`);
            paramIndex++;
        }

        // Filtro por editora
        if (editora) {
            query += ` AND e.editora_nome ILIKE $${paramIndex}`;
            queryParams.push(`%${editora}%`);
            paramIndex++;
        }

        // Filtro por ano
        if (ano) {
            query += ` AND l.livro_ano = $${paramIndex}`;
            queryParams.push(parseInt(ano));
            paramIndex++;
        }

        // Filtro por gêneros - TODOS os gêneros devem estar presentes
        if (generos) {
            const generosArray = generos.split(',').map(g => g.trim());
            const generosPlaceholders = generosArray.map((_, index) => 
                `$${paramIndex + index}`
            ).join(',');
            
            // Subconsulta para garantir que o livro tenha TODOS os gêneros especificados
            query += ` AND l.livro_isbn IN (
                SELECT lg_inner.livro_isbn 
                FROM livro_genero lg_inner
                JOIN genero g_inner ON lg_inner.genero_id = g_inner.genero_id
                WHERE g_inner.genero_nome IN (${generosPlaceholders})
                GROUP BY lg_inner.livro_isbn
                HAVING COUNT(DISTINCT g_inner.genero_nome) = ${generosArray.length}
            )`;
            
            queryParams.push(...generosArray);
        }

        query += ` GROUP BY l.livro_isbn, l.livro_titulo, l.livro_ano, l.livro_sinopse, l.livro_capa, l.editora_id`;

        console.log('Query final:', query);
        console.log('Parâmetros:', queryParams);

        const result = await pool.query(query, queryParams);
        
        console.log('Resultados do backend:', result.rows);
        res.json(result.rows);
        
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Erro ao buscar livro na barra de pesquisa' });
    }
});

app.get('/livro', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM livro');
        res.json(result.rows);                        // Retorna todos os livros
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Erro ao buscar livros' });
    }
});


// Rota para inserção de user no banco de dados
app.post('/usuario', async (req, res) => {
    console.log('Dados recebidos no backend:', req.body);
    const {usuario_nome, usuario_apelido, usuario_email, usuario_senha} = req.body
    try {
        // Query para inserção do user no banco de dados
        const result = await pool.query(
            'INSERT INTO usuario (usuario_nome, usuario_apelido, usuario_email, usuario_senha) VALUES ($1, $2, $3, $4) RETURNING *',
            [usuario_nome, usuario_apelido, usuario_email, usuario_senha]
        )
        res.status(201).json(result.rows[0])
    } catch (err) {
        console.error(err.message)
        res.status(500).json({ error: 'Erro ao cadastrar usuário! :(' })
    }
})

// Rota para buscar todos os usuários
app.get('/usuario', async (req, res) => {

    try {
        const result = await pool.query(
            'SELECT * FROM usuario'
        )
        res.status(200).json(result.rows)
    } catch (error) {

        console.error('Erro ao buscar usuários: ', error)
        res.status(500).json({ error: 'Erro ao buscar usuário'})

    }


})

// Rota para buscar um usuário por ID
app.get('/usuario/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('SELECT * FROM usuario WHERE usuario_id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Erro ao buscar usuário' });
    }
});

// Rota para buscar um cliente por apelido
app.get('/usuario/apelido/:apelido', async (req, res) => {
    const { apelido } = req.params;
    try {
        const result = await pool.query('SELECT * FROM usuario WHERE usuario_apelido = $1', [apelido]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Erro ao buscar usuário' });
    }
});

// // Rota para atualizar um cliente
// app.put('/usuario/:usuario_id', async (req, res) => {
//     const { usuario_id } = req.params;
//     const { usuario_nome, usuario_email, usuario_senha, url_foto  } = req.body;
//     try {
//         console.log('entrei no try')
//         const result = await pool.query(
//             'UPDATE usuario SET usuario_nome = $1, usuario_email = $2, usuario_senha = $3, url_foto = $4 WHERE usuario_id = $5 RETURNING *',
//             [usuario_nome, usuario_email, usuario_senha, url_foto, usuario_id]
//         );
//         console.log('fiz a query')
//         console.log(usuario_id)
//         if (result.rows.length === 0) {
//             console.log('entrei no 404')
//             return res.status(404).json({ error: 'Usuario não encontrado' });
//         }
//         console.log('atualizei os dados')
//         res.json(result.rows[0]);
//     } catch (err) {
//         console.error(err.message);
//         res.status(500).json({ error: 'Erro ao atualizar usuario' });
//     }
//   });

// rota para atualizar um usuário
app.put('/usuario/:usuario_id', async (req, res) => {
  const { usuario_id } = req.params;
  const campos = req.body;

  try {
    const chaves = Object.keys(campos);
    const valores = Object.values(campos);

    if (chaves.length === 0) {
      return res.status(400).json({ error: 'Nenhum dado enviado para atualização' });
    }

    // Ex: "usuario_nome = $1, usuario_email = $2"
    const setClause = chaves.map((campo, i) => `${campo} = $${i + 1}`).join(', ');

    const query = `
      UPDATE usuario
      SET ${setClause}
      WHERE usuario_id = $${chaves.length + 1}
      RETURNING *;
    `;

    const result = await pool.query(query, [...valores, usuario_id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Erro ao atualizar usuário:', err.message);
    res.status(500).json({ error: 'Erro ao atualizar usuário' });
  }
});


  // Rota para deletar um cliente
app.delete('/usuario/:usuario_id', async (req, res) => {
    const { usuario_id } = req.params;
    try {
        const result = await pool.query('DELETE FROM usuario WHERE usuario_id = $1 RETURNING *', [usuario_id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Usuario não encontrado' });
        }
        res.json({ message: 'Usuario deletado com sucesso' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Erro ao deletar usuario' });
    }
});

// -- JAIME --
// Rota para criar uma nova lista
app.post('/listas_personalizadas', async (req, res) => {
    console.log('Dados recebidos', req.body);

    const { nome, descricao, criador } = req.body;
    
    try {
        // Query para inserir a nova lista no banco de dados
        const result = await pool.query(
            'INSERT INTO listas_personalizadas ( nome_lista, descricao_lista, criador_lista ) VALUES ($1, $2, $3) RETURNING *',
            [ nome, descricao, criador ]
        );
        console.dir("recebendo resultado ", result)

        // Retorna a lista criada com status 201
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Erro ao criar lista!' });
    }
});

//Rota para buscar todas as listas de um usuário específico
app.get('/listas_personalizadas/usuario/:id', async (req, res) => {
    const { id } = req.params;

    const userID = parseInt(id)

    try {
        const result = await pool.query(
            'SELECT * FROM listas_personalizadas WHERE criador_lista = $1',
            [userID]
        );

        res.status(200).json(result.rows);
    } catch (err) {
        console.error('Erro ao buscar listas:', err.message);
        res.status(500).json({ error: 'Erro ao buscar listas!' });
    }
});

// Rota para atualizar nome e/ou descrição de uma lista
app.patch('/listas_personalizadas/:id', async (req, res) => {
    console.log('Dados recebidos:', req.body);
    
    const { id } = req.params;
    const { nomeLista, descricaoLista } = req.body;
    
    try {
        // Construir a query dinamicamente baseado nos campos enviados
        let updateFields = [];
        let values = [];
        let paramIndex = 1;
        
        if (nomeLista !== undefined) {
            updateFields.push(`nome_lista = $${paramIndex}`);
            values.push(nomeLista);
            paramIndex++;
        }
        
        if (descricaoLista !== undefined) {
            updateFields.push(`descricao_lista = $${paramIndex}`);
            values.push(descricaoLista);
            paramIndex++;
        }
        
        if (updateFields.length === 0) {
            return res.status(400).json({ error: 'Nenhum campo para atualizar foi fornecido' });
        }
        
        // Adicionar o ID no final dos valores
        values.push(parseInt(id));
        
        const query = `
            UPDATE listas_personalizadas 
            SET ${updateFields.join(', ')} 
            WHERE id = $${paramIndex} 
            RETURNING *
        `;
        
        console.log('Query:', query);
        console.log('Values:', values);
        
        const result = await pool.query(query, values);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Lista não encontrada' });
        }
        
        // Retornar a lista atualizada
        res.status(200).json(result.rows[0]);
        
    } catch (err) {
        console.error('Erro ao atualizar lista:', err.message);
        res.status(500).json({ error: 'Erro ao atualizar lista!' });
    }
});

//Rota para deletar uma lista
app.delete('/listas_personalizadas/:id', async (req, res) => {
    const { id } = req.params;

    try{
        const result = await pool.query(
            'DELETE FROM listas_personalizadas WHERE id = $1', [id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Lista não encontrada' });
        }
      
        res.status(200).json({ message: 'Lista deletada com sucesso' });
    } 
    catch (error) {
        console.error('Erro ao deletar a lista:', error);
        res.status(500).json({ error: 'Erro interno ao deletar a lista' });
    }
    
});

//Rota para listar todos os livros que estão no meu banco de dados
app.get("/livro", async (req, res) => {
    try {
      const resultado = await pool.query("SELECT * FROM livro");
      res.json(resultado.rows); // ou .recordset se for SQL Server
    } catch (err) {
      console.error(err);
      res.status(500).json({ erro: "Erro ao buscar livros" });
    }
  });

//adição de isbn do livro a lista
app.patch("/listas_personalizadas/:id/adicionar-livro", async (req, res) => {
    const idLista = req.params.id;
    const { isbnLivro } = req.body;

    console.log('requisição recebida:', { idLista, isbnLivro })

    try {

        const isbnParaBanco = Number(isbnLivro);
        
        // Primeiro verifica se a lista existe
        const listaExiste = await pool.query(
            "SELECT * FROM listas_personalizadas WHERE id = $1",
            [idLista]
        );
        
        if (listaExiste.rows.length === 0) {
            console.log('Lista não encontrada!')
            return res.status(404).json({ erro: "Lista não encontrada" });
        }
        
        // Verifica se o livro já está na lista
        const isbnArray = listaExiste.rows[0].isbn_livros || [];
        console.log('ISBNSs atuais na lista:', isbnArray);
        if (isbnArray.includes(isbnParaBanco)) {
            return res.status(400).json({ erro: "Livro já está na lista" });
        }
        
        const resultado = await pool.query(
            `UPDATE listas_personalizadas 
             SET isbn_livros = array_append(COALESCE(isbn_livros, '{}'), $1)
             WHERE id = $2
             RETURNING *;`,
            [isbnParaBanco, idLista]
        );
        console.log('livro adicionado com sucesso:', resultado.rows[0])
        res.status(200).json(resultado.rows[0]);

    } catch (erro) {
        console.error("Erro ao adicionar livro: ", erro);
        res.status(500).json({ erro: "Erro interno do servidor" });
    }
});

//rota para buscar todos os isbns da minha lista de livros
app.get("/listas_personalizadas/:id/livro", async (req, res) => {
    const { id } = req.params;
  
    try {
      // Busca os ISBNs da lista
      const lista = await pool.query(
        "SELECT isbn_livros FROM listas_personalizadas WHERE id = $1",
        [id]
      );
  
      if (lista.rows.length === 0) {
        return res.status(404).json({ erro: "Lista não encontrada" });
      }
  
      const isbns = lista.rows[0].isbn_livros;
  
      if (!isbns || isbns.length === 0) {
        return res.json([]); // Lista vazia
      }
  
      // Busca os dados dos livros com base nos ISBNs
      const livros = await pool.query(
        `SELECT * FROM livro WHERE livro_isbn = ANY($1::bigint[])`,
        [isbns]
      );
  
      res.json(livros.rows);
    } catch (erro) {
      console.error("Erro ao buscar livros da lista:", erro);
      res.status(500).json({ erro: "Erro interno ao buscar livros da lista" });
    }
  });
  

//rota para apagar um livro de uma lista
app.patch('/listas_personalizadas/:id/remover-livro', async (req, res) => {
    const { id } = req.params; // ID da lista
    const { isbnLivro } = req.body; // ISBN do livro a remover (como string)
  
    try {
      // Verifica se a lista existe
      const listaResult = await pool.query('SELECT * FROM listas_personalizadas WHERE id = $1', [id]);
  
      if (listaResult.rowCount === 0) {
        return res.status(404).json({ erro: 'Lista não encontrada.' });
      }
  
      // Remove o ISBN do array (PostgreSQL: array_remove)
      const updateResult = await pool.query(
        `UPDATE listas_personalizadas 
         SET isbn_livros = array_remove(isbn_livros, $1)
         WHERE id = $2
         RETURNING *`,
        [isbnLivro, id]
      );
  
      return res.status(200).json(updateResult.rows[0]);
  
    } catch (erro) {
      console.error('Erro ao remover livro da lista:', erro);
      return res.status(500).json({ erro: 'Erro interno ao remover livro da lista.' });
    }
  });
  

//Rota para verificar o login 
app.post('/login', async (req, res) => {
    const { usuario_apelido, usuario_senha } = req.body;

    try {
        const resultado = await pool.query(
            'SELECT * FROM usuario WHERE usuario_apelido = $1 AND usuario_senha = $2',
            [usuario_apelido, usuario_senha]
        );

        if (resultado.rows.length > 0) {
            const usuario = resultado.rows[0];
            res.status(200).json({
                mensagem: 'Login bem-sucedido!',
                usuario_id: usuario.usuario_id,
                usuario_nome: usuario.usuario_nome,
                usuario_apelido: usuario.usuario_apelido,
                usuario_email: usuario.usuario_email
            });
        } else {
            res.status(401).json({ mensagem: 'Apelido ou senha incorretos.' });
        }
    } catch (error) {
        console.error('Erro ao fazer login:', error);
        res.status(500).json({ mensagem: 'Erro no servidor.' });
    }
});

//* TABELA RESENHA
app.post('/resenha', async (req, res) => {
    const {resenha_titulo, resenha_texto, resenha_nota, resenha_curtidas, usuario_id, livro_isbn} = req.body;
    try {
        const result = await pool.query(
            `INSERT INTO resenha 
            (resenha_titulo, resenha_texto, resenha_nota, resenha_curtidas, usuario_id, livro_isbn) 
            VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [resenha_titulo, resenha_texto, resenha_nota, resenha_curtidas, usuario_id, livro_isbn]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Erro ao cadastrar resenha!-Server' });
    }
});

app.get('/resenha', async (req, res) => {
    const { usuario_id } = req.query;

    try {
        let result;
        if (usuario_id) {
            result = await pool.query(
                'SELECT * FROM resenha WHERE usuario_id = $1',
                [usuario_id]
            );
        } else {
            result = await pool.query(
                'SELECT * FROM resenha'
            );
        }
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Erro ao buscar resenha: ', error);
        res.status(500).json({ error: 'Erro ao buscar resenha' });
    }
});


    
app.get('/resenha/:resenha_id', async (req, res) => {
    const {resenha_id} = req.params;
    try {

        const result = await pool.query(
            'SELECT * FROM resenha WHERE resenha_id = $1', [resenha_id]

        )
        res.status(200).json(result.rows)
    } catch (error) {

        console.error('Erro ao buscar resenha: ', error)
        res.status(500).json({ error: 'Erro ao buscar resenha'})

    }


})

app.delete('/resenha/:resenha_id', async (req, res) => {
    const { resenha_id } = req.params;
    try {
        const result = await pool.query(
            'DELETE FROM resenha WHERE resenha_id = $1 RETURNING *',
            [resenha_id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Resenha não encontrada' });
        }
        res.json({ message: 'Resenha deletada com sucesso' });
    } catch (error) {
        console.error('Erro ao deletar resenha:', error);
        res.status(500).json({ error: 'Erro ao deletar resenha' });
    }
});

app.put('/resenha/:resenha_id', async (req, res) => {
    const { resenha_id } = req.params;
    const { resenha_curtidas } = req.body;
    
    try {

        const resenhaExiste = await pool.query(
            'SELECT * FROM resenha WHERE resenha_id = $1', 
            [resenha_id]
        );
        
        if (resenhaExiste.rows.length === 0) {
            return res.status(404).json({ error: 'Resenha não encontrada' });
        }
        

        const result = await pool.query(
            'UPDATE resenha SET resenha_curtidas = $1 WHERE resenha_id = $2 RETURNING *',
            [resenha_curtidas, resenha_id]
        );
        
        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error('Erro ao atualizar resenha:', error);
        res.status(500).json({ error: 'Erro ao atualizar resenha' });
    }
});
  

app.listen(3000, () => {
    console.log('Servidor rodando na porta 3000! :D')
})
