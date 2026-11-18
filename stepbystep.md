# Step-by-Step: Snake "Catch the Coin" (BMAP Finals Lab Exam)

Due: **Wednesday, Nov 18, 2026, 11:59 PM** | Expo Snack | 60 pts | Individual

**How to use this:** do ONE step at a time. Run it in Snack and pass the **Checkpoint** before moving on. These are guides and key snippets. You assemble the final file yourself, so you can explain every line on camera.

---

## Rubric reminder

| Criteria | Pts |
|---|---|
| Two-screen navigation (name passed, back to Home) | 8 |
| Sprite and movement (stays inside field) | 5 |
| Reanimated (shared value + animated style + one more animation) | 6 |
| Objects, collision (own `isColliding`), score | 9 |
| Timer, Game Over, Restart | 7 |
| Code quality | 5 |
| Enhancement works / fits the game / handles problems | 6 / 3 / 3 |
| Originality | 3 |
| Demo and explanation | 7 |

---

## Step 1: Auto-moving snake

**Goal:** the snake moves by itself and turns with the d-pad.

**1a. Imports and constants**
```jsx
import { useState, useEffect, useRef } from 'react';
```
```jsx
const PLAYER_SIZE = 20;   // same as STEP
const START_X = 140;      // multiples of 20
const START_Y = 240;
const TICK_MS = 180;
const MAX_X = FIELD_W - PLAYER_SIZE;
const MAX_Y = FIELD_H - PLAYER_SIZE;
```

**1b. Delete:** `playerX`, `playerY`, `px`, `py`, `playerStyle`, the `useEffect` that animates `px`/`py`, and `moveLeft/Right/Up/Down`.

**1c. New state**
```jsx
const [snake, setSnake] = useState([{ x: START_X, y: START_Y }]);
const dirRef = useRef({ dx: 0, dy: -1 });
const snakeRef = useRef(snake);
snakeRef.current = snake;
```

**1d. `turn` (blocks 180-degree reversals)**
```jsx
const turn = (dx, dy) => {
  const d = dirRef.current;
  if (d.dx === -dx && d.dy === -dy) return;
  dirRef.current = { dx, dy };
};
```
Buttons: `onPress={() => turn(0, -1)}` (up), `turn(0, 1)` (down), `turn(-1, 0)` (left), `turn(1, 0)` (right).

**1e. `Segment` component** (above `App`)
```jsx
function Segment({ x, y, size, color }) {
  const sx = useSharedValue(x);
  const sy = useSharedValue(y);
  useEffect(() => {
    sx.value = withTiming(x, { duration: TICK_MS });
    sy.value = withTiming(y, { duration: TICK_MS });
  }, [x, y]);
  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: sx.value }, { translateY: sy.value }],
  }));
  return (
    <Animated.View
      style={[
        { position: 'absolute', left: 0, top: 0, width: size, height: size, backgroundColor: color },
        style,
      ]}
    />
  );
}
```

**1f. Tick loop**
```jsx
useEffect(() => {
  if (!playing) return;
  const tick = setInterval(() => {
    const head = snakeRef.current[0];
    const nx = head.x + dirRef.current.dx * STEP;
    const ny = head.y + dirRef.current.dy * STEP;
    if (nx < 0 || nx > MAX_X || ny < 0 || ny > MAX_Y) return;
    setSnake([{ x: nx, y: ny }, ...snakeRef.current.slice(0, -1)]);
  }, TICK_MS);
  return () => clearInterval(tick);
}, [playing]);
```

**1g. Render** (replaces the old player view)
```jsx
{snake.map((s, i) => (
  <Segment key={i} x={s.x} y={s.y} size={PLAYER_SIZE} color={i === 0 ? 'blue' : 'dodgerblue'} />
))}
```

**1h. Fix what broke**
- Collision effect: `const player = { x: snake[0].x, y: snake[0].y, width: PLAYER_SIZE, height: PLAYER_SIZE }`, and the dependency array uses `snake` instead of `playerX, playerY`.
- `moveEnemy`: use `snake[0]` for the "don't land on the player" check.
- `restart`: `setSnake([{ x: START_X, y: START_Y }])` and `dirRef.current = { dx: 0, dy: -1 }`.

**Checkpoint:** moves on its own, turns, can't reverse, stops at walls, freezes on GAME OVER.

---

## Step 2: Growth and food

**Goal:** eating the coin grows the snake.

Add a ref for the coin position:
```jsx
const coinRef = useRef({ x: coinX, y: coinY });
coinRef.current = { x: coinX, y: coinY };
```

Inside the tick, after computing `nx` and `ny`:
```jsx
const newHead = { x: nx, y: ny, width: PLAYER_SIZE, height: PLAYER_SIZE };
const coinBox = { x: coinRef.current.x, y: coinRef.current.y, width: COIN_SIZE, height: COIN_SIZE };
const ate = isColliding(newHead, coinBox);

// YOUR JOB:
// 1. newSnake = ate ? keep the tail : drop the tail
// 2. setSnake(newSnake)
// 3. if (ate): setScore, setTime (+BONUS_TIME), then moveEnemy() and moveCoin(newEnemy)
```

Rules:
- Do NOT call `setScore`, `setTime` or `moveCoin` inside a `setSnake(prev => ...)` updater. Updaters must be pure, or points can double.
- Keep the enemy collision check in the old effect (watching `snake`). Delete only the `isColliding(player, coin)` branch from it.

**Checkpoint:** each coin = +1 score, +3 seconds, +1 segment. The red box still ends the game.

---

## Step 3: Grid spawns and self-collision

**3a.** Set `COIN_SIZE = 20`, keep `ENEMY_SIZE = 40`, so everything lines up with `STEP = 20`.

**3b. Grid-snapped random helper** (above `App`)
```jsx
const randomCell = size =>
  Math.floor(Math.random() * ((FIELD_W - size) / STEP + 1)) * STEP;
```

**3c. `moveCoin` retries until the spot is free**
```jsx
const moveCoin = enemyBox => {
  let x, y, box, bad;
  do {
    x = randomCell(COIN_SIZE);
    y = randomCell(COIN_SIZE);
    box = { x, y, width: COIN_SIZE, height: COIN_SIZE };
    bad =
      isColliding(box, enemyBox) ||
      snakeRef.current.some(s =>
        isColliding(box, { x: s.x, y: s.y, width: PLAYER_SIZE, height: PLAYER_SIZE })
      );
  } while (bad);
  setCoinX(x);
  setCoinY(y);
};
```
Do the same in `moveEnemy` with `ENEMY_SIZE`, checking against the snake body.

**3d. Self-collision in the tick** (after `ate`, before `setSnake`)
```jsx
const body = ate ? snakeRef.current : snakeRef.current.slice(0, -1);
const hitSelf = body.some(s =>
  isColliding(newHead, { x: s.x, y: s.y, width: PLAYER_SIZE, height: PLAYER_SIZE })
);
if (hitSelf) { setGameOver(true); return; }
```
The tail is excluded when you did not eat, because it moves out of the way this tick.

**Checkpoint:** head lines up exactly with the coin, no free points from spawns, biting your tail ends the game.

---

## Step 4: Two screens

**4a.** Add `TextInput` to your `react-native` import.

**4b. New `App`** (state-based navigation)
```jsx
export default function App() {
  const [screen, setScreen] = useState('home');
  const [name, setName] = useState('');
  return screen === 'home' ? (
    <HomeScreen name={name} setName={setName} onStart={() => setScreen('game')} />
  ) : (
    <GameScreen name={name} onHome={() => setScreen('home')} />
  );
}
```

**4c. `HomeScreen`**
```jsx
function HomeScreen({ name, setName, onStart }) {
  const [msg, setMsg] = useState('');
  const start = () => {
    if (name.trim() === '') { setMsg('Please enter your name first.'); return; }
    onStart();
  };
  return (
    <View style={styles.container}>
      <Text style={styles.title}>CATCH THE COIN</Text>
      <Text style={styles.info}>Steer the snake, eat coins (+3s), avoid the red box!</Text>
      <TextInput
        style={styles.input}
        placeholder="Your name"
        placeholderTextColor="#888"
        value={name}
        onChangeText={setName}
      />
      {msg !== '' && <Text style={styles.error}>{msg}</Text>}
      <Button title="START" onPress={start} />
      {/* high score goes here in step 6 */}
    </View>
  );
}
```
Add `input` and `error` styles yourself (white text, border, width about 200).

**4d. `GameScreen`:** rename your current `App` to `GameScreen({ name, onHome })`, then:
- delete the `started` state and the START overlay
- `const playing = !gameOver;`
- timer effect: remove the `!started` guard
- game-over effect: `if (time === 0) setGameOver(true)`
- show `{name}` in the HUD next to the score

**Checkpoint:** empty name shows your message. A typed name appears in the game HUD.

---

## Step 5: PLAY AGAIN and BACK TO HOME

**5a. `restart` must reset everything**
```jsx
setScore(0); setTime(START_TIME); setGameOver(false);
setSnake([{ x: START_X, y: START_Y }]);
dirRef.current = { dx: 0, dy: -1 };
setEnemyX(ENEMY_START_X); setEnemyY(ENEMY_START_Y);
enemyOpacity.value = 1;
moveCoin({ x: ENEMY_START_X, y: ENEMY_START_Y, width: ENEMY_SIZE, height: ENEMY_SIZE });
```
`snakeRef.current` only updates on the next render. If that bothers you, set `snakeRef.current` yourself in `restart`.

**5b.** Add to the GAME OVER overlay: `<Button title="BACK TO HOME" onPress={onHome} />`

**5c. Cleanup:** leaving the game unmounts `GameScreen`, which resets state. Make sure every `setInterval` effect returns `clearInterval`.

**Checkpoint:** die, PLAY AGAIN gives a clean game. Die, BACK TO HOME, START gives a fresh game with the name still filled in.

---

## Step 6: High score with AsyncStorage

**6a.** In Snack, add the `@react-native-async-storage/async-storage` dependency, then `import AsyncStorage from '@react-native-async-storage/async-storage';`

**6b. Save on game over** (in `GameScreen`, replacing the old `bestScore` effect)
```jsx
const [saveError, setSaveError] = useState(false);
useEffect(() => {
  if (!gameOver) return;
  (async () => {
    try {
      const v = await AsyncStorage.getItem('highScore');
      const best = v === null ? 0 : Number(v);
      if (score > best) {
        await AsyncStorage.setItem('highScore', String(score));
        setBestScore(score);
      } else {
        setBestScore(best);
      }
    } catch (e) {
      setSaveError(true);
    }
  })();
}, [gameOver]);
```
Show "Couldn't save high score" on the GAME OVER overlay when `saveError` is true.

**6c. Load on Home** (in `HomeScreen`)
```jsx
const [high, setHigh] = useState(null);
const [loadError, setLoadError] = useState(false);
useEffect(() => {
  (async () => {
    try {
      const v = await AsyncStorage.getItem('highScore');
      setHigh(v === null ? 0 : Number(v));
    } catch (e) {
      setLoadError(true);
    }
  })();
}, []);
```
Display: `loadError ? 'High score unavailable' : high === null ? 'Loading...' : 'High score: ' + high`

**Checkpoint:** set a high score, reload Snack, it is still there. A lower score does not overwrite it.

---

## Step 7: Polish, test, submit

- Run the full PDF flow: name, START, play, GAME OVER, PLAY AGAIN, BACK TO HOME, high score on Home.
- Clear all console warnings and errors.
- Download the project from Snack as a zip, then put it in **`Lastname_CatchTheCoin.zip`**.
- Unzipped or misnamed files = **-5 pts**.
- The Teams post says one zip with code AND video. The PDF says video attached separately. Reply to the post and ask which one your instructor wants.

**Demo script (2 to 3 minutes)**
1. Say your full name.
2. Introduce the game, show Home, type name, press START.
3. Play: movement, animation, coin, score, timer.
4. Let it end: GAME OVER, PLAY AGAIN, BACK TO HOME.
5. Show the high score and explain how AsyncStorage keeps it.

---

## Be ready to explain

1. Why is `dirRef` a ref and not state?
2. Why does each snake segment need its own component?
3. How does `isColliding` work (the four comparisons)?
4. What happens each tick, and why does skipping the tail removal make the snake grow?
5. Why is the tail excluded from the self-collision check when you did not eat?
6. How does the high score survive closing the app?
7. Where does the player's name travel from Home to the game?

---

## Progress checklist

- [ ] Step 1: auto-moving snake
- [ ] Step 2: growth and food
- [ ] Step 3: grid spawns and self-collision
- [ ] Step 4: Home and Game screens, name passed
- [ ] Step 5: PLAY AGAIN and BACK TO HOME
- [ ] Step 6: high score with AsyncStorage
- [ ] Step 7: test, zip, record demo, submit
