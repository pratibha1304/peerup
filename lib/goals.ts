import { db, auth } from '@/lib/firebase'
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Unsubscribe,
  writeBatch,
  increment,
  getDocs,
  limit,
} from 'firebase/firestore'

export type Goal = {
  id: string
  title: string
  description?: string
  status: 'in-progress' | 'completed'
  taskCount: number
  completedTaskCount: number
  createdBy: string
  createdAt?: any
}

export type Task = {
  id: string
  text: string
  isComplete: boolean
  order: number
  createdAt?: any
  completedBy?: string | null
}

export function listenToGoals(partnershipId: string, cb: (goals: Goal[]) => void): Unsubscribe {
  const goalsRef = collection(db, 'matches', partnershipId, 'goals')
  const q = query(goalsRef, orderBy('createdAt', 'desc'))
  return onSnapshot(q, (snap) => {
    const out = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as Goal[]
    cb(out)
  })
}

export function listenToTasks(partnershipId: string, goalId: string, cb: (tasks: Task[]) => void): Unsubscribe {
  const tasksRef = collection(db, 'matches', partnershipId, 'goals', goalId, 'tasks')
  const q = query(tasksRef, orderBy('order'))
  return onSnapshot(q, (snap) => {
    const out = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as Task[]
    cb(out)
  })
}

export async function addGoal(partnershipId: string, title: string, description?: string) {
  const goalsRef = collection(db, 'matches', partnershipId, 'goals')
  await addDoc(goalsRef, {
    title: title.trim(),
    description: description?.trim() || '',
    status: 'in-progress',
    taskCount: 0,
    completedTaskCount: 0,
    createdBy: auth.currentUser?.uid || 'unknown',
    createdAt: serverTimestamp(),
  })
}

export async function addTask(partnershipId: string, goalId: string, taskText: string) {
  const batch = writeBatch(db)
  const goalRef = doc(db, 'matches', partnershipId, 'goals', goalId)
  const newTaskRef = doc(collection(goalRef, 'tasks'))

  // Determine next order by looking up the last task
  const lastQ = query(collection(goalRef, 'tasks'), orderBy('order', 'desc'), limit(1))
  const lastSnap = await getDocs(lastQ)
  const nextOrder = lastSnap.empty ? 1 : ((lastSnap.docs[0].data() as any).order || 0) + 1

  batch.set(newTaskRef, {
    text: taskText.trim(),
    isComplete: false,
    createdAt: serverTimestamp(),
    order: nextOrder,
    completedBy: null,
  })

  batch.update(goalRef, { taskCount: increment(1) })
  await batch.commit()
}

export async function toggleTask(partnershipId: string, goalId: string, taskId: string, newStatus: boolean) {
  const batch = writeBatch(db)
  const goalRef = doc(db, 'matches', partnershipId, 'goals', goalId)
  const taskRef = doc(goalRef, 'tasks', taskId)

  batch.update(taskRef, {
    isComplete: newStatus,
    completedBy: newStatus ? (auth.currentUser?.uid || null) : null,
  })

  batch.update(goalRef, { completedTaskCount: increment(newStatus ? 1 : -1) })
  await batch.commit()
}


