/* ─────────────────────────────────────────────────────────────────────────
   Catch the Coin — created by "wei" (Herwin D. Datinguinoo)
   GitHub:   https://github.com/Weiyhn
   Facebook: https://www.facebook.com/thisiswin
   Discord:  weiyhn

   All game logic lives in this file. The author credit below is load-bearing:
   the app will not run if it is removed or altered.
   ───────────────────────────────────────────────────────────────────────── */
/* eslint-disable react-hooks/immutability -- Reanimated shared values are intentionally mutated through `.value`. */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useRef, useState } from 'react';
import { Button, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AUTHOR, AUTHOR_GITHUB, verifyCredit } from '../credit';

// Load-bearing credit: the app throws on startup if the author credit is gone.
verifyCredit(AUTHOR);

// ---------------------------------------------------------------- constants
const STEP = 20; // one grid cell
const PLAYER_SIZE = 20; // one snake segment = one cell
const COIN_SIZE = 20; // coin = one cell
const ENEMY_SIZE = 40; // enemy = 2x2 cells
const FIELD_W = 300; // 15 cells wide
const FIELD_H = 300; // 15 cells tall
const START_X = 140; // snake head start (multiple of STEP)
const START_Y = 240;
const ENEMY_START_X = 20;
const ENEMY_START_Y = 20;
const TICK_MS = 180; // how fast the snake moves
const START_TIME = 20; // seconds on the clock
const BONUS_TIME = 3; // seconds gained per coin
const MAX_X = FIELD_W - PLAYER_SIZE;
const MAX_Y = FIELD_H - PLAYER_SIZE;
const HIGH_SCORE_KEY = 'highScore';

type Box = { x: number; y: number; width: number; height: number };
type Point = { x: number; y: number };
type Dir = { dx: number; dy: number };

// Axis-aligned bounding-box collision: the rectangles overlap on both axes.
function isColliding(a: Box, b: Box) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

// Random position snapped to the grid, inside the field.
const randomCell = (size: number) =>
  Math.floor(Math.random() * ((FIELD_W - size) / STEP + 1)) * STEP;

const segmentBox = (p: Point): Box => ({
  x: p.x,
  y: p.y,
  width: PLAYER_SIZE,
  height: PLAYER_SIZE,
});

// -------------------------------------------------- animated snake segment
function Segment({
  x,
  y,
  size,
  color,
}: {
  x: number;
  y: number;
  size: number;
  color: string;
}) {
  const sx = useSharedValue(x);
  const sy = useSharedValue(y);

  useEffect(() => {
    // A normal step is one cell; anything much larger means the segment wrapped
    // to the opposite edge, so snap instead of sliding across the whole field.
    const wrapped =
      Math.abs(x - sx.value) > STEP * 2 || Math.abs(y - sy.value) > STEP * 2;
    sx.value = wrapped ? x : withTiming(x, { duration: TICK_MS });
    sy.value = wrapped ? y : withTiming(y, { duration: TICK_MS });
  }, [x, y, sx, sy]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: sx.value }, { translateY: sy.value }],
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: 0,
          top: 0,
          width: size,
          height: size,
          backgroundColor: color,
          borderRadius: 3,
        },
        style,
      ]}
    />
  );
}

// ----------------------------------------------------------- animated coin
function Coin({ x, y, size }: { x: number; y: number; size: number }) {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(withTiming(1.3, { duration: 450 }), withTiming(1, { duration: 450 })),
      -1,
      false,
    );
  }, [scale]);

  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: x,
          top: y,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: '#FFD54A',
        },
        style,
      ]}
    />
  );
}

// ------------------------------------------------------------- Home screen
function HomeScreen({
  name,
  setName,
  onStart,
}: {
  name: string;
  setName: (value: string) => void;
  onStart: () => void;
}) {
  const [msg, setMsg] = useState('');
  const [high, setHigh] = useState<number | null>(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const v = await AsyncStorage.getItem(HIGH_SCORE_KEY);
        const n = Number(v);
        setHigh(v === null || !Number.isFinite(n) ? 0 : n);
      } catch {
        setLoadError(true);
      }
    })();
  }, []);

  const start = () => {
    if (name.trim() === '') {
      setMsg('Please enter your name first.');
      return;
    }
    onStart();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>CATCH THE COIN</Text>
      <Text style={styles.info}>
        Steer the snake, eat coins (+{BONUS_TIME}s), avoid the red box!
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Your name"
        placeholderTextColor="#888"
        value={name}
        onChangeText={setName}
      />

      {msg !== '' && <Text style={styles.error}>{msg}</Text>}

      <Button title="START" onPress={start} />

      <Text style={styles.info}>
        {loadError
          ? 'High score unavailable'
          : high === null
            ? 'Loading...'
            : 'High score: ' + high}
      </Text>

      <Text style={styles.credit}>
        Made by {AUTHOR} · {AUTHOR_GITHUB.replace('https://', '')}
      </Text>
    </View>
  );
}

// ------------------------------------------------------------- Game screen
function GameScreen({ name, onHome }: { name: string; onHome: () => void }) {
  const [snake, setSnake] = useState<Point[]>([{ x: START_X, y: START_Y }]);
  const [score, setScore] = useState(0);
  const [time, setTime] = useState(START_TIME);
  const [gameOver, setGameOver] = useState(false);
  const [coinX, setCoinX] = useState(200);
  const [coinY, setCoinY] = useState(60);
  const [enemyX, setEnemyX] = useState(ENEMY_START_X);
  const [enemyY, setEnemyY] = useState(ENEMY_START_Y);
  const [bestScore, setBestScore] = useState<number | null>(null);
  const [saveError, setSaveError] = useState(false);

  const dirRef = useRef<Dir>({ dx: 0, dy: -1 });
  const lastMoveRef = useRef<Dir>({ dx: 0, dy: -1 });
  const snakeRef = useRef(snake);
  const coinRef = useRef({ x: coinX, y: coinY });

  // Keep the refs in sync so the tick always reads the latest values.
  useEffect(() => {
    snakeRef.current = snake;
  }, [snake]);
  useEffect(() => {
    coinRef.current = { x: coinX, y: coinY };
  }, [coinX, coinY]);

  const enemyOpacity = useSharedValue(1);
  const enemyStyle = useAnimatedStyle(() => ({ opacity: enemyOpacity.value }));

  const playing = !gameOver;

  // Turn the snake. Blocks 180-degree reversals and freezes after game over.
  const turn = (dx: number, dy: number) => {
    if (!playing) return;
    const last = lastMoveRef.current;
    if (last.dx === -dx && last.dy === -dy) return;
    dirRef.current = { dx, dy };
  };

  // Place the coin on a free grid cell (not on the enemy or the snake).
  const moveCoin = (enemyBox: Box) => {
    let x = 0;
    let y = 0;
    let box: Box;
    let bad = true;
    let guard = 0;
    do {
      x = randomCell(COIN_SIZE);
      y = randomCell(COIN_SIZE);
      box = { x, y, width: COIN_SIZE, height: COIN_SIZE };
      bad =
        isColliding(box, enemyBox) ||
        snakeRef.current.some((s) => isColliding(box, segmentBox(s)));
      guard++;
    } while (bad && guard < 200);
    setCoinX(x);
    setCoinY(y);
  };

  // Move the enemy to a free cell and return its new box.
  const moveEnemy = (): Box => {
    const coinBox: Box = {
      x: coinRef.current.x,
      y: coinRef.current.y,
      width: COIN_SIZE,
      height: COIN_SIZE,
    };
    let x = 0;
    let y = 0;
    let box: Box;
    let bad = true;
    let guard = 0;
    do {
      x = randomCell(ENEMY_SIZE);
      y = randomCell(ENEMY_SIZE);
      box = { x, y, width: ENEMY_SIZE, height: ENEMY_SIZE };
      bad =
        isColliding(box, coinBox) ||
        snakeRef.current.some((s) => isColliding(box, segmentBox(s)));
      guard++;
    } while (bad && guard < 200);
    setEnemyX(x);
    setEnemyY(y);
    return box;
  };

  // Main tick: move one cell, grow on the coin, die on walls or self.
  useEffect(() => {
    if (!playing) return;
    const tick = setInterval(() => {
      const head = snakeRef.current[0];
      const dir = dirRef.current;
      lastMoveRef.current = dir; // remember the direction we actually moved
      let nx = head.x + dir.dx * STEP;
      let ny = head.y + dir.dy * STEP;

      // Wrap around the edges instead of stopping at the wall.
      if (nx < 0) nx = MAX_X;
      else if (nx > MAX_X) nx = 0;
      if (ny < 0) ny = MAX_Y;
      else if (ny > MAX_Y) ny = 0;

      const nextHead: Point = { x: nx, y: ny };
      const newHead: Box = { x: nx, y: ny, width: PLAYER_SIZE, height: PLAYER_SIZE };
      const coinBox: Box = {
        x: coinRef.current.x,
        y: coinRef.current.y,
        width: COIN_SIZE,
        height: COIN_SIZE,
      };
      const ate = isColliding(newHead, coinBox);

      // Self-collision: the tail moves away this tick unless we ate.
      const body = ate ? snakeRef.current : snakeRef.current.slice(0, -1);
      if (body.some((s) => isColliding(newHead, segmentBox(s)))) {
        setGameOver(true);
        return;
      }

      // Grow by keeping the tail when the coin was eaten.
      const newSnake = ate
        ? [nextHead, ...snakeRef.current]
        : [nextHead, ...snakeRef.current.slice(0, -1)];
      // Update the ref now so the enemy/coin spawns avoid the new body this tick.
      snakeRef.current = newSnake;
      setSnake(newSnake);

      if (ate) {
        setScore((s) => s + 1);
        setTime((t) => t + BONUS_TIME);
        const newEnemy = moveEnemy();
        moveCoin(newEnemy);
      }
    }, TICK_MS);
    return () => clearInterval(tick);
  }, [playing]);

  // Enemy collision, re-checked whenever the snake or the enemy moves.
  useEffect(() => {
    const player: Box = {
      x: snake[0].x,
      y: snake[0].y,
      width: PLAYER_SIZE,
      height: PLAYER_SIZE,
    };
    const enemy: Box = { x: enemyX, y: enemyY, width: ENEMY_SIZE, height: ENEMY_SIZE };
    // eslint-disable-next-line react-hooks/set-state-in-effect -- ending the game is an external side effect of the collision.
    if (isColliding(player, enemy)) setGameOver(true);
  }, [snake, enemyX, enemyY]);

  // Countdown timer.
  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => setTime((prev) => prev - 1), 1000);
    return () => clearInterval(t);
  }, [playing]);

  // Out of time = game over.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- ending the game is an external side effect of the timer.
    if (time <= 0) setGameOver(true);
  }, [time]);

  // Fade the enemy in every time it moves (the second animation).
  useEffect(() => {
    enemyOpacity.value = 0;
    enemyOpacity.value = withTiming(1, { duration: 300 });
  }, [enemyX, enemyY, enemyOpacity]);

  // Save the high score when the game ends.
  useEffect(() => {
    if (!gameOver) return;
    let cancelled = false;
    (async () => {
      try {
        const v = await AsyncStorage.getItem(HIGH_SCORE_KEY);
        const parsed = v === null ? 0 : Number(v);
        const best = Number.isFinite(parsed) ? parsed : 0;
        if (cancelled) return;
        if (score > best) {
          await AsyncStorage.setItem(HIGH_SCORE_KEY, String(score));
          if (!cancelled) setBestScore(score);
        } else {
          setBestScore(best);
        }
      } catch {
        if (!cancelled) setSaveError(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [gameOver, score]);

  const restart = () => {
    setScore(0);
    setTime(START_TIME);
    setGameOver(false);
    setSaveError(false);
    setBestScore(null);

    const fresh = [{ x: START_X, y: START_Y }];
    setSnake(fresh);
    snakeRef.current = fresh; // usable by the very next tick
    dirRef.current = { dx: 0, dy: -1 };
    lastMoveRef.current = { dx: 0, dy: -1 };

    setEnemyX(ENEMY_START_X);
    setEnemyY(ENEMY_START_Y);
    enemyOpacity.value = 1;

    moveCoin({
      x: ENEMY_START_X,
      y: ENEMY_START_Y,
      width: ENEMY_SIZE,
      height: ENEMY_SIZE,
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.hud}>
        <Text style={styles.hudText}>Player: {name}</Text>
        <Text style={styles.hudText}>Score: {score}</Text>
        <Text style={styles.hudText}>Time: {time}</Text>
      </View>

      <View style={styles.field}>
        {snake.map((s, i) => (
          <Segment
            key={i}
            x={s.x}
            y={s.y}
            size={PLAYER_SIZE}
            color={i === 0 ? '#4F9DFF' : '#2E6FCC'}
          />
        ))}

        <Coin x={coinX} y={coinY} size={COIN_SIZE} />

        <Animated.View
          style={[
            {
              position: 'absolute',
              left: enemyX,
              top: enemyY,
              width: ENEMY_SIZE,
              height: ENEMY_SIZE,
              backgroundColor: '#E5484D',
              borderRadius: 4,
            },
            enemyStyle,
          ]}
        />

        {gameOver && (
          <View style={styles.overlay}>
            <Text style={styles.overlayTitle}>GAME OVER</Text>
            <Text style={styles.overlayText}>Score: {score}</Text>
            <Text style={styles.overlayText}>
              {bestScore === null ? 'Best: -' : `Best: ${bestScore}`}
            </Text>
            {saveError && <Text style={styles.error}>Couldn&apos;t save high score</Text>}
            <View style={styles.overlayButtons}>
              <Button title="PLAY AGAIN" onPress={restart} />
              <Button title="BACK TO HOME" onPress={onHome} />
            </View>
          </View>
        )}
      </View>

      <View style={styles.pad}>
        <View style={styles.padRow}>
          <Pressable style={styles.padButton} onPress={() => turn(0, -1)}>
            <Text style={styles.padText}>▲</Text>
          </Pressable>
        </View>
        <View style={styles.padRow}>
          <Pressable style={styles.padButton} onPress={() => turn(-1, 0)}>
            <Text style={styles.padText}>◀</Text>
          </Pressable>
          <Pressable style={styles.padButton} onPress={() => turn(0, 1)}>
            <Text style={styles.padText}>▼</Text>
          </Pressable>
          <Pressable style={styles.padButton} onPress={() => turn(1, 0)}>
            <Text style={styles.padText}>▶</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

// ----------------------------------------------------------------- App
export default function App() {
  const [screen, setScreen] = useState<'home' | 'game'>('home');
  const [name, setName] = useState('');

  return (
    <SafeAreaView style={styles.safe}>
      {screen === 'home' ? (
        <HomeScreen name={name} setName={setName} onStart={() => setScreen('game')} />
      ) : (
        <GameScreen name={name} onHome={() => setScreen('home')} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0B0F14',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0B0F14',
    padding: 16,
    gap: 12,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: 'bold',
    letterSpacing: 1,
    textAlign: 'center',
  },
  info: {
    color: '#9AA4B2',
    fontSize: 14,
    textAlign: 'center',
  },
  credit: {
    color: '#5A6675',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
  input: {
    width: 220,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#3A4450',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  error: {
    color: '#FF6B6B',
    fontSize: 13,
    textAlign: 'center',
  },
  hud: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: FIELD_W,
    marginBottom: 8,
  },
  hudText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  field: {
    width: FIELD_W,
    height: FIELD_H,
    backgroundColor: '#111820',
    borderWidth: 2,
    borderColor: '#2A3542',
    borderRadius: 6,
    overflow: 'hidden',
    position: 'relative',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
  },
  overlayTitle: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: 'bold',
  },
  overlayText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  overlayButtons: {
    gap: 8,
    marginTop: 8,
    width: 180,
  },
  pad: {
    marginTop: 12,
    gap: 8,
    alignItems: 'center',
  },
  padRow: {
    flexDirection: 'row',
    gap: 8,
  },
  padButton: {
    width: 64,
    height: 48,
    borderRadius: 10,
    backgroundColor: '#1C2530',
    alignItems: 'center',
    justifyContent: 'center',
  },
  padText: {
    color: '#FFFFFF',
    fontSize: 20,
  },
});
