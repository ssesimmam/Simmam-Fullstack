import type { LucideIcon } from 'lucide-react'

interface Props {
  title: string
  value: string
  icon: LucideIcon
}

export default function StatCard({
  title,
  value,
  icon: Icon,
}: Props) {
  return (
    <div
      className={`bg-[#111] border border-[#333] rounded-3xl p-6 transition-all duration-300 hover:-translate-y-1`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-400">
            {title}
          </p>

          <h3 className="mt-3 text-4xl font-bold text-white">
            {value}
          </h3>
        </div>

        <div className="bg-black border border-[#333] flex h-14 w-14 items-center justify-center rounded-2xl">
          <Icon className="h-7 w-7 text-white" />
        </div>
      </div>
    </div>
  )
}