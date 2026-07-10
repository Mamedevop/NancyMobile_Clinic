import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../../context/LanguageContext'

export default function ForgotPassword() {
  const { t } = useLanguage()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    setSent(true)
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded shadow w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center">{t('resetPassword')}</h2>
        {sent ? <p className="text-green-600 text-center">{t('checkEmail')}</p> : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input className="w-full border p-2 rounded" type="email" placeholder={t('emailAddress')}
              value={email} onChange={e => setEmail(e.target.value)} required />
            <button className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700" type="submit">
              {t('sendResetLink')}
            </button>
          </form>
        )}
        <p className="mt-4 text-center text-sm">
          <Link to="/login" className="text-blue-600">{t('backToLogin')}</Link>
        </p>
      </div>
    </div>
  )
}
