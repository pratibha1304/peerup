"use client"

import { useState, useMemo } from 'react'
import { auth, db } from '@/lib/firebase'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Bug, Loader2 } from 'lucide-react'

type FeedbackButtonProps = {
  screenName: string
}

export default function FeedbackButton({ screenName }: FeedbackButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [feedbackText, setFeedbackText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const isSendDisabled = useMemo(() => !feedbackText.trim() || isSubmitting, [feedbackText, isSubmitting])

  const handleSubmit = async () => {
    if (!auth.currentUser) {
      // Require sign-in to submit feedback
      setIsModalOpen(false)
      return
    }

    try {
      setIsSubmitting(true)
      const feedbackData = {
        userId: auth.currentUser.uid,
        userEmail: auth.currentUser.email || '',
        feedbackText: feedbackText.trim(),
        contextScreen: screenName,
        timestamp: serverTimestamp(),
        status: 'new',
        appVersion: 'v0.1-prototype',
      }

      await addDoc(collection(db, 'feedback'), feedbackData)
      setIsSubmitting(false)
      setIsSubmitted(true)

      // Auto-close after brief thank-you
      setTimeout(() => {
        setIsSubmitted(false)
        setFeedbackText('')
        setIsModalOpen(false)
      }, 2000)
    } catch (e) {
      setIsSubmitting(false)
      // In case of error, keep modal open for retry; you could add toast here
    }
  }

  return (
    <>
      <Button
        type="button"
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-5 right-5 z-[1000] h-12 w-12 rounded-full shadow-lg"
        size="icon"
        aria-label="Send Feedback"
      >
        <Bug className="h-5 w-5" />
      </Button>

      <Dialog open={isModalOpen} onOpenChange={(open) => {
        setIsModalOpen(open)
        if (!open) {
          setIsSubmitting(false)
          setIsSubmitted(false)
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Got Feedback?</DialogTitle>
            <DialogDescription>
              Tell us what's on your mind. Bugs, ideas for improvement, or just general confusion—we want to hear it!
            </DialogDescription>
          </DialogHeader>

          {isSubmitted ? (
            <div className="py-6 text-center text-sm">Thank you! Your feedback has been sent.</div>
          ) : (
            <div className="space-y-4">
              <div>
                <label htmlFor="feedback-textarea" className="mb-2 block text-sm font-medium">Your feedback</label>
                <Textarea
                  id="feedback-textarea"
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  rows={6}
                  placeholder={`What's happening on ${screenName}?`}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} disabled={isSubmitting}>Cancel</Button>
                <Button type="button" onClick={handleSubmit} disabled={isSendDisabled}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    'Send Feedback'
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}


