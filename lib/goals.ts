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
  runTransaction,
  where,
  updateDoc,
  deleteDoc,
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
  details?: string
  durationDays?: number | null
  isComplete: boolean
  order: number
  unlocked?: boolean
  completedBy?: Record<string, boolean>
  createdAt?: any
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
  const docRef = await addDoc(goalsRef, {
    title: title.trim(),
    description: description?.trim() || '',
    status: 'in-progress',
    taskCount: 0,
    completedTaskCount: 0,
    createdBy: auth.currentUser?.uid || 'unknown',
    createdAt: serverTimestamp(),
  })

  return docRef.id
}

type AddTaskOptions = {
  details?: string
  durationDays?: number | null
  unlocked?: boolean
}

export async function addTask(
  partnershipId: string,
  goalId: string,
  taskText: string,
  options: AddTaskOptions = {}
) {
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
    unlocked: options.unlocked ?? nextOrder === 1,
    completedBy: {},
    details: options.details?.trim() || '',
    durationDays: options.durationDays ?? null,
  })

  batch.update(goalRef, { taskCount: increment(1) })
  await batch.commit()
}

export async function updateGoal(
  partnershipId: string,
  goalId: string,
  updates: { title?: string; description?: string }
) {
  const goalRef = doc(db, 'matches', partnershipId, 'goals', goalId)
  const payload: Record<string, any> = {}
  if (typeof updates.title === 'string') {
    payload.title = updates.title.trim()
  }
  if (typeof updates.description === 'string') {
    payload.description = updates.description.trim()
  }
  if (Object.keys(payload).length === 0) return
  await updateDoc(goalRef, payload)
}

export async function clearGoalTasks(partnershipId: string, goalId: string) {
  const goalRef = doc(db, 'matches', partnershipId, 'goals', goalId)
  const tasksRef = collection(goalRef, 'tasks')
  const snap = await getDocs(tasksRef)
  const batch = writeBatch(db)
  snap.forEach((taskDoc) => batch.delete(taskDoc.ref))
  batch.update(goalRef, {
    taskCount: 0,
    completedTaskCount: 0,
    status: 'in-progress',
  })
  await batch.commit()
}

export async function deleteGoal(partnershipId: string, goalId: string) {
  await clearGoalTasks(partnershipId, goalId)
  const goalRef = doc(db, 'matches', partnershipId, 'goals', goalId)
  await deleteDoc(goalRef)
}

export async function updateTask(
  partnershipId: string,
  goalId: string,
  taskId: string,
  updates: { text?: string; details?: string; durationDays?: number | null }
) {
  const goalRef = doc(db, 'matches', partnershipId, 'goals', goalId)
  const taskRef = doc(goalRef, 'tasks', taskId)
  const payload: Record<string, any> = {}
  if (typeof updates.text === 'string') {
    payload.text = updates.text.trim()
  }
  if (typeof updates.details === 'string') {
    payload.details = updates.details.trim()
  }
  if (updates.durationDays !== undefined) {
    payload.durationDays = updates.durationDays
  }
  if (Object.keys(payload).length === 0) return
  await updateDoc(taskRef, payload)
}

export async function deleteTask(
  partnershipId: string,
  goalId: string,
  taskId: string
) {
  await runTransaction(db, async (tx) => {
    const goalRef = doc(db, 'matches', partnershipId, 'goals', goalId)
    const taskRef = doc(goalRef, 'tasks', taskId)

    const taskSnap = await tx.get(taskRef)
    if (!taskSnap.exists()) return
    const taskData = taskSnap.data() as Task
    const wasComplete = !!taskData.isComplete

    tx.delete(taskRef)

    const goalSnap = await tx.get(goalRef)
    if (!goalSnap.exists()) return
    const goalData = goalSnap.data() as Goal
    const currentCount = goalData.taskCount || 0
    const nextTaskCount = Math.max(0, currentCount - 1)
    let completedCount = goalData.completedTaskCount || 0
    if (wasComplete) {
      completedCount = Math.max(0, completedCount - 1)
    }

    tx.update(goalRef, {
      taskCount: nextTaskCount,
      completedTaskCount: completedCount,
      status:
        nextTaskCount > 0 && completedCount >= nextTaskCount
          ? 'completed'
          : 'in-progress',
    })
  })
}

export async function toggleTask(
  partnershipId: string,
  goalId: string,
  taskId: string,
  newStatus: boolean,
  participantIds: string[]
) {
  if (!auth.currentUser) throw new Error('Not signed in')
  const currentUid = auth.currentUser.uid

  await runTransaction(db, async (tx) => {
    const goalRef = doc(db, 'matches', partnershipId, 'goals', goalId)
    const taskRef = doc(goalRef, 'tasks', taskId)

    const taskSnap = await tx.get(taskRef)
    if (!taskSnap.exists()) throw new Error('Task not found')
    const taskData = taskSnap.data() as Task

    const completedBy = { ...(taskData.completedBy || {}) }
    completedBy[currentUid] = newStatus

    const participants = participantIds && participantIds.length > 0 ? participantIds : Object.keys(completedBy)
    const wasComplete = !!taskData.isComplete
    const isNowComplete =
      (taskData.unlocked ?? true) &&
      participants.length > 0 &&
      participants.every((uid) => completedBy[uid])

    const taskUpdates: Record<string, any> = {
      completedBy,
    }
    if (wasComplete !== isNowComplete) {
      taskUpdates.isComplete = isNowComplete
    }
    tx.update(taskRef, taskUpdates)

    const goalSnap = await tx.get(goalRef)
    if (!goalSnap.exists()) return
    const goalData = goalSnap.data() as Goal

    let completedCount = goalData.completedTaskCount || 0
    if (!wasComplete && isNowComplete) {
      completedCount += 1
    } else if (wasComplete && !isNowComplete) {
      completedCount = Math.max(0, completedCount - 1)
    }

    const goalUpdates: Record<string, any> = {}
    if (completedCount !== goalData.completedTaskCount) {
      goalUpdates.completedTaskCount = completedCount
    }
    if ((goalData.taskCount || 0) > 0) {
      goalUpdates.status =
        completedCount >= (goalData.taskCount || 0) ? 'completed' : 'in-progress'
    }
    if (Object.keys(goalUpdates).length) {
      tx.update(goalRef, goalUpdates)
    }

    if (isNowComplete && !wasComplete) {
      const nextTaskQuery = query(
        collection(goalRef, 'tasks'),
        where('order', '>', taskData.order),
        orderBy('order'),
        limit(1)
      )
      const nextSnap = await tx.get(nextTaskQuery)
      if (!nextSnap.empty) {
        tx.update(nextSnap.docs[0].ref, { unlocked: true })
      }
    }
  })
}
