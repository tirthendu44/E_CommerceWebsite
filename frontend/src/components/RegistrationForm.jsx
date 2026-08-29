import { ChevronDownIcon } from '@heroicons/react/16/solid'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function RegisterForm({ onAuthSuccess }) {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    username: '',
    firstName: '',
    lastName: '',
    email: '',
    country: 'United States',
    streetAddress: '',
    city: '',
    region: '',
    postalCode: '',
    password: '',
    confirmPassword: '',
  })

  const [error, setError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if ((name === 'password' || name === 'confirmPassword') && passwordError) {
      setPasswordError('')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setPasswordError('')
    setSuccess(false)

    if (formData.password !== formData.confirmPassword) {
      setPasswordError('Passwords do not match')
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          country: formData.country,
          streetAddress: formData.streetAddress,
          city: formData.city,
          region: formData.region,
          postalCode: formData.postalCode,
          password: formData.password,
        }),
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed')
      }
      
      if (data.token) {
        localStorage.setItem('token', data.token)
        localStorage.setItem('user', JSON.stringify(data.user))
        window.dispatchEvent(new Event('authChange'))
      }

      setSuccess(true)
      onAuthSuccess?.(data.user, data.token)
      setFormData({
        username: '',
        firstName: '',
        lastName: '',
        email: '',
        country: 'United States',
        streetAddress: '',
        city: '',
        region: '',
        postalCode: '',
        password: '',
        confirmPassword: '',
      })
      navigate('/') // Redirect to home page after successful registration
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white text-black p-6 rounded-md w-[70%] mx-auto"
    >
      <div className="space-y-12">
        {/* Account */}
        <div className="border-b border-gray-900/10 pb-12">
          <h2 className="text-base/7 font-semibold text-gray-900">Account</h2>
          <p className="mt-1 text-sm/6 text-gray-600">
            Choose a username and password for your account.
          </p>

          <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
            <div className="sm:col-span-4">
              <label htmlFor="username" className="block text-sm/6 font-medium text-gray-900">
                Username
              </label>
              <div className="mt-2">
                <div className="flex items-center rounded-md bg-white pl-3 outline-1 -outline-offset-1 outline-gray-300 focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-indigo-600">
                  <input
                    id="username"
                    name="username"
                    type="text"
                    value={formData.username}
                    onChange={handleChange}
                    required
                    className="block min-w-0 grow bg-white py-1.5 pr-3 pl-1 text-base text-gray-900 placeholder:text-gray-400 focus:outline-none sm:text-sm/6"
                  />
                </div>
              </div>
            </div>

            <div className="sm:col-span-4">
              <label htmlFor="email" className="block text-sm/6 font-medium text-gray-900">
                Email address
              </label>
              <div className="mt-2">
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  autoComplete="email"
                  required
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                />
              </div>
            </div>

            <div className="sm:col-span-3">
              <label htmlFor="password" className="block text-sm/6 font-medium text-gray-900">
                Set Password
              </label>
              <div className="mt-2">
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="new-password"
                  required
                  className={`block w-full rounded-md bg-white px-3 py-1.5 text-base outline-1 -outline-offset-1 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 sm:text-sm/6 ${
                    passwordError
                      ? 'text-red-900 outline-red-300 focus:outline-red-600'
                      : 'text-gray-900 outline-gray-300 focus:outline-indigo-600'
                  }`}
                />
              </div>
            </div>

            <div className="sm:col-span-3">
              <label htmlFor="confirm-password" className="block text-sm/6 font-medium text-gray-900">
                Confirm Password
              </label>
              <div className="mt-2">
                <input
                  id="confirm-password"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  autoComplete="new-password"
                  required
                  className={`block w-full rounded-md bg-white px-3 py-1.5 text-base outline-1 -outline-offset-1 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 sm:text-sm/6 ${
                    passwordError
                      ? 'text-red-900 outline-red-300 focus:outline-red-600'
                      : 'text-gray-900 outline-gray-300 focus:outline-indigo-600'
                  }`}
                />
              </div>
            </div>

            {passwordError && (
              <p className="col-span-full -mt-4 text-sm text-red-600">{passwordError}</p>
            )}
          </div>
        </div>

        {/* Personal Information */}
        <div className="border-b border-gray-900/10 pb-12">
          <h2 className="text-base/7 font-semibold text-gray-900">Personal Information</h2>
          <p className="mt-1 text-sm/6 text-gray-600">Use a permanent address where you can receive your orders.</p>

          <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
            <div className="sm:col-span-3">
              <label htmlFor="first-name" className="block text-sm/6 font-medium text-gray-900">
                First name
              </label>
              <div className="mt-2">
                <input
                  id="first-name"
                  name="firstName"
                  type="text"
                  value={formData.firstName}
                  onChange={handleChange}
                  autoComplete="given-name"
                  required
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                />
              </div>
            </div>

            <div className="sm:col-span-3">
              <label htmlFor="last-name" className="block text-sm/6 font-medium text-gray-900">
                Last name
              </label>
              <div className="mt-2">
                <input
                  id="last-name"
                  name="lastName"
                  type="text"
                  value={formData.lastName}
                  onChange={handleChange}
                  autoComplete="family-name"
                  required
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                />
              </div>
            </div>

            <div className="sm:col-span-3">
              <label htmlFor="country" className="block text-sm/6 font-medium text-gray-900">
                Country
              </label>
              <div className="mt-2 grid grid-cols-1">
                <select
                  id="country"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  autoComplete="country-name"
                  className="col-start-1 row-start-1 w-full appearance-none rounded-md bg-white py-1.5 pr-8 pl-3 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                >
                  <option>United States</option>
                  <option>Canada</option>
                  <option>Mexico</option>
                  <option>India</option>
                </select>
                <ChevronDownIcon
                  aria-hidden="true"
                  className="pointer-events-none col-start-1 row-start-1 mr-2 size-5 self-center justify-self-end text-gray-500 sm:size-4"
                />
              </div>
            </div>

            <div className="col-span-full">
              <label htmlFor="street-address" className="block text-sm/6 font-medium text-gray-900">
                Street address
              </label>
              <div className="mt-2">
                <input
                  id="street-address"
                  name="streetAddress"
                  type="text"
                  value={formData.streetAddress}
                  onChange={handleChange}
                  autoComplete="street-address"
                  required
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                />
              </div>
            </div>

            <div className="sm:col-span-2 sm:col-start-1">
              <label htmlFor="city" className="block text-sm/6 font-medium text-gray-900">
                City
              </label>
              <div className="mt-2">
                <input
                  id="city"
                  name="city"
                  type="text"
                  value={formData.city}
                  onChange={handleChange}
                  autoComplete="address-level2"
                  required
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="region" className="block text-sm/6 font-medium text-gray-900">
                State / Province
              </label>
              <div className="mt-2">
                <input
                  id="region"
                  name="region"
                  type="text"
                  value={formData.region}
                  onChange={handleChange}
                  autoComplete="address-level1"
                  required
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="postal-code" className="block text-sm/6 font-medium text-gray-900">
                ZIP / Postal code
              </label>
              <div className="mt-2">
                <input
                  id="postal-code"
                  name="postalCode"
                  type="text"
                  value={formData.postalCode}
                  onChange={handleChange}
                  autoComplete="postal-code"
                  required
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      {success && (
        <p className="mt-4 text-sm text-green-600">
          Registration successful — you're now logged in.
        </p>
      )}

      <div className="mt-6 flex items-center justify-end gap-x-6">
        <button type="button" className="text-sm/6 font-semibold text-gray-900">
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
        >
          {submitting ? 'Saving...' : 'Save'}
        </button>
      </div>
    </form>
  )
}