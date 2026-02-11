interface OutboundLayoutProps {
  children: React.ReactNode
}

export default function OutboundLayout({ children }: OutboundLayoutProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  )
}
