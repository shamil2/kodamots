# Product Requirements Document — SpeedBac Digital Game

## 1. Product Summary

**SpeedBac** is a fast-paced multiplayer word game inspired by the classic “Petit Bac / Baccalauréat” game. In the classic Petit Bac, players must find words matching predefined categories and starting with a chosen letter. In Speed Bac, the experience is accelerated: each player has letter cards, a theme is revealed, and players race to give valid answers starting with one of their available letters.

The digital product will recreate this party-game experience for web and mobile, supporting real-time multiplayer, private rooms, public matchmaking, score tracking, theme packs, moderation, and optional AI-assisted validation.

---

## 2. Product Vision

Create the most accessible and fun online version of SpeedBac, allowing friends, families, classrooms, and remote teams to play quick word battles together from any device.

The product should feel:

* **Fast**: no long setup, short rounds, instant feedback.
* **Social**: voice/chat reactions, funny answers, disputes, rematches.
* **Fair**: clear rules, voting/validation, anti-cheat controls.
* **Replayable**: many categories, custom packs, difficulty modes.
* **Accessible**: playable by children, adults, and mixed groups.

---

## 3. Target Users

### 3.1 Primary Users

**Casual friend groups**
People looking for a quick online party game during evenings, calls, or remote hangouts.

**Families**
Parents and children who want a simple word game playable together.

**Teachers and facilitators**
Teachers, trainers, and language tutors using the game for vocabulary, creativity, and speed-thinking exercises.

**Remote teams**
Companies using the game as an icebreaker or quick team-building activity.

### 3.2 Player Personas

**The Fast Player**
Wants quick rounds, low friction, and immediate gameplay.

**The Competitive Player**
Cares about score, rankings, streaks, fairness, and challenges.

**The Host**
Creates rooms, chooses rules, invites players, manages disputes.

**The Young Player**
Needs simpler categories, family-safe words, and visual guidance.

---

## 4. Game Rules — Digital Adaptation

### 4.1 Reference Rules

Speed Bac is commonly described as a rapid word game where players receive letter cards, a theme is revealed, and each player must quickly find a word matching the theme and starting with one of their letters. Some versions distribute 5 cards per player, reveal a theme, and the winner is the first player to get rid of all cards.

Accessible rule descriptions also mention that when a player plays the third valid card for the current theme, the theme changes. The round ends when a player empties their hand. Remaining cards can count as penalty points, and some sources describe a game ending when a player reaches 40 points, with the lowest score winning.

### 4.2 Core Digital Rule Set

The first product version will use the following default rules:

1. Each player joins a game room.
2. Each player receives **5 letter cards**.
3. A **theme/category card** is revealed.
4. Players must submit a word that:

   * starts with one of their available letters;
   * matches the current theme;
   * has not already been used during the current round;
   * is accepted by the group or by validation rules.
5. When a valid answer is submitted, the player uses that letter card.
6. After **3 valid answers** for the current theme, a new theme is revealed.
7. The round ends when one player has no cards left.
8. Players receive penalty points for remaining cards.
9. A full game ends when:

   * a player reaches the configured penalty threshold, default **40 points**; or
   * the configured number of rounds is completed.
10. The player with the **lowest score** wins.

### 4.3 Alternative Modes

**Classic Petit Bac Mode**
All players receive the same letter and must fill several categories before time ends.

**Speed Mode**
Players race to play cards as fast as possible. No turn order.

**Turn-Based Mode**
Players answer one after another, useful for kids, classrooms, and accessibility.

**Kids Mode**
Simpler themes, fewer cards, no adult content, shorter sessions. Speed Bac Kids is commonly described as an adapted version for younger players with more accessible categories.

**Adult / Carnage Mode**
Optional mature category pack for 16+ users. Some Speed Bac versions are positioned as more adult or “épicée” versions.

---

## 5. Goals and Non-Goals

### 5.1 Product Goals

* Allow users to create and join a SpeedBac game in less than 60 seconds.
* Support real-time multiplayer for 2 to 8 players.
* Provide a fun, fast, low-friction digital party-game experience.
* Support room sharing by link or code.
* Include enough categories and letters for high replayability.
* Provide fair validation through voting, host decisions, and optional AI assistance.
* Make the game playable on desktop, tablet, and mobile.

### 5.2 Non-Goals for MVP

* No real-money betting.
* No complex tournament infrastructure in MVP.
* No full social network in MVP.
* No voice/video chat in MVP, although external voice tools should work well alongside the game.
* No fully automated perfect semantic validation in MVP, because category-word correctness can be subjective.

---

## 6. Platforms

### MVP Platforms

* Responsive web app.
* Mobile browser support.

### Future Platforms

* iOS app.
* Android app.
* Desktop PWA.
* Smart TV / party mode.

---

## 7. User Journeys

### 7.1 Host Creates a Game

1. User clicks **Create Game**.
2. User chooses:

   * language;
   * category pack;
   * number of cards;
   * score limit;
   * validation mode;
   * private or public room.
3. Game room is created.
4. Host shares invite link or room code.
5. Players join.
6. Host starts the game.

### 7.2 Player Joins a Game

1. Player opens invite link.
2. Player enters nickname.
3. Player optionally chooses avatar.
4. Player lands in lobby.
5. Player sees other players.
6. Game starts when host launches.

### 7.3 Playing a Round

1. Each player sees 5 letter cards.
2. A theme appears in the center.
3. Player types or speaks an answer.
4. Player selects the letter card used, or the system detects it.
5. Answer appears to all players.
6. Other players can accept, challenge, or react.
7. If accepted, the card is removed from the player’s hand.
8. After 3 valid answers, the theme changes.
9. Round ends when a player has no cards.

### 7.4 Dispute Flow

1. A player challenges an answer.
2. A short voting timer starts.
3. Players vote **Accept** or **Reject**.
4. If rejected:

   * the answer is removed;
   * the card returns to the player;
   * optional penalty applies.
5. If accepted:

   * the answer remains valid;
   * the game continues.

### 7.5 End of Game

1. Final scores are displayed.
2. Winner is highlighted.
3. Players see:

   * fastest answer;
   * funniest answer;
   * most challenged player;
   * best streak.
4. Players can rematch with the same settings.

---

## 8. Functional Requirements

## 8.1 Account and Identity

### MVP

* Players can play as guests.
* Guest players enter a nickname.
* Host can rename or remove players.
* Basic avatar selection.

### Future

* Optional account creation.
* Persistent stats.
* Friends list.
* Player history.
* Achievements.

---

## 8.2 Lobby

### Requirements

* Create private room.
* Join by link.
* Join by code.
* Display player list.
* Display host badge.
* Allow host to configure game settings.
* Allow players to mark themselves ready.
* Host can start game when minimum players are present.

### Acceptance Criteria

* A user can create a room and invite another player successfully.
* Players joining late appear in the lobby.
* Host can change settings before game start.
* Non-host players cannot start the game unless host delegates control.

---

## 8.3 Game Settings

### Configurable Settings

* Language: French, English, future languages.
* Number of players: 2–8.
* Cards per player: default 5.
* Valid answers per theme before theme change: default 3.
* Score limit: default 40 penalty points.
* Number of rounds: optional.
* Timer per answer: optional.
* Timer per round: optional.
* Validation mode:

  * group voting;
  * host validation;
  * automatic dictionary check;
  * AI-assisted validation;
  * no validation.
* Category pack:

  * Classic;
  * Funny;
  * Kids;
  * Adult;
  * Custom.

---

## 8.4 Game Board

### Player View

Each player sees:

* Current theme.
* Their letter cards.
* Text input for answer.
* Submit button.
* Timer, if enabled.
* Scoreboard.
* Recent answers.
* Challenge button.
* Current round status.

### Spectator View

Spectators can see:

* Current theme.
* Scoreboard.
* Recent answers.
* Round progress.

Spectators cannot submit answers or vote unless allowed by host.

---

## 8.5 Letter Cards

### Requirements

* Each player starts with a configured number of letters.
* Letters are randomly distributed.
* Letter distribution should avoid impossible hands where possible.
* Rare letters can have higher penalty value.
* Used cards disappear from the player’s hand after a valid answer.
* Invalidated cards return to the player.

### Optional Letter Balancing

For French, letters should be weighted so common starting letters appear more frequently than rare letters. Rare letters such as K, W, X, Y, and Z should appear less often or only in advanced modes.

---

## 8.6 Theme Cards

### Requirements

* Themes are randomly selected from the chosen category pack.
* The same theme should not repeat in the same game unless the theme deck is exhausted.
* Theme changes after the configured number of valid answers.
* Theme should be clearly visible to all players.

### Example Themes

Classic:

* Animal
* City
* Country
* Food
* Job
* Object
* Sport
* Movie
* First name
* Plant

Funny:

* Something you find in a fridge
* Something that makes noise
* Something you should not say at work
* A bad excuse
* Something sticky
* Something that smells bad

Kids:

* Animal
* Color
* Fruit
* Toy
* Cartoon character
* School object

Adult mode should be disabled by default and must require explicit selection.

---

## 8.7 Answer Submission

### Requirements

* Player types an answer.
* Player selects the card/letter used.
* System checks that the answer starts with the selected letter.
* System normalizes accents and case.
* System prevents exact duplicate answers in the same round.
* System displays the answer to all players.
* System starts validation flow depending on room settings.

### Text Normalization

The system should treat these as equivalent for starting-letter validation:

* É = E
* È = E
* Ê = E
* À = A
* Ç = C
* Ô = O

Example: “Éléphant” should be valid for letter E.

---

## 8.8 Validation System

### MVP Validation Modes

#### Group Vote

* Any player can challenge an answer within a short time window.
* If challenged, players vote.
* Majority decides.
* Host breaks ties.

#### Host Validation

* Host accepts or rejects answers.
* Best for classrooms or family games.

#### Manual Trust Mode

* Answers are accepted automatically.
* Players self-police.

### Future Validation Modes

#### Dictionary Validation

* Checks if the submitted word exists.
* Does not guarantee category correctness.

#### AI-Assisted Validation

* AI estimates whether the answer matches the theme.
* AI provides explanation.
* Players or host can override the AI.

Important: AI validation should be assistive, not absolute, because many categories are subjective.

---

## 8.9 Challenge and Penalty Rules

### Requirements

* Players can challenge an answer.
* Challenge must happen within configurable time window, default 5 seconds.
* If answer is rejected:

  * the card returns to the player;
  * the answer is removed from history;
  * optional penalty card is added.
* If answer is accepted:

  * challenger receives no penalty in MVP;
  * future mode may penalize abusive challenges.

### Anti-Abuse

* Limit repeated challenges by the same player.
* Track challenge accuracy.
* Host can mute challenge rights for a player.

---

## 8.10 Scoring

### Default Scoring

The game uses penalty scoring:

* At the end of a round, players receive penalty points for remaining cards.
* Lower score is better.
* Game ends when a player reaches the score limit.
* Player with the lowest score wins.

This matches commonly described Speed Bac scoring patterns where remaining cards give penalty points and the game can end around a 40-point threshold.

### Card Values

MVP options:

* Simple mode: every remaining card = 1 point.
* Advanced mode: cards have values from 1 to 3 penalty points.
* Rare-letter mode: rare letters have lower penalty or special bonuses to avoid unfairness.

### Scoreboard

Display:

* Current score.
* Cards remaining.
* Round wins.
* Fastest answer.
* Valid answer count.
* Rejected answer count.

---

## 8.11 Timers

### Timer Types

* Lobby countdown.
* Round timer.
* Challenge timer.
* AFK timer.
* Rematch timer.

### Timer Modes

**No Timer**
Recommended for family/kids.

**Soft Timer**
Players can continue, but bonus points are disabled after time.

**Hard Timer**
Input closes when time ends.

---

## 8.12 Multiplayer and Real-Time Requirements

### Requirements

* Real-time synchronization of:

  * player joins/leaves;
  * answers;
  * card usage;
  * theme changes;
  * challenges;
  * votes;
  * score updates.
* Reconnection support.
* Host migration if host disconnects.
* Grace period for disconnected players.
* Prevent double submissions.

### Latency Requirement

* Answer submission should appear to all players in under 500 ms under normal network conditions.
* Game state should remain authoritative on the server.

---

## 8.13 Public Matchmaking

### MVP

Private rooms only.

### Future

* Quick Play.
* Region-based matchmaking.
* Language-based matchmaking.
* Skill/experience matching.
* Public family-safe rooms.

---

## 8.14 Custom Category Packs

### MVP

Predefined packs only.

### Future

Hosts can create custom packs:

* Pack name.
* Language.
* Age rating.
* Theme list.
* Private/public visibility.
* Import/export CSV.
* AI-generated theme suggestions.
* Community rating.

---

## 8.15 Chat and Reactions

### MVP

* Emoji reactions.
* Quick reactions:

  * 😂
  * 😱
  * 🤔
  * ✅
  * ❌
  * 🔥

### Future

* Text chat.
* Voice chat integration.
* Giphy/sticker reactions.
* “Funniest answer” voting.

---

## 8.16 Moderation and Safety

### Requirements

* Profanity filter for family-safe rooms.
* Report player.
* Kick player.
* Ban from room.
* Disable adult packs for underage/kids mode.
* Host moderation controls.
* AI moderation for custom categories and answers in public rooms.

### Safety Rules

* Adult mode must be opt-in.
* Public rooms must default to family-safe mode.
* Custom public packs require moderation before discovery listing.

---

## 9. Non-Functional Requirements

## 9.1 Performance

* Room creation under 2 seconds.
* Game start under 2 seconds after host click.
* Answer broadcast under 500 ms in normal conditions.
* Support at least 10,000 concurrent rooms in scalable architecture.
* Support 2–8 active players per MVP room.

## 9.2 Availability

* Target MVP availability: 99.5%.
* Target production availability after launch: 99.9%.

## 9.3 Scalability

Architecture should support horizontal scaling of:

* Web frontend.
* API backend.
* WebSocket gateway.
* Game room workers.
* Redis/pub-sub state layer.
* Database.

## 9.4 Security

* HTTPS everywhere.
* Server-authoritative game state.
* Rate limiting on answer submissions.
* Anti-spam for room creation.
* Input sanitization.
* Basic bot protection for public rooms.
* No sensitive personal data required for guest play.

## 9.5 Privacy

* Guest play should not require email.
* Store minimal data.
* Allow account deletion for registered users.
* Do not store voice/video in MVP.
* Avoid storing raw chat longer than necessary.

## 9.6 Accessibility

* Keyboard-only support.
* Mobile-friendly controls.
* High contrast mode.
* Dyslexia-friendly font option.
* Screen reader labels.
* Reduced motion mode.
* Configurable timers for slower players.

---

## 10. Analytics and Metrics

### Acquisition Metrics

* Landing page conversion.
* Room creation rate.
* Invite link open rate.
* New player join rate.

### Engagement Metrics

* Games started.
* Games completed.
* Average rounds per game.
* Average rematches.
* Average session length.
* Number of answers submitted per game.

### Quality Metrics

* Challenge rate.
* Rejected answer rate.
* Disconnection rate.
* Rage quit / early leave rate.
* Average latency.

### Monetization Metrics, Future

* Premium conversion.
* Category pack purchases.
* Custom pack creation rate.
* Subscription retention.

---

## 11. MVP Scope

### MVP Must-Have

* Responsive web app.
* Guest nickname.
* Create private room.
* Join by link/code.
* Lobby.
* Host starts game.
* 2–8 players.
* 5 letter cards per player.
* Random theme.
* Real-time answer submission.
* Manual/group validation.
* Challenge and vote.
* Theme changes after 3 valid answers.
* Round ends when a player empties hand.
* Penalty score calculation.
* Game end screen.
* Rematch.
* French language.
* Basic category pack.
* Basic moderation: kick player.

### MVP Should-Have

* English language.
* Kids category pack.
* Emoji reactions.
* Host validation mode.
* Configurable score limit.
* Reconnection support.

### MVP Could-Have

* AI validation.
* Custom packs.
* Public matchmaking.
* Player accounts.
* Stats and achievements.

### MVP Won’t-Have

* Native mobile apps.
* Voice chat.
* Tournaments.
* Marketplace.
* Paid packs.
* Full AI moderation.

---

## 12. Future Roadmap

### Phase 1 — MVP

Goal: playable private-room SpeedBac.

Features:

* Core game loop.
* Real-time multiplayer.
* Manual validation.
* Basic scoring.
* French categories.

### Phase 2 — Better Party Experience

Features:

* English support.
* Reactions.
* More packs.
* Kids mode.
* Better scoreboard.
* Rematch improvements.
* Shareable game results.

### Phase 3 — Accounts and Progression

Features:

* User accounts.
* Persistent profiles.
* Stats.
* Achievements.
* Friend invites.
* Match history.

### Phase 4 — AI and Customization

Features:

* AI-assisted answer validation.
* AI-generated theme packs.
* Custom private packs.
* Custom public packs with moderation.
* Teacher mode.

### Phase 5 — Public and Monetization

Features:

* Public matchmaking.
* Ranked casual leaderboard.
* Premium packs.
* Mobile apps.
* Seasonal events.

---

## 13. AI Features

## 13.1 AI-Assisted Answer Validation

### Purpose

Help players decide whether an answer matches a theme.

### Example

Theme: “Something you find in a kitchen”
Letter: “F”
Answer: “Fourchette”
AI result: likely valid.

Theme: “Animal”
Letter: “T”
Answer: “Table”
AI result: invalid.

### Requirements

* AI response must include:

  * valid / invalid / uncertain;
  * short explanation;
  * confidence level.
* Host or group vote can override AI.
* AI validation should not block gameplay for too long.
* If AI response takes more than 2 seconds, fallback to manual validation.

---

## 13.2 AI Theme Generation

Hosts can generate custom theme packs.

Example prompt:

“Generate 50 funny family-safe SpeedBac themes in French for players aged 10+.”

The system should review generated themes for safety before adding them.

---

## 13.3 AI Moderation

Use AI moderation for:

* offensive answers;
* adult content in family rooms;
* hate speech;
* harassment;
* unsafe custom category packs.

---

## 14. Technical Architecture

## 14.1 Suggested Stack

### Frontend

* Next.js or React.
* Tailwind CSS.
* WebSocket client.
* PWA support.

### Backend

* Node.js/NestJS or Go.
* WebSocket gateway.
* REST API for room creation and configuration.
* Server-authoritative game engine.

### Real-Time Layer

* WebSockets.
* Redis Pub/Sub or Redis Streams.
* Optional Socket.IO for faster MVP development.

### Database

* PostgreSQL for persistent data.
* Redis for active game state and room sessions.

### AI Layer

* Optional LLM API.
* Prompt templates for validation.
* Moderation endpoint.
* Caching for repeated answers.

---

## 14.2 High-Level Architecture

```text
Client Web/Mobile
      |
      | HTTPS + WebSocket
      v
API Gateway / WebSocket Gateway
      |
      +--> Auth / Guest Session Service
      |
      +--> Game Room Service
      |       |
      |       +--> Redis Active State
      |       +--> Game Engine
      |
      +--> Validation Service
      |       |
      |       +--> Dictionary
      |       +--> AI Validator
      |
      +--> Moderation Service
      |
      +--> PostgreSQL
```

---

## 15. Core Data Model

### User

```json
{
  "id": "uuid",
  "type": "guest | registered",
  "nickname": "string",
  "avatar": "string",
  "createdAt": "datetime"
}
```

### Room

```json
{
  "id": "uuid",
  "code": "ABC123",
  "hostUserId": "uuid",
  "status": "lobby | playing | finished",
  "language": "fr",
  "settings": {},
  "createdAt": "datetime"
}
```

### GameSettings

```json
{
  "cardsPerPlayer": 5,
  "answersBeforeThemeChange": 3,
  "scoreLimit": 40,
  "validationMode": "group_vote",
  "timerMode": "none",
  "categoryPackId": "classic_fr"
}
```

### PlayerState

```json
{
  "userId": "uuid",
  "roomId": "uuid",
  "score": 0,
  "cards": ["A", "B", "M", "S", "T"],
  "connected": true,
  "ready": true
}
```

### Theme

```json
{
  "id": "uuid",
  "text": "Animal",
  "language": "fr",
  "packId": "classic_fr",
  "ageRating": "family"
}
```

### Answer

```json
{
  "id": "uuid",
  "roomId": "uuid",
  "roundId": "uuid",
  "playerId": "uuid",
  "themeId": "uuid",
  "letter": "A",
  "answer": "Antilope",
  "status": "pending | accepted | rejected",
  "submittedAt": "datetime"
}
```

---

## 16. API Requirements

### Room API

```http
POST /rooms
GET /rooms/{code}
POST /rooms/{code}/join
POST /rooms/{code}/leave
PATCH /rooms/{code}/settings
POST /rooms/{code}/start
```

### Game API

```http
POST /rooms/{code}/answers
POST /rooms/{code}/answers/{answerId}/challenge
POST /rooms/{code}/answers/{answerId}/vote
POST /rooms/{code}/rematch
```

### WebSocket Events

Client to server:

```text
player.ready
game.start
answer.submit
answer.challenge
answer.vote
reaction.send
```

Server to client:

```text
room.updated
game.started
theme.changed
answer.submitted
answer.accepted
answer.rejected
round.ended
game.ended
player.disconnected
```

---

## 17. UX Requirements

## 17.1 Design Principles

* Game state must always be obvious.
* Letter cards must be large and tappable.
* Current theme must be central.
* Submit flow must be fast.
* Mobile users should be able to answer with one hand.
* Reactions should enhance fun without blocking gameplay.

## 17.2 Key Screens

### Landing Page

* “Create Game”
* “Join Game”
* Short explanation.
* Language selector.

### Lobby

* Room code.
* Invite link.
* Player list.
* Settings panel.
* Ready status.
* Start button.

### Game Screen

* Current theme.
* Letter cards.
* Answer input.
* Submit button.
* Scoreboard.
* Answer feed.
* Challenge actions.

### Round Summary

* Round winner.
* Remaining cards.
* Points added.
* Fun stats.

### Game End

* Winner.
* Full ranking.
* Best answers.
* Rematch button.
* Share result.

---

## 18. Edge Cases

### Player Disconnects

* Keep player in game for 60 seconds.
* If they return, restore state.
* If they do not return, host can remove them.
* If host disconnects, assign host to next connected player.

### Duplicate Answers

* Exact duplicates are rejected.
* Normalized duplicates are rejected:

  * “élephant” and “éléphant” count as same.
  * Case-insensitive comparison.
* Similar answers are not automatically rejected in MVP.

### Invalid Letter

* If answer does not start with selected letter, reject immediately.
* Show clear message.

### No One Can Answer

* Host can skip theme.
* Auto-skip after timeout if enabled.

### Ties

* If multiple players end with same lowest score:

  * declare shared victory; or
  * run sudden-death round, depending on settings.

---

## 19. Monetization Options

### Free

* Private rooms.
* Basic packs.
* Guest play.
* Limited custom packs.

### Premium

* More category packs.
* Custom packs.
* AI validation.
* Advanced stats.
* Room themes.
* Larger rooms.
* No ads.

### B2B / Education

* Teacher dashboard.
* Classrooms.
* Vocabulary packs.
* Student progress.
* Export results.
* Safe mode locked by default.

---

## 20. Success Metrics

### MVP Success

* 70% of created rooms start a game.
* 60% of started games complete.
* Average game session above 10 minutes.
* At least 30% rematch rate.
* Less than 5% technical disconnection rate.
* Average answer latency under 500 ms.

### Product-Market Fit Signals

* Users create custom packs.
* Users invite friends repeatedly.
* High rematch rate.
* Organic sharing of game results.
* Teachers or facilitators request group features.

---

## 21. Risks and Mitigations

### Risk: Subjective Answer Validation

Mitigation:

* Group voting.
* Host override.
* AI as assistant, not judge.
* Clear challenge flow.

### Risk: Real-Time Desync

Mitigation:

* Server-authoritative state.
* Event sequencing.
* Reconnect recovery.
* Redis-backed state.

### Risk: Toxic Answers in Public Games

Mitigation:

* Family-safe default.
* Moderation filters.
* Reports.
* Kick/ban.
* Public-room restrictions.

### Risk: Game Feels Too Slow Digitally

Mitigation:

* Minimal clicks.
* Keyboard shortcuts.
* Auto-focus input.
* Fast animations.
* Skip unnecessary confirmations.

### Risk: AI Validation Feels Wrong

Mitigation:

* Always allow human override.
* Show confidence.
* Use “uncertain” state.
* Do not use AI as sole authority in MVP.

---

## 22. Acceptance Criteria for MVP Launch

The MVP is ready to launch when:

1. A host can create a room.
2. Players can join by link or code.
3. Host can start a game.
4. Each player receives letter cards.
5. A theme is displayed.
6. Players can submit answers in real time.
7. The system validates starting letters.
8. Players can challenge answers.
9. Group vote can accept or reject answers.
10. Cards are removed after accepted answers.
11. Theme changes after 3 valid answers.
12. Round ends when one player has no cards.
13. Scores are calculated.
14. Game ends based on score limit or round limit.
15. Players can rematch.
16. Game works on desktop and mobile browsers.
17. Basic moderation exists.
18. The app remains stable during a full game with at least 6 players.

---

## 23. Open Questions

1. Should MVP use penalty scoring only, or also reward fastest answers?
2. Should rare letters be included in default mode?
3. Should the default game end at 40 penalty points or after a fixed number of rounds?
4. Should answers be typed only, or should voice input be supported later?
5. Should adult packs exist at launch or be delayed?
6. Should public matchmaking be delayed until moderation is mature?
7. Should AI validation be included in MVP or Phase 4?
8. Should custom category packs be private-only at first?

---

## 24. Recommended MVP Decision

For the first version, build:

* private rooms only;
* guest play only;
* French language first;
* 5 cards per player;
* 3 valid answers before theme change;
* penalty scoring;
* score limit of 40;
* group-vote validation;
* no AI dependency in the core game loop.

This keeps the MVP close to the known Speed Bac experience while avoiding the hardest risks: public moderation, subjective AI validation, and account complexity.
