// Tab navigation component for dashboard
export default function TabNavigation({ activeTab, setActiveTab }) {
  const tabs = [
    { id: 'emails', label: '📧 Emails', color: 'blue' },
    { id: 'terminal', label: '💻 Terminal', color: 'green' }
  ];

  return (
    <div className="flex border-b border-[#222222] bg-[#111111]">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`px-6 py-3 text-sm font-medium transition-colors ${
            activeTab === tab.id
              ? `text-white border-b-2 border-${tab.color}-500 bg-[#1a1a1a]`
              : 'text-gray-400 hover:text-white hover:bg-[#1a1a1a]'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}