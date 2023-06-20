DROP TABLE IF EXISTS moves;
DROP TABLE IF EXISTS chat_messages;
DROP TABLE IF EXISTS chess_data;
DROP TABLE IF EXISTS games;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE games (
  id INT PRIMARY KEY AUTO_INCREMENT,
  player1_username VARCHAR(50) NOT NULL,
  player2_username VARCHAR(50) NOT NULL,
  status ENUM('ongoing', 'completed') NOT NULL DEFAULT 'ongoing',
  winner_username VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (player1_username) REFERENCES users(username),
  FOREIGN KEY (player2_username) REFERENCES users(username),
  FOREIGN KEY (winner_username) REFERENCES users(username)
);

CREATE TABLE moves (
  id INT PRIMARY KEY AUTO_INCREMENT,
  game_id INT NOT NULL,
  player_id INT NOT NULL,
  move VARCHAR(10) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (game_id) REFERENCES games(id),
  FOREIGN KEY (player_id) REFERENCES users(id)
);

CREATE TABLE chat_messages (
  id INT PRIMARY KEY AUTO_INCREMENT,
  game_id INT NOT NULL,
  sender_id INT NOT NULL,
  recipient_id INT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (game_id) REFERENCES games(id),
  FOREIGN KEY (sender_id) REFERENCES users(id),
  FOREIGN KEY (recipient_id) REFERENCES users(id)
);

CREATE TABLE chess_data (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL UNIQUE,
  games_played INT NOT NULL DEFAULT 0,
  elo INT NOT NULL DEFAULT 1200,
  wins INT NOT NULL DEFAULT 0,
  losses INT NOT NULL DEFAULT 0,
  draws INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);