import argparse
import os
import random
import sys

import chess.pgn
import numpy as np
import time
from keras.models import load_model

# Step 2: Data preprocessing
def encode_board(board):
    # Encode the board as a 12x8x8 binary matrix
    encoding = np.zeros((12, 8, 8), dtype=np.int8)
    for i in range(64):
        piece = board.piece_at(i)
        if piece is not None:
            encoding[piece.piece_type - 1][i // 8][i % 8] = 1
            if piece.color == chess.WHITE:
                encoding[6][i // 8][i % 8] = 1
            else:
                encoding[7][i // 8][i % 8] = 1
    return encoding

def encode_move(move):
    # Encode the move as a 8x8x1 binary matrix
    encoded = np.zeros(64)
    encoded[move.from_square] = 1
    encoded[move.to_square] = 1
    if move.promotion:
        encoded[move.promotion - 1] = 1
    return encoded

sys.stdout = open(os.devnull, 'w')

# Load the Keras model
model = load_model('third_model')

# Step 6: Search algorithm
def minimax(board, depth, alpha, beta, maximizing_player):
    if depth == 0 or board.is_game_over():
        return evaluate_board(board)

    if maximizing_player:
        max_eval = -np.inf
        for move in board.legal_moves:
            board.push(move)
            eval = minimax(board, depth - 1, alpha, beta, False)
            board.pop()
            max_eval = max(max_eval, eval)
            alpha = max(alpha, eval)
            if beta <= alpha:
                break
        return max_eval
    else:
        min_eval = np.inf
        for move in board.legal_moves:
            board.push(move)
            eval = minimax(board, depth - 1, alpha, beta, True)
            board.pop()
            min_eval = min(min_eval, eval)
            beta = min(beta, eval)
            if beta <= alpha:
                break
        return min_eval

def evaluate_board(board):
    # Evaluate the board position using the neural network
    x_test = np.array([encode_board(board)]).transpose((0, 2, 3, 1))  # Transpose the input data
    y_pred = model.predict(x_test)[0]
    return np.argmax(y_pred)

def get_best_move(fen, max_time):
    board = chess.Board(fen)
    start_time = time.time()
    x_test = np.array([encode_board(board)]).transpose((0, 2, 3, 1))
    y_pred = model.predict(x_test)[0]
    legal_moves = list(board.legal_moves)
    legal_move_indices = [encode_move(move) for move in legal_moves]
    legal_move_indices = np.argmax(legal_move_indices, axis=1)
    legal_move_probs = y_pred[legal_move_indices]
    best_moves = np.argsort(legal_move_probs)[::-1][:5]
    elapsed_time = time.time() - start_time
    if elapsed_time >= max_time:
        return str(random.choice(legal_moves))
    return str(legal_moves[best_moves[0]])


parser = argparse.ArgumentParser(description='Get the best move for a given FEN string')
parser.add_argument('fen', type=str, help='the FEN string to evaluate')
args = parser.parse_args()

# Get the best move from the AI model
best_move = get_best_move(args.fen, 2)


# Restore stdout to the console
sys.stdout = sys.__stdout__
# Print the best move
print(best_move)