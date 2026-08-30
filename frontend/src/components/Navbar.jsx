import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
} from '@headlessui/react'
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'
import logo from "/src/assets/e-shoplogo.png"
import Cart from './Cart'
import { getTokenExpiry } from '../utils/jwt'
const navigation = [
  { name: 'Dashboard', href: '/', current: false },
  { name: 'Products', href: '/products', current: false },
  { name: 'Orders', href: '/orders', current: false },
]

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

function getStoredUser() {
  try {
    const raw = localStorage.getItem('user')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}


function Navbar() {
  const navigate = useNavigate()
  const [user, setUser] = useState(getStoredUser)
  const [cartOpen, setCartOpen] = useState(false)
  const isAdmin = Boolean(user?.isAdmin)

  useEffect(() => {
    const syncUser = () => setUser(getStoredUser())
    window.addEventListener('authChange', syncUser)
    window.addEventListener('storage', syncUser)
    return () => {
      window.removeEventListener('authChange', syncUser)
      window.removeEventListener('storage', syncUser)
    }
  }, [])
  

  const handleSignOut = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    window.dispatchEvent(new Event('authChange'))
    window.location.href = '/'
  }

  // Automatically sign out the moment the current token's expiry time passes,
  // instead of waiting for the next failed API call to notice.
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) return

    const expiryMs = getTokenExpiry(token)
    if (!expiryMs) return

    const msUntilExpiry = expiryMs - Date.now()

    if (msUntilExpiry <= 0) {
      handleSignOut()
      return
    }

    const timer = setTimeout(() => {
      handleSignOut()
    }, msUntilExpiry)

    return () => clearTimeout(timer)
  }, [user])

  return (
    <Disclosure as="nav" className="relative bg-gray-800 m-0 p-0 border-0 shadow-none">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">
          
          {/* Left section: Logo + navigation */}
          <div className="flex items-center">
            <div className="flex shrink-0 items-center">
              <img
  src={logo}
  alt="E-Shop Logo"
  className="h-15 w-auto object-contain block select-none pointer-events-none focus:outline-none focus:ring-0"
/>

            </div>
            {!isAdmin && (
              <div className="hidden sm:ml-6 sm:block">
                <div className="flex space-x-4">
                  {navigation.map((item) => (
                    <Link
                      key={item.name}
                      to={item.name==='Orders'? user? item.href: '/login': item.href}
                      aria-current={item.current ? 'page' : undefined}
                      className={classNames(
                        'text-gray-300 hover:bg-white/5 hover:text-white',
                        'rounded-md px-3 py-2 text-sm font-medium'
                      )}
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right side controls */}
          <div className="flex items-center space-x-4">
            {/* Mobile menu toggle - the hamburger that reveals DisclosurePanel below */}
            {!isAdmin && (
              <div className="sm:hidden">
                <DisclosureButton className="group relative inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-white/5 hover:text-white focus:outline-none focus:ring-0">
                  <span className="absolute -inset-0.5" />
                  <span className="sr-only">Open main menu</span>
                  <Bars3Icon aria-hidden="true" className="block size-6 group-data-open:hidden" />
                  <XMarkIcon aria-hidden="true" className="hidden size-6 group-data-open:block" />
                </DisclosureButton>
              </div>
            )}

            {/* Cart */}
            {!isAdmin && (
              <button
                type="button"
                className="relative rounded-full p-1 text-gray-400 hover:text-white focus:outline-none focus:ring-0"
                onClick={user?() => setCartOpen(true):() => navigate('/login')}
              >
                <span className="sr-only">Cart</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="size-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z"
                  />
                </svg>
              </button>
            )}

            {/* Profile dropdown */}
            <Menu as="div" className="relative">
              <MenuButton className="flex rounded-full focus:outline-none focus:ring-0">
                <span className="sr-only">Open user menu</span>
                <img
                  alt="Profile"
                  src="https://png.pngitem.com/pimgs/s/4-40070_user-staff-man-profile-user-account-icon-jpg.png"
                  className="size-9 rounded-full bg-gray-800"
                />
              </MenuButton>
              <MenuItems
                transition
                className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black/5 focus:outline-none focus:ring-0
                           transition-transform duration-100 ease-out data-closed:scale-95 data-closed:opacity-0 data-leave:duration-75 data-leave:ease-in"
              >
                {user ? (
                  <>
                    <div className="px-4 py-2 text-sm text-gray-500">
                      Signed in as{' '}
                      <span className="font-medium text-gray-900">
                        {user.username || user.email}
                      </span>
                    </div>
                    <div className="border-t border-gray-200 my-1"></div>
                    <div className="py-1">
                      {isAdmin && (
                        <MenuItem>
                          {({ active }) => (
                            <Link
                              to="/admin"
                              className={`block px-4 py-2 text-sm font-medium text-indigo-600 ${active ? 'bg-gray-100' : ''}`}
                            >
                              Admin Portal
                            </Link>
                          )}
                        </MenuItem>
                      )}
                      <MenuItem>
                        {({ active }) => (
                          <a
                            href="#"
                            className={`block px-4 py-2 text-sm ${active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'}`}
                          >
                            Account settings
                          </a>
                        )}
                      </MenuItem>
                      <MenuItem>
                        {({ active }) => (
                          <a
                            href="#"
                            className={`block px-4 py-2 text-sm ${active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'}`}
                          >
                            Support
                          </a>
                        )}
                      </MenuItem>
                      <MenuItem>
                        {({ active }) => (
                          <a
                            href="#"
                            className={`block px-4 py-2 text-sm ${active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'}`}
                          >
                            License
                          </a>
                        )}
                      </MenuItem>
                      <div className="border-t border-gray-200 my-1"></div>
                      <MenuItem>
                        {({ active }) => (
                          <button
                            type="button"
                            onClick={handleSignOut}
                            className={`block w-full text-left px-4 py-2 text-sm rounded-b-md ${active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'}`}
                          >
                            Sign out
                          </button>
                        )}
                      </MenuItem>
                    </div>
                  </>
                ) : (
                  <div className="py-1">
                    <MenuItem>
                      {({ active }) => (
                        <a
                          href="#"
                          className={`block px-4 py-2 text-sm ${active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'}`}
                        >
                          Support
                        </a>
                      )}
                    </MenuItem>
                    <MenuItem>
                      {({ active }) => (
                        <a
                          href="#"
                          className={`block px-4 py-2 text-sm ${active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'}`}
                        >
                          License
                        </a>
                      )}
                    </MenuItem>
                    <div className="border-t border-gray-200 my-1"></div>
                    <MenuItem>
                      {({ active }) => (
                        <Link
                          to="/login"
                          className={`block px-4 py-2 text-sm rounded-b-md ${active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'}`}
                        >
                          Sign in
                        </Link>
                      )}
                    </MenuItem>
                  </div>
                )}
              </MenuItems>
            </Menu>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {!isAdmin && (
        <DisclosurePanel className="sm:hidden">
          <div className="space-y-1 px-2 pt-2 pb-3">
            {navigation.map((item) => (
              <DisclosureButton
                key={item.name}
                as={Link}
                to={item.name==='Orders'? user? item.href: '/login': item.href}
                aria-current={item.current ? 'page' : undefined}
                className={classNames(
                  item.current
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-300 hover:bg-white/5 hover:text-white',
                  'block rounded-md px-3 py-2 text-base font-medium focus:outline-none focus:ring-0'
                )}
              >
                {item.name}
              </DisclosureButton>
            ))}
          </div>
        </DisclosurePanel>
      )}

      {!isAdmin && <Cart open={cartOpen} onClose={() => setCartOpen(false)} />}
    </Disclosure>
  )
}
export default Navbar;