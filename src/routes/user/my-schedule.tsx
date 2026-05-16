import { createFileRoute } from '@tanstack/react-router'
import { MySchedulePage } from '@/components/user/MySchedulePage'

export const Route = createFileRoute('/user/my-schedule')({
  component: MySchedulePage,
})
