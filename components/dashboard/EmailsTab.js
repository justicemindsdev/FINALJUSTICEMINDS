// Emails tab content component
import SearchEmails from '@/components/SearchEmails';

export default function EmailsTab({ onSearchResults }) {
  return (
    <div className="flex-1 flex items-center justify-center p-3">
      <SearchEmails onSearchResults={onSearchResults} />
    </div>
  );
}