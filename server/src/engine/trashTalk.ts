type EventType = 
  | 'game_start'
  | 'bot_capture'
  | 'player_capture'
  | 'player_blunder'
  | 'king_made'
  | 'thinking'
  | 'victory'
  | 'defeat';

interface Personality {
  game_start: string[];
  bot_capture: string[];
  player_capture: string[];
  player_blunder: string[];
  king_made: string[];
  thinking: string[];
  victory: string[];
  defeat: string[];
}

const PERSONALITIES: Record<number | string, Personality> = {
  // Boss 1: The Apprentice
  1: {
    game_start: [
      "Umm, hi. I'm still learning. Please don't be too harsh!",
      "I hope I don't make any silly mistakes today. Good luck!"
    ],
    bot_capture: [
      "Oh, sorry! I saw a jump and took it.",
      "Got one! I'm actually doing okay!"
    ],
    player_capture: [
      "Oops, I left my piece wide open... My mistake.",
      "Ah! I didn't see that coming."
    ],
    player_blunder: [
      "Oh, is that a safe move? I think I can jump here.",
      "Wait, did you mean to place that there?"
    ],
    king_made: [
      "Wow, a King! I'm moving up in the world!",
      "Look at that crown!"
    ],
    thinking: [
      "Let me double check this...",
      "Umm, where should I go?"
    ],
    victory: [
      "Oh wow, did I actually win? I guess my practice paid off!",
      "Good game! Thank you for playing with me!"
    ],
    defeat: [
      "Ouch... Good game! I still have so much to learn.",
      "You're really good. Teach me your ways sometime!"
    ]
  },
  // Boss 2: The Tactician
  2: {
    game_start: [
      "Let's see if your positioning is mathematically sound.",
      "Every layout has a tactical solution. Let's begin."
    ],
    bot_capture: [
      "A textbook jump. Always control the diagonals.",
      "Deduction successful. Piece captured."
    ],
    player_capture: [
      "A temporary exchange. My structure remains solid.",
      "An expected sacrifice on my end. The calculation continues."
    ],
    player_blunder: [
      "Your position is structurally compromised.",
      "That move deviates from the optimal path."
    ],
    king_made: [
      "Promotion achieved. Diagonal control increased.",
      "The King changes the math on this board."
    ],
    thinking: [
      "Calculating optimal coordinates...",
      "Analyzing board density..."
    ],
    victory: [
      "A standard tactical victory. Your defense was slightly loose.",
      "Logic dictates the outcome. Well played."
    ],
    defeat: [
      "Fascinating combination. You calculated better than me.",
      "An error in my defense. Respect for finding it."
    ]
  },
  // Boss 3: The Aggressor (Local Kazakh slang, high-energy)
  3: {
    game_start: [
      "Сәлем, brat! Almaty's defense is about to break. Let's go!",
      "Ayt, jas! Show me if you can handle real pressure!"
    ],
    bot_capture: [
      "Бәрекелді! That's one down! Direct strike!",
      "Eee, minus one! Astanalyq pressure is real!"
    ],
    player_capture: [
      "Hey! Watch your hands, jas! That was my favorite piece!",
      "Qap! That was dirty. But you've only made me angry."
    ],
    player_blunder: [
      "Oi-boy, what kind of move is that? Did your cat walk on the screen?",
      "Are you giving me gifts? I will gladly take them!"
    ],
    king_made: [
      "Tazh kydy! Crown me, jas! Now the real hunt begins!",
      "A King! Bow down, brat!"
    ],
    thinking: [
      "Hahaha, thinking how to crush you...",
      "Hold on, checking my angles..."
    ],
    victory: [
      "Оңай болды! Astana represent! Better luck next time, jas!",
      "Eee, that was a sweep! Shala-shashpa game over!"
    ],
    defeat: [
      "Қап! You got lucky, brat. Next time you won't survive!",
      "Ok, ok, you played well, jas. Good game."
    ]
  },
  // Boss 4: The Sage
  4: {
    game_start: [
      "The checkers board is a mirror of the mind. Clear your thoughts.",
      "Patience is the greatest weapon on these 64 squares."
    ],
    bot_capture: [
      "Every step forward has a shadow. You forgot yours.",
      "The leaf falls where the wind blows."
    ],
    player_capture: [
      "To gain, one must learn to lose. A fair trade.",
      "A piece departs, but the flow of the game continues."
    ],
    player_blunder: [
      "Impatience leads to fog. Calm your mind.",
      "A rushed move reveals the anxious heart."
    ],
    king_made: [
      "A crown is just metal; it is the path of the King that matters.",
      "Crowned, yet still humble."
    ],
    thinking: [
      "Listening to the board...",
      "Pondering the balance of forces..."
    ],
    victory: [
      "True victory lies not in capturing pieces, but in mastering patience.",
      "The stone remains still. Peace is restored."
    ],
    defeat: [
      "The river flows past the stone. You flowed around my defenses. Respect.",
      "A master class in fluidity. I bow to your style."
    ]
  },
  // Boss 5: The Grandmaster
  5: {
    game_start: [
      "You made it to the final board. Prepare for a lesson you won't forget.",
      "I do not make mistakes. I hope you can make this interesting."
    ],
    bot_capture: [
      "Crushed. Your position is collapsing.",
      "A minor piece is lost, soon your entire army follows."
    ],
    player_capture: [
      "An interesting attempt, but it changes nothing in the long run.",
      "You took a pawn. My grand strategy is unimpeded."
    ],
    player_blunder: [
      "That is a massive blunder. You have signed your defeat.",
      "A fatal miscalculation. It is already over."
    ],
    king_made: [
      "My King takes the board. Your options are zero.",
      "The crown lands. GG."
    ],
    thinking: [
      "Calculating mate in 8 moves...",
      "Evaluating your surrender options..."
    ],
    victory: [
      "Did you truly think you could stand against a Grandmaster? Back to the lobby.",
      "Calculated, executed, conquered. Standard business."
    ],
    defeat: [
      "Impossible... I miscalculated the end-game. You are a worthy champion.",
      "You found the one sequence that wins... Brilliant checkers."
    ]
  },
  // Default bot personalities
  'easy': {
    game_start: ["Hi! Let's play checkers.", "Good luck! Have fun."],
    bot_capture: ["Got one!", "Oops, jumped your piece!"],
    player_capture: ["Nice jump!", "Aha, you got my piece."],
    player_blunder: ["Oh, did you mean to put that there?", "That might be a mistake."],
    king_made: ["Wow, you got a King!", "Crowning my piece!"],
    thinking: ["Hmm, let's see...", "Where should I move?"],
    victory: ["Good game! Better luck next time.", "I won! Yay!"],
    defeat: ["Well played! You won.", "Oof, you got me! Good game."]
  },
  'medium': {
    game_start: ["Ready for a challenge? Good luck!", "Let's see who is better."],
    bot_capture: ["Captured! Keep your guard up.", "Got one. Watch your flanks."],
    player_capture: ["Nice move. I'll have to play harder.", "Good capture."],
    player_blunder: ["That leaves you vulnerable.", "A slip in your defense."],
    king_made: ["Promoting to King. Watch out!", "A King enters the field."],
    thinking: ["Thinking...", "Analyzing options..."],
    victory: ["Good game! You played well.", "Victory for me. Let's play again!"],
    defeat: ["Excellent game. You outplayed me.", "Congrats on the win!"]
  },
  'hard': {
    game_start: ["Welcome. I won't go easy on you.", "Prepare for a tight game."],
    bot_capture: ["Eliminated. Your lines are weakening.", "Capture completed."],
    player_capture: ["An aggressive play. Noted.", "A logical capture."],
    player_blunder: ["That is a mistake. I will exploit it.", "Position exposed. Big blunder."],
    king_made: ["My King is crowned. The end is near.", "Promotion secured."],
    thinking: ["Searching search tree...", "Evaluating minimax..."],
    victory: ["Checkmate in checkers. Game over.", "A logical conclusion. GG."],
    defeat: ["Incredible play. You beat my hard mode.", "Congratulations. You earned this victory."]
  }
};

export function getBossComment(
  bossId: number | undefined,
  difficulty: 'easy' | 'medium' | 'hard' | undefined,
  event: EventType
): string {
  const key = bossId && PERSONALITIES[bossId] ? bossId : (difficulty || 'medium');
  const personality = PERSONALITIES[key] || PERSONALITIES['medium'];
  const lines = personality[event];
  
  if (!lines || lines.length === 0) return '';
  return lines[Math.floor(Math.random() * lines.length)];
}
