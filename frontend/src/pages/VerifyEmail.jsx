import React, { useEffect, useState } from 'react';
import logo from '../assets/logo.png';
import { MdEmail } from "react-icons/md";
import OTPInput from '../components1/OTPInput';
import backendApi from '../utils/axiosInstance';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const VerifyEmail = () => {
    const navigate = useNavigate();
    const { user } = useSelector(state => state.auth);

    useEffect(() => {
        if (!user) navigate("/login");
        if (user.isVerified) navigate("/dashboard");
    }, [user, navigate]);

    const [otpCode, setOtpCode] = useState("");
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);

    useEffect(() => {
        if (resendCooldown <= 0) return;

        const interval = setInterval(() => {
            setResendCooldown(prev => prev - 1);
        }, 1000);

        return () => clearInterval(interval);
    }, [resendCooldown]);

    const handleVerifyEmail = async (e) => {
        e.preventDefault();
        if (!otpCode || otpCode.length < 6) return setError("Please enter the 6-digit code");

        setLoading(true);
        try {
            if (!user) return setError("Missing verification context");
            const { email } = user;

            console.log("email and code: ", email, otpCode);
            await backendApi.post("/auth/account/verify", { otp: otpCode, email });

            navigate("/land");
        } catch (error) {
            console.log(error);
            setError(error.response?.data?.message || error.message || "Invalid code");
        } finally {
            setLoading(false);
        }
    };

    const handleResendCode = async () => {
        if (resendLoading || resendCooldown > 0) return;

        setResendLoading(true);
        try {
            if (!user) return setError("Missing verification context");
            const { email } = user;

            await backendApi.post("/auth/account/send", { email });
            setError(null);
            setOtpCode("");
            setResendCooldown(30); // 30 second cooldown
        } catch (error) {
            console.log(error);
            setError(error.response?.data?.message || error.message || "Failed to resend code");
        } finally {
            setResendLoading(false);
        }
    };

    return (
        <div className='flex flex-col w-full h-full text-center px-[80px] bg-[#f3e7d9]'>
            <div className='flex flex-col'>
                <img
                src={logo}
                alt="logo"
                className='w-[90px] h-[70px] m-[40px] mt-[20px] mx-auto'
                />
                <h1 className='text-center text-5xl font-bold text-[#be741e] mt-[-100px] mb-[50px]'>
                TradeWise
                </h1>
            </div>

            {error && <p className='text-red-500 bg-red-200 w-[50%] mx-auto p-2 rounded'>{error}</p>}

            <div className='bg-[#1C1206] text-white p-8'>
                <MdEmail className='text-white text-5xl mx-auto' />
                <h2 className='font-bold text-2xl text-[#BE741E] pt-2'>
                    Verify Your Email Address
                </h2>
                <p className='mt-4'>
                    Hi,<br />
                    Please check your inbox and enter the verification<br />
                    code below to verify your email address.
                </p>
            </div>

            <div className='bg-[#1c1206] p-3 text-[#BE741E]'>
                <form
                    className='my-2'
                    onSubmit={handleVerifyEmail}
                >
                    <OTPInput
                        length={6}
                        onComplete={(code) => setOtpCode(code)}
                    />
                    <div className='flex gap-4 justify-center mt-4'>
                        <button
                            className='bg-[#BE741E] text-[#fff] px-6 py-2 rounded disabled:opacity-50 cursor-pointer'
                            type="submit"
                            disabled={otpCode.length < 6 || loading}
                        >
                            {loading ? "Verifying..." : "Verify Email"}
                        </button>
                        <button
                            type="button"
                            className='bg-[#BE741E] text-[#fff] px-6 py-2 rounded disabled:opacity-50 font-bold cursor-pointer'
                            onClick={handleResendCode}
                            disabled={resendLoading || resendCooldown > 0}
                        >
                            {resendLoading ? "Sending..." : resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend Code"}
                        </button>
                    </div>
                </form>

            </div>

            <div className='bg-[#BE741E] p-[15px]'>
                <p>&copy; 2025 <span className='font-bold text-white'>TradeWise</span>. All rights reserved.</p>
            </div>
        </div>
    );
};

export default VerifyEmail;
