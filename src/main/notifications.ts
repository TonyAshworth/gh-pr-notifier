import { Notification, shell } from 'electron'
import type { PREvent } from './state'

export function sendNotifications(events: PREvent[]): number {
  let count = 0
  for (const event of events) {
    const { title, body } = formatNotification(event)
    const notif = new Notification({ title, body, silent: false })
    const url = event.pr.url
    notif.on('click', () => shell.openExternal(url))
    notif.show()
    count++
  }
  return count
}

function formatNotification(event: PREvent): { title: string; body: string } {
  const { pr } = event
  const repo = pr.repo
  const prTitle = `"${pr.title}"`

  switch (event.type) {
    case 'opened':
      return {
        title: `[${repo}] New PR #${pr.number}`,
        body: `${pr.author.login} opened: ${prTitle}`
      }
    case 'ready_for_review':
      return {
        title: `[${repo}] PR #${pr.number} ready`,
        body: `${prTitle} is ready for review`
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
        body: `${lastReviewer} ${stateLabel}`
      }
    }
    case 'new_comment':
      return {
        title: `[${repo}] PR #${pr.number} comment`,
        body: `New comment (${pr.commentCount} total)`
      }
    case 'merged':
      return {
        title: `[${repo}] PR #${pr.number} merged`,
        body: `${prTitle} was merged`
      }
    case 'closed':
      return {
        title: `[${repo}] PR #${pr.number} closed`,
        body: `${prTitle} was closed`
      }
  }
}
