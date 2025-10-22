import { useState, useRef } from 'react'
import Signupimage from '../assets/Login.jpg'
import backendApi from '../utils/axiosInstance'
import { handleError } from '../utils/handleError'
import { toast } from 'react-toastify'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'

const Forgotpassword = () => {
  const [email, setEmail] = useState('')
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const inputRefs = useRef([])
  const navigate = useNavigate()

  // Step 1: Request OTP
  const handleEmailSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    if (!email) {
      toast.error('Please enter an email')
      setIsLoading(false)
      return
    }
    try {
      await backendApi.post('/auth/password/forget', { email })
      setStep(2)
      toast.success('Verification code sent to your email')
    } catch (error) {
      const { message } = handleError(error)
      toast.error(message || 'Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  // Step 2: OTP input
  const handleCodeChange = (index, value) => {
    const lastChar = value.slice(-1)
    const newCode = [...code]
    newCode[index] = lastChar
    setCode(newCode)

    if (lastChar && index < 5) inputRefs.current[index + 1]?.focus()

    // Trigger spinner and move to Step 3 if all filled
    if (newCode.every((c) => c !== '')) {
      setIsLoading(true)
      setTimeout(() => {
        setStep(3)
        setIsLoading(false)
      }, 2000)
    }
  }

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (code[index]) {
        const newCode = [...code]
        newCode[index] = ''
        setCode(newCode)
      } else if (index > 0) {
        inputRefs.current[index - 1]?.focus()
      }
    }
    if (e.key === 'ArrowLeft' && index > 0) inputRefs.current[index - 1]?.focus()
    if (e.key === 'ArrowRight' && index < 5) inputRefs.current[index + 1]?.focus()
    if (['Backspace', 'ArrowLeft', 'ArrowRight'].includes(e.key)) e.preventDefault()
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const paste = e.clipboardData.getData('text').trim()
    if (!paste) return
    const pasteArray = paste.slice(0, 6).split('')
    const newCode = [...code]

    let startIndex = 0
    for (let i = 0; i < inputRefs.current.length; i++) {
      if (inputRefs.current[i] === e.target) {
        startIndex = i
        break
      }
    }

    for (let i = 0; i < pasteArray.length; i++) {
      const targetIndex = startIndex + i
      if (targetIndex < 6) newCode[targetIndex] = pasteArray[i]
    }

    setCode(newCode)
    const nextIndex = Math.min(startIndex + pasteArray.length, 5)
    inputRefs.current[nextIndex]?.focus()

    if (newCode.every((c) => c !== '')) {
      setIsLoading(true)
      setTimeout(() => {
        setStep(3)
        setIsLoading(false)
      }, 2000)
    }
  }

  // Step 3: Reset password
  const handleResetPassword = async (e) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    setIsLoading(true)
    try {
      const verificationCode = code.join('')
      await backendApi.post('/auth/password/reset', {
        email,
        otp: verificationCode,
        password,
      })
      toast.success('Password reset successfully!')
      setStep(1)
      setEmail('')
      setCode(['', '', '', '', '', ''])
      setPassword('')
      setConfirmPassword('')
      navigate('/login')
    } catch (error) {
      const { message } = handleError(error)
      toast.error(message || 'Invalid or expired OTP')
      // Go back to step 2 to correct OTP
      setStep(2)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-black h-screen flex justify-between">
      <div className="flex flex-col items-center justify-center bg-white w-1/2 p-8">
        <h1 className="text-black text-5xl font-bold my-4 text-center mb-10">
          Welcome Back at <span className="text-[#BE741E]">TradeWise</span>
        </h1>

        {/* Step 1: Email input */}
        {step === 1 && (
          <form onSubmit={handleEmailSubmit} className="flex flex-col items-center space-y-4">
            <p className="text-black/80 text-center mb-4">
              Please provide a valid email address so we can send you a code.
            </p>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-80 py-2 px-4 border text-sm border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BE741E]"
            />
            <button
              type="submit"
              className="py-2 px-6 bg-[#BE741E] text-sm text-white font-medium rounded-lg hover:bg-[#cc8b3a] transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {isLoading ? 'Sending...' : 'Submit'}
            </button>
          </form>
        )}

        {/* Step 2: OTP input */}
        {step === 2 && (
          <div className="relative flex flex-col items-center space-y-6">
            <p className="text-black/80 text-center mb-4">Enter the 6-character OTP sent to your email.</p>
            <div
              className="flex space-x-4"
              style={{ pointerEvents: isLoading ? 'none' : 'auto', opacity: isLoading ? 0.5 : 1 }}
            >
              {code.map((char, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  maxLength="1"
                  value={char}
                  onChange={(e) => handleCodeChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={handlePaste}
                  className="w-12 h-12 text-center text-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#BE741E]"
                  required
                  disabled={isLoading}
                />
              ))}
            </div>
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/50">
                <div className="loader border-t-[#BE741E] border-b-[#BE741E] border-gray-300 w-10 h-10 rounded-full animate-spin"></div>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Reset password */}
        {step === 3 && (
          <form onSubmit={handleResetPassword} className="flex flex-col items-center space-y-4 w-full">
            <p className="text-black/80 text-center mb-4">Enter your new password.</p>

            <div className="w-80 space-y-2">
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="New Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full py-2 px-4 border text-sm border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BE741E]"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-[#BE741E] transition-colors duration-200"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full py-2 px-4 border text-sm border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BE741E]"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-[#BE741E] transition-colors duration-200"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="py-2 px-6 bg-[#BE741E] text-sm text-white font-medium rounded-lg hover:bg-[#cc8b3a] transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {isLoading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}
      </div>

      <div className="w-1/2 h-full flex items-center justify-center bg-gray-50">
        <img src={Signupimage} alt="login" className="w-full h-full object-cover" />
      </div>
    </div>
  )
}

export default Forgotpassword
