import React from 'react';

const UserModal = ({ user, onClose }) => {
  if (!user) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
      <div className="bg-[#2b2b2b] rounded-xl p-4 sm:p-6 max-w-2xl w-full mx-3 sm:mx-4 relative overflow-y-auto max-h-[90vh]">
        <button
          onClick={onClose}
          className="absolute top-2 sm:top-4 right-2 sm:right-4 text-gray-400 hover:text-white"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="flex items-center mb-4 sm:mb-6">
          <div className="h-12 w-12 sm:h-16 sm:w-16 flex-shrink-0">
            {user.avatar ? (
              <img
                className="h-12 w-12 sm:h-16 sm:w-16 rounded-full object-cover"
                src={user.avatar}
                alt={user.name}
              />
            ) : (
              <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500 text-xl sm:text-2xl font-medium">
                {user.name?.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="ml-3 sm:ml-4">
            <h3 className="text-lg sm:text-xl font-semibold text-white">{user.name}</h3>
            <p className="text-sm text-gray-400">@{user.username}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-400">Email</label>
              <p className="text-white">{user.email}</p>
            </div>
            <div>
              <label className="text-sm text-gray-400">WhatsApp</label>
              <p className="text-white">{user.whatsapp}</p>
            </div>
            <div>
              <label className="text-sm text-gray-400">Role</label>
              <p className={`px-3 w-20 py-1 text-sm text-center rounded-lg mt-1
                ${user.role === 'owner' ? 'bg-orange-500/20 text-orange-400' : 
                  user.role === 'admin' ? 'bg-purple-500/20 text-purple-400' : 
                  'bg-blue-500/20 text-blue-400'}`}>
                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
              </p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-400">Tanggal Registrasi</label>
              <p className="text-white">
                {new Date(user.created_at).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
            <div>
              <label className="text-sm text-gray-400">Tanggal Ulang Tahun</label>
              <p className="text-white">
                {user.birthdate ? 
                  new Date(user.birthdate).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  }) : 'Belum diatur'}
              </p>
            </div>
            <div>
              <label className="text-sm text-gray-400">Alamat</label>
              <p className="text-white break-words">
                {user.address || 'Belum diatur'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserModal; 