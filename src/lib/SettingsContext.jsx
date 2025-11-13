import React from 'react'

const SettingsContext = React.createContext()

export function SettingsProvider({ children }) {
  const [companyId, setCompanyId] = React.useState(() => localStorage.getItem('linkedinCompanyId') || '')

  const updateCompanyId = (newId) => {
    if (newId.trim()) {
      localStorage.setItem('linkedinCompanyId', newId.trim())
      setCompanyId(newId.trim())
    } else {
      localStorage.removeItem('linkedinCompanyId')
      setCompanyId('')
    }
  }

  React.useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'linkedinCompanyId') {
        setCompanyId(e.newValue || '')
      }
    }
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  return (
    <SettingsContext.Provider value={{ companyId, updateCompanyId }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  return React.useContext(SettingsContext)
}