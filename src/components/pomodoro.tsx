"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  PlusCircle,
  XCircle,
  PlayCircle,
  PauseCircle,
  RotateCcw,
  Plus,
  Minus,
  Volume2,
  VolumeX,
} from "lucide-react";
import useSound from "use-sound";

interface Todo {
  id: string;
  text: string;
  completed: boolean;
}

interface Session {
  date: string;
  completedTasks: number;
}

export function Pomodoro() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const [playStartSound] = useSound("/start-gong.mp3", { volume: 0.5 });
  const [playEndSound] = useSound("/end-gong.mp3", { volume: 0.5 });

  useEffect(() => {
    const storedTodos = localStorage.getItem("todos");
    if (storedTodos) {
      setTodos(JSON.parse(storedTodos));
    }

    const storedSessions = localStorage.getItem("sessions");
    if (storedSessions) {
      setSessions(JSON.parse(storedSessions));
    }

    const storedSoundEnabled = localStorage.getItem("soundEnabled");
    if (storedSoundEnabled !== null) {
      setSoundEnabled(JSON.parse(storedSoundEnabled));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("todos", JSON.stringify(todos));
  }, [todos]);

  useEffect(() => {
    localStorage.setItem("sessions", JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    localStorage.setItem("soundEnabled", JSON.stringify(soundEnabled));
  }, [soundEnabled]);

  const playSound = (sound: () => void) => {
    if (soundEnabled) {
      sound();
    }
  };

  const addSession = (completedTasks: number) => {
    setSessions((prev) => [
      ...prev,
      { date: new Date().toISOString(), completedTasks },
    ]);
  };

  return (
    <div className="flex flex-col items-center px-4 py-2 max-w-5xl mx-auto bg-zinc-100 text-black">
      <Timer
        onTimerEnd={() => {
          playSound(playEndSound);
          addSession(todos.filter((todo) => todo.completed).length);
        }}
        onTimerStart={() => playSound(playStartSound)}
        soundEnabled={soundEnabled}
        setSoundEnabled={setSoundEnabled}
      />
      <Todo todos={todos} setTodos={setTodos} />
      <Session sessions={sessions} />
    </div>
  );
}

interface TimerProps {
  onTimerEnd: () => void;
  onTimerStart: () => void;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
}

export function Timer({
  onTimerEnd,
  onTimerStart,
  soundEnabled,
  setSoundEnabled,
}: TimerProps) {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [initialTime, setInitialTime] = useState(25 * 60);

  const requestRef = useRef<number>();
  const startTimeRef = useRef<number>();
  const previousTimeRef = useRef<number>();

  const animate = useCallback(
    (currentTime: number) => {
      if (startTimeRef.current === undefined) {
        startTimeRef.current = currentTime;
      }

      if (previousTimeRef.current !== undefined) {
        const deltaTime = currentTime - previousTimeRef.current;
        if (deltaTime >= 1000) {
          setTimeLeft((prevTime) => {
            const newTime = prevTime - Math.floor(deltaTime / 1000);
            if (newTime <= 0) {
              setIsActive(false);
              onTimerEnd();
              return 0;
            }
            return newTime;
          });
          previousTimeRef.current = currentTime - (deltaTime % 1000);
        }
      } else {
        previousTimeRef.current = currentTime;
      }

      if (isActive && timeLeft > 0) {
        requestRef.current = requestAnimationFrame(animate);
      }
    },
    [isActive, timeLeft, onTimerEnd]
  );

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      requestRef.current = requestAnimationFrame(animate);
    } else if (timeLeft === 0) {
      alert("Time's up!");
    }
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [isActive, timeLeft, animate]);

  const toggleTimer = () => {
    setIsActive((prevActive) => {
      if (!prevActive) {
        onTimerStart();
        setInitialTime(timeLeft);
      }
      return !prevActive;
    });
    startTimeRef.current = undefined;
    previousTimeRef.current = undefined;
  };

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(25 * 60);
    setInitialTime(25 * 60);
    startTimeRef.current = undefined;
    previousTimeRef.current = undefined;
  };

  const adjustTimer = (minutes: number) => {
    setTimeLeft((prevTime) => {
      const newTime = Math.max(0, prevTime + minutes * 60);
      setInitialTime(newTime);
      return newTime;
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const progress = isActive ? 1 - timeLeft / initialTime : 0;

  return (
    <div className="w-full mb-6">
      <h2 className="text-center text-4xl mb-4 font-bold uppercase">TIMER</h2>
      <div className="flex justify-center items-center mb-4">
        <Button
          onClick={() => adjustTimer(-5)}
          variant="outline"
          size="lg"
          className="btn bg-zinc-300 text-black border-zinc-500 hover:bg-zinc-400"
          disabled={isActive}
        >
          <Minus className="h-6 w-6" />
        </Button>
        <div className="relative mx-4">
          <svg className="w-48 h-48">
            <circle
              className="text-zinc-300"
              strokeWidth="5"
              stroke="currentColor"
              fill="transparent"
              r="90"
              cx="96"
              cy="96"
            />
            <circle
              className="text-zinc-500"
              strokeWidth="5"
              stroke="currentColor"
              fill="transparent"
              r="90"
              cx="96"
              cy="96"
              strokeDasharray={`${2 * Math.PI * 90}`}
              strokeDashoffset={`${2 * Math.PI * 90 * (1 - progress)}`}
              strokeLinecap="square"
              style={{
                transition: "stroke-dashoffset 0.5s ease 0s",
                transform: "rotate(-90deg)",
                transformOrigin: "50% 50%",
              }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center text-5xl font-bold">
            {formatTime(timeLeft)}
          </div>
        </div>
        <Button
          onClick={() => adjustTimer(5)}
          variant="outline"
          size="lg"
          className="btn bg-zinc-300 text-black border-zinc-500 hover:bg-zinc-400"
          disabled={isActive}
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>
      <div className="flex justify-center space-x-4 mb-4">
        <Button
          onClick={resetTimer}
          variant="outline"
          size="lg"
          className="btn bg-zinc-300 text-black border-zinc-500 hover:bg-zinc-400"
        >
          <RotateCcw className="h-6 w-6" />
        </Button>
        <Button
          onClick={toggleTimer}
          variant="outline"
          size="lg"
          className="btn bg-zinc-300 text-black border-zinc-500 hover:bg-zinc-400"
        >
          {isActive ? (
            <PauseCircle className="h-6 w-6" />
          ) : (
            <PlayCircle className="h-6 w-6" />
          )}
        </Button>
        <Button
          onClick={() => setSoundEnabled(!soundEnabled)}
          variant="outline"
          size="lg"
          className="btn bg-zinc-300 text-black border-zinc-500 hover:bg-zinc-400"
        >
          {soundEnabled ? (
            <Volume2 className="h-6 w-6" />
          ) : (
            <VolumeX className="h-6 w-6" />
          )}
        </Button>
      </div>
    </div>
  );
}

interface Todo {
  id: string;
  text: string;
  completed: boolean;
}

interface TodoProps {
  todos: Todo[];
  setTodos: React.Dispatch<React.SetStateAction<Todo[]>>;
}

export function Todo({ todos, setTodos }: TodoProps) {
  const [newTodo, setNewTodo] = useState("");

  const addTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTodo.trim() !== "") {
      setTodos((prevTodos) => [
        ...prevTodos,
        { id: Date.now().toString(), text: newTodo, completed: false },
      ]);
      setNewTodo("");
    }
  };

  const toggleTodo = (id: string) => {
    setTodos((prevTodos) =>
      prevTodos.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  const removeTodo = (id: string) => {
    setTodos((prevTodos) => prevTodos.filter((todo) => todo.id !== id));
  };

  return (
    <div className="w-full bg-zinc-200 p-6 shadow-lg">
      <h2 className="text-center text-3xl mb-4 font-bold uppercase">TO DO</h2>
      <form onSubmit={addTodo} className="flex mb-4">
        <Input
          type="text"
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          placeholder="Add a new task"
          className="input mr-2 text-lg bg-zinc-100 text-black placeholder-zinc-700 border-zinc-500"
        />
        <Button
          type="submit"
          size="icon"
          variant="outline"
          className="btn bg-zinc-300 text-black border-zinc-500 hover:bg-zinc-400"
        >
          <PlusCircle className="h-6 w-6" />
        </Button>
      </form>
      <ul className="space-y-3">
        {todos.map((todo) => (
          <li
            key={todo.id}
            className="flex items-center justify-between text-lg"
          >
            <div className="flex items-center">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => toggleTodo(todo.id)}
                className="btn mr-2 text-black hover:text-zinc-700"
              >
                {todo.completed ? "✓" : "○"}
              </Button>
              <span
                className={todo.completed ? "line-through text-zinc-700" : ""}
              >
                {todo.text}
              </span>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => removeTodo(todo.id)}
              className="btn text-black hover:text-zinc-700"
            >
              <XCircle className="h-5 w-5" />
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}

interface Session {
  date: string;
  completedTasks: number;
}

interface SessionProps {
  sessions: Session[];
}

export function Session({ sessions }: SessionProps) {
  return (
    <div className="w-full mt-6 bg-zinc-200 p-6 shadow-lg">
      <h2 className="text-center text-3xl mb-4 font-bold uppercase">
        SESSIONS
      </h2>
      <ul className="space-y-2">
        {sessions.map((session, index) => (
          <li key={index} className="text-sm">
            {new Date(session.date).toLocaleString()}: {session.completedTasks}{" "}
            tasks completed
          </li>
        ))}
      </ul>
    </div>
  );
}
