import { createFileRoute } from '@tanstack/react-router'
import { MySchedulePage } from '@/components/user/MySchedulePage'

export const Route = createFileRoute('/my-schedule')({
  head: () => ({
    meta: [
      { title: 'My Schedule - SIMMAM 2026' },
      {
        name: 'description',
        content: 'View your registered SIMMAM 2026 events and ticket QR codes all in one place.',
      },
      { property: 'og:title', content: 'My Schedule - SIMMAM 2026' },
    ],
  }),
  component: MySchedulePage,
})
