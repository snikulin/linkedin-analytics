import React from 'react'

export function Tabs({ children, defaultTab = 0 }) {
  const [activeTab, setActiveTab] = React.useState(defaultTab)

  const tabs = React.Children.map(children, (child, index) => ({
    title: child.props.title,
    content: child.props.children,
    index
  }))

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1 border-b border-slate-800">
        {tabs.map((tab, index) => (
          <button
            key={index}
            onClick={() => setActiveTab(index)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === index
                ? 'text-sky-400 border-b-2 border-sky-400 bg-slate-900/50'
                : 'text-slate-400 hover:text-slate-300 hover:bg-slate-800/50'
            }`}
          >
            {tab.title}
          </button>
        ))}
      </div>
      <div>
        {tabs[activeTab]?.content}
      </div>
    </div>
  )
}

export function Tab({ title, children }) {
  return children
}