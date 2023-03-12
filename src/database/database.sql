-- Active: 1678316405930@@127.0.0.1@3306

CREATE TABLE users (
    id TEXT PRIMARY KEY UNIQUE NOT NULL,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL,
    created_at TEXT DEFAULT (DATETIME()) NOT NULL
);

INSERT INTO users (id, name, email, password, role)
VALUES
	("u001", "Fulano", "fulano@email.com", "fulano123", "NORMAL"),
	("u002", "Beltrana", "beltrana@email.com", "beltrana00", "NORMAL"),
	("u003", "Astrodev", "astrodev@email.com", "astrodev99", "ADMIN");


CREATE TABLE posts (
    id TEXT PRIMARY KEY UNIQUE NOT NULL,
    creator_id TEXT NOT NULL,
    content TEXT NOT NULL,
    likes INTEGER DEFAULT (0) NOT NULL,
    dislikes INTEGER DEFAULT (0) NOT NULL,
    created_at TEXT DEFAULT (DATETIME()) NOT NULL,
    updated_at TEXT DEFAULT (DATETIME()) NOT NULL,
    FOREIGN KEY (creator_id) REFERENCES users (id) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE
    );

INSERT INTO posts (id, creator_id, content)
VALUES
    ("p001", "u001", "Hello World!"),
    ("p002", "u001", "Testando."),
    ("p003", "u002", "Cheguei!");

CREATE TABLE likes_dislikes (
    user_id TEXT NOT NULL, 
    post_id TEXT NOT NULL, 
    like INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users (id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
        FOREIGN KEY (post_id) REFERENCES posts (id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

INSERT INTO likes_dislikes (user_id, post_id, like)
VALUES
    ("u002", "p001", 1),
    ("u003", "p001", 1),
    ("u001", "p003", 1),
    ("u003", "p002", 0);


SELECT
    posts.id,
    posts.creator_id,
    posts.content,
    posts.likes,
    posts.dislikes,
    posts.created_at,
    posts.updated_at,
    users.name AS creator_name
FROM posts
JOIN users
ON posts.creator_id = users.id;

SELECT * FROM likes_dislikes





