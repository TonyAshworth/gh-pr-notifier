import { Notification, shell } from 'electron'
import { store } from './store'
import type { PREvent } from './state'

type ViewedCallback = (key: string, updatedAt: string) => void

export function sendNotifications(events: PREvent[], onViewed?: ViewedCallback): number {
  let count = 0
  for (const event of events) {
    const { title, subtitle, body } = formatNotification(event)
    const notif = new Notification({ title, subtitle, body, silent: false })
    const { pr } = event
    notif.on('click', () => {
      shell.openExternal(pr.url)
      const key = `${pr.repo}#${pr.number}`
      store.set('viewedPRs', { ...store.get('viewedPRs'), [key]: pr.updatedAt })
      onViewed?.(key, pr.updatedAt)
    })
    notif.show()
    count++
  }
  return count
}

function formatNotification(event: PREvent): { title: string; subtitle: string; body: string } {
  const { pr } = event
  const repo = pr.repo
  const prTitle = pr.title

  switch (event.type) {
    case 'opened':
      return {
        title: `[${repo}] New PR #${pr.number}`,
        subtitle: prTitle,
        body: `Opened by ${pr.author.login}`
      }
    case 'ready_for_review':
      return {
        title: `[${repo}] PR #${pr.number} ready for review`,
        subtitle: prTitle,
        body: ''
      }
    case 'review_submitted': {
      const stateLabel =
        event.reviewState === 'APPROVED'
          ? 'approved'
          : event.reviewState === 'CHANGES_REQUESTED'
            ? 'requested changes'
            : 'commented'
      const lastReviewer = pr.reviews.length > 0
        ? pr.reviews.reduce((a, b) => (a.submittedAt > b.submittedAt ? a : b)).author.login
        : 'Someone'
      return {
        title: `[${repo}] PR #${pr.number} reviewed`,
        subtitle: prTitle,
        body: `${lastReviewer} ${stateLabel}`
      }
    }
    case 'new_comment':
      return {
        title: `[${repo}] PR #${pr.number} — new comment`,
        subtitle: prTitle,
        body: `${pr.commentCount} total comments`
      }
    case 'merged':
      return {
        title: `[${repo}] PR #${pr.number} merged`,
        subtitle: prTitle,
        body: ''
      }
    case 'closed':
      return {
        title: `[${repo}] PR #${pr.number} closed`,
        subtitle: prTitle,
        body: ''
      }
  }
}
