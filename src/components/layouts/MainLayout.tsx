import type { ReactNode } from 'react'
import SidebarComponent from './Sidebar'
import TabNavigation from './TabNavigation'

interface MainLayoutProps {
  children: ReactNode
}

const MainLayout = ({ children }: MainLayoutProps) => {
  return (
    <div className="min-h-screen bg-muted/20">
      <div className="max-w-[1280px] mx-auto flex min-h-screen">
        <SidebarComponent />
        <div className="flex-1 flex flex-col bg-background">
          <TabNavigation />
          <main className="flex-1 p-6 bg-background">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}

export default MainLayout