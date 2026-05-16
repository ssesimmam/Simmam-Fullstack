interface Props {
  status: 'active' | 'pending' | 'inactive' | 'completed' | 'cancelled'
}

const statusConfig = {
  active: { bg: 'bg-[#222]', text: 'text-white', label: 'Active' },
  pending: { bg: 'bg-[#222]', text: 'text-white', label: 'Pending' },
  inactive: { bg: 'bg-[#222]', text: 'text-white', label: 'Inactive' },
  completed: { bg: 'bg-[#222]', text: 'text-white', label: 'Completed' },
  cancelled: { bg: 'bg-[#222]', text: 'text-white', label: 'Cancelled' },
}

export default function StatusBadge({ status }: Props) {
  const config = statusConfig[status]

  return (
    <span className={`px-2 py-1 ${config.bg} ${config.text} rounded text-xs font-medium border border-[#333]`}>
      {config.label}
    </span>
  )
}
