"""
game_state.py — In-memory singleton tracking the current game session.

Resets on server restart (intentional — this is an event game).
"""


class GameState:
    """Tracks whether the game is active and the current round."""

    def __init__(self):
        self.is_active: bool = False
        self.round_number: int = 0
        self.winners: list = []  # top 3 dicts: { username, roll_number, balance, rank }

    def start(self):
        self.is_active = True
        self.round_number += 1
        self.winners = []

    def stop(self, winners: list):
        self.is_active = False
        self.winners = winners

    def reset(self):
        self.winners = []

    def to_dict(self) -> dict:
        return {
            "is_active": self.is_active,
            "round_number": self.round_number,
            "winners": self.winners,
        }


# Singleton
game_state = GameState()
