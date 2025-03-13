import React from 'react';

const UserTable = ({ 
  users, 
  onViewDetails, 
  onDeleteUser, 
  onRoleChange,
  isOwner = false
}) => {
  return (
    <div className="w-full overflow-hidden max-md:pl-3">
      <div className="overflow-x-auto -mx-4 sm:mx-0">
        <div className="min-w-full inline-block align-middle">
          <div className="overflow-hidden border border-gray-700 rounded-xl">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-[#363636]">
                <tr>
                  <th scope="col" className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Pengguna
                  </th>
                  <th scope="col" className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider hidden sm:table-cell">
                    Kontak
                  </th>
                  <th scope="col" className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Role
                  </th>
                  <th scope="col" className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider hidden sm:table-cell">
                    Terdaftar
                  </th>
                  <th scope="col" className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700 bg-[#2b2b2b]">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-[#363636] transition-colors duration-150">
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0">
                          {user.avatar ? (
                            <img
                              className="h-8 w-8 sm:h-10 sm:w-10 rounded-full object-cover"
                              src={user.avatar}
                              alt={user.name}
                            />
                          ) : (
                            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500 font-medium text-sm sm:text-base">
                              {user.name?.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="ml-2 sm:ml-4">
                          <div className="text-sm font-medium text-white">
                            {user.name}
                          </div>
                          <div className="text-xs sm:text-sm text-gray-400">
                            @{user.username}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                      <div className="text-sm text-white">{user.email}</div>
                      <div className="text-sm text-gray-400">WA: {user.whatsapp}</div>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      {isOwner ? (
                        <select
                          value={user.role}
                          onChange={(e) => onRoleChange(user.id, e.target.value)}
                          className="px-2 sm:px-3 py-1 text-sm bg-[#363636] text-white border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                          <option value="owner">Owner</option>
                        </select>
                      ) : (
                        <span className={`inline-flex px-2 sm:px-3 py-1 text-xs sm:text-sm rounded-lg
                          ${user.role === 'owner' ? 'bg-orange-500/20 text-orange-400' : 
                            user.role === 'admin' ? 'bg-purple-500/20 text-purple-400' : 
                            'bg-blue-500/20 text-blue-400'}`}>
                          {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                        </span>
                      )}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                      <div className="text-sm text-gray-400">
                        {new Date(user.created_at).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm">
                      <button
                        onClick={() => onViewDetails(user)}
                        className="text-blue-500 hover:text-blue-400 mr-2 sm:mr-4 transition-colors duration-150"
                      >
                        Detail
                      </button>
                      {isOwner && (
                        <button
                          onClick={() => onDeleteUser(user)}
                          className="text-red-500 hover:text-red-400 transition-colors duration-150"
                        >
                          Hapus
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserTable; 