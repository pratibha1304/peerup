"use client"

import { useEffect, useMemo, useState } from 'react'
import { Goal, Task, listenToGoals, listenToTasks, addGoal, addTask, toggleTask } from '@/lib/goals'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'

type GoalsViewProps = {
  partnershipId: string
  matchType?: 'buddy' | 'mentor'
  menteeId?: string | null
  currentUserId?: string | null
}

export default function GoalsView({ partnershipId, matchType, menteeId, currentUserId }: GoalsViewProps) {
  const [goals, setGoals] = useState<Goal[]>([])
  const [activeGoalId, setActiveGoalId] = useState<string | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [isAddGoalOpen, setIsAddGoalOpen] = useState(false)
  const [newGoalTitle, setNewGoalTitle] = useState('')
  const [newTaskText, setNewTaskText] = useState('')

  useEffect(() => {
    const unsub = listenToGoals(partnershipId, setGoals)
    return () => unsub()
  }, [partnershipId])

  useEffect(() => {
    if (!activeGoalId) return
    const unsub = listenToTasks(partnershipId, activeGoalId, setTasks)
    return () => unsub()
  }, [partnershipId, activeGoalId])

  const activeGoal = useMemo(() => goals.find((g) => g.id === activeGoalId) || null, [goals, activeGoalId])
  const canToggleTasks = useMemo(() => {
    if (matchType === 'buddy') return true
    if (matchType === 'mentor') return currentUserId != null && currentUserId === menteeId
    return true
  }, [matchType, currentUserId, menteeId])

  const handleCreateGoal = async () => {
    if (!newGoalTitle.trim()) return
    await addGoal(partnershipId, newGoalTitle)
    setNewGoalTitle('')
    setIsAddGoalOpen(false)
  }

  const handleAddTask = async () => {
    if (!activeGoalId || !newTaskText.trim()) return
    await addTask(partnershipId, activeGoalId, newTaskText)
    setNewTaskText('')
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Goals</h1>
        <Button onClick={() => setIsAddGoalOpen(true)}>+ Add Goal</Button>
      </div>

      {/* Goals list */}
      <div className="grid gap-4 sm:grid-cols-2">
        {goals.map((g) => {
          const pct = g.taskCount > 0 ? Math.round((g.completedTaskCount / g.taskCount) * 100) : 0
          return (
            <button key={g.id} className="text-left rounded-xl border p-4 hover:bg-accent" onClick={() => setActiveGoalId(g.id)}>
              <div className="font-medium mb-1">{g.title}</div>
              <div className="text-xs text-muted-foreground mb-2">{g.completedTaskCount} of {g.taskCount} tasks</div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
              </div>
            </button>
          )
        })}
      </div>

      {/* Goal detail */}
      {activeGoal && (
        <div className="mt-8 rounded-xl border p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-lg font-semibold">{activeGoal.title}</div>
              {activeGoal.description && <div className="text-sm text-muted-foreground">{activeGoal.description}</div>}
            </div>
            <Button variant="outline" onClick={() => setActiveGoalId(null)}>Close</Button>
          </div>

          <div className="space-y-2 mb-4">
            {tasks.map((t) => (
              <label key={t.id} className="flex items-center gap-3 rounded-lg border p-3">
                <input
                  type="checkbox"
                  checked={t.isComplete}
                  disabled={!canToggleTasks}
                  onChange={(e) => toggleTask(partnershipId, activeGoal.id, t.id, e.target.checked)}
                />
                <span className={t.isComplete ? 'line-through text-muted-foreground' : ''}>{t.text}</span>
              </label>
            ))}
            {tasks.length === 0 && <div className="text-sm text-muted-foreground">No tasks yet.</div>}
          </div>

          <div className="flex gap-2">
            <Input placeholder="Add a task..." value={newTaskText} onChange={(e) => setNewTaskText(e.target.value)} />
            <Button onClick={handleAddTask}>Add Task</Button>
          </div>
        </div>
      )}

      {/* Add Goal dialog */}
      <Dialog open={isAddGoalOpen} onOpenChange={setIsAddGoalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Goal</DialogTitle>
            <DialogDescription>Define the objective for this partnership.</DialogDescription>
          </DialogHeader>
          <div className="flex gap-2">
            <Input placeholder="Goal title" value={newGoalTitle} onChange={(e) => setNewGoalTitle(e.target.value)} />
            <Button onClick={handleCreateGoal} disabled={!newGoalTitle.trim()}>Create</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}


