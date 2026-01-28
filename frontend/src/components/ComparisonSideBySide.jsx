export default function ComparisonSideBySide({ beforeImage, afterImage, beforeLabel = 'Before', afterLabel = 'After' }) {
  // Placeholder for images that fail to load
  const placeholderBefore = 'data:image/svg+xml,' + encodeURIComponent(`
    <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#e5e7eb"/>
      <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#9ca3af" font-family="system-ui" font-size="18">Before Image</text>
    </svg>
  `);

  const placeholderAfter = 'data:image/svg+xml,' + encodeURIComponent(`
    <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#dbeafe"/>
      <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#3b82f6" font-family="system-ui" font-size="18">After Image</text>
    </svg>
  `);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Before */}
      <div className="relative">
        <img
          src={beforeImage || placeholderBefore}
          alt={beforeLabel}
          className="w-full h-64 md:h-80 object-cover rounded-lg"
          onError={(e) => { e.target.src = placeholderBefore; }}
        />
        <span className="absolute top-3 left-3 bg-gray-800 text-white px-3 py-1 rounded-full text-sm font-medium">
          {beforeLabel}
        </span>
      </div>

      {/* After */}
      <div className="relative">
        <img
          src={afterImage || placeholderAfter}
          alt={afterLabel}
          className="w-full h-64 md:h-80 object-cover rounded-lg"
          onError={(e) => { e.target.src = placeholderAfter; }}
        />
        <span className="absolute top-3 left-3 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
          {afterLabel}
        </span>
      </div>

      {/* Comparison arrow indicator */}
      <div className="hidden md:flex absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
        <div className="bg-white shadow-lg rounded-full p-2">
          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </div>
      </div>
    </div>
  );
}
